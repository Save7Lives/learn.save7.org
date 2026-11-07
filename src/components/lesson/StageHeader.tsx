import Link from "next/link";
import { Eyebrow } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";

/**
 * The top of a Stage (#74): back link, eyebrow, the Stage title, its core question,
 * and the time and step count. Where the Stage sits in its Level is shown once, in
 * the step rail below (StepRail), not in a stepper of its own here.
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
}: {
  levelSlug: string;
  levelTitle: string;
  stageNumber: number;
  stageCount: number;
  stageTitle: string;
  coreQuestion: string;
  estMinutes: number;
  stepCount: number;
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
      </div>
    </header>
  );
}
