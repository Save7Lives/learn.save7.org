"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { getBaselineState, submitBaselineSitting } from "@/lib/baseline";
import type { SubmittedAnswer } from "@/lib/quiz";
import { recordEvent } from "@/lib/progress";

/**
 * Record one Baseline Sitting.
 *
 * `sittingNo` is the Sitting the page was rendered for, passed through the
 * runner's attempt-id slot. It is checked against what is owed *now*, because
 * `learn_submit_baseline_sitting()` is not idempotent: a second tab, or a form
 * submitted twice, would otherwise record the same answers as the next Sitting
 * and spend one of the learner's four. A Sitting that is no longer owed lands on
 * the results instead.
 *
 * The payload arrives as a JSON string so the client component can stay a plain
 * function call rather than a form encoding. It is parsed defensively; the
 * function marks the bank it reads for itself, so anything outside it is ignored.
 */
export async function submitBaselineSittingAction(
  sittingNo: string,
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

  const { due } = await getBaselineState(user.id);
  if (due === null || String(due) !== sittingNo) redirect("/assessment/pre/done");

  const result = await submitBaselineSitting(answers);
  if ("error" in result) return { error: result.error };

  await recordEvent(user.id, "quiz_submit", {
    metaJson: JSON.stringify({
      kind: "BASELINE",
      sitting: result.sittingNo,
      scorePct: result.totalPct,
    }),
  });

  redirect("/assessment/pre/done");
}
