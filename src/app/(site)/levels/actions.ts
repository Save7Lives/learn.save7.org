"use server";

import { redirect } from "next/navigation";
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
): Promise<{ error?: string } | void> {
  const user = await requireUser();

  // Failures are returned, not thrown. The caller runs this inside a transition,
  // and an error escaping a transition reaches React's error boundary — which
  // replaces the entire page with "a client-side exception has occurred" instead
  // of telling the learner that one button did not work. A learner who has just
  // finished a module should never lose the module to a failed write.
  let next: string | null = null;
  try {
    const result = await completeModule(user.id, moduleSlug);
    if (!result.ok) return { error: result.error };

    next = await getNextModuleSlug(levelSlug, moduleSlug);
  } catch (error) {
    // Logged as well as reported, because the learner-facing message is
    // deliberately vague and the deployment's function logs are where the real
    // cause has to be readable.
    console.error("completeModuleAction failed", { levelSlug, moduleSlug, error });
    return { error: "We couldn't save your progress. Please try again." };
  }

  // No revalidatePath. Every route in this app reads cookies for the session, so
  // all of them are dynamic and none has a server-side cached entry to
  // invalidate; its only real effect here would be clearing the client's router
  // cache, and the redirect below already re-renders on the server.
  //
  // Outside the try above, deliberately: redirect() signals by throwing, so
  // catching it would turn a successful completion into an error message.
  //
  // Sends them to the next module in the level, or back to the level overview
  // when this was the last one — that is where the post-assessment CTA lives.
  redirect(next ? `/levels/${levelSlug}/modules/${next}` : `/levels/${levelSlug}`);
}

/** Fired when a learner opens a level, for drop-off analytics. */
export async function startLevelAction(levelSlug: string): Promise<void> {
  const user = await requireUser();
  await recordEvent(user.id, "level_start", {
    metaJson: JSON.stringify({ level: levelSlug }),
  });
}
