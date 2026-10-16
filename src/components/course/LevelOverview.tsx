import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { PortalCard, StatusPill, StepDot } from "@/components/portal/Portal";
import { ButtonLink, Display, Eyebrow, ProgressBar, cx } from "@/components/ui/primitives";
import type { LevelWithProgress } from "@/lib/course";
import type { StageQuizState } from "@/lib/quiz";
import { AwardNode } from "./AwardNode";

/**
 * The Level overview (#73): a sticky summary beside a dotted timeline of Stage rows that
 * ends in the Certificate. Takes plain data so every state can be rendered without a
 * session. No blobs: this is a signed-in page.
 */
export function LevelOverview({
  level,
  levelSlug,
  certificatePublicId,
  baselineDue,
  stageStatus,
  quizByModule,
}: {
  level: LevelWithProgress;
  levelSlug: string;
  certificatePublicId: string | null;
  /** The next Baseline Sitting offered after this Level, or null. */
  baselineDue: number | null;
  /** Stage ids this learner has read. */
  stageStatus: Map<string, unknown>;
  quizByModule: Map<string, StageQuizState>;
}) {
  const progress = level.progress!;
  const allPassed = progress.modulesTotal > 0 && progress.stagesPassed === progress.modulesTotal;
  const statusByModule = stageStatus;

  // The first Stage whose Quiz is not passed: the pink row, and the Stage the summary's
  // button opens. -1 once every Stage Quiz is passed.
  const nextIndex = level.modules.findIndex((m) => quizByModule.get(m.id)?.passedAt == null);
  const nextStage = nextIndex >= 0 ? level.modules[nextIndex] : null;
  const anyStarted = level.modules.some((m) => {
    const q = quizByModule.get(m.id);
    return statusByModule.get(m.id) !== undefined || q?.latest != null || q?.passedAt != null;
  });
  const toGo = progress.modulesTotal - progress.stagesPassed;

  return (
    <div className="mx-auto max-w-[73.75rem] px-[1.125rem] pb-4 pt-10 min-[760px]:px-6">
      <Link
        href="/#levels"
        className="mb-[1.625rem] inline-flex items-center gap-2 font-medium text-teal-ink underline underline-offset-[3px]"
      >
        <Icon name="arrow-left" className="size-5 shrink-0" />
        All levels
      </Link>

      <header>
        <Eyebrow className="text-pink">{level.title} Level</Eyebrow>
        {progress.status === "COMPLETE" || certificatePublicId ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {progress.status === "COMPLETE" ? (
              <StatusPill tone="done" icon="check-circle">
                Complete
              </StatusPill>
            ) : null}
            {certificatePublicId ? (
              <StatusPill tone="done" icon="award">
                Certificate earned
              </StatusPill>
            ) : null}
          </div>
        ) : null}

        <Display as="h1" className="mb-3.5 mt-3 text-display text-navy">
          {level.title}
        </Display>
        <p className="mb-[1.125rem] max-w-[56ch] text-lg leading-[1.7] text-grey">{level.goal}</p>
        <ul className="mb-[1.875rem] flex list-none flex-wrap gap-x-[1.625rem] gap-y-2.5 p-0 text-[0.9375rem]">
          <li className="flex items-center gap-2">
            <Icon name="clock" className="size-5 shrink-0 text-teal-ink" />
            {level.estMinMinutes} to {level.estMaxMinutes} minutes
          </li>
          <li className="flex items-center gap-2">
            <Icon name="book" className="size-5 shrink-0 text-teal-ink" />
            {level.modules.length} Stages
          </li>
          <li className="flex items-center gap-2">
            <Icon name="award" className="size-5 shrink-0 text-teal-ink" />
            Earns the &ldquo;{level.certificateTitle}&rdquo; certificate
          </li>
        </ul>
      </header>

      <div className="grid items-start gap-7 min-[1000px]:grid-cols-[0.7fr_1.3fr] min-[1000px]:gap-11">
        {/* --- Summary: sticky beside the timeline, first on a phone ----------- */}
        <PortalCard
          as="aside"
          plain
          tone="teal"
          className="rounded-[1.375rem] p-[1.625rem] min-[1000px]:sticky min-[1000px]:top-6"
        >
          <Eyebrow className="text-teal-ink">Your progress</Eyebrow>
          <div className="mb-2 mt-4 flex items-baseline justify-between text-[0.9375rem] font-medium">
            <span>
              {progress.stagesPassed} of {progress.modulesTotal} Stage Quizzes passed
            </span>
            <span className="text-grey">{progress.percentComplete}%</span>
          </div>
          <ProgressBar value={progress.percentComplete} label={`${level.title} progress`} tone="teal" />
          <dl className="mb-5 mt-[1.125rem] grid gap-3 text-[0.9375rem]">
            {[
              ["Time", `${level.estMinMinutes} to ${level.estMaxMinutes} minutes`],
              ["Stages", String(level.modules.length)],
              ["Earns", `\u201c${level.certificateTitle}\u201d certificate`],
            ].map(([dt, dd]) => (
              <div key={dt} className="grid gap-x-2.5 min-[760px]:grid-cols-[6.125rem_1fr]">
                <dt className="font-medium text-grey">{dt}</dt>
                <dd>{dd}</dd>
              </div>
            ))}
          </dl>
          {certificatePublicId ? (
            <ButtonLink href={`/certificate/${certificatePublicId}`} className="w-full">
              View my certificate
            </ButtonLink>
          ) : nextStage ? (
            <ButtonLink
              href={`/levels/${levelSlug}/modules/${nextStage.slug}`}
              className="w-full"
            >
              {anyStarted ? "Continue" : "Start"} Stage {nextIndex + 1}
            </ButtonLink>
          ) : null}
        </PortalCard>

        {/* --- Timeline: a dotted line, a Stage row on each node, the Certificate last --- */}
        <ol className="relative m-0 list-none p-0 pl-12 before:absolute before:bottom-[3.75rem] before:left-[15px] before:top-[34px] before:border-l-[3px] before:border-dotted before:border-line-strong before:content-[''] min-[760px]:pl-[3.75rem]">
          {level.modules.map((mod, i) => {
            const status = statusByModule.get(mod.id);
            const quiz = quizByModule.get(mod.id);
            // The tick is for the Stage Quiz, which is what the Certificate counts.
            const isDone = quiz?.passedAt != null;
            const quizFailed = !isDone && quiz?.latest != null;
            const isStarted = !isDone && (status !== undefined || quizFailed);
            const isNext = i === nextIndex;

            return (
              <li key={mod.slug} className="relative mb-4">
                <StepDot
                  n={i + 1}
                  state={isDone ? "passed" : isNext ? "current" : "todo"}
                  className="absolute -left-12 top-[18px] shadow-[0_0_0_6px_white] min-[760px]:-left-[3.75rem]"
                />
                <Link
                  href={`/levels/${levelSlug}/modules/${mod.slug}`}
                  className={cx(
                    "flex flex-wrap items-start gap-4 rounded-[1.125rem] border px-5 py-[1.125rem] text-navy no-underline",
                    isNext
                      ? "border-pink-line bg-pink-50 hover:border-pink"
                      : "border-line bg-white hover:border-teal-line hover:bg-teal-50",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 font-display text-[1.0625rem] font-bold leading-tight">
                      <span className="sr-only">Stage {i + 1}: </span>
                      {mod.title}
                      {isDone ? (
                        <StatusPill tone="done" icon="check-circle">
                          Quiz passed
                        </StatusPill>
                      ) : quizFailed ? (
                        <StatusPill tone="warn" icon="alert">
                          Quiz not passed yet
                        </StatusPill>
                      ) : isStarted ? (
                        <StatusPill tone="progress" icon="clock">
                          In progress
                        </StatusPill>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-[0.9375rem] text-grey">{mod.coreQuestion}</span>
                    <span className="mt-1.5 block text-[0.8125rem] text-grey">
                      About {mod.estMinutes} minutes
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 self-center text-[0.9375rem] font-medium text-navy">
                    {isDone ? "Review" : isStarted || quizFailed ? "Continue" : "Start"}
                    <Icon name="arrow" className="size-5 shrink-0" />
                  </span>
                </Link>
              </li>
            );
          })}

          {/* --- Certificate: the last node ---------------------------------- */}
          <li className="relative">
            <AwardNode
              earned={allPassed}
              className="absolute -left-12 top-[18px] shadow-[0_0_0_6px_white] min-[760px]:-left-[3.75rem]"
            />
            <PortalCard plain tone={allPassed ? "pink" : "teal"} className="rounded-[1.375rem] p-5 min-[760px]:p-7">
              <Eyebrow className={allPassed ? "text-pink" : "text-teal-ink"}>Certificate</Eyebrow>
              <Display as="h2" className="mb-2 mt-1.5 text-[1.5rem] font-bold leading-[1.22] tracking-tight text-navy min-[760px]:text-[1.75rem]">
                {level.certificateTitle} certificate
              </Display>

              {certificatePublicId ? (
                <>
                  <p className="mb-4 max-w-[60ch] text-grey">
                    You&apos;ve passed every Stage Quiz in {level.title}.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <ButtonLink href={`/certificate/${certificatePublicId}`}>
                      View my certificate
                    </ButtonLink>
                    {baselineDue !== null ? (
                      <ButtonLink href="/assessment/pre" variant="secondary">
                        See what you&apos;ve learned: baseline sitting {baselineDue}
                      </ButtonLink>
                    ) : null}
                  </div>
                </>
              ) : allPassed ? (
                <p className="max-w-[60ch] text-grey">
                  You&apos;ve passed every Stage Quiz, but we couldn&apos;t issue your certificate just
                  now. Refresh this page to try again.
                </p>
              ) : (
                <p className="max-w-[60ch] text-grey">
                  Pass the Stage Quiz in each of the {progress.modulesTotal} Stages to earn it. Each
                  one is the &ldquo;Check your understanding&rdquo; step of its Stage: {toGo} to go.
                </p>
              )}
            </PortalCard>
          </li>
        </ol>
      </div>
    </div>
  );
}
