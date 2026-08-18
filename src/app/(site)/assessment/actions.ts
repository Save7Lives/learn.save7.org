"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { submitAttempt, type SubmittedAnswer } from "@/lib/quiz";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courseProgress, levels, quizAttempts } from "@/db/schema";
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

  const [attempt] = await db
    .select({
      kind: quizAttempts.kind,
      levelSlug: levels.slug,
      courseId: quizAttempts.courseId,
    })
    .from(quizAttempts)
    .leftJoin(levels, eq(quizAttempts.levelId, levels.id))
    .where(eq(quizAttempts.id, attemptId))
    .limit(1);

  await recordEvent(user.id, "quiz_submit", {
    metaJson: JSON.stringify({
      kind: attempt?.kind,
      level: attempt?.levelSlug ?? null,
      scorePct: result.scorePct,
    }),
  });

  if (attempt?.kind === "PRE") {
    // Mark the baseline done so the learner is no longer gated out of modules.
    const now = new Date();
    await db
      .insert(courseProgress)
      .values({
        userId: user.id,
        courseId: attempt.courseId,
        baselineDoneAt: now,
        status: "IN_PROGRESS",
      })
      .onConflictDoUpdate({
        target: [courseProgress.userId, courseProgress.courseId],
        set: { baselineDoneAt: now, updatedAt: now },
      });
    redirect("/assessment/pre/done");
  }

  redirect(`/assessment/${attempt?.levelSlug ?? ""}/results`);
}
