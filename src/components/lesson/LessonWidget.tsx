"use client";

import { useEffect, useId, useState } from "react";
import { cx } from "@/components/ui/primitives";
import type {
  ChecklistWidget,
  CompareWidget,
  LessonWidget,
  RevealWidget,
  StepsWidget,
  TimerWidget,
} from "@/lib/lesson-widgets";

/**
 * Draws one interactive block from a lesson's Markdown (`src/lib/lesson-widgets.ts`).
 *
 * Every word comes from the block; the only text written here is button chrome
 * ("Start", "Run again"). Nothing a learner does in a block is recorded or scored:
 * it is part of reading, and the Stage Quiz is what measures.
 *
 * Keys are positions, not labels: a block's list is fixed once parsed, and two rows
 * may share a label.
 *
 * Selected states are a navy ring on teal-50, not a navy fill, and teal is only ever
 * teal-ink on white (#68).
 */
export function LessonWidgetView({ widget }: { widget: LessonWidget }) {
  switch (widget.type) {
    case "compare":
      return <Compare widget={widget} />;
    case "checklist":
      return <Checklist widget={widget} />;
    case "steps":
      return <Steps widget={widget} />;
    case "timer":
      return <Timer widget={widget} />;
    case "reveal":
      return <Reveal widget={widget} />;
  }
}

const pill =
  "inline-flex min-h-11 items-center rounded-pill border px-4 py-2 text-left text-[0.9375rem] font-medium text-navy transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";
const chosen = "border-navy bg-teal-50";
const unchosen = "border-line-strong bg-white hover:bg-teal-50";

function Figure({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <figure className="my-7 rounded-card border border-line bg-white p-4 sm:p-5">
      <figcaption className="mb-3 font-display text-[0.9375rem] font-bold text-navy">{title}</figcaption>
      {children}
    </figure>
  );
}

