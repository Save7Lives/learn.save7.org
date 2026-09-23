"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { issueCertificateIfEarned } from "@/lib/certificates";
import { getNextModuleSlug } from "@/lib/course";
import { completeModule, markLessonViewed, recordEvent } from "@/lib/progress";
import {
  readAttemptResult,
  startStageQuiz,
  submitAttempt,
  type AttemptResult,
  type ClientQuestion,
  type SubmittedAnswer,
} from "@/lib/quiz";

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
  // when this was the last one — that is where the Certificate lives.
  redirect(next ? `/levels/${levelSlug}/modules/${next}` : `/levels/${levelSlug}`);
}

/** Fired when a learner opens a level, for drop-off analytics. */
export async function startLevelAction(levelSlug: string): Promise<void> {
  const user = await requireUser();
  await recordEvent(user.id, "level_start", {
    metaJson: JSON.stringify({ level: levelSlug }),
  });
}

// --- Stage Quizzes ----------------------------------------------------------
// Run inline in a Stage's CHECK step, so these return rather than redirect.
// Failures come back as { error }, never thrown, for the reason
// completeModuleAction gives: an error escaping a transition replaces the whole
// page with React's error boundary.

export type StageQuizPaper = {
  attemptId: string;
  attemptNo: number;
  questions: ClientQuestion[];
};

export type StageQuizOutcome = {
  result: AttemptResult;
  /** Set when this pass completed the Level: the Certificate it earned. */
  certificatePublicId: string | null;
};

/** Open, or resume, this Stage's quiz. */
export async function startStageQuizAction(
  stageSlug: string,
): Promise<StageQuizPaper | { error: string }> {
  const user = await requireUser();
  try {
    const { attempt, questions } = await startStageQuiz(stageSlug);
    if (questions.length === 0) {
      return { error: "This Stage's quiz isn't available yet." };
    }
    await recordEvent(user.id, "quiz_start", {
      moduleId: stageSlug,
      metaJson: JSON.stringify({ kind: "STAGE", stage: stageSlug, attemptNo: attempt.attemptNo }),
    });
    return { attemptId: attempt.id, attemptNo: attempt.attemptNo, questions };
  } catch (error) {
    console.error("startStageQuizAction failed", { stageSlug, error });
    return { error: "We couldn't open the Stage Quiz. Please try again." };
  }
}

/**
 * Mark a Stage Quiz.
 *
 * Marking, the pass mark and the Stage's pass flag are all the database's
 * (`learn_submit_attempt()`, 0113). What is left here is issuing the Certificate
 * when a pass completes the Level — issued on the first screen where it could
 * have been earned, as the results page used to, and idempotent, so a pass that
 * does not finish the Level simply gets nothing back.
 */
export async function submitStageQuizAction(
  attemptId: string,
  payload: string,
): Promise<StageQuizOutcome | { error: string }> {
  const user = await requireUser();

  const answers = parseAnswers(payload);
  if (!answers) {
    return { error: "We couldn't read your answers. Please try submitting again." };
  }

  const result = await submitAttempt(user.id, attemptId, answers);
  if ("error" in result) return { error: result.error };

  await recordEvent(user.id, "quiz_submit", {
    moduleId: result.moduleSlug ?? undefined,
    metaJson: JSON.stringify({
      kind: "STAGE",
      stage: result.moduleSlug,
      level: result.levelSlug,
      scorePct: result.scorePct,
      passed: result.passed,
    }),
  });

  let certificatePublicId: string | null = null;
  if (result.passed && result.levelSlug) {
    const certificate = await issueCertificateIfEarned(user.id, result.levelSlug);
    certificatePublicId = certificate?.publicId ?? null;
  }

  return { result, certificatePublicId };
}

/** A marked attempt read back, for "review your last attempt". */
export async function readStageQuizAction(
  attemptId: string,
): Promise<AttemptResult | { error: string }> {
  const user = await requireUser();
  const result = await readAttemptResult(user.id, attemptId);
  return result ?? { error: "That attempt couldn't be found." };
}

/**
 * The payload arrives as a JSON string so the client component can stay a plain
 * function call. Parsed defensively: the database ignores anything that is not a
 * question on this paper anyway.
 */
function parseAnswers(payload: string): SubmittedAnswer[] | null {
  try {
    const parsed = JSON.parse(payload) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter(
        (a): a is { questionId: string; choiceIds: unknown } =>
          typeof a === "object" &&
          a !== null &&
          typeof (a as { questionId?: unknown }).questionId === "string",
      )
      .map((a) => ({
        questionId: a.questionId,
        choiceIds: Array.isArray(a.choiceIds)
          ? a.choiceIds.filter((c): c is string => typeof c === "string")
          : [],
      }));
  } catch {
    return null;
  }
}
