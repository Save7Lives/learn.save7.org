import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { getLevelBySlug } from "@/lib/course";
import { getPostQuestions, startAttempt } from "@/lib/quiz";
import { isLevelContentComplete, recordEvent } from "@/lib/progress";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { submitAssessmentAction } from "../actions";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Cloudflare applies at deploy time. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/assessment/[level]">,
): Promise<Metadata> {
  const { level } = await props.params;
  const row = await getLevelBySlug(level);
  return { title: row ? `${row.certificateTitle} assessment` : "Assessment" };
}

export default async function PostAssessmentPage(
  props: PageProps<"/assessment/[level]">,
) {
  const { level: levelSlug } = await props.params;
  const user = await requireUser(`/assessment/${levelSlug}`);

  const level = await getLevelBySlug(levelSlug);
  if (!level) notFound();

  // Gate on the content actually being finished. Checked here rather than only
  // hidden in the UI, so the URL cannot be used to skip the modules.
  const contentComplete = await isLevelContentComplete(user.id, level.id);
  if (!contentComplete) redirect(`/levels/${levelSlug}`);

  const { attempt } = await startAttempt(user.id, "POST", level.id);
  const questions = await getPostQuestions(level.id);

  await recordEvent(user.id, "quiz_start", {
    metaJson: JSON.stringify({ kind: "POST", level: levelSlug }),
  });

  return (
    <div className="px-5 py-14 sm:px-8">
      <QuizRunner
        questions={questions}
        attemptId={attempt.id}
        title={`${level.title} assessment`}
        intro={
          attempt.attemptNo > 1
            ? `This is attempt ${attempt.attemptNo}. Your first attempt stays on record as the measure of what you learned, and passing on any attempt earns your certificate.`
            : `${questions.length} questions. You need ${level.passMarkPct}% for the "${level.certificateTitle}" certificate, and you can retake this as many times as you like.`
        }
        submitLabel="Submit assessment"
        onSubmit={submitAssessmentAction}
      />
    </div>
  );
}
