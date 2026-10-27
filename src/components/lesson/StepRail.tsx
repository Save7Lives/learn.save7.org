"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { RailStepper, type RailState } from "@/components/portal/Portal";
import { cx } from "@/components/ui/primitives";

export type RailStep = {
  id: string;
  /** The short rail label: Why this matters, Learn, Key takeaways, Check ... */
  label: string;
};

/** One Stage of the Level, as the rail needs it. */
export type RunnerStage = {
  slug: string;
  title: string;
  /** This Stage's Stage Quiz has been passed. What a Stage counts as complete on. */
  passed: boolean;
};

/** The current Stage's share of the line: wide enough to cut into its steps. */
const CURRENT_STAGE_FLEX = "flex-[2.4]";

/**
 * Where the learner is, in one slim bar that sticks to the top of the screen while
 * the site header scrolls away.
 *
 * It is "Step 2 of 7" over the step's short name, an "All steps" button, and one
 * segmented line that carries both scales: a block per Stage in the Level, with the
 * current Stage's block cut into its steps. A Stage block is teal once its quiz is
 * passed; a step segment is teal once read and navy where the learner is. This
 * replaced a dotted stepper for the Stages above a second one for the steps, which
 * said the same thing twice.
 *
 * "All steps" opens the vertical dotted rail stepper My Progress uses for a Level's
 * Stages, which is how a keyboard or a screen reader moves between steps; the step
 * segments take a tap or a click as a shortcut and are hidden from both. Each other
 * Stage's block is a link to that Stage.
 */
export function StepRail({
  steps,
  index,
  visited,
  onSelect,
  levelSlug,
  levelTitle,
  stages,
  currentSlug,
}: {
  steps: RailStep[];
  index: number;
  /** Indexes of steps the learner has been to. */
  visited: ReadonlySet<number>;
  onSelect: (index: number) => void;
  levelSlug: string;
  /** The Level's name without the word Level: "Beginner". */
  levelTitle: string;
  stages: RunnerStage[];
  currentSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const current = steps[index];
  const stateOf = (i: number): RailState =>
    i === index ? "current" : visited.has(i) ? "passed" : "todo";

  return (
    <nav
      aria-label="Steps in this Stage"
      // LessonSections measures this to stick its section map just below it.
      data-step-rail
      className="sticky top-0 z-30 border-b border-line bg-white"
    >
      <div className="mx-auto max-w-[680px] px-5 pb-3 pt-2.5 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <p className="flex min-w-0 flex-col leading-tight">
            <span className="text-[0.8125rem] text-grey">
              Step {index + 1} of {steps.length}
            </span>
            <span className="truncate font-(family-name:--font-display) text-base font-semibold leading-tight text-navy">
              {current.label}
            </span>
          </p>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="step-list"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[10px] px-2.5 text-sm font-medium text-teal-ink underline underline-offset-4"
          >
            All steps
            <Icon
              name="chev"
              className={cx("size-4 shrink-0 stroke-[2.25] transition-transform", open && "rotate-180")}
            />
          </button>
        </div>

        <ol aria-label={`Stages in ${levelTitle} Level`} className="mt-2 flex gap-1.5">
          {stages.map((stage, si) => {
            const label = `Stage ${si + 1}`;
            if (stage.slug === currentSlug) {
              return (
                <li key={stage.slug} aria-current="step" className={cx("min-w-0", CURRENT_STAGE_FLEX)}>
                  <div aria-hidden="true" className="flex gap-0.5">
                    {steps.map((step, i) => (
                      <button
                        key={step.id}
                        type="button"
                        tabIndex={-1}
                        title={step.label}
                        onClick={() => onSelect(i)}
                        className={cx(
                          "h-2 flex-1 first:rounded-l-full last:rounded-r-full",
                          i === index ? "bg-navy" : visited.has(i) ? "bg-teal" : "bg-line",
                        )}
                      />
                    ))}
                  </div>
                  <span className="mt-1 block truncate text-[0.6875rem] font-medium text-navy">
                    {label}
                    <span className="sr-only">
                      , {stage.title}, you are here{stage.passed ? ", quiz passed" : ""}
                    </span>
                  </span>
                </li>
              );
            }
            return (
              <li key={stage.slug} className="min-w-0 flex-1">
                <Link
                  href={`/levels/${levelSlug}/modules/${stage.slug}`}
                  aria-label={`${label}, ${stage.title}${stage.passed ? ", quiz passed" : ""}`}
                  title={stage.title}
                  // The pseudo-element stretches the tap target past the 8px bar
                  // without making the sticky bar any taller.
                  className="group relative block after:absolute after:inset-x-0 after:-inset-y-3 after:content-['']"
                >
                  <span
                    aria-hidden="true"
                    className={cx("block h-2 rounded-full", stage.passed ? "bg-teal" : "bg-line")}
                  />
                  <span
                    aria-hidden="true"
                    className="mt-1 block truncate text-[0.6875rem] text-grey group-hover:text-navy"
                  >
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>

        {open ? (
          <div id="step-list">
            <RailStepper
              label="All steps in this Stage"
              steps={steps.map((step, i) => ({
                key: step.id,
                title: step.label,
                state: stateOf(i),
                status: i === index ? "You are here" : visited.has(i) ? "Read" : "Not read yet",
                onSelect: () => {
                  setOpen(false);
                  onSelect(i);
                },
              }))}
            />
          </div>
        ) : null}
      </div>
    </nav>
  );
}
