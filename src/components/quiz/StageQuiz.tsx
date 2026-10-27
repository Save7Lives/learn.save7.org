"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button, ButtonLink, Card, Eyebrow } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { StatusPill } from "@/components/portal/Portal";
import { IconCircle } from "@/components/course/IconCircle";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { MarkedChoice, ScenarioBox, type MarkedState } from "@/components/quiz/QuizParts";
import { CountUp, FlipIn, HeartBurst, Settle } from "@/components/motion/parts";
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
  | {
      kind: "result";
      result: AttemptResult;
      certificatePublicId: string | null;
      /** Just submitted, rather than an old attempt reopened: only this celebrates. */
      fresh: boolean;
    };

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
      else setView({ kind: "result", result, certificatePublicId: null, fresh: false });
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
    setView({
      kind: "result",
      result,
      certificatePublicId: outcome.certificatePublicId,
      fresh: true,
    });
  }

  return (
    <div ref={top} className="scroll-mt-24">
      {view.kind === "paper" ? (
        <QuizRunner
          key={view.paper.attemptId}
          questions={view.paper.questions}
          attemptId={view.paper.attemptId}
          title="Stage Quiz"
          headingAs="h3"
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
          fresh={view.fresh}
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
          <p className="mt-4 rounded-xl border border-pink-line bg-pink-50 px-4 py-3 text-sm font-medium text-incorrect">
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
    <section
      aria-label="Stage Quiz"
      className="rounded-[18px] border border-line px-5 py-[22px] sm:px-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow>Stage Quiz</Eyebrow>
        {passedAt ? (
          <StatusPill tone="done" icon="check-circle">
            Passed
          </StatusPill>
        ) : latest ? (
          <StatusPill tone="warn" icon="x-circle">
            Not passed yet
          </StatusPill>
        ) : (
          <StatusPill tone="progress" icon="flag">
            Not started
          </StatusPill>
        )}
      </div>

      <h3 className="t-h3 mt-3 text-navy">
        {passedAt ? "You have passed this Stage" : latest ? "Nearly there" : "Ready when you are"}
      </h3>

      {passedAt ? (
        <p className="mt-1.5 text-base leading-[1.6] text-grey">
          You passed this Stage&apos;s quiz on{" "}
          {passedAt.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
          .
          {latest && !latest.passed
            ? ` Your latest practice attempt scored ${latest.scoreRaw} of ${latest.scoreMax}, and that doesn't change your pass.`
            : ""}
        </p>
      ) : latest ? (
        <p className="mt-1.5 text-base leading-[1.6] text-grey">
          Your last attempt scored {latest.scoreRaw} of {latest.scoreMax}. You need {need} of{" "}
          {STAGE_QUIZ_SIZE} to pass. A new attempt gives you questions you didn&apos;t see last
          time.
        </p>
      ) : (
        <p className="mt-1.5 text-base leading-[1.6] text-grey">
          {STAGE_QUIZ_SIZE} questions on this Stage. Get {need} right to pass. You can try as many
          times as you like, and each new attempt gives you questions you didn&apos;t see the time
          before.
        </p>
      )}

      <ul className="mb-1.5 mt-4 flex flex-wrap gap-2 sm:grid sm:grid-cols-3 sm:gap-2.5">
        <Fact icon="list">{STAGE_QUIZ_SIZE} questions</Fact>
        <Fact icon="target">{need} right to pass</Fact>
        <Fact icon="refresh">Retry as often as you like</Fact>
      </ul>

      {!passedAt ? (
        <p className="mt-3 text-sm text-grey">
          Passing every Stage Quiz in this Level earns the{" "}
          <span className="font-medium text-navy">&ldquo;{certificateTitle}&rdquo;</span>{" "}
          certificate. It doesn&apos;t hold you back: you can carry on to the next step whenever you
          like.
        </p>
      ) : null}

      <div className="mt-[18px] flex flex-wrap items-center gap-3">
        <Button onClick={onStart} disabled={pending} variant={passedAt ? "outline" : "primary"}>
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
          <Button variant="tertiary" onClick={() => onReview(latest.attemptId)} disabled={pending}>
            Review your last attempt
          </Button>
        ) : null}
      </div>
    </section>
  );
}

/** One of the three facts on the status card: a chip on a phone, a tile from 40rem. */
function Fact({
  icon,
  children,
}: {
  icon: "list" | "target" | "refresh";
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2 rounded-pill border border-teal-line bg-teal-50 py-1.5 pl-1.5 pr-3 text-sm font-medium text-navy sm:gap-3 sm:rounded-[14px] sm:px-3 sm:py-2.5 sm:text-[0.9375rem]">
      <span
        aria-hidden="true"
        className="grid size-7 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-ink sm:size-10"
      >
        <Icon name={icon} className="size-4 shrink-0 stroke-[2.25] sm:size-5 sm:stroke-[1.75]" />
      </span>
      {children}
    </li>
  );
}

// --- The marked paper --------------------------------------------------------

