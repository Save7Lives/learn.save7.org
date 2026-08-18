import "server-only";

import { and, asc, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";

import { db } from "./db";
import {
  certificates,
  contentReviewItems,
  levelProgress,
  levels as levelsTable,
  modules as modulesTable,
  questions as questionsTable,
  quizAttempts,
  users,
} from "@/db/schema";
import { getCourse } from "./course";


/**
 * Save7's analytics.
 *
 * The brief is explicit that the question to answer is "are people learning?",
 * not "how many people clicked things". So the numbers here are built around
 * knowledge movement and where learners get stuck, and there is deliberately no
 * per-learner behavioural profile, no funnel of individual actions, and no
 * ranking of learners against each other.
 *
 * Only `attemptNo === 1` counts toward reported improvement. If retakes were
 * included, Save7's headline "learning gain" would drift upward every time a
 * learner tried again, which would make the platform's central claim unfalsifiable.
 */

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export type LearnerSummary = {
  registered: number;
  /** Started the baseline or any module. */
  active: number;
  /** Completed at least one level. */
  completedAnyLevel: number;
  /** Completed every level. */
  completedCourse: number;
  /** Of those who started, the share who finished at least one level. */
  completionRatePct: number | null;
  registeredLast30Days: number;
};

export async function getLearnerSummary(): Promise<LearnerSummary> {
  const course = await getCourse();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);

  const [registered, registeredLast30Days, withBaseline, levelCompletions, levelsTotal] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.role, "LEARNER"))
        .then((r) => Number(r[0]?.count ?? 0)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.role, "LEARNER"), gte(users.createdAt, thirtyDaysAgo)))
        .then((r) => Number(r[0]?.count ?? 0)),
      db
        .selectDistinct({ userId: quizAttempts.userId })
        .from(quizAttempts)
        .where(and(eq(quizAttempts.courseId, course.id), eq(quizAttempts.kind, "PRE"))),
      db
        .select({ userId: levelProgress.userId, levelId: levelProgress.levelId })
        .from(levelProgress)
        .innerJoin(levelsTable, eq(levelProgress.levelId, levelsTable.id))
        .where(
          and(eq(levelProgress.status, "COMPLETE"), eq(levelsTable.courseId, course.id)),
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(levelsTable)
        .where(eq(levelsTable.courseId, course.id))
        .then((r) => Number(r[0]?.count ?? 0)),
    ]);

  const active = withBaseline.length;

  const levelsByUser = new Map<string, Set<string>>();
  for (const row of levelCompletions) {
    const set = levelsByUser.get(row.userId) ?? new Set<string>();
    set.add(row.levelId);
    levelsByUser.set(row.userId, set);
  }

  const completedAnyLevel = levelsByUser.size;
  const completedCourse = [...levelsByUser.values()].filter(
    (set) => set.size === levelsTotal,
  ).length;

  return {
    registered,
    active,
    completedAnyLevel,
    completedCourse,
    // Denominated on learners who actually started, not on everyone who signed
    // up: a sign-up that never began the course says nothing about the teaching.
    completionRatePct: active > 0 ? Math.round((completedAnyLevel / active) * 100) : null,
    registeredLast30Days,
  };
}

export type KnowledgeSummary = {
  averageBaselinePct: number | null;
  baselineCount: number;
  perLevel: Array<{
    levelId: string;
    slug: string;
    title: string;
    tier: string;
    averagePostPct: number | null;
    postCount: number;
    /** Average point change for learners who took both. */
    averagePointChange: number | null;
    passRatePct: number | null;
  }>;
  /** Baseline score distribution, for a histogram. */
  baselineDistribution: Array<{ bucket: string; count: number }>;
  postDistribution: Array<{ bucket: string; count: number }>;
};

const BUCKETS = [
  { label: "0–20%", min: 0, max: 20 },
  { label: "21–40%", min: 21, max: 40 },
  { label: "41–60%", min: 41, max: 60 },
  { label: "61–80%", min: 61, max: 80 },
  { label: "81–100%", min: 81, max: 100 },
];

function distribute(scores: number[]): Array<{ bucket: string; count: number }> {
  return BUCKETS.map((b) => ({
    bucket: b.label,
    count: scores.filter((s) => s >= b.min && s <= b.max).length,
  }));
}

