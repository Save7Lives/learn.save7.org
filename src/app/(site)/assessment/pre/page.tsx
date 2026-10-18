import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { MAX_SITTINGS, getBaselineState } from "@/lib/baseline";
import { getBaselineQuestions } from "@/lib/quiz";
import { BaselineSitting } from "@/components/course/BaselineSitting";
import { startBaselineSittingAction, submitBaselineSittingAction } from "../actions";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Baseline assessment" };

/**
 * One Baseline Sitting: a before-you-start screen, then the twenty fixed-form
 * questions, in their one order, with options in authored order. `quiz_start` is
 * recorded when the learner presses Start, not when this page loads. Offered only
 * when a Sitting is owed (the Progress Record's `baseline.sitting_due`); anyone else
 * returning to this URL sees their results instead.
 */
export default async function BaselinePage() {
  const user = await requireUser("/assessment/pre");

  const { due } = await getBaselineState(user.id);
  if (due === null) redirect("/assessment/pre/done");

  const questions = await getBaselineQuestions();
  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
        <p className="rounded-xl border border-pink-line bg-pink-50 px-4 py-3 text-sm font-medium text-incorrect">
          The baseline questions aren&apos;t available right now. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <BaselineSitting
      questions={questions}
      sitting={due}
      maxSittings={MAX_SITTINGS}
      onStart={startBaselineSittingAction}
      onSubmit={submitBaselineSittingAction}
    />
  );
}