function Compare({ widget }: { widget: CompareWidget }) {
  const [tab, setTab] = useState(0);
  const id = useId();
  return (
    <Figure title={widget.title}>
      <div role="tablist" aria-label={widget.title} className="mb-3 flex flex-wrap gap-2">
        {widget.tabs.map((t, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={tab === i}
            aria-controls={`${id}-panel`}
            onClick={() => setTab(i)}
            className={cx(pill, tab === i ? chosen : unchosen)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <dl id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${tab}`} className="divide-y divide-line">
        {widget.tabs[tab].rows.map(([label, text], i) => (
          <div key={i} className="grid gap-x-4 gap-y-0.5 py-2.5 text-[0.9375rem] leading-relaxed sm:grid-cols-[9rem_1fr]">
            <dt className="font-medium text-navy">{label}</dt>
            <dd className="text-grey">{text}</dd>
          </div>
        ))}
      </dl>
    </Figure>
  );
}

function Checklist({ widget }: { widget: ChecklistWidget }) {
  const [ticked, setTicked] = useState<boolean[]>(() => widget.items.map(() => false));
  const id = useId();
  const all = ticked.every(Boolean);
  return (
    <Figure title={widget.title}>
      <ul className="space-y-1">
        {widget.items.map((item, i) => (
          <li key={i}>
            <label
              htmlFor={`${id}-${i}`}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-[0.9375rem] leading-snug text-grey hover:bg-teal-50"
            >
              <input
                id={`${id}-${i}`}
                type="checkbox"
                checked={ticked[i]}
                onChange={() => setTicked((t) => t.map((v, j) => (j === i ? !v : v)))}
                className="size-5 shrink-0 accent-teal-ink"
              />
              {item}
            </label>
          </li>
        ))}
      </ul>
      <p
        aria-live="polite"
        className={cx(
          "mt-3 rounded-lg px-3 py-2 text-[0.9375rem] leading-snug",
          all ? "bg-teal-50 font-medium text-navy" : "bg-white text-grey ring-1 ring-line",
        )}
      >
        {all ? widget.done : widget.pending}
      </p>
    </Figure>
  );
}

function Steps({ widget }: { widget: StepsWidget }) {
  const [open, setOpen] = useState<number | null>(null);
  const [choice, setChoice] = useState<number | null>(null);
  const id = useId();
  return (
    <Figure title={widget.title}>
      <ol className="m-0 list-none p-0">
        {widget.steps.map((step, i) => (
          <li key={i}>
            <button
              type="button"
              aria-expanded={open === i}
              aria-controls={`${id}-${i}`}
              onClick={() => {
                setOpen(open === i ? null : i);
                setChoice(null);
              }}
              className={cx(pill, "w-full gap-3 rounded-card", open === i ? chosen : unchosen)}
            >
              <span
                aria-hidden="true"
                className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-navy bg-white font-display text-sm font-bold"
              >
                {i + 1}
              </span>
              {step.label}
            </button>
            {open === i ? (
              <div id={`${id}-${i}`} className="ml-[1.6rem] border-l-2 border-line-strong py-3 pl-5 text-[0.9375rem] leading-relaxed text-grey">
                <p>{step.detail}</p>
                {step.choices.length ? (
                  <>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {step.choices.map(([label], j) => (
                        <button
                          key={j}
                          type="button"
                          aria-pressed={choice === j}
                          onClick={() => setChoice(choice === j ? null : j)}
                          className={cx(pill, choice === j ? chosen : unchosen)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <p aria-live="polite" className="mt-3 text-navy">
                      {choice === null ? null : step.choices[choice][1]}
                    </p>
                  </>
                ) : null}
              </div>
            ) : i < widget.steps.length - 1 ? (
              <span aria-hidden="true" className="ml-[1.6rem] block h-3 border-l-2 border-line-strong" />
            ) : null}
          </li>
        ))}
      </ol>
    </Figure>
  );
}

function Timer({ widget }: { widget: TimerWidget }) {
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [wasReset, setWasReset] = useState(false);
  const finished = count >= widget.units;

  useEffect(() => {
    if (!running || finished) return;
    const t = setTimeout(() => setCount((c) => c + 1), 1000);
    return () => clearTimeout(t);
  }, [running, finished, count]);

  const status = finished
    ? widget.done
    : count > 0
      ? widget.tick.replace("{n}", String(count))
      : widget.start;

  return (
    <Figure title={widget.title}>
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: widget.units }, (_, i) => (
          <span key={i} className={cx("h-3 flex-1 rounded-full", count > i ? "bg-teal-ink" : "bg-line")} />
        ))}
      </div>
      <p aria-live="polite" className="mt-3 text-[0.9375rem] leading-relaxed text-navy">
        {status}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={running && !finished}
          onClick={() => {
            if (finished) setCount(0);
            setRunning(true);
          }}
          className={cx(pill, unchosen, "disabled:cursor-default disabled:opacity-60")}
        >
          {finished ? "Run again" : running ? "Observing" : "Start"}
        </button>
        <button
          type="button"
          disabled={!running || count === 0 || finished}
          onClick={() => {
            setCount(0);
            setWasReset(true);
          }}
          className={cx(pill, unchosen, "disabled:cursor-default disabled:opacity-60")}
        >
          {widget.reset}
        </button>
      </div>
      {wasReset ? <p className="mt-3 text-[0.9375rem] leading-relaxed text-grey">{widget.afterReset}</p> : null}
    </Figure>
  );
}

function Reveal({ widget }: { widget: RevealWidget }) {
  const [shown, setShown] = useState<ReadonlySet<number>>(new Set());
  const id = useId();
  const toggle = (i: number) =>
    setShown((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  return (
    <Figure title={widget.title}>
      <ul className="m-0 list-none space-y-2 p-0">
        {widget.cards.map(([front, back], i) => (
          <li key={i} className={cx("rounded-card border", shown.has(i) ? "border-navy" : "border-line-strong")}>
            <button
              type="button"
              aria-expanded={shown.has(i)}
              aria-controls={`${id}-${i}`}
              onClick={() => toggle(i)}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-card px-4 py-2.5 text-left text-[0.9375rem] font-medium leading-snug text-navy hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              {front}
              <span aria-hidden="true" className="shrink-0 text-sm text-teal-ink">
                {shown.has(i) ? "Hide" : "Show"}
              </span>
            </button>
            {shown.has(i) ? (
              <p id={`${id}-${i}`} className="m-0 rounded-b-card bg-teal-50 px-4 py-3 text-[0.9375rem] leading-relaxed text-navy">
                {back}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </Figure>
  );
}
