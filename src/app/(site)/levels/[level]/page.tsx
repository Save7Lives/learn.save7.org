import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { getBaselineState } from "@/lib/baseline";
import { getPathwayForUser, getLevelBySlug, getModuleStatuses } from "@/lib/course";
import { issueCertificateIfEarned } from "@/lib/certificates";
import { getStageQuizStates } from "@/lib/quiz";
import { LevelOverview } from "@/components/course/LevelOverview";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/levels/[level]">,
): Promise<Metadata> {
  const { level } = await props.params;
  const row = await getLevelBySlug(level);
  return row
    ? { title: row.title, description: row.strapline }
    : { title: "Level not found" };
}

export default async function LevelPage(props: PageProps<"/levels/[level]">) {
  const { level: levelSlug } = await props.params;
  const user = await requireUser(`/levels/${levelSlug}`);

  // Stage content waits for the first Baseline Sitting: a "before" taken after
  // reading is not a before (#54). No score gates anything, and no later Sitting.
  const baseline = await getBaselineState(user.id);
  if (!baseline.completed) redirect("/assessment/pre");

  const { levels } = await getPathwayForUser(user.id);
  const level = levels.find((l) => l.slug === levelSlug);
  if (!level) notFound();

  const progress = level.progress!;
  const allPassed = progress.modulesTotal > 0 && progress.stagesPassed === progress.modulesTotal;

  // Which Stages this learner has read, and where they stand on each Stage Quiz.
  const [statusByModule, quizByModule] = await Promise.all([
    getModuleStatuses(
      user.id,
      level.modules.map((m) => m.id),
    ),
    getStageQuizStates(level.modules.map((m) => m.id)),
  ]);

  // Normally issued the moment the last Stage Quiz is passed. Issued here as well,
  // idempotently, so a learner whose pass landed but whose certificate call did
  // not is never left with a finished Level and nothing to show for it.
  const certificatePublicId =
    progress.certificatePublicId ??
    (allPassed ? ((await issueCertificateIfEarned(user.id, level.id))?.publicId ?? null) : null);

  return (
    <LevelOverview
      level={level}
      levelSlug={levelSlug}
      certificatePublicId={certificatePublicId}
      baselineDue={baseline.due}
      stageStatus={statusByModule}
      quizByModule={quizByModule}
    />
  );
}
