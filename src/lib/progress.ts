import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "./db";
import {
  courseProgress,
  eventLogs,
  levelProgress,
  levels,
  moduleProgress,
  modules,
} from "@/db/schema";
import type { EventType } from "./constants";

/**
 * Progress writes and engagement events.
 *
 * Kept apart from the read path in course.ts so that every mutation of a
 * learner's record goes through one small, auditable file.
 */

/** How many of the given modules this learner has completed. */
async function countCompleted(userId: string, moduleIds: string[]): Promise<number> {
  if (moduleIds.length === 0) return 0;
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(moduleProgress)
    .where(
      and(
        eq(moduleProgress.userId, userId),
        eq(moduleProgress.status, "COMPLETE"),
        inArray(moduleProgress.moduleId, moduleIds),
      ),
    );
  return Number(row?.count ?? 0);
}

// --- Events -----------------------------------------------------------------

/**
 * Record an engagement event.
 *
 * Deliberately stores no IP address and no user agent — see the privacy notice.
 * Save7 needs to know whether people are learning, not who they are or what
 * device they used.
 *
 * Never throws: analytics failing must not break a lesson. A learner losing
 * their place because an event insert failed would be a far worse bug than a
 * missing data point.
 */
export async function recordEvent(
  userId: string | null,
  type: EventType,
  options: {
    sessionKey?: string;
    moduleId?: string;
    lessonId?: string;
    metaJson?: string;
  } = {},
): Promise<void> {
  try {
    await db.insert(eventLogs).values({
      userId,
      // Falls back to the user id so an event is always attributable to a
      // session of some kind without inventing a fingerprint.
      sessionKey: options.sessionKey ?? userId ?? "anonymous",
      type,
      moduleId: options.moduleId ?? null,
      lessonId: options.lessonId ?? null,
      metaJson: options.metaJson ?? null,
    });
  } catch {
    // Intentionally swallowed.
  }
}

// --- Module progress --------------------------------------------------------

/** Mark a lesson as viewed, and keep the resume pointer up to date. */
export async function markLessonViewed(
  userId: string,
  moduleId: string,
  lessonId: string,
  secondsToAdd = 0,
): Promise<void> {
  const [existing] = await db
    .select({
      completedLessonsJson: moduleProgress.completedLessonsJson,
      status: moduleProgress.status,
      secondsSpent: moduleProgress.secondsSpent,
    })
    .from(moduleProgress)
    .where(and(eq(moduleProgress.userId, userId), eq(moduleProgress.moduleId, moduleId)))
    .limit(1);

  const seen = new Set<string>(
    existing ? (JSON.parse(existing.completedLessonsJson) as string[]) : [],
  );
  seen.add(lessonId);

  // Clamped: a tab left open overnight must not report a sixteen-hour lesson.
  const seconds = Math.max(0, Math.min(secondsToAdd, 3600));

  await db
    .insert(moduleProgress)
    .values({
      userId,
      moduleId,
      completedLessonsJson: JSON.stringify([...seen]),
      lastLessonId: lessonId,
      secondsSpent: seconds,
      status: "IN_PROGRESS",
    })
    .onConflictDoUpdate({
      target: [moduleProgress.userId, moduleProgress.moduleId],
      set: {
        completedLessonsJson: JSON.stringify([...seen]),
        lastLessonId: lessonId,
        secondsSpent: (existing?.secondsSpent ?? 0) + seconds,
        // Viewing a lesson never downgrades a completed module back to in-progress.
        status: existing?.status === "COMPLETE" ? "COMPLETE" : "IN_PROGRESS",
        updatedAt: new Date(),
      },
    });

  await recordEvent(userId, "lesson_view", { moduleId, lessonId });
}

/**
 * Complete a module.
 *
 * The learner marks this explicitly rather than it happening implicitly on
 * scroll — the brief asks for an explicit completion step, and an explicit action
 * is also a more honest record of engagement than "reached the bottom".
 */
