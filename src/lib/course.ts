import "server-only";

import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";

import { db } from "./db";
import {
  certificates,
  courses,
  levelProgress,
  levels,
  lessons,
  moduleProgress,
  modules,
  quizAttempts,
  resources,
} from "@/db/schema";
import { COURSE_SLUG, type LevelTier, type ProgressStatus } from "./constants";

/**
 * Course structure and learner progress.
 *
 * Everything here is read-only. Progress *writes* live in src/lib/progress.ts so
 * that the read path can be freely reused by pages, and the write path stays in
 * one auditable place.
 */

export async function getCourse() {
  const course = await db.query.courses.findFirst({
    where: eq(courses.slug, COURSE_SLUG),
  });
  if (!course) {
    throw new Error(`Course "${COURSE_SLUG}" not found. Run: npm run db:seed`);
  }
  return course;
}

/** The full pathway: levels with their modules, in order. */
export async function getPathway() {
  const course = await getCourse();
  const pathwayLevels = await db.query.levels.findMany({
    where: eq(levels.courseId, course.id),
    orderBy: asc(levels.order),
    with: {
      modules: {
        orderBy: asc(modules.order),
        columns: {
          id: true,
          slug: true,
          order: true,
          title: true,
          coreQuestion: true,
          estMinutes: true,
          isMandatory: true,
        },
      },
    },
  });
  return { course, levels: pathwayLevels };
}

export type LevelProgressSummary = {
  status: ProgressStatus;
  percentComplete: number;
  modulesComplete: number;
  modulesTotal: number;
  /** Post-assessment result on the recorded (first) attempt, if taken. */
  postScorePct: number | null;
  /** Highest post-assessment score across all attempts. */
  bestScorePct: number | null;
  passed: boolean;
  certificatePublicId: string | null;
  /** The module to resume at, or the first module if not started. */
  nextModuleSlug: string | null;
};

export type LevelWithProgress = Awaited<
  ReturnType<typeof getPathway>
>["levels"][number] & {
  /** Null for a signed-out visitor: structure without a learner attached. */
  progress: LevelProgressSummary | null;
};

/**
 * The pathway annotated with one learner's progress.
 *
 * Written as a small number of batched queries rather than per-level lookups —
 * this drives the landing page and the dashboard, so it runs on almost every
 * request a signed-in learner makes.
 */
export async function getPathwayForUser(userId: string | null) {
  const { course, levels: pathwayLevels } = await getPathway();

  // Signed out: return the structure with no learner attached, so callers have
  // one shape to render rather than a union.
  if (!userId) {
    return {
      course,
      levels: pathwayLevels.map((level) => ({
        ...level,
        progress: null,
      })) as LevelWithProgress[],
    };
  }

  const [moduleRows, levelRows, attemptRows, certificateRows] = await Promise.all([
    // Joined up to Level so this is scoped to the course, matching the other
    // three queries. A learner could in principle have progress in a second
    // Save7 course, and it must not leak into this one's totals.
    db
      .select({
        moduleId: moduleProgress.moduleId,
        status: moduleProgress.status,
        updatedAt: moduleProgress.updatedAt,
      })
      .from(moduleProgress)
      .innerJoin(modules, eq(moduleProgress.moduleId, modules.id))
      .innerJoin(levels, eq(modules.levelId, levels.id))
      .where(and(eq(moduleProgress.userId, userId), eq(levels.courseId, course.id))),

    db
      .select({
        levelId: levelProgress.levelId,
        status: levelProgress.status,
        percentComplete: levelProgress.percentComplete,
      })
      .from(levelProgress)
      .innerJoin(levels, eq(levelProgress.levelId, levels.id))
      .where(and(eq(levelProgress.userId, userId), eq(levels.courseId, course.id))),

    db
      .select({
        levelId: quizAttempts.levelId,
        scorePct: quizAttempts.scorePct,
        attemptNo: quizAttempts.attemptNo,
      })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.courseId, course.id),
          eq(quizAttempts.kind, "POST"),
          isNotNull(quizAttempts.submittedAt),
        ),
      )
      .orderBy(asc(quizAttempts.attemptNo)),

    db
      .select({ levelId: certificates.levelId, publicId: certificates.publicId })
      .from(certificates)
      .where(
        and(
          eq(certificates.userId, userId),
          eq(certificates.courseId, course.id),
          isNull(certificates.revokedAt),
        ),
      ),
  ]);

  const completeModuleIds = new Set(
    moduleRows.filter((m) => m.status === "COMPLETE").map((m) => m.moduleId),
  );
  const startedModuleIds = new Set(moduleRows.map((m) => m.moduleId));
  const levelProgressByLevel = new Map(levelRows.map((l) => [l.levelId, l]));
  const certByLevel = new Map(certificateRows.map((c) => [c.levelId, c.publicId]));

  const annotated: LevelWithProgress[] = pathwayLevels.map((level) => {
    const mandatory = level.modules.filter((m) => m.isMandatory);
    const modulesTotal = mandatory.length;
    const modulesComplete = mandatory.filter((m) => completeModuleIds.has(m.id)).length;

    const levelAttempts = attemptRows.filter((a) => a.levelId === level.id);
    // attemptNo 1 is the recorded measure — retakes must not inflate analytics.
    const recorded = levelAttempts.find((a) => a.attemptNo === 1)?.scorePct ?? null;
    const best = levelAttempts.length
      ? Math.max(...levelAttempts.map((a) => a.scorePct ?? 0))
      : null;

    const lp = levelProgressByLevel.get(level.id);
    const percentComplete =
      modulesTotal === 0 ? 0 : Math.round((modulesComplete / modulesTotal) * 100);

    // Resume at the first incomplete module; if all are done, stay on the last.
    const firstIncomplete = level.modules.find((m) => !completeModuleIds.has(m.id));
    const nextModuleSlug =
      firstIncomplete?.slug ?? level.modules[level.modules.length - 1]?.slug ?? null;

    const started = level.modules.some((m) => startedModuleIds.has(m.id));
    const status: ProgressStatus =
      modulesTotal > 0 && modulesComplete === modulesTotal
        ? "COMPLETE"
        : started
          ? "IN_PROGRESS"
          : "NOT_STARTED";

    return {
      ...level,
      progress: {
        status,
        percentComplete: lp?.percentComplete ?? percentComplete,
        modulesComplete,
        modulesTotal,
        postScorePct: recorded,
        bestScorePct: best,
        passed: (best ?? 0) >= level.passMarkPct,
        certificatePublicId: certByLevel.get(level.id) ?? null,
        nextModuleSlug,
      },
    };
  });

  return { course, levels: annotated };
}

