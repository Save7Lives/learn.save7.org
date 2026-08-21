import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { levels as levelsTable } from "@/db/schema";
import { getPostQuestions, startAttempt } from "@/lib/quiz";
import { isLevelContentComplete, recordEvent } from "@/lib/progress";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { submitAssessmentAction } from "../actions";

/**
 * Edge runtime, required by Cloudflare Pages.
 *
 * `@cloudflare/next-on-pages` refuses to build a route that renders on the
 * Node runtime — every server-rendered route on Pages runs on workerd. This is
 * the whole reason the app is pinned to Next 15.5.2: the adapter supports no
 * higher, and OpenNext (which does not need this) supports no lower.
 */
export const runtime = "edge";

export async function generateMetadata(
  props: PageProps<"/assessment/[level]">,
): Promise<Metadata> {
  const { level } = await props.params;
  const [row] = await db
    .select({ certificateTitle: levelsTable.certificateTitle })
    .from(levelsTable)
    .where(eq(levelsTable.slug, level))
    .limit(1);
  return { title: row ? `${row.certificateTitle} assessment` : "Assessment" };
}

export default async function PostAssessmentPage(
  props: PageProps<"/assessment/[level]">,
) {
  const { level: levelSlug } = await props.params;
  const user = await requireUser(`/assessment/${levelSlug}`);

  const level = await db.query.levels.findFirst({
    where: eq(levelsTable.slug, levelSlug),
  });
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
