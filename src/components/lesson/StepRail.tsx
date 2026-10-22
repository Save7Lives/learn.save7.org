"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icons";
import { RailStepper, StepDot, type RailState } from "@/components/portal/Portal";
import { cx } from "@/components/ui/primitives";

export type RailStep = {
  id: string;
  /** The short rail label: Why this matters, Learn, Key takeaways, Check ... */
  label: string;
};

/**
 * The way through a Stage's steps (#74): a slim bar that sticks to the top of the
 * screen while the site header scrolls away.
 *
 * On a phone it is "Step 2 of 7" over the step's short name, an "All steps" button
 * and a 4px progress line, about 52px of the screen. "All steps" opens the same
 * vertical dotted rail stepper My Progress uses for a Level's Stages: a number per
 * step, a check once read. From 40rem it is the labelled stepper instead, with no
 * button to press.
 *
 * Both are in the DOM and CSS picks one, so there is no layout flash and no
 * window-width state to keep in step with the server render. The hidden one is
 * `display: none`, so a screen reader meets one list, not two.
 */
export function StepRail({
  steps,
  index,
  visited,
  onSelect,
}: {
  steps: RailStep[];
  index: number;
  /** Indexes of steps the learner has been to. */
  visited: ReadonlySet<number>;
  onSelect: (index: number) => void;
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
      {/* --- Phone: compact bar and the All steps list ------------------------ */}
      <div className="sm:hidden">
        <div className="mx-auto max-w-[680px] px-5">
          <div className="flex min-h-[52px] items-center justify-between gap-2.5">
            <p className="flex flex-col leading-tight">
              <span className="text-[0.8125rem] text-grey">
                Step {index + 1} of {steps.length}
              </span>
              <span className="font-(family-name:--font-display) text-base font-semibold leading-tight text-navy">
                {current.label}
              </span>
            </p>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="step-list"
              onClick={() => setOpen((o) => !o)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] px-2.5 text-sm font-medium text-teal-ink underline underline-offset-4"
            >
              All steps
              <Icon
                name="chev"
                className={cx(
                  "size-4 shrink-0 stroke-[2.25] transition-transform",
                  open && "rotate-180",
                )}
              />
            </button>
          </div>
        </div>
        <div aria-hidden="true" className="h-1 bg-line">
          <div
            className="h-full bg-teal-ink"
            style={{ width: `${((index + 1) / steps.length) * 100}%` }}
          />
        </div>
        {open ? (
          <div id="step-list" className="mx-auto max-w-[680px] px-5 pb-3">
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

      {/* --- From 40rem: the labelled stepper --------------------------------- */}
      <div className="mx-auto hidden max-w-[680px] px-8 pb-1.5 pt-3 sm:block">
        <ol className="flex">
          {steps.map((step, i) => (
            <li key={step.id} className="relative min-w-0 flex-1 px-1 text-center">
              {i > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute right-[calc(50%+22px)] top-[15px] w-[calc(100%-44px)] border-t-[3px] border-dotted border-line-strong"
                />
              ) : null}
              <button
                type="button"
                aria-current={i === index ? "step" : undefined}
                onClick={() => onSelect(i)}
                className="block min-h-11 w-full"
              >
                <StepDot state={stateOf(i)} n={i + 1} className="mx-auto mb-1.5" />
                <span
                  className={cx(
                    "block text-[0.8125rem] leading-[1.3] text-navy",
                    i === index ? "font-semibold" : "font-medium",
                  )}
                >
                  {step.label}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