function Result({
  result,
  certificatePublicId,
  fresh,
  certificateTitle,
  passMarkPct,
  everPassed,
  pending,
  onRetry,
  onDone,
}: {
  result: AttemptResult;
  certificatePublicId: string | null;
  fresh: boolean;
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
      <section className="rounded-[18px] border border-line px-5 py-[22px] sm:px-6">
        <div aria-live="polite">
          {passed ? (
            <StatusPill tone="done" icon="check-circle">
              Passed
            </StatusPill>
          ) : everPassed ? (
            <StatusPill tone="progress" icon="refresh">
              Practice attempt
            </StatusPill>
          ) : (
            <StatusPill tone="warn" icon="x-circle">
              Not passed yet
            </StatusPill>
          )}
          <p className="t-display mt-2 text-navy">
            <span className="relative inline-block">
              {passed && fresh ? <HeartBurst delay={0.7} radius={64} /> : null}
              {fresh ? <CountUp value={result.scoreRaw} /> : result.scoreRaw}
            </span>{" "}
            <span className="font-sans text-base font-medium tracking-normal text-grey">
              of {result.scoreMax}
            </span>
          </p>
          <p className="mt-2 text-base leading-[1.6] text-grey">
            {passed
              ? "Well done. The explanations below are worth a read, even for the ones you got right."
              : everPassed
                ? "This was a practice attempt, so your pass stands."
                : `You need ${need} to pass. Read the explanations below, then try again: you'll get questions you haven't seen yet.`}
          </p>
        </div>

        {certificatePublicId ? (
          <FlipIn delay={fresh ? 0.9 : 0}>
            <Card className="mt-[18px] border-pink-line bg-pink-50 p-5">
              <div className="flex items-start gap-3.5">
                <IconCircle name="award" tone="pink" />
                <div>
                  <h4 className="t-h4 mb-1 text-navy">
                    You&apos;ve earned the &ldquo;{certificateTitle}&rdquo; certificate
                  </h4>
                  <p className="mb-3 text-sm text-grey">
                    That was the last Stage Quiz in this Level.
                  </p>
                  <ButtonLink href={`/certificate/${certificatePublicId}`}>
                    View my certificate
                  </ButtonLink>
                </div>
              </div>
            </Card>
          </FlipIn>
        ) : null}

        <div className="mt-[18px] flex flex-wrap items-center gap-3">
          <Button
            onClick={onRetry}
            disabled={pending}
            variant={passed || everPassed ? "outline" : "primary"}
          >
            {pending
              ? "Opening…"
              : passed || everPassed
                ? "Take it again for practice"
                : "Try again"}
          </Button>
          <Button variant="tertiary" onClick={onDone} disabled={pending}>
            Done
          </Button>
        </div>
      </section>

      <ol className="mt-[22px] grid gap-4">
        {result.answers.map((answer, i) => (
          <MarkedQuestion key={answer.questionId} answer={answer} index={i} />
        ))}
      </ol>
    </div>
  );
}

function stateOf(choice: GradedAnswer["choices"][number]): MarkedState {
  if (choice.isCorrect) return choice.wasSelected ? "yours-correct" : "correct-missed";
  return choice.wasSelected ? "yours-not-correct" : "not-chosen";
}

/** Only the learner's own choices move: a shake for a wrong one, a pop for a right one. */
function settleTone(state: MarkedState): "ok" | "bad" | null {
  return state === "yours-correct" ? "ok" : state === "yours-not-correct" ? "bad" : null;
}

/** One question as marked: the choices in their six states, then the explanation. */
function MarkedQuestion({ answer, index }: { answer: GradedAnswer; index: number }) {
  const multi = answer.choices.filter((c) => c.isCorrect).length > 1;
  const unanswered = answer.selectedChoiceIds.length === 0;

  return (
    <li className="rounded-[18px] border border-line px-4 py-[18px]">
      <div className="flex items-baseline gap-3">
        <span
          aria-hidden="true"
          className="font-(family-name:--font-display) text-lg font-extrabold leading-none text-navy"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          {answer.scenario ? <ScenarioBox className="mb-3">{answer.scenario}</ScenarioBox> : null}
          <p className="t-h4 text-navy">{answer.prompt}</p>
        </div>
      </div>
      {multi ? <p className="ml-[34px] mt-1.5 text-sm text-grey">Select all that apply.</p> : null}

      <ul className="mt-[18px] grid gap-2.5">
        {answer.choices.map((choice, i) => (
          <li key={choice.id}>
            <Settle tone={settleTone(stateOf(choice))} delay={0.1}>
              <MarkedChoice index={i} text={choice.text} state={stateOf(choice)} multi={multi} />
            </Settle>
            {/* Per-choice feedback on what they chose: why a tempting wrong
                answer is tempting teaches more than a bare "incorrect". */}
            {choice.wasSelected && choice.feedback ? (
              <p className="ml-11 mt-1.5 text-[0.9375rem] text-grey">{choice.feedback}</p>
            ) : null}
          </li>
        ))}
      </ul>

      <div
        className={
          "mt-3.5 rounded-[14px] border p-3.5 text-[0.9375rem] leading-[1.55] text-navy " +
          (answer.isCorrect ? "border-teal-line bg-teal-50" : "border-pink-line bg-pink-50")
        }
      >
        {answer.isCorrect ? (
          <StatusPill tone="done" icon="check-circle">
            Correct
          </StatusPill>
        ) : unanswered ? (
          <StatusPill tone="warn" icon="alert">
            Not answered
          </StatusPill>
        ) : (
          <StatusPill tone="warn" icon="x-circle">
            Not quite
          </StatusPill>
        )}
        <p className="mt-2">{answer.explanation}</p>
      </div>
    </li>
  );
}
