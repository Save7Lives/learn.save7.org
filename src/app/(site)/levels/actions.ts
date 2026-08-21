"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/authz";
import { getNextModuleSlug } from "@/lib/course";
import { completeModule, markLessonViewed, recordEvent } from "@/lib/progress";

/**
 * Record that a learner has reached a lesson.
 *
 * Called as the learner moves between steps.
 *
 * **The module is now a parameter rather than being resolved from the lesson.**
 * A lesson slug is only unique within its module — `intro`, `check` and
 * `complete` each occur once per module, thirteen times over — so a lesson
 * identifier on its own no longer identifies a lesson. Passing the module is what
 * makes the write unambiguous; the progress row it writes is keyed on the
 * learner, from the JWT, so naming somebody else's module still writes nothing
 * for them.
 */
export async function viewLessonAction(
  moduleSlug: string,
  lessonSlug: string,
  secondsOnPreviousStep: number,
): Promise<void> {
  const user = await requireUser();

  await markLessonViewed(
    user.id,
    moduleSlug,
    lessonSlug,
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

  await completeModule(user.id, moduleSlug);

  revalidatePath(`/levels/${levelSlug}`);
  revalidatePath("/dashboard");
  revalidatePath("/");

  // Send them to the next module in the level, or back to the level overview
  // when this was the last one — that is where the post-assessment CTA lives.
  const next = await getNextModuleSlug(levelSlug, moduleSlug);

  redirect(next ? `/levels/${levelSlug}/modules/${next}` : `/levels/${levelSlug}`);
}

/** Fired when a learner opens a level, for drop-off analytics. */
export async function startLevelAction(levelSlug: string): Promise<void> {
  const user = await requireUser();
  await recordEvent(user.id, "level_start", {
    metaJson: JSON.stringify({ level: levelSlug }),
  });
}
