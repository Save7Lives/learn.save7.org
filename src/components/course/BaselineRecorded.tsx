import { MAX_SITTINGS, type BaselineState } from "@/lib/baseline";
import { BaselineLevelRows, SittingStepper } from "@/components/course/BaselineLevelRows";
import { ButtonLink, Card, Eyebrow } from "@/components/ui/primitives";
import { HeroArt } from "@/components/ui/HeroArt";
import { StatusPill } from "@/components/portal/Portal";

/**
 * The Baseline's results screen, given a learner's Sittings and the Level to
 * suggest next. The page reads them; this only draws them, so it can be rendered
 * against any state (see the results page for what the screen is and is not).
 */
export function BaselineRecorded({
  baseline,
  nextLevel,
}: {
  baseline: Pick<BaselineState, "sittings" | "levels" | "levelsCompleted" | "due" | "first">;
  /** The first Level not yet complete, or null when all are. */
  nextLevel: { slug: string; title: string; notStarted: boolean } | null;
}) {
  const latest = baseline.sittings[baseline.sittings.length - 1];
  const first = baseline.first!;
  const isFirst = latest.sittingNo === 1;
  const change = latest.totalPct - first.totalPct;

  return (
    <div className="relative overflow-hidden pb-14 pt-[132px] sm:pt-14">
      <HeroArt />
      <div className="relative z-10 mx-auto max-w-[640px] px-5 sm:px-8">
        <Eyebrow className="text-pink">Baseline recorded</Eyebrow>
        <h1 className="t-display mt-2 text-navy sm:max-w-[14ch]">
          {isFirst ? <>That&apos;s your starting point</> : <>Here&apos;s what changed</>}
        </h1>

        <Card className="mt-[22px] px-5 py-[22px] sm:px-6">
          <Eyebrow>
            {isFirst ? "Before the course" : `Sitting ${latest.sittingNo} of ${MAX_SITTINGS}`}
          </Eyebrow>
          <p className="mt-2 font-(family-name:--font-display) text-[3.5rem] font-extrabold leading-none tracking-[-0.02em] text-navy">
            {latest.totalPct}%
          </p>
          <p className="mt-2 text-sm text-grey">
            {latest.totalScore} of {latest.totalMax} questions
          </p>
          {isFirst ? null : (
            <p className="mt-3">
              <StatusPill
                tone={change >= 0 ? "done" : "progress"}
                icon={change >= 0 ? "check" : "info"}
              >
                {change >= 0 ? "+" : "\u2212"}
                {Math.abs(change)} points since your first sitting ({first.totalPct}%)
              </StatusPill>
            </p>
          )}

          {isFirst ? null : (
            <p className="mt-4 flex items-center gap-2 text-sm text-grey">
              <span aria-hidden="true" className="inline-block h-4 w-1 rounded-sm bg-navy" />
              The dark mark on a bar is your first sitting.
            </p>
          )}
          <BaselineLevelRows state={baseline} sitting={latest} first={isFirst ? null : first} />
          <SittingStepper state={baseline} current={latest.sittingNo} max={MAX_SITTINGS} />

          <div className="mt-[22px] border-t border-line pt-[18px] text-base leading-[1.7] text-grey">
            {isFirst ? (
              <>
                <p>
                  There is no pass mark here, and this is not a grade. It is a measurement taken
                  before you learned anything, which is exactly what makes the later sittings
                  meaningful. You&apos;ll sit the same questions again after each Level you finish.
                </p>
                <p className="mt-3">
                  {latest.totalPct < 50
                    ? "A low baseline is genuinely the best place to start from. You have the most to gain."
                    : "You already know some of this. The course will fill in the parts that are harder to pick up casually: brain death, the law, and how to handle a difficult conversation."}
                </p>
              </>
            ) : (
              <p>
                Each row is the same {latest.totalMax} questions, so the difference between rows is
                what you learned. A Level you haven&apos;t studied yet usually moves least. That is
                expected, not a shortfall.
              </p>
            )}
          </div>
        </Card>

        {baseline.due !== null ? (
          <Card className="mt-4 border-pink-line bg-pink-50 p-5">
            <p className="text-base text-navy">
              You&apos;ve finished a Level since your last sitting, so sitting {baseline.due} is
              ready whenever you are.
            </p>
            <div className="mt-3">
              <ButtonLink href="/assessment/pre" className="w-full sm:w-auto">
                Take sitting {baseline.due}
              </ButtonLink>
            </div>
          </Card>
        ) : null}

        <div className="mt-[34px]">
          {isFirst ? (
            <>
              <h2 className="t-h2 text-navy">Now choose where to begin</h2>
              <p className="mt-2 text-base leading-6 text-grey sm:text-lg sm:leading-7">
                We recommend starting with{" "}
                <span className="font-medium text-navy">{nextLevel?.title ?? "Beginner"}</span>, but
                you can start at any Level.
              </p>
            </>
          ) : null}

          <div className="mt-[18px] flex flex-wrap gap-3">
            {nextLevel ? (
              <ButtonLink href={`/levels/${nextLevel.slug}`} size="lg" className="w-full sm:w-auto">
                {nextLevel.notStarted ? "Start" : "Continue"} {nextLevel.title} Level
              </ButtonLink>
            ) : null}
            <ButtonLink
              href={isFirst ? "/#levels" : "/dashboard"}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              {isFirst ? "See all three Levels" : "My progress"}
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
