import Link from "next/link";
import { Eyebrow } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { StepDot, type RailState } from "@/components/portal/Portal";

/** One Stage of the Level, as the stepper needs it. */
export type RunnerStage = {
  slug: string;
  title: string;
  /** This Stage's Stage Quiz has been passed. What a Stage counts as complete on. */
  passed: boolean;
};

/**
 * The top of a Stage (#74): back link, eyebrow, the Stage title, its core question,
 * the time and step count, then the Stage stepper.
 *
 * The stepper is one dot per Stage in the Level: `teal` with a navy check when that
 * Stage's quiz is passed, a navy ring for this Stage, a grey ring for the rest. On a
 * phone it is dots only, because a Level can hold four Stages with long names; from
 * 40rem the names and a status word show. Each dot is a link, and carries its
 * Stage's name and state for a screen reader either way.
 */
export function StageHeader({
  levelSlug,
  levelTitle,
  stageNumber,
  stageCount,
  stageTitle,
  coreQuestion,
  estMinutes,
  stepCount,
  stages,
  currentSlug,
}: {
  levelSlug: string;
  levelTitle: string;
  stageNumber: number;
  stageCount: number;
  stageTitle: string;
  coreQuestion: string;
  estMinutes: number;
  stepCount: number;
  stages: RunnerStage[];
  currentSlug: string;
}) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto max-w-[680px] px-5 pb-[22px] pt-[18px] sm:px-8">
        <Link
          href={`/levels/${levelSlug}`}
          className="-ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-[0.9375rem] font-medium text-teal-ink hover:text-navy"
        >
          <Icon name="arrow-left" className="size-4 shrink-0 stroke-[2.25]" />
          {levelTitle} Level
        </Link>

        <Eyebrow className="text-teal-ink">
          {levelTitle} Level · Stage {stageNumber} of {stageCount}
        </Eyebrow>
        <h1 className="t-h1 mt-0.5 text-navy">{stageTitle}</h1>
        <p className="mt-2 text-base leading-6 text-grey sm:text-lg sm:leading-7">{coreQuestion}</p>

        <p className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-sm text-grey">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="clock" className="size-4 shrink-0 stroke-[2.25]" />
            About {estMinutes} minutes
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="list" className="size-4 shrink-0 stroke-[2.25]" />
            {stepCount} steps
          </span>
        </p>

        <ol aria-label={`Stages in ${levelTitle} Level`} className="mt-4 flex sm:mt-5">
          {stages.map((stage, i) => {
            const isCurrent = stage.slug === currentSlug;
            const state: RailState = isCurrent ? "current" : stage.passed ? "passed" : "todo";
            const status = isCurrent
              ? stage.passed
                ? "You are here, quiz passed"
                : "You are here"
              : stage.passed
                ? "Quiz passed"
                : "";
            return (
              <li key={stage.slug} className="relative min-w-0 flex-1 px-1 text-center">
                {i > 0 ? (
                  <span
                    aria-hidden="true"
                    className="absolute right-[calc(50%+22px)] top-[15px] w-[calc(100%-44px)] border-t-[3px] border-dotted border-line-strong"
                  />
                ) : null}
                <Link
                  href={`/levels/${levelSlug}/modules/${stage.slug}`}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Stage ${i + 1}, ${stage.title}${status ? `, ${status.toLowerCase()}` : ""}`}
                  className="block min-h-11"
                >
                  <StepDot state={state} n={i + 1} className="mx-auto mb-1.5" />
                  <span
                    className={
                      "hidden text-[0.8125rem] leading-[1.3] text-navy sm:block " +
                      (isCurrent ? "font-semibold" : "font-medium")
                    }
                  >
                    {stage.title}
                  </span>
                  <span className="mt-0.5 hidden text-xs text-grey sm:block">{status}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </header>
  );
}
