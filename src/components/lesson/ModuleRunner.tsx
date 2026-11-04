"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { LESSON_KIND_LABELS, type LessonKind } from "@/lib/constants";
import { StepMenu } from "@/components/lesson/StepMenu";
import { StepNavContext } from "@/components/lesson/StepNav";

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
 * One step at a time through the Stage's seven-part spine. A single long
 * scrolling page was the alternative and it was worse on both counts that matter
 * here: on a phone it becomes an intimidating wall, and it makes "where am I?"
 * unanswerable.
 *
 * All lesson content is rendered on the server and passed in as nodes. This
 * component only handles navigation and progress, which is why the answer keys for
 * the inline checks are never in its props.
 *
 * The route and the schema still say `module`; only what a learner reads says
 * Stage (#74).
 */
export function ModuleRunner({
  lessons,
  levelSlug,
  moduleSlug,
  stageTitle,
  stageNumber,
  stageCount,
  coreQuestion,
  levelTitle,
  estMinutes,
  isRead,
  isPassed,
  initialLessonIndex,
  onViewLesson,
  onComplete,
  nextStageTitle,
}: {
  lessons: RunnerLesson[];
  levelSlug: string;
  moduleSlug: string;
  stageTitle: string;
  stageNumber: number;
  /** How many Stages the Level has. */
  stageCount: number;
  coreQuestion: string;
  /** The Level's name without the word Level: "Beginner". */
  levelTitle: string;
  estMinutes: number;
  /** The Read Mark: the Stage was finished before, so the last step moves on instead of recording it again. */
  isRead: boolean;
  /** The Stage Quiz is passed: the Stage is complete. Only this says "finished". */
  isPassed: boolean;
  initialLessonIndex: number;
  onViewLesson: (
    moduleSlug: string,
    lessonSlug: string,
    secondsOnPreviousStep: number,
  ) => Promise<void>;
  onComplete: (levelSlug: string, moduleSlug: string) => Promise<{ error?: string } | void>;
  nextStageTitle: string | null;
}) {
  const startIndex = Math.min(Math.max(initialLessonIndex, 0), lessons.length - 1);
  const [index, setIndex] = useState(startIndex);
  // The steps the learner has been to, for the step list's checks. Resuming at step 5
  // means steps 1 to 4 were read on the way.
  const [visited, setVisited] = useState<ReadonlySet<number>>(
    () => new Set(Array.from({ length: startIndex + 1 }, (_, i) => i)),
  );
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Set inside the effect below, never during render: calling Date.now() while
  // rendering is impure and React can re-render at any time.
  const stepEnteredAt = useRef<number>(0);
  const isFirstRender = useRef(true);

  const lesson = lessons[index];
  const isLastStep = index === lessons.length - 1;

  // Record the view, and how long the previous step took. Time-on-step is the
  // signal Save7 needs to find Stages that are too long, so it is measured per
  // step rather than per Stage.
  useEffect(() => {
    if (!lesson) return;
    const seconds =
      isFirstRender.current || stepEnteredAt.current === 0
        ? 0
        : Math.round((Date.now() - stepEnteredAt.current) / 1000);
    stepEnteredAt.current = Date.now();
    isFirstRender.current = false;
    void onViewLesson(moduleSlug, lesson.id, seconds);
  }, [lesson, moduleSlug, onViewLesson]);

  function go(nextIndex: number) {
    setIndex(nextIndex);
    setVisited((prev) => new Set(prev).add(nextIndex));
    // Move focus to the new step's heading so keyboard and screen reader users
    // land in the content rather than staying on a button that has moved.
    requestAnimationFrame(() => {
      headingRef.current?.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function finish() {
    setSaveError(null);
    startTransition(async () => {
      // An error escaping a transition reaches React's error boundary, which
      // replaces the entire page with "a client-side exception has occurred" —
      // a learner who has just finished a Stage loses the Stage instead of
      // being told to press the button again. Caught here so the failure stays
      // the size of the thing that failed.
      try {
        const result = await onComplete(levelSlug, moduleSlug);
        if (result?.error) setSaveError(result.error);
      } catch (error) {
        // A successful completion ends in redirect(), which signals by throwing.
        // Catching that would cancel the navigation and report a failure for a
        // write that worked — so it is re-thrown for the framework to handle.
        // This guard is the difference between "the fix works" and "the fix
        // replaced a crash with a learner who can never leave the page".
        if (isFrameworkSignal(error)) throw error;

        // Logged so the browser console names the cause. Next redacts server
        // error messages in production, but the digest it does print can be
        // matched against the deployment's function logs.
        console.error("Finishing the Stage failed", error);
        setSaveError("We couldn't save your progress. Please try again.");
      }
    });
  }

  if (!lesson) return null;

  const stepNav = {
    goToKind: (kind: string) => {
      const target = lessons.findIndex((l) => l.kind === kind);
      if (target >= 0) go(target);
    },
  };
  // The Finish step's heading comes from its kind, so it says "Stage" without a
  // content migration to retitle every Stage's COMPLETE lesson.
  const heading = lesson.kind === "COMPLETE" ? "Finish this Stage" : lesson.title;
  const backLabel = `Back to ${levelTitle} Level`;
  const railSteps = lessons.map((step) => ({
    id: step.id,
    label: LESSON_KIND_LABELS[step.kind as LessonKind] ?? step.title,
  }));
  const next = lessons[index + 1];
  // The card leading to the Finish step says "Finish", not "Finish this Stage": the
  // button on that step is the one that finishes.
  const nextName = next ? (next.kind === "COMPLETE" ? railSteps[index + 1].label : next.title) : null;

  return (
    // data-reader switches the site header off its sticky position (globals.css),
    // so the hairline of progress is the only thing that sticks.
    <StepNavContext.Provider value={stepNav}>
      <div data-reader>
        <div className="reader-progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${(index + 1) / lessons.length})` }} />
        </div>

        <div className="mx-auto max-w-[660px] px-5 pb-16 pt-5 sm:px-8 sm:pt-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              href={`/levels/${levelSlug}`}
              className="-ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-[0.9375rem] font-medium text-teal-ink hover:text-navy"
            >
              <Icon name="arrow-left" className="size-4 shrink-0 stroke-[3]" />
              {levelTitle} Level
            </Link>
            <StepMenu steps={railSteps} index={index} visited={visited} onSelect={go} />
          </div>

          <h1 className="reader-stage">
            Stage {stageNumber} of {stageCount}: {stageTitle}
          </h1>

          {/* Keyed, so each step rises in as the learner arrives at it. */}
          <div key={index} className="reader-step">
            <h2 ref={headingRef} tabIndex={-1} className="reader-title outline-none">
              {heading}
            </h2>

            {index === 0 ? (
              <>
                <p className="reader-lede">{coreQuestion}</p>
                <p className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-sm text-grey">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="clock" className="size-4 shrink-0 stroke-[2.25]" />
                    About {estMinutes} minutes
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="list" className="size-4 shrink-0 stroke-[2.25]" />
                    {lessons.length} steps
                  </span>
                </p>
              </>
            ) : null}

            <div className="mt-9">{lesson.content}</div>
          </div>

          {/* --- Step navigation: inline after the content, not docked -------- */}
          <div className="mt-16 grid gap-2">
            {next ? (
              <button type="button" className="reader-next" onClick={() => go(index + 1)}>
                <span>
                  <span className="reader-next-eyebrow">Up next</span>
                  <span className="reader-next-title">{nextName}</span>
                </span>
                <Icon name="arrow" className="size-5 shrink-0 stroke-[3]" />
              </button>
            ) : isRead ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="navy" onClick={finish} disabled={pending}>
                  {pending ? "Saving…" : nextStageTitle ? "Next Stage" : backLabel}
                </Button>
                {isPassed ? (
                  <p className="inline-flex items-center gap-1.5 text-sm font-medium text-correct">
                    <Icon name="check-circle" className="size-4 shrink-0 stroke-[2.25]" />
                    You&apos;ve already finished this Stage
                  </p>
                ) : null}
              </div>
            ) : (
              <Button onClick={finish} disabled={pending} className="justify-self-start">
                {pending ? "Saving…" : "Finish this Stage"}
              </Button>
            )}

            {index > 0 ? (
              <button type="button" className="reader-back" onClick={() => go(index - 1)}>
                <Icon name="arrow-left" className="size-4 shrink-0 stroke-[3]" />
                Back to {railSteps[index - 1].label}
              </button>
            ) : null}
          </div>

          {/* aria-live so a failed save is announced, not just drawn. */}
          <div aria-live="polite">
            {saveError ? (
              <p className="mt-4 rounded-xl border border-pink-line bg-pink-50 px-4 py-3 text-sm font-medium text-incorrect">
                {saveError}
              </p>
            ) : null}
          </div>

          {isLastStep && !isRead ? (
            <p className="mt-4 text-sm text-grey">
              {nextStageTitle
                ? `Finishing takes you on to "${nextStageTitle}".`
                : `This is the last Stage in the Level.`}
            </p>
          ) : null}
        </div>
      </div>
    </StepNavContext.Provider>
  );
}

/**
 * Whether an error is Next's own control flow rather than a real failure.
 *
 * `redirect()` and `notFound()` are implemented by throwing an error carrying a
 * `digest`. Any catch around a server action call has to let those through.
 */
function isFrameworkSignal(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND")
  );
}
