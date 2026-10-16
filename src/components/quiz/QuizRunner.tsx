"use client";

import { useMemo, useState, useTransition } from "react";
import { Button, Eyebrow, cx } from "@/components/ui/primitives";
import { StatusPill } from "@/components/portal/Portal";
import { QuizChoice, QuizProgress, ScenarioBox } from "@/components/quiz/QuizParts";
import type { ClientQuestion } from "@/lib/quiz";

/**
 * The assessment runner, used for the Baseline and for each Stage Quiz.
 *
 * One question at a time rather than a long scrolling form. On a phone a
 * twenty-question form is a wall; one question per screen keeps the reading
 * measure short and makes progress legible. A review step before submitting means
 * nobody submits by accident, and unanswered questions are easy to find.
 *
 * It sizes itself to its parent: the Stage page's column, or the Baseline page's.
 */

export type QuizRunnerProps = {
  questions: ClientQuestion[];
  attemptId: string;
  title: string;
  /** A line above the first question, such as "Attempt 2" on a Stage Quiz retake. */
  intro?: string;
  /** A teal-ink eyebrow above the paper, such as "Baseline assessment · Sitting 1 of 4". */
  eyebrow?: string;
  submitLabel?: string;
  /** The review step's heading level: h3 when the runner sits inside a lesson step. */
  headingAs?: "h1" | "h2" | "h3";
  /**
   * Grades the attempt. A page-level quiz passes a server action that redirects;
   * an inline one passes a function that stores the result and returns nothing.
   */
  onSubmit: (attemptId: string, payload: string) => Promise<{ error?: string } | void>;
};

type Answers = Record<string, string[]>;

/** The card a paper's screens sit in: a hairline and 18px corners. */
const PAPER = "rounded-[18px] border border-line px-5 py-[22px] sm:px-6";

export function QuizRunner({
  questions,
  attemptId,
  title,
  intro,
  eyebrow,
  submitLabel = "Submit answers",
  headingAs = "h1",
  onSubmit,
}: QuizRunnerProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const total = questions.length;
  const answered = useMemo(
    () => questions.map((q) => (answers[q.id]?.length ?? 0) > 0),
    [questions, answers],
  );
  const unansweredCount = answered.filter((a) => !a).length;

  const question = questions[index];
  const isMulti = question?.kind === "MULTI";
  const selected = question ? (answers[question.id] ?? []) : [];

  function toggle(choiceId: string) {
    if (!question) return;
    setAnswers((prev) => {
      const current = prev[question.id] ?? [];
      if (isMulti) {
        return {
          ...prev,
          [question.id]: current.includes(choiceId)
            ? current.filter((id) => id !== choiceId)
            : [...current, choiceId],
        };
      }
      return { ...prev, [question.id]: [choiceId] };
    });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const payload = JSON.stringify(
        questions.map((q) => ({ questionId: q.id, choiceIds: answers[q.id] ?? [] })),
      );
      const result = await onSubmit(attemptId, payload);
      if (result && "error" in result && result.error) setError(result.error);
    });
  }

  const Heading = headingAs;

  // --- Review step ----------------------------------------------------------
  if (reviewing) {
    return (
      <div>
        {eyebrow ? <Eyebrow className="mb-3.5 text-teal-ink">{eyebrow}</Eyebrow> : null}
        <div className={PAPER}>
          <Heading className="t-h2 text-navy">Check before you submit</Heading>
          <p className="mt-2 text-base leading-6 text-grey">
            {unansweredCount === 0
              ? "All questions answered. You can change any of them before submitting."
              : `${unansweredCount} question${unansweredCount === 1 ? "" : "s"} still unanswered. Unanswered questions are marked not correct, so it is worth going back.`}
          </p>

          <ol className="mt-5 grid gap-2.5">
            {questions.map((q, i) => {
              const done = answered[i];
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setIndex(i);
                      setReviewing(false);
                    }}
                    className={cx(
                      "flex min-h-14 w-full items-center gap-3 rounded-[14px] border px-3.5 py-3 text-left text-[0.9375rem] leading-[1.4] text-navy",
                      done ? "border-line-strong bg-white" : "border-pink bg-pink-50",
                    )}
                  >
                    <span className="w-7 shrink-0 font-(family-name:--font-display) text-[0.9375rem] font-semibold leading-none text-navy">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1">{q.prompt}</span>
                    {done ? (
                      <StatusPill tone="done" icon="check">
                        Answered
                      </StatusPill>
                    ) : (
                      <StatusPill tone="warn" icon="alert">
                        Not answered
                      </StatusPill>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>

          <div aria-live="polite">
            {error ? (
              <p className="mt-5 rounded-xl border border-pink-line bg-pink-50 px-4 py-3 text-sm font-medium text-incorrect">
                {error}
              </p>
            ) : null}
          </div>

          <div className="mt-[22px] flex flex-wrap items-center gap-2.5">
            <Button size="lg" onClick={submit} disabled={pending}>
              {pending ? "Submitting…" : submitLabel}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setReviewing(false)}
              disabled={pending}
            >
              Keep editing
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) return null;

  // --- Question step --------------------------------------------------------
  return (
    <div>
      {eyebrow ? <Eyebrow className="mb-3.5 text-teal-ink">{eyebrow}</Eyebrow> : null}
      {index === 0 && intro ? <p className="mb-3.5 text-sm text-grey">{intro}</p> : null}

      <div className={PAPER}>
        <QuizProgress total={total} current={index} answered={answered} />

        {question.scenario ? (
          <ScenarioBox className="mb-[18px]">{question.scenario}</ScenarioBox>
        ) : null}

        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="t-h3 p-0 text-navy">{question.prompt}</legend>
          {isMulti ? <p className="mt-1.5 text-sm text-grey">Select all that apply.</p> : null}

          <div className="mt-[18px] grid gap-2.5">
            {question.choices.map((choice, i) => (
              <QuizChoice
                key={choice.id}
                index={i}
                text={choice.text}
                name={question.id}
                value={choice.id}
                multi={isMulti}
                checked={selected.includes(choice.id)}
                onChange={() => toggle(choice.id)}
              />
            ))}
          </div>
        </fieldset>

        <div className="mt-[22px] flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            Back
          </Button>

          {index < total - 1 ? (
            <Button onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}>Next</Button>
          ) : (
            <Button onClick={() => setReviewing(true)}>Review answers</Button>
          )}

          <Button variant="tertiary" onClick={() => setReviewing(true)} className="ml-auto">
            Review all
          </Button>
        </div>
      </div>

      <p className="mt-4 text-sm text-grey">{title} · Your answers are saved when you submit.</p>
    </div>
  );
}
