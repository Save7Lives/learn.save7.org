"use client";

import { useState } from "react";
import { Badge, Button, Card, cx } from "@/components/ui/primitives";
import type { ClientQuestion } from "@/lib/quiz";

type Feedback = {
  isCorrect: boolean;
  explanation: string;
  choices: Array<{ id: string; isCorrect: boolean; feedback: string | null }>;
};

/**
 * Inline "check your understanding".
 *
 * Formative, not summative: nothing here gates progress and there is no score
 * shown. What matters is the explanation, which appears for right *and* wrong
 * answers — a learner who guessed correctly still needs to know why.
 *
 * Grading is a round trip to the server. That costs a few hundred milliseconds and
 * buys the answer key never being present in the page.
 */
export function QuizBlock({ questions }: { questions: ClientQuestion[] }) {
  if (questions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-sand-300 bg-sand-100/60 px-4 py-3 text-sm text-sand-600">
        No questions have been written for this module yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question, i) => (
        <CheckQuestion key={question.id} question={question} index={i} />
      ))}
    </div>
  );
}

function CheckQuestion({
  question,
  index,
}: {
  question: ClientQuestion;
  index: number;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMulti = question.kind === "MULTI";
  const answered = feedback !== null;

  function toggle(choiceId: string) {
    if (answered) return;
    setSelected((prev) =>
      isMulti
        ? prev.includes(choiceId)
          ? prev.filter((id) => id !== choiceId)
          : [...prev, choiceId]
        : [choiceId],
    );
  }

  async function check() {
    if (selected.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/quiz/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, choiceIds: selected }),
      });
      if (!response.ok) throw new Error("Request failed");
      setFeedback((await response.json()) as Feedback);
    } catch {
      setError("We couldn't check that answer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    setFeedback(null);
    setSelected([]);
  }

  const choiceState = (choiceId: string) => {
    if (!feedback) return selected.includes(choiceId) ? "selected" : "idle";
    const info = feedback.choices.find((c) => c.id === choiceId);
    if (info?.isCorrect) return "correct";
    if (selected.includes(choiceId)) return "wrong";
    return "idle";
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-baseline gap-3">
        <span aria-hidden="true" className="font-display text-lg text-pink-600">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex-1">
          {question.scenario ? (
            <p className="mb-3 border-l-3 border-teal-500 bg-teal-50 py-2.5 pl-3.5 pr-3 text-sm italic text-ink">
              {question.scenario}
            </p>
          ) : null}

          <fieldset disabled={answered}>
            <legend className="font-bold text-ink">{question.prompt}</legend>
            {isMulti ? (
              <p className="mt-1 text-sm text-sand-500">Select all that apply.</p>
            ) : null}

            <div className="mt-4 space-y-2">
              {question.choices.map((choice) => {
                const state = choiceState(choice.id);
                const info = feedback?.choices.find((c) => c.id === choice.id);
                return (
                  <div key={choice.id}>
                    <label
                      className={cx(
                        "flex items-start gap-3 rounded-xl border-2 px-4 py-3 transition",
                        answered ? "cursor-default" : "cursor-pointer",
                        state === "correct" && "border-correct bg-correct-soft",
                        state === "wrong" && "border-incorrect bg-incorrect-soft",
                        state === "selected" && "border-pink bg-pink-50",
                        state === "idle" &&
                          "border-sand-200 bg-white hover:border-sand-300",
                      )}
                    >
                      <input
                        type={isMulti ? "checkbox" : "radio"}
                        name={`check-${question.id}`}
                        checked={selected.includes(choice.id)}
                        onChange={() => toggle(choice.id)}
                        className="mt-1 size-4 shrink-0 accent-pink"
                      />
                      <span className="flex-1 text-ink">{choice.text}</span>
                      {state === "correct" ? (
                        <span
                          aria-label="Correct answer"
                          className="shrink-0 text-sm font-bold text-correct"
                        >
                          ✓
                        </span>
                      ) : null}
                    </label>

                    {/* Per-choice feedback: explaining why a tempting wrong answer
                        is tempting teaches more than a bare "incorrect". */}
                    {answered && info?.feedback && selected.includes(choice.id) ? (
                      <p className="mt-1.5 pl-4 text-sm text-sand-600">
                        {info.feedback}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </fieldset>

          <div aria-live="polite">
            {error ? (
              <p className="mt-4 text-sm font-medium text-incorrect">{error}</p>
            ) : null}

            {feedback ? (
              <div className="mt-4 rounded-xl bg-sand-100/70 p-4">
                <Badge tone={feedback.isCorrect ? "correct" : "incorrect"}>
                  {feedback.isCorrect ? "Correct" : "Not quite"}
                </Badge>
                <p className="mt-2.5 text-sm text-ink">{feedback.explanation}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-4">
            {answered ? (
              <button
                type="button"
                onClick={retry}
                className="text-sm font-semibold text-pink-600 underline"
              >
                Try again
              </button>
            ) : (
              <Button
                size="sm"
                onClick={check}
                disabled={selected.length === 0 || submitting}
              >
                {submitting ? "Checking…" : "Check answer"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
