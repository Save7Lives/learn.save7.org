import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { getBaselineState } from "@/lib/baseline";
import { getPathwayForUser, getLevelBySlug, getModuleStatuses } from "@/lib/course";
import { issueCertificateIfEarned } from "@/lib/certificates";
import { getStageQuizStates } from "@/lib/quiz";
import {
  Badge,
  ButtonLink,
  Card,
  Display,
  Eyebrow,
  ProgressBar,
  TIER_META,
  cx,
} from "@/components/ui/primitives";
import type { LevelTier } from "@/lib/constants";

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

  const tier = level.tier as LevelTier;
  const meta = TIER_META[tier];
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
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
      <Link
        href="/#levels"
        className="text-sm font-semibold text-sand-500 underline hover:text-ink"
      >
        ← All levels
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            tone="neutral"
            className={cx(meta.softClass, meta.textClass, "border-transparent")}
          >
            <span aria-hidden="true" className={cx("size-2 rounded-full", meta.dotClass)} />
            {meta.label}
          </Badge>
          {progress.status === "COMPLETE" ? <Badge tone="correct">Complete</Badge> : null}
          {certificatePublicId ? (
            <Badge tone="pink">Certificate earned</Badge>
          ) : null}
        </div>

        <Display as="h1" className="mt-4 text-display text-ink">
          {level.title}
        </Display>
        <p className="mt-3 max-w-2xl text-lg text-sand-700">{level.goal}</p>
        <p className="mt-2 text-sm text-sand-500">
          {level.estMinMinutes}–{level.estMaxMinutes} minutes · {level.modules.length}{" "}
          modules · earns the &ldquo;{level.certificateTitle}&rdquo; certificate
        </p>
      </header>

      <Card className="mt-8 p-5">
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-semibold text-ink">
            {progress.stagesPassed} of {progress.modulesTotal} Stage Quizzes passed
          </span>
          <span className="text-sand-500">{progress.percentComplete}%</span>
        </div>
        <ProgressBar
          value={progress.percentComplete}
          label={`${level.title} progress`}
          tone={allPassed ? "teal" : "pink"}
        />
      </Card>

      {/* --- Modules ------------------------------------------------------- */}
      <ol className="mt-8 space-y-3">
        {level.modules.map((mod) => {
          const status = statusByModule.get(mod.id);
          const quiz = quizByModule.get(mod.id);
          // The tick is for the Stage Quiz, which is what the Certificate counts.
          const isDone = quiz?.passedAt != null;
          const isStarted = !isDone && (status !== undefined || quiz?.latest != null);
          const quizFailed = !isDone && quiz?.latest != null;

          return (
            <Card as="li" key={mod.slug} className="p-0">
              <Link
                href={`/levels/${levelSlug}/modules/${mod.slug}`}
                className="flex items-start gap-4 p-5 transition hover:bg-sand-50"
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    "grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold",
                    isDone
                      ? "bg-correct text-white"
                      : isStarted
                        ? "bg-pink-button text-white"
                        : "bg-sand-200 text-sand-600",
                  )}
                >
                  {isDone ? "✓" : mod.order}
                </span>

                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-ink">{mod.title}</span>
                    {isDone ? (
                      <Badge tone="correct">Quiz passed</Badge>
                    ) : quizFailed ? (
                      <Badge tone="review">Quiz not passed yet</Badge>
                    ) : isStarted ? (
                      <Badge tone="pink">In progress</Badge>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-sm text-sand-600">
                    {mod.coreQuestion}
                  </span>
                  <span className="mt-1.5 block text-xs text-sand-400">
                    About {mod.estMinutes} minutes
                  </span>
                </span>

                <span aria-hidden="true" className="shrink-0 self-center text-sand-400">
                  →
                </span>
              </Link>
            </Card>
          );
        })}
      </ol>

      {/* --- Certificate --------------------------------------------------- */}
      <Card
        className={cx(
          "mt-8 p-6",
          allPassed ? "border-pink-200 bg-pink-50/40" : "bg-sand-100/60",
        )}
      >
        <Eyebrow>Certificate</Eyebrow>
        <Display as="h2" className="mt-3 text-title text-ink">
          {level.certificateTitle} certificate
        </Display>

        {certificatePublicId ? (
          <>
            <p className="mt-3 text-sand-700">
              You&apos;ve passed every Stage Quiz in {level.title}.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink href={`/certificate/${certificatePublicId}`} size="lg">
                View my certificate
              </ButtonLink>
              {baseline.due !== null ? (
                <ButtonLink href="/assessment/pre" size="lg" variant="outline">
                  See what you&apos;ve learned: baseline sitting {baseline.due}
                </ButtonLink>
              ) : null}
            </div>
          </>
        ) : allPassed ? (
          <p className="mt-3 text-sand-700">
            You&apos;ve passed every Stage Quiz, but we couldn&apos;t issue your certificate just
            now. Refresh this page to try again.
          </p>
        ) : (
          <p className="mt-3 text-sand-600">
            Pass the Stage Quiz in each of the {progress.modulesTotal} modules to earn it. Each
            one is in its module&apos;s Check step: {progress.modulesTotal - progress.stagesPassed}{" "}
            to go.
          </p>
        )}
      </Card>
    </div>
  );
}
