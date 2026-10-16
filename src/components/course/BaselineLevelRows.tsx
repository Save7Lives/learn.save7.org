import { percent, sittingLabel, type BaselineState, type Sitting } from "@/lib/baseline";
import { StepDot, type RailState } from "@/components/portal/Portal";

type State = Pick<BaselineState, "sittings" | "levels" | "levelsCompleted">;

/**
 * One row per Level for a Sitting (#74): its name, its percent, a 12px `teal-ink`
 * bar on `line`, and "n of m questions". No Level colour.
 *
 * After a later Sitting each bar carries a 4px navy mark at the first Sitting's
 * value, and "First sitting n%" sits beside the count, so the change reads without
 * a second chart. The bar is `role="img"` with the whole sentence as its name, and
 * the same figures are in the text beside it.
 *
 * It is the readable twin of the table `BaselineResults` draws: at 375px a
 * five-column table scrolls sideways, so the results page uses these rows, and My
 * Progress keeps the table.
 */
export function BaselineLevelRows({
  state,
  sitting,
  first,
}: {
  state: State;
  /** The Sitting to show. */
  sitting: Sitting;
  /** The first Sitting, for the marks; null on the first Sitting itself. */
  first: Sitting | null;
}) {
  return (
    <ul className="mt-[18px] grid gap-[18px]">
      {state.levels.map((level) => {
        const score = sitting.levelScores[level.slug];
        const firstScore = first?.levelScores[level.slug];
        const pct = score ? percent(score.score, score.max) : null;
        const firstPct = firstScore ? percent(firstScore.score, firstScore.max) : null;

        return (
          <li key={level.slug}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-(family-name:--font-display) text-base font-semibold leading-[1.3] text-navy">
                {level.title}
              </span>
              <span className="font-(family-name:--font-display) text-xl font-bold leading-none text-navy">
                {pct === null ? "n/a" : `${pct}%`}
              </span>
            </div>
            <div
              role="img"
              aria-label={
                score && pct !== null
                  ? `${level.title} ${pct} percent, ${score.score} of ${score.max}${firstPct !== null ? `, first sitting ${firstPct} percent` : ""}`
                  : `${level.title} not scored`
              }
              className="relative mt-2 h-3 rounded-pill bg-line"
            >
              <div className="h-full rounded-pill bg-teal-ink" style={{ width: `${pct ?? 0}%` }} />
              {firstPct !== null && firstPct !== pct ? (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 h-5 w-1 -translate-x-1/2 rounded-sm bg-navy"
                  style={{ left: `${firstPct}%` }}
                />
              ) : null}
            </div>
            <p className="mt-1.5 flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm text-grey">
              <span>
                {score ? `${score.score} of ${score.max} questions` : "No questions at this Level"}
              </span>
              {firstPct !== null ? (
                <span>
                  {firstPct === pct ? "Same as your first sitting" : `First sitting ${firstPct}%`}
                </span>
              ) : null}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The four Sittings as a dotted stepper: a check for each one behind you, a ring
 * for this one, grey for those still to come. On a phone it is dots only; names and
 * what prompted each Sitting show from 40rem, and every dot is named for a screen
 * reader either way.
 */
export function SittingStepper({
  state,
  current,
  max,
}: {
  state: State;
  /** The Sitting number this screen is about. */
  current: number;
  max: number;
}) {
  return (
    <ol aria-label={`Your ${max} sittings`} className="mt-[18px] flex">
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1;
        const taken = state.sittings.find((s) => s.sittingNo === n) ?? null;
        const dot: RailState = n < current ? "passed" : n === current ? "current" : "todo";
        const note = taken ? sittingLabel(state, taken) : "Not yet";
        const status = n === current ? "this sitting" : n < current ? "taken" : "not yet taken";
        return (
          <li key={n} className="relative min-w-0 flex-1 px-1 text-center">
            {n > 1 ? (
              <span
                aria-hidden="true"
                className="absolute right-[calc(50%+22px)] top-[15px] w-[calc(100%-44px)] border-t-[3px] border-dotted border-line-strong"
              />
            ) : null}
            <span className="block min-h-11">
              <StepDot state={dot} n={n} className="mx-auto mb-1.5" />
              <span className="sr-only">{`Sitting ${n}, ${status}${taken ? `, ${note}` : ""}`}</span>
              <span
                aria-hidden="true"
                className={
                  "hidden text-[0.8125rem] leading-[1.3] text-navy sm:block " +
                  (n === current ? "font-semibold" : "font-medium")
                }
              >
                Sitting {n}
              </span>
              <span aria-hidden="true" className="mt-0.5 hidden text-xs text-grey sm:block">
                {note}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
