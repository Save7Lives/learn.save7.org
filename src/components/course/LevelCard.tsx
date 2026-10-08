import Link from "next/link";
import {
  Badge,
  ButtonLink,
  Card,
  Display,
  ProgressBar,
  TIER_META,
  cx,
} from "@/components/ui/primitives";
import type { LevelTier } from "@/lib/constants";
import type { LevelProgressSummary } from "@/lib/course";

/**
 * A level card.
 *
 * The point of the three-tier structure is that Beginner never feels like an
 * unfinished fragment, so each card leads with what the learner will be able to
 * *do*, and names its own certificate. Nothing here implies the level is a step
 * toward something more legitimate.
 */
export function LevelCard({
  level,
  progress,
  signedIn,
  recommended,
}: {
  level: {
    slug: string;
    tier: string;
    title: string;
    strapline: string;
    goal: string;
    estMinMinutes: number;
    estMaxMinutes: number;
    certificateTitle: string;
    modules: Array<{ slug: string; order: number; title: string }>;
  };
  progress: LevelProgressSummary | null;
  signedIn: boolean;
  recommended?: boolean;
}) {
  const tier = level.tier as LevelTier;
  const meta = TIER_META[tier];
  const started = progress && progress.status !== "NOT_STARTED";
  const complete = progress?.status === "COMPLETE";

  const href = signedIn
    ? started && progress?.nextModuleSlug
      ? `/levels/${level.slug}/modules/${progress.nextModuleSlug}`
      : `/levels/${level.slug}`
    : `/register?next=${encodeURIComponent(`/levels/${level.slug}`)}`;

  return (
    <Card
      as="article"
      className={cx(
        "flex flex-col p-6 transition hover:shadow-[0_8px_30px_rgba(17,17,17,0.07)] sm:p-7",
        recommended && "ring-2 ring-pink-200",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          tone="neutral"
          className={cx(meta.softClass, meta.textClass, "border-transparent")}
        >
          <span aria-hidden="true" className={cx("size-2 rounded-full", meta.dotClass)} />
          {meta.label}
        </Badge>
        {recommended && !started ? <Badge tone="pink">Recommended start</Badge> : null}
        {complete ? <Badge tone="correct">Complete</Badge> : null}
      </div>

      <Display as="h3" className="mt-4 text-title text-ink">
        {level.title}
      </Display>
      <p className="mt-2 text-sm text-sand-600">{level.strapline}</p>

      <dl className="mt-5 space-y-3 border-t border-sand-200 pt-5 text-sm">
        <div className="flex gap-3">
          <dt className="w-24 shrink-0 font-semibold text-sand-500">You&apos;ll be able to</dt>
          <dd className="text-sand-700">{level.goal}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-24 shrink-0 font-semibold text-sand-500">Time</dt>
          <dd className="text-sand-700">
            {level.estMinMinutes}–{level.estMaxMinutes} minutes · {level.modules.length}{" "}
            Stages
          </dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-24 shrink-0 font-semibold text-sand-500">Earns</dt>
          <dd className="font-semibold text-ink">
            &ldquo;{level.certificateTitle}&rdquo; certificate
          </dd>
        </div>
      </dl>

      <ul className="mt-5 space-y-1.5 text-sm text-sand-600">
        {level.modules.map((m) => (
          <li key={m.slug} className="flex gap-2.5">
            <span
              aria-hidden="true"
              className={cx("mt-2 size-1.5 shrink-0 rounded-full", meta.dotClass)}
            />
            {m.title}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex-1" />

      {progress && started ? (
        <div className="mb-4">
          <div className="mb-2 flex items-baseline justify-between text-xs font-semibold">
            <span className="text-sand-500">
              {progress.stagesPassed} of {progress.modulesTotal} Stages passed
            </span>
            {progress.certificatePublicId ? (
              <Link
                href={`/certificate/${progress.certificatePublicId}`}
                className="text-pink-600 underline"
              >
                View certificate
              </Link>
            ) : null}
          </div>
          <ProgressBar
            value={progress.percentComplete}
            label={`${level.title} progress`}
            tone={complete ? "teal" : "pink"}
          />
        </div>
      ) : null}

      <ButtonLink
        href={href}
        variant={recommended && !started ? "primary" : "outline"}
        className="w-full"
      >
        {complete
          ? "Review this level"
          : started
            ? "Continue"
            : `Start ${meta.label}`}
      </ButtonLink>
    </Card>
  );
}