export async function getKnowledgeSummary(): Promise<KnowledgeSummary> {
  const course = await getCourse();

  const [preAttempts, levels, postAttempts] = await Promise.all([
    db
      .select({ userId: quizAttempts.userId, scorePct: quizAttempts.scorePct })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.courseId, course.id),
          eq(quizAttempts.kind, "PRE"),
          isNotNull(quizAttempts.submittedAt),
        ),
      ),
    db
      .select({
        id: levelsTable.id,
        slug: levelsTable.slug,
        title: levelsTable.title,
        tier: levelsTable.tier,
        passMarkPct: levelsTable.passMarkPct,
      })
      .from(levelsTable)
      .where(eq(levelsTable.courseId, course.id))
      .orderBy(asc(levelsTable.order)),
    db
      .select({
        userId: quizAttempts.userId,
        levelId: quizAttempts.levelId,
        scorePct: quizAttempts.scorePct,
        attemptNo: quizAttempts.attemptNo,
      })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.courseId, course.id),
          eq(quizAttempts.kind, "POST"),
          isNotNull(quizAttempts.submittedAt),
        ),
      ),
  ]);

  const baselineByUser = new Map(
    preAttempts.map((a) => [a.userId, a.scorePct ?? 0]),
  );
  const baselineScores = [...baselineByUser.values()];

  const perLevel = levels.map((level) => {
    const recorded = postAttempts.filter(
      (a) => a.levelId === level.id && a.attemptNo === 1,
    );
    const scores = recorded.map((a) => a.scorePct ?? 0);

    // Point change only for learners who have both measurements.
    const changes = recorded
      .filter((a) => baselineByUser.has(a.userId))
      .map((a) => (a.scorePct ?? 0) - (baselineByUser.get(a.userId) ?? 0));

    // Pass rate uses the best attempt, because that is what earns a certificate.
    const allForLevel = postAttempts.filter((a) => a.levelId === level.id);
    const bestByUser = new Map<string, number>();
    for (const a of allForLevel) {
      const current = bestByUser.get(a.userId) ?? 0;
      bestByUser.set(a.userId, Math.max(current, a.scorePct ?? 0));
    }
    const passed = [...bestByUser.values()].filter((s) => s >= level.passMarkPct).length;

    return {
      levelId: level.id,
      slug: level.slug,
      title: level.title,
      tier: level.tier,
      averagePostPct: mean(scores),
      postCount: scores.length,
      averagePointChange: mean(changes),
      passRatePct:
        bestByUser.size > 0 ? Math.round((passed / bestByUser.size) * 100) : null,
    };
  });

  return {
    averageBaselinePct: mean(baselineScores),
    baselineCount: baselineScores.length,
    perLevel,
    baselineDistribution: distribute(baselineScores),
    postDistribution: distribute(
      postAttempts.filter((a) => a.attemptNo === 1).map((a) => a.scorePct ?? 0),
    ),
  };
}

export type MissedQuestion = {
  questionId: string;
  authoringKey: string;
  prompt: string;
  topicTag: string;
  scope: string;
  levelTitle: string | null;
  moduleTitle: string | null;
  answered: number;
  incorrect: number;
  incorrectRatePct: number;
};

/**
 * The most commonly missed questions.
 *
 * The single most actionable report Save7 gets: a question most learners fail is
 * usually a teaching problem in the module before it, not a cohort of poor learners.
 * A minimum sample is enforced so one wrong answer cannot top the list.
 */
export async function getMostMissedQuestions(
  minimumAnswers = 3,
  limit = 12,
): Promise<MissedQuestion[]> {
  const course = await getCourse();

  const questions = await db.query.questions.findMany({
    where: eq(questionsTable.courseId, course.id),
    columns: {
      id: true,
      authoringKey: true,
      prompt: true,
      topicTag: true,
      scope: true,
    },
    with: {
      level: { columns: { title: true } },
      module: { columns: { title: true } },
      answers: { columns: { isCorrect: true } },
    },
  });

  return questions
    .map((q) => {
      const answered = q.answers.length;
      const incorrect = q.answers.filter((a) => !a.isCorrect).length;
      return {
        questionId: q.id,
        authoringKey: q.authoringKey,
        prompt: q.prompt,
        topicTag: q.topicTag,
        scope: q.scope,
        levelTitle: q.level?.title ?? null,
        moduleTitle: q.module?.title ?? null,
        answered,
        incorrect,
        incorrectRatePct: answered > 0 ? Math.round((incorrect / answered) * 100) : 0,
      };
    })
    .filter((q) => q.answered >= minimumAnswers && q.incorrect > 0)
    .sort(
      (a, b) =>
        b.incorrectRatePct - a.incorrectRatePct || b.answered - a.answered,
    )
    .slice(0, limit);
}