/** Whether the learner has completed the one-time baseline assessment. */
export async function getBaselineState(userId: string) {
  const course = await getCourse();
  const [attempt] = await db
    .select({
      id: quizAttempts.id,
      submittedAt: quizAttempts.submittedAt,
      scorePct: quizAttempts.scorePct,
      scoreRaw: quizAttempts.scoreRaw,
      scoreMax: quizAttempts.scoreMax,
    })
    .from(quizAttempts)
    .where(
      and(
        eq(quizAttempts.userId, userId),
        eq(quizAttempts.courseId, course.id),
        eq(quizAttempts.kind, "PRE"),
      ),
    )
    // Earliest attempt: the baseline is taken once, and the first sitting is the
    // one that counts.
    .orderBy(asc(quizAttempts.startedAt))
    .limit(1);

  return {
    /** An unsubmitted attempt means they started and can resume it. */
    inProgressAttemptId: attempt && !attempt.submittedAt ? attempt.id : null,
    completed: Boolean(attempt?.submittedAt),
    scorePct: attempt?.submittedAt ? attempt.scorePct : null,
    scoreRaw: attempt?.submittedAt ? attempt.scoreRaw : null,
    scoreMax: attempt?.submittedAt ? attempt.scoreMax : null,
  };
}

/** A single module with its lessons, plus this learner's position in it. */
export async function getModuleForUser(
  userId: string | null,
  levelSlug: string,
  moduleSlug: string,
) {
  const course = await getCourse();
  const level = await db.query.levels.findFirst({
    where: and(eq(levels.courseId, course.id), eq(levels.slug, levelSlug)),
  });
  if (!level) return null;

  const mod = await db.query.modules.findFirst({
    where: and(eq(modules.levelId, level.id), eq(modules.slug, moduleSlug)),
    with: {
      lessons: { orderBy: asc(lessons.order) },
      resources: { orderBy: asc(resources.order) },
    },
  });
  if (!mod) return null;

  // Sibling modules, for prev/next navigation within the level.
  const siblings = await db
    .select({ slug: modules.slug, order: modules.order, title: modules.title })
    .from(modules)
    .where(eq(modules.levelId, level.id))
    .orderBy(asc(modules.order));

  const progress = userId
    ? ((await db.query.moduleProgress.findFirst({
        where: and(
          eq(moduleProgress.userId, userId),
          eq(moduleProgress.moduleId, mod.id),
        ),
      })) ?? null)
    : null;

  const completedLessonIds: string[] = progress
    ? (JSON.parse(progress.completedLessonsJson) as string[])
    : [];

  return {
    course,
    level,
    module: mod,
    siblings,
    progress,
    completedLessonIds: new Set(completedLessonIds),
  };
}

export function tierOf(level: { tier: string }): LevelTier {
  return level.tier as LevelTier;
}
