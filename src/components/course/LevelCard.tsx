import Link from "next/link";
import { PortalCard, StatusPill } from "@/components/portal/Portal";
import {
  ButtonLink,
  Display,
  NumberPill,
  ProgressBar,
  RecommendedPill,
  cx,
} from "@/components/ui/primitives";
import type { LevelPosition } from "@/lib/course-position";

/**
 * A level card.
 *
 * The point of the three-tier structure is that Beginner never feels like an
 * unfinished fragment, so each card leads with what the learner will be able to
 * *do*, and names its own certificate. Nothing here implies the level is a step
 * toward something more legitimate.
 *
 * The recommended Level is `pink-50` and carries the only pink button until it is
 * complete, so a Student halfway through Intermediate sees a pink "Continue" there.
 * "Recommended start" shows only before the Level is started. A Level is told apart by
 * its name, never by a colour (#10, #68).
 */
export function LevelCard({
  level,
  position,
  signedIn,
  recommended,
}: {
  level: {
    slug: string;
    title: string;
    strapline: string;
    goal: string;
    estMinMinutes: number;
    estMaxMinutes: number;
    certificateTitle: string;
    modules: Array<{ slug: string; order: number; title: string }>;
  };
  /** The Student's Course Position in this Level; an empty one when signed out. */
  position: LevelPosition;
  signedIn: boolean;
  recommended?: boolean;
}) {
  const started = signedIn && position.status !== "NOT_STARTED";
  const complete = position.complete;

  const href = signedIn
    ? started && position.resumeStageSlug
      ? `/levels/${level.slug}/modules/${position.resumeStageSlug}`
      : `/levels/${level.slug}`
    : `/register?next=${encodeURIComponent(`/levels/${level.slug}`)}`;

  const divider = recommended ? "border-pink-line" : "border-line";

  return (
    <PortalCard
      as="article"
      plain
      tone={recommended ? "pink" : "white"}
      className="flex flex-col rounded-[1.375rem] p-6 sm:p-[1.625rem]"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-2.5 gap-y-2">
        <Display as="h3" className="text-[1.375rem] font-bold leading-tight tracking-normal text-navy">
          {level.title}
        </Display>
        {recommended && !started ? (
          <RecommendedPill>Recommended start</RecommendedPill>
        ) : complete ? (
          <StatusPill tone="done" icon="check-circle">
            Complete
          </StatusPill>
        ) : started ? (
          <StatusPill tone="progress" icon="clock">
            In progress
          </StatusPill>
        ) : null}
      </div>
      <p className="mb-[1.125rem] mt-2 text-[0.9375rem] text-grey">{level.strapline}</p>

      <dl className={cx("mb-[1.125rem] grid gap-3 border-t pt-4 text-[0.9375rem]", divider)}>
        <div>
          <dt className="text-[0.8125rem] font-medium text-grey">You&apos;ll be able to</dt>
          <dd className="mt-0.5">{level.goal}</dd>
        </div>
        <div>
          <dt className="text-[0.8125rem] font-medium text-grey">Time</dt>
          <dd className="mt-0.5">
            {level.estMinMinutes} to {level.estMaxMinutes} minutes &middot; {level.modules.length}{" "}
            Stages
          </dd>
        </div>
        <div>
          <dt className="text-[0.8125rem] font-medium text-grey">Earns</dt>
          <dd className="mt-0.5 font-medium">&ldquo;{level.certificateTitle}&rdquo; certificate</dd>
        </div>
      </dl>

      <ol className="mb-[1.375rem] grid gap-[0.5625rem] text-[0.9375rem]">
        {level.modules.map((m, i) => (
          <li key={m.slug} className="flex items-start gap-2.5">
            <NumberPill n={i + 1} tone="teal" size="sm" />
            <span>
              <span className="sr-only">Stage {i + 1}: </span>
              {m.title}
            </span>
          </li>
        ))}
      </ol>

      <div className="flex-1" />

      {started ? (
        <div className="mb-4">
          <div className="mb-2 flex items-baseline justify-between text-[0.8125rem] font-medium">
            <span>
              {position.stagesPassed} of {position.stagesTotal} Stages passed
            </span>
            {position.certificateCode ? (
              <Link
                href={`/certificate/${position.certificateCode}`}
                className="text-teal-ink underline underline-offset-2"
              >
                View certificate
              </Link>
            ) : null}
          </div>
          <ProgressBar
            value={position.percentComplete}
            label={`${level.title} progress`}
            tone="teal"
          />
        </div>
      ) : null}

      <ButtonLink
        href={href}
        variant={recommended ? "primary" : "secondary"}
        className="w-full"
      >
        {complete ? "Review this level" : started ? "Continue" : `Start ${level.title}`}
      </ButtonLink>
    </PortalCard>
  );
}
