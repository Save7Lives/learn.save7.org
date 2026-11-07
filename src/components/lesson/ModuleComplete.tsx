import { Card, Eyebrow } from "@/components/ui/primitives";
import { StatusPill } from "@/components/portal/Portal";
import { IconCircle } from "@/components/course/IconCircle";
import { GoToStepLink } from "@/components/lesson/StepNav";
import { StageRoute, type StageStop } from "@/components/moments/parts";

export type ModuleCompleteContext = {
  stageTitle: string;
  coreQuestion: string;
  nextStageTitle: string | null;
  /** The Level's name without the word Level: "Beginner". */
  levelTitle: string;
  levelSlug: string;
  /** True when this is the last Stage in the Level. */
  isLastInLevel: boolean;
  certificateTitle: string;
  /** The Read Mark: the Stage has been read before. Not completion. */
  alreadyRead: boolean;
  /** Whether this Stage's quiz has been passed — what the Certificate counts. */
  quizPassed: boolean;
  /** This Level's Stages in order, with whether each quiz is passed. */
  stages: StageStop[];
  stageSlug: string;
  /** The learner's most recent marked Stage Quiz attempt, or null before the first. */
  latestMark: { scoreRaw: number; scoreMax: number } | null;
};

/**
 * The final step of every Stage.
 *
 * The brief asks for an explicit finishing step rather than inferring it from
 * scrolling, and this is it: the question the Stage opened with, then a deliberate
 * action (the button lives in the runner's footer, immediately below).
 *
 * Everything above the sources is derived from the Stage's own data: its core
 * question, its position in the Level and the learner's latest Stage Quiz mark.
 * The one authored part is the sources list, the Stage's `sources.md`, which
 * names every document the Stage relies on (it replaced the study guide and the
 * further reading step).
 *
 * Closing the loop on the opening question is also the pedagogically useful moment:
 * the learner is asked whether they could now answer it, which is the only test
 * that matters for this course.
 *
 * Finishing records that the Stage was *read*. A Stage counts as complete when its
 * Stage Quiz is passed (Progress Record, CONTEXT.md). Until then the pink card says so
 * rather than let "finish" imply it; once passed, the Level's route takes its place.
 */
export function ModuleComplete({
  context,
  sources,
}: {
  context: ModuleCompleteContext;
  /** The Stage's sources list (its `sources.md`), rendered last. */
  sources?: React.ReactNode;
}) {
  const {
    coreQuestion,
    nextStageTitle,
    levelTitle,
    isLastInLevel,
    certificateTitle,
    alreadyRead,
    quizPassed,
    stages,
    stageSlug,
    latestMark,
  } = context;

  return (
    <div>
      {/* The Stage opened with this question. Closing the loop on it is the point
          of the step. */}
      <Card className="border-teal-line bg-teal-50 p-5">
        <Eyebrow className="text-teal-ink">The question this Stage asked</Eyebrow>
        <p className="mt-2 text-lg font-medium leading-7 text-navy">{coreQuestion}</p>
        <p className="mt-2.5 text-sm text-grey">
          Could you answer that in a conversation now, in your own words? That is the only test that
          matters here.
        </p>
      </Card>

      <section className="mt-7">
        <h3 className="t-h3 text-navy">
          {quizPassed ? "You've finished this Stage" : "You've reached the end of this Stage"}
        </h3>
        <p className="mt-2 text-base leading-7 text-grey">
          {alreadyRead
            ? "This Stage is recorded as read. You can revisit any step at any time. Nothing is locked once you have been through it."
            : "Finishing records that you have read it, so you can stop here and pick up later without losing your place."}
        </p>

        {/* Once passed, the Level's route shows where this Stage leaves the learner:
            its own stop ticked, the next one marked, the certificate at the end. */}
        {quizPassed ? (
          <>
            <StageRoute
              stages={stages}
              currentSlug={stageSlug}
              certificateTitle={certificateTitle}
              certificateEarned={stages.every((s) => s.passed)}
              celebrate={false}
            />
            {latestMark ? <LatestMark mark={latestMark} /> : null}
          </>
        ) : (
          <>
            <Card className="mt-[18px] border-pink-line bg-pink-50 p-5">
              <div className="flex items-start gap-3.5">
                <IconCircle name="award" tone="pink" />
                <div>
                  <h4 className="t-h4 mb-1 text-navy">A Stage counts as complete when you pass its quiz</h4>
                  <p className="text-sm text-grey">
                    The Stage Quiz is the step before this one. Passing every Stage Quiz in {levelTitle}{" "}
                    Level earns the{" "}
                    <span className="font-medium text-navy">&ldquo;{certificateTitle}&rdquo;</span>{" "}
                    certificate.
                  </p>
                  {latestMark ? <LatestMark mark={latestMark} /> : null}
                  <div className="mt-1.5">
                    <GoToStepLink kind="CHECK">Go to the Stage Quiz</GoToStepLink>
                  </div>
                </div>
              </div>
            </Card>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {isLastInLevel ? (
                <StatusPill tone="progress" icon="flag">
                  Last Stage in {levelTitle} Level
                </StatusPill>
              ) : null}
              {!isLastInLevel && nextStageTitle ? (
                <p className="text-sm text-grey">
                  Next up: <span className="font-medium text-navy">{nextStageTitle}</span>.
                </p>
              ) : null}
            </div>
          </>
        )}
      </section>

      {sources ? (
        <section className="mt-9 border-t border-line pt-6">
          <h3 className="t-h3 text-navy">Sources for this Stage</h3>
          <div className="mt-3">{sources}</div>
        </section>
      ) : null}
    </div>
  );
}

/** The learner's latest marked attempt, in words. */
function LatestMark({ mark }: { mark: { scoreRaw: number; scoreMax: number } }) {
  return (
    <p className="mt-2 text-sm text-grey">
      Your latest mark:{" "}
      <span className="font-bold text-navy">
        {mark.scoreRaw} out of {mark.scoreMax}
      </span>
    </p>
  );
}