export async function completeModule(userId: string, moduleId: string): Promise<void> {
  const now = new Date();

  await db
    .insert(moduleProgress)
    .values({
      userId,
      moduleId,
      status: "COMPLETE",
      completedAt: now,
      completedLessonsJson: "[]",
    })
    .onConflictDoUpdate({
      target: [moduleProgress.userId, moduleProgress.moduleId],
      set: { status: "COMPLETE", completedAt: now, updatedAt: now },
    });

  await recordEvent(userId, "module_complete", { moduleId });
  await recalculateLevelProgress(userId, moduleId);
}

/**
 * Recompute cached level and course percentages after a module completes.
 *
 * These are denormalised because the dashboard and landing page read them on
 * almost every request; recomputing here keeps that read cheap.
 */
export async function recalculateLevelProgress(
  userId: string,
  changedModuleId: string,
): Promise<void> {
  const [mod] = await db
    .select({ levelId: modules.levelId, courseId: levels.courseId })
    .from(modules)
    .innerJoin(levels, eq(modules.levelId, levels.id))
    .where(eq(modules.id, changedModuleId))
    .limit(1);
  if (!mod) return;

  const mandatory = await db
    .select({ id: modules.id })
    .from(modules)
    .where(and(eq(modules.levelId, mod.levelId), eq(modules.isMandatory, true)));

  const completed = await countCompleted(
    userId,
    mandatory.map((m) => m.id),
  );

  const percent = mandatory.length ? Math.round((completed / mandatory.length) * 100) : 0;
  const isComplete = mandatory.length > 0 && completed === mandatory.length;
  const now = new Date();

  await db
    .insert(levelProgress)
    .values({
      userId,
      levelId: mod.levelId,
      percentComplete: percent,
      status: isComplete ? "COMPLETE" : "IN_PROGRESS",
      completedAt: isComplete ? now : null,
    })
    .onConflictDoUpdate({
      target: [levelProgress.userId, levelProgress.levelId],
      set: {
        percentComplete: percent,
        status: isComplete ? "COMPLETE" : "IN_PROGRESS",
        completedAt: isComplete ? now : null,
        updatedAt: now,
      },
    });

  await recalculateCourseProgress(userId, mod.courseId);
}

async function recalculateCourseProgress(userId: string, courseId: string): Promise<void> {
  const mandatory = await db
    .select({ id: modules.id })
    .from(modules)
    .innerJoin(levels, eq(modules.levelId, levels.id))
    .where(and(eq(levels.courseId, courseId), eq(modules.isMandatory, true)));

  const completed = await countCompleted(
    userId,
    mandatory.map((m) => m.id),
  );

  const percent = mandatory.length ? Math.round((completed / mandatory.length) * 100) : 0;
  const isComplete = mandatory.length > 0 && completed === mandatory.length;
  const now = new Date();

  await db
    .insert(courseProgress)
    .values({
      userId,
      courseId,
      percentComplete: percent,
      status: isComplete ? "COMPLETE" : "IN_PROGRESS",
      completedAt: isComplete ? now : null,
    })
    .onConflictDoUpdate({
      target: [courseProgress.userId, courseProgress.courseId],
      set: {
        percentComplete: percent,
        status: isComplete ? "COMPLETE" : "IN_PROGRESS",
        completedAt: isComplete ? now : null,
        updatedAt: now,
      },
    });
}

/** Whether every mandatory module in a level is complete. Gates the certificate. */
export async function isLevelContentComplete(
  userId: string,
  levelId: string,
): Promise<boolean> {
  const mandatory = await db
    .select({ id: modules.id })
    .from(modules)
    .where(and(eq(modules.levelId, levelId), eq(modules.isMandatory, true)));
  if (mandatory.length === 0) return false;

  const completed = await countCompleted(
    userId,
    mandatory.map((m) => m.id),
  );
  return completed === mandatory.length;
}
