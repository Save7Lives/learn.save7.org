"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Badge, Button, ButtonLink, Card, cx } from "@/components/ui/primitives";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { STAGE_QUIZ_SIZE } from "@/lib/constants";
import type { AttemptResult, GradedAnswer, StageQuizState } from "@/lib/quiz";
import type { StageQuizOutcome, StageQuizPaper } from "@/app/(site)/levels/actions";

/**
 * A Stage's quiz, run inside its CHECK step.
 *
 * The Blueprint (#8): five questions drawn from the Stage's fifteen, four right to
 * pass, as many retries as the learner wants, each retry drawn from questions the
 * last attempt did not show. The draw, the marking and the pass are all the
 * database's (0113); this is the three screens around them — where you stand, the
 * paper, and the marked paper with its explanations.
 *
 * It gates nothing on the page. Moving to the next step works whether or not the
 * quiz has been passed; what it gates is the Level's Certificate.
 */

type View =
  | { kind: "status" }
  | { kind: "paper"; paper: StageQuizPaper }
  | { kind: "result"; result: AttemptResult; certificatePublicId: string | null };

export type StageQuizProps = {
  stageSlug: string;
  passMarkPct: number;
  certificateTitle: string;
  initialState: StageQuizState | null;
  onStart: (stageSlug: string) => Promise<StageQuizPaper | { error: string }>;
  onSubmit: (attemptId: string, payload: string) => Promise<StageQuizOutcome | { error: string }>;
  onReview: (attemptId: string) => Promise<AttemptResult | { error: string }>;
};

/** Correct answers needed out of `size`, from the Level's pass mark: 80% of 5 is 4. */
function needed(passMarkPct: number, size: number) {
  return Math.ceil((passMarkPct * size) / 100);
}

