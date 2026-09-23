"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { getAttemptMeta, submitAttempt, type SubmittedAnswer } from "@/lib/quiz";
import { recordEvent } from "@/lib/progress";

/**
 * Grade a submitted assessment.
 *
 * The payload arrives as a JSON string so the client component can stay a plain
 * function call rather than a form encoding. It is parsed defensively — the
 * grader ignores anything that is not a known question of this attempt anyway.
 */
export async function submitAssessmentAction(
  attemptId: string,
  payload: string,
): Promise<{ error?: string } | void> {
  const user = await requireUser();

  let answers: SubmittedAnswer[];
  try {
    const parsed = JSON.parse(payload) as unknown;
    if (!Array.isArray(parsed)) throw new Error("not an array");
    answers = parsed
      .filter(
        (a): a is { questionId: string; choiceIds: unknown } =>
          typeof a === "object" && a !== null && typeof (a as { questionId?: unknown }).questionId === "string",
      )
      .map((a) => ({
        questionId: a.questionId,
        choiceIds: Array.isArray(a.choiceIds)
          ? a.choiceIds.filter((c): c is string => typeof c === "string")
          : [],
      }));
  } catch {
    return { error: "We couldn't read your answers. Please try submitting again." };
  }

  const result = await submitAttempt(user.id, attemptId, answers);
  if ("error" in result) return { error: result.error };

  const attempt = await getAttemptMeta(attemptId);

  await recordEvent(user.id, "quiz_submit", {
    metaJson: JSON.stringify({
      kind: attempt?.scope,
      level: attempt?.levelSlug ?? null,
      scorePct: result.scorePct,
    }),
  });

  if (attempt?.scope === "PRE") {
    // The baseline-done marker is written by learn_submit_attempt(), in the same
    // statement that records the score — so it cannot be set for an attempt that
    // did not actually grade, and there is nothing to write here.
    redirect("/assessment/pre/done");
  }

  // Stage Quizzes are submitted inline through submitStageQuizAction, so nothing
  // Level-wide reaches here any more (#57). The Level page is the safe landing.
  redirect(attempt?.levelSlug ? `/levels/${attempt.levelSlug}` : "/dashboard");
}