export type ModuleEngagement = {
  moduleId: string;
  slug: string;
  title: string;
  order: number;
  levelTitle: string;
  levelSlug: string;
  started: number;
  completed: number;
  completionRatePct: number | null;
  /** Median rather than mean: one learner leaving a tab open would skew a mean. */
  medianSeconds: number | null;
  estMinutes: number;
  /** Learners who started this module and did not complete it. */
  dropped: number;
};

export async function getModuleEngagement(): Promise<ModuleEngagement[]> {
  const course = await getCourse();

  // Ordered by level then module. The relational query API cannot order by a
  // parent's column, so the level order is fetched and applied below.
  //
  // The level ids are also used to scope the module query. An earlier version
  // embedded a raw SQL subquery here, which broke: the relational query builder
  // aliases its root table, so an interpolated column reference resolved against
  // the wrong name at runtime.
  const courseLevels = await db
    .select({ id: levelsTable.id, order: levelsTable.order })
    .from(levelsTable)
    .where(eq(levelsTable.courseId, course.id));
  const levelOrder = new Map(courseLevels.map((l) => [l.id, l.order]));
  const levelIds = courseLevels.map((l) => l.id);

  if (levelIds.length === 0) return [];

  const modules = (
    await db.query.modules.findMany({
      where: inArray(modulesTable.levelId, levelIds),
      columns: {
        id: true,
        slug: true,
        title: true,
        order: true,
        estMinutes: true,
        levelId: true,
      },
      with: {
        level: { columns: { title: true, slug: true } },
        progress: { columns: { status: true, secondsSpent: true } },
      },
    })
  ).sort(
    (a, b) =>
      (levelOrder.get(a.levelId) ?? 0) - (levelOrder.get(b.levelId) ?? 0) ||
      a.order - b.order,
  );

  return modules.map((m) => {
    const started = m.progress.length;
    const completed = m.progress.filter((p) => p.status === "COMPLETE").length;

    const times = m.progress
      .map((p) => p.secondsSpent)
      .filter((s) => s > 0)
      .sort((a, b) => a - b);
    const medianSeconds = times.length
      ? times[Math.floor(times.length / 2)]
      : null;

    return {
      moduleId: m.id,
      slug: m.slug,
      title: m.title,
      order: m.order,
      levelTitle: m.level.title,
      levelSlug: m.level.slug,
      started,
      completed,
      completionRatePct: started > 0 ? Math.round((completed / started) * 100) : null,
      medianSeconds,
      estMinutes: m.estMinutes,
      dropped: started - completed,
    };
  });
}

export type CertificateRow = {
  publicId: string;
  learnerName: string;
  awardTitle: string;
  levelTitle: string;
  scorePct: number;
  issuedAt: Date;
  revokedAt: Date | null;
};

export async function getCertificates(limit = 100): Promise<CertificateRow[]> {
  const rows = await db.query.certificates.findMany({
    orderBy: desc(certificates.issuedAt),
    limit,
    columns: {
      publicId: true,
      learnerNameSnapshot: true,
      awardTitleSnapshot: true,
      scorePct: true,
      issuedAt: true,
      revokedAt: true,
    },
    with: { level: { columns: { title: true } } },
  });

  return rows.map((r) => ({
    publicId: r.publicId,
    learnerName: r.learnerNameSnapshot,
    awardTitle: r.awardTitleSnapshot,
    levelTitle: r.level.title,
    scorePct: r.scorePct,
    issuedAt: r.issuedAt,
    revokedAt: r.revokedAt,
  }));
}

export type ReviewSummary = {
  total: number;
  needsVerification: number;
  approved: number;
  rejected: number;
  blockingLaunch: number;
  byCategory: Array<{ category: string; count: number }>;
};

export async function getReviewSummary(): Promise<ReviewSummary> {
  const items = await db
    .select({
      status: contentReviewItems.status,
      category: contentReviewItems.category,
      severity: contentReviewItems.severity,
    })
    .from(contentReviewItems);

  const byCategory = ["MEDICAL", "LEGAL", "STATISTIC"].map((category) => ({
    category,
    count: items.filter(
      (i) => i.category === category && i.status === "NEEDS_VERIFICATION",
    ).length,
  }));

  return {
    total: items.length,
    needsVerification: items.filter((i) => i.status === "NEEDS_VERIFICATION").length,
    approved: items.filter((i) => i.status === "APPROVED").length,
    rejected: items.filter((i) => i.status === "REJECTED").length,
    blockingLaunch: items.filter(
      (i) => i.status === "NEEDS_VERIFICATION" && i.severity === 1,
    ).length,
    byCategory,
  };
}
