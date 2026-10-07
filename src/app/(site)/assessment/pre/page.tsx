import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { getBaselineState } from "@/lib/baseline";
import { getBaselineQuestions } from "@/lib/quiz";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { submitBaselineSittingAction } from "../actions";
import { recordEvent } from "@/lib/progress";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Baseline assessment" };

/**
 * One Baseline Sitting: the twenty fixed-form questions, in their one order, with
 * options in authored order. Offered only when a Sitting is owed (see
 * `dueSitting()` in lib/baseline.ts); anyone else returning to this URL sees their
 * results instead.
 */
export default async function BaselinePage() {
  const user = await requireUser("/assessment/pre");

  const { due } = await getBaselineState(user.id);
  if (due === null) redirect("/assessment/pre/done");

  const questions = await getBaselineQuestions();
  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
        <p className="rounded-xl border border-red-200 bg-incorrect-soft px-4 py-3 text-sm font-medium text-incorrect">
          The baseline questions aren&apos;t available right now. Please try again later.
        </p>
      </div>
    );
  }

  await recordEvent(user.id, "quiz_start", {
    metaJson: JSON.stringify({ kind: "BASELINE", sitting: due }),
  });

  const intro =
    due === 1
      ? `This is a baseline, not a test. There is no pass mark and nobody is judged on it: it is the "before" that shows what you learn. Answer what you can, and guess if you're unsure. You won't see the answers afterwards, because the same ${questions.length} questions come back after each level. The course opens as soon as you submit.`
      : `The same ${questions.length} questions as your first baseline, in the same order, so the two can be compared. There is still no pass mark, and the answers still aren't shown afterwards.`;

  return (
    <div className="px-5 py-14 sm:px-8">
      <QuizRunner
        questions={questions}
        attemptId={String(due)}
        title={due === 1 ? "Baseline assessment" : `Baseline assessment, sitting ${due}`}
        intro={intro}
        submitLabel={due === 1 ? "Submit and start learning" : "Submit"}
        onSubmit={submitBaselineSittingAction}
      />
    </div>
  );
}
