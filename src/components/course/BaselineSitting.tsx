"use client";

import { useState, useTransition } from "react";
import { Button, Eyebrow, NumberPill } from "@/components/ui/primitives";
import { HeroArt } from "@/components/ui/HeroArt";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import type { ClientQuestion } from "@/lib/quiz";

/**
 * One Baseline Sitting: the before-you-start screen, then the twenty questions.
 *
 * The screen replaces the one-line box that used to sit above question 1. It says
 * what the Baseline is and is not, and `quiz_start` is recorded when the learner
 * presses Start, not when the page loads (`onStart`). The three points differ for
 * Sitting 1 and later Sittings only in their words.
 *
 * Nothing here knows an answer: the questions arrive as `ClientQuestion`s and the
 * Baseline never shows a key, before or after.
 */
export function BaselineSitting({
  questions,
  sitting,
  maxSittings,
  onStart,
  onSubmit,
}: {
  questions: ClientQuestion[];
  /** The Sitting being offered, 1 to `maxSittings`. */
  sitting: number;
  maxSittings: number;
  onStart: (sitting: number) => Promise<void>;
  onSubmit: (sittingNo: string, payload: string) => Promise<{ error?: string } | void>;
}) {
  const [started, setStarted] = useState(false);
  const [, startTransition] = useTransition();
  const first = sitting === 1;
  const count = questions.length;
  const of = `Sitting ${sitting} of ${maxSittings}`;

  function start() {
    setStarted(true);
    window.scrollTo({ top: 0 });
    // Not awaited: the event is a record, and a slow write must not hold the
    // first question back.
    startTransition(() => {
      void onStart(sitting);
    });
  }

  if (started) {
    return (
      <div className="mx-auto max-w-[640px] px-5 pb-10 pt-7 sm:px-8">
        <QuizRunner
          questions={questions}
          attemptId={String(sitting)}
          title={first ? "Baseline assessment" : `Baseline assessment, sitting ${sitting}`}
          eyebrow={`Baseline assessment · ${of}`}
          submitLabel={first ? "Submit and start learning" : "Submit"}
          onSubmit={onSubmit}
        />
      </div>
    );
  }

  const points = first
    ? [
        {
          title: "This is not a test",
          text: "There is no pass mark and nobody is judged on it. Answer what you can, and guess if you are unsure.",
        },
        {
          title: "You won't see the answers afterwards",
          text: `The same ${count} questions come back after each Level, so the answers stay hidden to keep the comparison fair.`,
        },
        {
          title: "The course opens when you submit",
          text: "Your score gates nothing. Submitting this first sitting is what opens the Stages.",
        },
      ]
    : [
        {
          title: "Still no pass mark",
          text: "Nobody is judged on it. Answer what you can, and guess if you are unsure.",
        },
        {
          title: "You won't see the answers afterwards",
          text: `The same ${count} questions come back after each Level, so the answers stay hidden to keep the comparison fair.`,
        },
        {
          title: "Your score gates nothing",
          text: "You can carry on with the course whether or not you sit it.",
        },
      ];

  return (
    <div className="relative overflow-hidden pb-8 pt-[132px] sm:pt-14">
      <HeroArt />
      <div className="relative z-10 mx-auto max-w-[680px] px-5 sm:px-8">
        <Eyebrow className="text-pink">
          {first ? "Baseline assessment" : `Baseline assessment · ${of}`}
        </Eyebrow>
        <h1 className="t-display mt-2 text-navy sm:max-w-[14ch]">
          {first ? "Let’s find your starting point" : "Same questions, a fresh sitting"}
        </h1>
        <p className="mt-2 text-base leading-6 text-grey sm:text-lg sm:leading-7">
          {first
            ? `Before you read anything, answer ${count} questions. They show what you already know, so that what you learn can be measured.`
            : `You finished a Level since your last sitting. These are the same ${count} questions, in the same order, so the two can be compared.`}
        </p>

        <ul className="mt-[22px] grid gap-3">
          {points.map((point, i) => (
            <li
              key={point.title}
              className="flex items-start gap-3.5 rounded-2xl border border-line bg-white p-4"
            >
              <NumberPill n={i + 1} tone="teal" />
              <div>
                <h2 className="t-h4 mb-1 mt-0.5 text-navy">{point.title}</h2>
                <p className="text-[0.9375rem] leading-[1.55] text-grey">{point.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-[26px]">
          <Button size="lg" onClick={start} className="w-full sm:w-auto">
            {first ? "Start the baseline" : `Start sitting ${sitting}`}
          </Button>
        </div>
        <p className="mt-3.5 text-sm text-grey">Your answers are saved when you submit.</p>
      </div>
    </div>
  );
}