export function StageQuiz({
  stageSlug,
  passMarkPct,
  certificateTitle,
  initialState,
  onStart,
  onSubmit,
  onReview,
}: StageQuizProps) {
  const [state, setState] = useState<StageQuizState | null>(initialState);
  const [view, setView] = useState<View>({ kind: "status" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const top = useRef<HTMLDivElement>(null);

  // Each view starts at its own top. The CHECK step can be long, and a marked
  // paper that opens scrolled to where the submit button was reads as nothing
  // having happened.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    top.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [view.kind]);

  function start() {
    setError(null);
    startTransition(async () => {
      const paper = await onStart(stageSlug);
      if ("error" in paper) setError(paper.error);
      else setView({ kind: "paper", paper });
    });
  }

  function review(attemptId: string) {
    setError(null);
    startTransition(async () => {
      const result = await onReview(attemptId);
      if ("error" in result) setError(result.error);
      else setView({ kind: "result", result, certificatePublicId: null });
    });
  }

  async function submit(attemptId: string, payload: string) {
    const outcome = await onSubmit(attemptId, payload);
    if ("error" in outcome) return { error: outcome.error };

    const { result } = outcome;
    setState((prev) => ({
      // A pass is permanent: a later practice attempt never clears it.
      passedAt: prev?.passedAt ?? (result.passed ? new Date().toISOString() : null),
      latest: {
        attemptId: result.attemptId,
        attemptNo: result.attemptNo,
        scoreRaw: result.scoreRaw,
        scoreMax: result.scoreMax,
        passed: result.passed === true,
      },
      openAttemptId: null,
    }));
    setView({ kind: "result", result, certificatePublicId: outcome.certificatePublicId });
  }

  return (
    <div ref={top} className="scroll-mt-24">
      {view.kind === "paper" ? (
        <QuizRunner
          key={view.paper.attemptId}
          questions={view.paper.questions}
          attemptId={view.paper.attemptId}
          title="Stage Quiz"
          headingAs="h2"
          intro={
            view.paper.attemptNo > 1
              ? `Attempt ${view.paper.attemptNo}. ${view.paper.questions.length} questions, and you need ${needed(passMarkPct, view.paper.questions.length)} right to pass.`
              : `${view.paper.questions.length} questions. Get ${needed(passMarkPct, view.paper.questions.length)} right to pass.`
          }
          submitLabel="Submit the quiz"
          onSubmit={submit}
        />
      ) : view.kind === "result" ? (
        <Result
          result={view.result}
          certificatePublicId={view.certificatePublicId}
          certificateTitle={certificateTitle}
          passMarkPct={passMarkPct}
          everPassed={state?.passedAt != null}
          pending={pending}
          onRetry={start}
          onDone={() => setView({ kind: "status" })}
        />
      ) : (
        <Status
          state={state}
          passMarkPct={passMarkPct}
          certificateTitle={certificateTitle}
          pending={pending}
          onStart={start}
          onReview={review}
        />
      )}

      <div aria-live="polite">
        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-incorrect-soft px-4 py-3 text-sm font-medium text-incorrect">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// --- Where you stand ---------------------------------------------------------

function Status({
  state,
  passMarkPct,
  certificateTitle,
  pending,
  onStart,
  onReview,
}: {
  state: StageQuizState | null;
  passMarkPct: number;
  certificateTitle: string;
  pending: boolean;
  onStart: () => void;
  onReview: (attemptId: string) => void;
}) {
  const need = needed(passMarkPct, STAGE_QUIZ_SIZE);
  const passedAt = state?.passedAt ? new Date(state.passedAt) : null;
  const latest = state?.latest ?? null;

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-sand-500">Stage Quiz</p>
        {passedAt ? (
          <Badge tone="correct">Passed</Badge>
        ) : latest ? (
          <Badge tone="review">Not passed yet</Badge>
        ) : null}
      </div>

      {passedAt ? (
        <p className="mt-3 text-ink">
          You passed this Stage&apos;s quiz on{" "}
          {passedAt.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}.
          {latest && !latest.passed
            ? ` Your latest practice attempt scored ${latest.scoreRaw} of ${latest.scoreMax}, and that doesn't change your pass.`
            : ""}
        </p>
      ) : latest ? (
        <p className="mt-3 text-ink">
          Your last attempt scored {latest.scoreRaw} of {latest.scoreMax}. You need {need} of{" "}
          {STAGE_QUIZ_SIZE} to pass. A new attempt gives you questions you didn&apos;t see last
          time.
        </p>
      ) : (
        <p className="mt-3 text-ink">
          {STAGE_QUIZ_SIZE} questions on this Stage. Get {need} right to pass. You can try as
          many times as you like, and each new attempt gives you questions you didn&apos;t see
          the time before.
        </p>
      )}

      {!passedAt ? (
        <p className="mt-3 text-sm text-sand-600">
          Passing every Stage Quiz in this Level earns the{" "}
          <strong className="text-ink">&ldquo;{certificateTitle}&rdquo;</strong> certificate. It
          doesn&apos;t hold you back: you can carry on to the next step whenever you like.
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          onClick={onStart}
          disabled={pending}
          variant={passedAt ? "outline" : "primary"}
        >
          {pending
            ? "Opening…"
            : state?.openAttemptId
              ? "Resume the quiz"
              : passedAt
                ? "Take it again for practice"
                : latest
                  ? "Try again"
                  : "Start the quiz"}
        </Button>
        {latest ? (
          <Button variant="quiet" onClick={() => onReview(latest.attemptId)} disabled={pending}>
            Review your last attempt
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

// --- The marked paper --------------------------------------------------------

function Result({
  result,
  certificatePublicId,
  certificateTitle,
  passMarkPct,
  everPassed,
  pending,
  onRetry,
  onDone,
}: {
  result: AttemptResult;
  certificatePublicId: string | null;
  certificateTitle: string;
  passMarkPct: number;
  everPassed: boolean;
  pending: boolean;
  onRetry: () => void;
  onDone: () => void;
}) {
  const passed = result.passed === true;
  const need = needed(passMarkPct, result.scoreMax || STAGE_QUIZ_SIZE);

  return (
    <div>
      <Card className="p-6 sm:p-8">
        <div aria-live="polite">
          <Badge tone={passed ? "correct" : everPassed ? "neutral" : "incorrect"}>
            {passed ? "Passed" : everPassed ? "Practice attempt" : "Not passed yet"}
          </Badge>
          <p className="mt-3 text-lg font-bold text-ink">
            You got {result.scoreRaw} of {result.scoreMax}.
          </p>
          <p className="mt-2 text-sand-700">
            {passed
              ? "Well done. The explanations below are worth a read, even for the ones you got right."
              : everPassed
                ? "This was a practice attempt, so your pass stands."
                : `You need ${need} to pass. Read the explanations below, then try again: you'll get questions you haven't seen yet.`}
          </p>
        </div>

        {certificatePublicId ? (
          <div className="mt-5 rounded-xl border border-pink-200 bg-pink-50 p-4">
            <p className="text-ink">
              That was the last Stage Quiz in this Level. You&apos;ve earned the{" "}
              <strong>&ldquo;{certificateTitle}&rdquo;</strong> certificate.
            </p>
            <ButtonLink href={`/certificate/${certificatePublicId}`} className="mt-3">
              View my certificate
            </ButtonLink>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={onRetry} disabled={pending} variant={passed || everPassed ? "outline" : "primary"}>
            {pending ? "Opening…" : passed || everPassed ? "Take it again for practice" : "Try again"}
          </Button>
          <Button variant="quiet" onClick={onDone} disabled={pending}>
            Done
          </Button>
        </div>
      </Card>

      <ol className="mt-6 space-y-4">
        {result.answers.map((answer, i) => (
          <MarkedQuestion key={answer.questionId} answer={answer} index={i} />
        ))}
      </ol>
    </div>
  );
}

/** One question as marked. The same states QuizBlock uses for an inline check. */
function MarkedQuestion({ answer, index }: { answer: GradedAnswer; index: number }) {
  return (
    <li>
      <Card className="p-5 sm:p-6">
        <div className="flex items-baseline gap-3">
          <span aria-hidden="true" className="font-display text-lg text-pink-600">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex-1">
            {answer.scenario ? (
              <p className="mb-3 border-l-3 border-teal-500 bg-teal-50 py-2.5 pl-3.5 pr-3 text-sm italic text-ink">
                {answer.scenario}
              </p>
            ) : null}

            <p className="font-bold text-ink">{answer.prompt}</p>

            <ul className="mt-4 space-y-2">
              {answer.choices.map((choice) => {
                const state = choice.isCorrect ? "correct" : choice.wasSelected ? "wrong" : "idle";
                return (
                  <li key={choice.id}>
                    <div
                      className={cx(
                        "flex items-start gap-3 rounded-xl border-2 px-4 py-3",
                        state === "correct" && "border-correct bg-correct-soft",
                        state === "wrong" && "border-incorrect bg-incorrect-soft",
                        state === "idle" && "border-sand-200 bg-white",
                      )}
                    >
                      <span className="flex-1 text-ink">{choice.text}</span>
                      {choice.wasSelected ? (
                        <span className="shrink-0 text-xs font-semibold text-sand-600">
                          Your answer
                        </span>
                      ) : null}
                      {state === "correct" ? (
                        <span
                          aria-label="Correct answer"
                          className="shrink-0 text-sm font-bold text-correct"
                        >
                          ✓
                        </span>
                      ) : null}
                    </div>
                    {/* Per-choice feedback on what they chose: why a tempting wrong
                        answer is tempting teaches more than a bare "incorrect". */}
                    {choice.wasSelected && choice.feedback ? (
                      <p className="mt-1.5 pl-4 text-sm text-sand-600">{choice.feedback}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 rounded-xl bg-sand-100/70 p-4">
              <Badge tone={answer.isCorrect ? "correct" : "incorrect"}>
                {answer.isCorrect
                  ? "Correct"
                  : answer.selectedChoiceIds.length === 0
                    ? "Not answered"
                    : "Not quite"}
              </Badge>
              <p className="mt-2.5 text-sm text-ink">{answer.explanation}</p>
            </div>
          </div>
        </div>
      </Card>
    </li>
  );
}
