"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Button,
  Display,
  Eyebrow,
  ProgressBar,
  cx,
} from "@/components/ui/primitives";
import { LESSON_KIND_LABELS, type LessonKind } from "@/lib/constants";

export type RunnerLesson = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  /** Pre-rendered on the server, so answer keys and payloads stay server-side. */
  content: React.ReactNode;
};

/**
 * The lesson runner.
 *
 * One step at a time through the module's seven-part spine. A single long
 * scrolling page was the alternative and it was worse on both counts that matter
 * here: on a phone it becomes an intimidating wall, and it makes "where am I?"
 * unanswerable.
 *
 * All lesson content is rendered on the server and passed in as nodes. This
 * component only handles navigation and progress, which is why the answer keys for
 * the inline checks are never in its props.
 */
export function ModuleRunner({
  lessons,
  levelSlug,
  moduleSlug,
  moduleTitle,
  moduleNumber,
  coreQuestion,
  levelTitle,
  tierLabel,
  tierDotClass,
  estMinutes,
  isComplete,
  initialLessonIndex,
  onViewLesson,
  onComplete,
  nextModuleTitle,
}: {
  lessons: RunnerLesson[];
  levelSlug: string;
  moduleSlug: string;
  moduleTitle: string;
  moduleNumber: number;
  coreQuestion: string;
  levelTitle: string;
  tierLabel: string;
  tierDotClass: string;
  estMinutes: number;
  isComplete: boolean;
  initialLessonIndex: number;
  onViewLesson: (lessonId: string, secondsOnPreviousStep: number) => Promise<void>;
  onComplete: (levelSlug: string, moduleSlug: string) => Promise<void>;
  nextModuleTitle: string | null;
}) {
  const [index, setIndex] = useState(
    Math.min(Math.max(initialLessonIndex, 0), lessons.length - 1),
  );
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Set inside the effect below, never during render: calling Date.now() while
  // rendering is impure and React can re-render at any time.
  const stepEnteredAt = useRef<number>(0);
  const isFirstRender = useRef(true);

  const lesson = lessons[index];
  const isLastStep = index === lessons.length - 1;
  const progressPct = ((index + 1) / lessons.length) * 100;

  // Record the view, and how long the previous step took. Time-on-step is the
  // signal Save7 needs to find modules that are too long, so it is measured per
  // step rather than per module.
  useEffect(() => {
    if (!lesson) return;
    const seconds =
      isFirstRender.current || stepEnteredAt.current === 0
        ? 0
        : Math.round((Date.now() - stepEnteredAt.current) / 1000);
    stepEnteredAt.current = Date.now();
    isFirstRender.current = false;
    void onViewLesson(lesson.id, seconds);
  }, [lesson, onViewLesson]);

  function go(nextIndex: number) {
    setIndex(nextIndex);
    // Move focus to the new step's heading so keyboard and screen reader users
    // land in the content rather than staying on a button that has moved.
    requestAnimationFrame(() => {
      headingRef.current?.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function finish() {
    startTransition(async () => {
      await onComplete(levelSlug, moduleSlug);
    });
  }

  if (!lesson) return null;

  return (
    <div>
      {/* --- Module header ------------------------------------------------- */}
      <header className="border-b border-sand-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <Link
              href={`/levels/${levelSlug}`}
              className="inline-flex min-h-11 items-center gap-2 font-semibold text-sand-600 hover:text-ink"
            >
              <span aria-hidden="true">←</span>
              <span aria-hidden="true" className={cx("size-2 rounded-full", tierDotClass)} />
              {levelTitle}
            </Link>
            <span aria-hidden="true" className="text-sand-400">
              /
            </span>
            <span className="text-sand-500">
              {tierLabel} · Module {moduleNumber}
            </span>
          </div>

          <Display as="h1" className="mt-4 text-title text-ink">
            {moduleTitle}
          </Display>
          <p className="mt-2 text-sand-600">{coreQuestion}</p>
          <p className="mt-2 text-sm text-sand-400">
            About {estMinutes} minutes · {lessons.length} steps
          </p>
        </div>
      </header>

      {/* --- Step rail ----------------------------------------------------- */}
      <div className="sticky top-[57px] z-30 border-b border-sand-200 bg-sand-50/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-5 py-3 sm:px-8">
          <nav aria-label="Module steps">
            <ol className="flex gap-1.5 overflow-x-auto pb-1">
              {lessons.map((step, i) => {
                const isCurrent = i === index;
                const isPast = i < index;
                return (
                  <li key={step.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => go(i)}
                      aria-current={isCurrent ? "step" : undefined}
                      className={cx(
                        "min-h-11 rounded-pill px-3 text-xs font-bold transition",
                        isCurrent
                          ? "bg-ink text-cream"
                          : isPast
                            ? "bg-pink-100 text-pink-700"
                            : "bg-sand-200/70 text-sand-500 hover:bg-sand-200",
                      )}
                    >
                      {LESSON_KIND_LABELS[step.kind as LessonKind] ?? step.title}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
          <ProgressBar
            value={progressPct}
            label={`${moduleTitle} progress`}
            className="mt-1"
          />
        </div>
      </div>

      {/* --- Step content --------------------------------------------------- */}
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <Eyebrow>
          Step {index + 1} of {lessons.length}
        </Eyebrow>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mt-2 font-display text-3xl uppercase tracking-tight text-ink outline-none"
        >
          {lesson.title}
        </h2>

        <div className="mt-8 animate-rise">{lesson.content}</div>

        {/* --- Step navigation --------------------------------------------- */}
        <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-sand-200 pt-6">
          <Button
            variant="outline"
            onClick={() => go(index - 1)}
            disabled={index === 0}
          >
            Back
          </Button>

          {!isLastStep ? (
            <Button onClick={() => go(index + 1)}>Continue</Button>
          ) : isComplete ? (
            <>
              <Button variant="ink" onClick={finish} disabled={pending}>
                {pending ? "Saving…" : nextModuleTitle ? "Next module" : "Back to level"}
              </Button>
              <p className="text-sm font-semibold text-correct">
                ✓ You&apos;ve already completed this module
              </p>
            </>
          ) : (
            <Button onClick={finish} disabled={pending}>
              {pending ? "Saving…" : "Mark module complete"}
            </Button>
          )}

          <Link
            href={`/levels/${levelSlug}`}
            className="ml-auto inline-flex min-h-11 items-center text-sm font-semibold text-sand-500 underline hover:text-ink"
          >
            All modules
          </Link>
        </div>

        {isLastStep && !isComplete ? (
          <p className="mt-4 text-sm text-sand-500">
            {nextModuleTitle
              ? `Completing this module takes you on to "${nextModuleTitle}".`
              : "This is the last module in the level — completing it unlocks the assessment."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
