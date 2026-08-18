"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/authz";
import { and, asc, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { levels, lessons, modules } from "@/db/schema";
import { completeModule, markLessonViewed, recordEvent } from "@/lib/progress";

/**
 * Record that a learner has reached a lesson.
 *
 * Called as the learner moves between steps. Ownership is re-checked here rather
 * than trusted from the client, and the module is resolved from the lesson, so a
 * crafted request cannot write progress against a module the learner isn't in.
 */
export async function viewLessonAction(
  lessonId: string,
  secondsOnPreviousStep: number,
): Promise<void> {
  const user = await requireUser();

  const [lesson] = await db
    .select({ id: lessons.id, moduleId: lessons.moduleId })
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);
  if (!lesson) return;

  await markLessonViewed(
    user.id,
    lesson.moduleId,
    lesson.id,
    Number.isFinite(secondsOnPreviousStep) ? Math.trunc(secondsOnPreviousStep) : 0,
  );
}

/**
 * Mark a module complete.
 *
 * Explicit rather than inferred from scrolling: the brief asks for a deliberate
 * completion step, and an explicit action is a more honest engagement record.
 */
export async function completeModuleAction(
  levelSlug: string,
  moduleSlug: string,
): Promise<void> {
  const user = await requireUser();

  const [mod] = await db
    .select({ id: modules.id, levelId: modules.levelId, order: modules.order })
    .from(modules)
    .innerJoin(levels, eq(modules.levelId, levels.id))
    .where(and(eq(modules.slug, moduleSlug), eq(levels.slug, levelSlug)))
    .limit(1);
  if (!mod) return;

  await completeModule(user.id, mod.id);

  revalidatePath(`/levels/${levelSlug}`);
  revalidatePath("/dashboard");
  revalidatePath("/");

  // Send them to the next module in the level, or back to the level overview
  // when this was the last one — that is where the post-assessment CTA lives.
  const [next] = await db
    .select({ slug: modules.slug })
    .from(modules)
    .where(and(eq(modules.levelId, mod.levelId), gt(modules.order, mod.order)))
    .orderBy(asc(modules.order))
    .limit(1);

  redirect(next ? `/levels/${levelSlug}/modules/${next.slug}` : `/levels/${levelSlug}`);
}

/** Fired when a learner opens a level, for drop-off analytics. */
export async function startLevelAction(levelSlug: string): Promise<void> {
  const user = await requireUser();
  await recordEvent(user.id, "level_start", {
    metaJson: JSON.stringify({ level: levelSlug }),
  });
}
