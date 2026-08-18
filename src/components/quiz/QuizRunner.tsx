"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge, Button, Card, Display, cx } from "@/components/ui/primitives";
import type { ClientQuestion } from "@/lib/quiz";

/**
 * The assessment runner, used for both the baseline and the per-level post
 * assessments.
 *
 * One question at a time rather than a long scrolling form. On a phone a
 * twelve-question form is a wall; one question per screen keeps the reading
 * measure short and makes progress legible. A review step before submitting means
 * nobody submits by accident, and unanswered questions are easy to find.
 */

export type QuizRunnerProps = {
  questions: ClientQuestion[];
  attemptId: string;
  title: string;
  /** Framing shown before the first question. */
  intro?: string;
  submitLabel?: string;
  /** Server action that grades the attempt and redirects. */
  onSubmit: (attemptId: string, payload: string) => Promise<{ error?: string } | void>;
};

type Answers = Record<string, string[]>;

export function QuizRunner({
  questions,
  attemptId,
  title,
  intro,
  submitLabel = "Submit answers",
  onSubmit,
}: QuizRunnerProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const total = questions.length;
  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id]?.length ?? 0) > 0).length,
    [questions, answers],
  );
  const unanswered = questions.filter((q) => (answers[q.id]?.length ?? 0) === 0);

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

  // --- Review step ----------------------------------------------------------
  if (reviewing) {
    return (
      <div className="mx-auto max-w-2xl">
        <Display as="h1" className="text-title text-ink">
          Check before you submit
        </Display>
        <p className="mt-3 text-sand-600">
          {unanswered.length === 0
            ? "All questions answered. You can change any of them before submitting."
            : `${unanswered.length} question${unanswered.length === 1 ? "" : "s"} still unanswered. Unanswered questions are marked incorrect, so it's worth going back.`}
        </p>

        <ol className="mt-8 space-y-2">
          {questions.map((q, i) => {
            const done = (answers[q.id]?.length ?? 0) > 0;
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => {
                    setIndex(i);
                    setReviewing(false);
                  }}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition",
                    done
                      ? "border-sand-200 bg-white hover:border-sand-300"
                      : "border-review/40 bg-review-soft hover:border-review",
                  )}
                >
                  <span className="w-6 shrink-0 font-display text-lg text-sand-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-sm text-ink">{q.prompt}</span>
                  {done ? (
                    <Badge tone="neutral">Answered</Badge>
                  ) : (
                    <Badge tone="review">Not answered</Badge>
                  )}
                </button>
              </li>
            );
          })}
        </ol>

        <div aria-live="polite">
          {error ? (
            <p className="mt-6 rounded-xl border border-red-200 bg-incorrect-soft px-4 py-3 text-sm font-medium text-incorrect">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
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
    );
  }

  if (!question) return null;

  // --- Question step --------------------------------------------------------
  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress. aria-live announces movement for screen reader users. */}
      <div className="mb-8">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-sm font-semibold text-sand-500" aria-live="polite">
            Question {index + 1} of {total}
          </p>
          <p className="text-sm text-sand-400">{answeredCount} answered</p>
        </div>
        <ol className="flex gap-1" aria-hidden="true">
          {questions.map((q, i) => (
            <li
              key={q.id}
              className={cx(
                "h-1.5 flex-1 rounded-pill transition-colors",
                i === index
                  ? "bg-pink"
                  : (answers[q.id]?.length ?? 0) > 0
                    ? "bg-pink-200"
                    : "bg-sand-200",
              )}
            />
          ))}
        </ol>
      </div>

      {index === 0 && intro ? (
        <p className="mb-6 rounded-xl border border-sand-200 bg-white px-4 py-3 text-sm text-sand-600">
          {intro}
        </p>
      ) : null}

      <Card className="p-6 sm:p-8">
        {question.scenario ? (
          <p className="mb-4 border-l-3 border-teal-500 bg-teal-50 py-3 pl-4 pr-3 text-sm italic text-ink">
            {question.scenario}
          </p>
        ) : null}

        <fieldset>
          <legend className="text-lg font-bold text-ink">{question.prompt}</legend>
          {isMulti ? (
            <p className="mt-1.5 text-sm text-sand-500">Select all that apply.</p>
          ) : null}

          <div className="mt-5 space-y-2.5">
            {question.choices.map((choice) => {
              const isSelected = selected.includes(choice.id);
              return (
                <label
                  key={choice.id}
                  className={cx(
                    "flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3.5 transition",
                    isSelected
                      ? "border-pink bg-pink-50"
                      : "border-sand-200 bg-white hover:border-sand-300",
                  )}
                >
                  <input
                    type={isMulti ? "checkbox" : "radio"}
                    name={question.id}
                    value={choice.id}
                    checked={isSelected}
                    onChange={() => toggle(choice.id)}
                    className="mt-1 size-4 shrink-0 accent-pink"
                  />
                  <span className={cx("text-ink", isSelected && "font-medium")}>
                    {choice.text}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </Card>

      <div className="mt-6 flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          Back
        </Button>

        {index < total - 1 ? (
          <Button onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}>
            Next
          </Button>
        ) : (
          <Button onClick={() => setReviewing(true)}>Review answers</Button>
        )}

        <button
          type="button"
          onClick={() => setReviewing(true)}
          className="ml-auto inline-flex min-h-11 items-center text-sm font-semibold text-sand-500 underline hover:text-ink"
        >
          Review all
        </button>
      </div>

      <p className="mt-6 text-xs text-sand-400">
        {title} · Your answers are saved when you submit.
      </p>
    </div>
  );
}
