import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { getBaselineState, getPathwayForUser, getLevelBySlug, getModuleStatuses } from "@/lib/course";
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
// (Supabase URL and key, SITE_URL) which Cloudflare applies at deploy time. A
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

  const baseline = await getBaselineState(user.id);
  if (!baseline.completed) redirect("/assessment/pre");

  const { levels } = await getPathwayForUser(user.id);
  const level = levels.find((l) => l.slug === levelSlug);
  if (!level) notFound();

  const tier = level.tier as LevelTier;
  const meta = TIER_META[tier];
  const progress = level.progress!;
  const contentDone = progress.modulesComplete === progress.modulesTotal;

  // Which modules this learner has finished.
  const statusByModule = await getModuleStatuses(
    user.id,
    level.modules.map((m) => m.id),
  );

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
          {progress.certificatePublicId ? (
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
            {progress.modulesComplete} of {progress.modulesTotal} modules complete
          </span>
          <span className="text-sand-500">{progress.percentComplete}%</span>
        </div>
        <ProgressBar
          value={progress.percentComplete}
          label={`${level.title} progress`}
          tone={contentDone ? "teal" : "pink"}
        />
      </Card>

      {/* --- Modules ------------------------------------------------------- */}
      <ol className="mt-8 space-y-3">
        {level.modules.map((mod) => {
          const status = statusByModule.get(mod.id);
          const isDone = status === "COMPLETE";
          const isStarted = status === "IN_PROGRESS";

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
                    {isStarted ? <Badge tone="pink">In progress</Badge> : null}
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

      {/* --- Assessment ---------------------------------------------------- */}
      <Card
        className={cx(
          "mt-8 p-6",
          contentDone ? "border-pink-200 bg-pink-50/40" : "bg-sand-100/60",
        )}
      >
        <Eyebrow>Assessment</Eyebrow>
        <Display as="h2" className="mt-3 text-title text-ink">
          {level.certificateTitle} assessment
        </Display>

        {contentDone ? (
          <>
            <p className="mt-3 text-sand-700">
              You&apos;ve finished all {progress.modulesTotal} modules. The assessment
              takes a few minutes, and passing it at {level.passMarkPct}% earns your
              certificate. You can retake it as many times as you like.
            </p>
            {progress.postScorePct !== null ? (
              <p className="mt-3 text-sm text-sand-600">
                Your recorded score:{" "}
                <strong className="text-ink">{progress.postScorePct}%</strong>
                {progress.bestScorePct !== null &&
                progress.bestScorePct !== progress.postScorePct
                  ? ` · best so far ${progress.bestScorePct}%`
                  : ""}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink href={`/assessment/${levelSlug}`} size="lg">
                {progress.postScorePct === null
                  ? "Start the assessment"
                  : "Retake the assessment"}
              </ButtonLink>
              {progress.certificatePublicId ? (
                <ButtonLink
                  href={`/certificate/${progress.certificatePublicId}`}
                  size="lg"
                  variant="outline"
                >
                  View my certificate
                </ButtonLink>
              ) : null}
              {progress.postScorePct !== null ? (
                <ButtonLink
                  href={`/assessment/${levelSlug}/results`}
                  size="lg"
                  variant="outline"
                >
                  See my results
                </ButtonLink>
              ) : null}
            </div>
          </>
        ) : (
          <p className="mt-3 text-sand-600">
            Complete all {progress.modulesTotal} modules to unlock the assessment.{" "}
            {progress.modulesTotal - progress.modulesComplete} to go.
          </p>
        )}
      </Card>
    </div>
  );
}
