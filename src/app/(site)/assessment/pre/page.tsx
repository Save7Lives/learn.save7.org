import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { getBaselineQuestions, startAttempt } from "@/lib/quiz";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { submitAssessmentAction } from "../actions";
import { recordEvent } from "@/lib/progress";

/**
 * Edge runtime, required by Cloudflare Pages.
 *
 * `@cloudflare/next-on-pages` refuses to build a route that renders on the
 * Node runtime — every server-rendered route on Pages runs on workerd. This is
 * the whole reason the app is pinned to Next 15.5.2: the adapter supports no
 * higher, and OpenNext (which does not need this) supports no lower.
 */
export const runtime = "edge";

export const metadata: Metadata = { title: "Baseline assessment" };

export default async function PreAssessmentPage() {
  const user = await requireUser("/assessment/pre");

  const { attempt, alreadySubmitted } = await startAttempt(user.id, "PRE", null);

  // The baseline may only be taken once — a retake could manufacture an
  // improvement. Anyone returning to this URL sees their result instead.
  if (alreadySubmitted) redirect("/assessment/pre/done");

  const questions = await getBaselineQuestions();
  await recordEvent(user.id, "quiz_start", { metaJson: JSON.stringify({ kind: "PRE" }) });

  return (
    <div className="px-5 py-14 sm:px-8">
      <QuizRunner
        questions={questions}
        attemptId={attempt.id}
        title="Baseline assessment"
        intro="This is a baseline, not a test. There is no pass mark and nobody is judged on it — it simply lets us show you how much you've learned by the end. Answer what you can, and guess if you're unsure."
        submitLabel="Submit and start learning"
        onSubmit={submitAssessmentAction}
      />
    </div>
  );
}
