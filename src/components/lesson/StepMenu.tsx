"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icons";
import { RailStepper } from "@/components/portal/Portal";
import { cx } from "@/components/ui/primitives";

export type RailStep = {
  id: string;
  /** The short label: Why this matters, Learn, Key takeaways, Check ... */
  label: string;
};

/**
 * "Step 2 of 7", which opens the Stage's steps.
 *
 * The reader keeps where-am-I to this one line and the hairline above the page.
 * Opened, it is the dotted rail stepper My Progress uses for a Level's
 * Stages, which is how a learner jumps to any step, the Check included. The button's
 * name says "All steps" as well as its visible "Step 2 of 7", so a screen reader
 * hears what it does.
 */
export function StepMenu({
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
  const rootRef = useRef<HTMLElement>(null);

  // Closes on Escape and on a click outside it, like any other menu.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointer(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <nav ref={rootRef} aria-label="Steps in this Stage" className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="step-list"
        aria-label={`Step ${index + 1} of ${steps.length}, all steps`}
        onClick={() => setOpen((o) => !o)}
        className="-mr-2 inline-flex min-h-11 items-center gap-1 rounded-pill px-2 text-sm tabular-nums text-grey hover:text-navy"
      >
        Step {index + 1} of {steps.length}
        <Icon
          name="chev"
          className={cx("size-4 shrink-0 stroke-[2.25] transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div
          id="step-list"
          className="reader-menu absolute right-0 top-full z-40 mt-1 w-72 max-w-[calc(100vw-2.5rem)] rounded-card border border-line bg-white px-4 pb-4 pt-1"
        >
          <RailStepper
            label="All steps in this Stage"
            steps={steps.map((step, i) => ({
              key: step.id,
              title: step.label,
              state: i === index ? "current" : visited.has(i) ? "passed" : "todo",
              status: i === index ? "You are here" : visited.has(i) ? "Read" : "Not read yet",
              onSelect: () => {
                setOpen(false);
                onSelect(i);
              },
            }))}
          />
        </div>
      ) : null}
    </nav>
  );
}
