import { percent, sittingLabel, type BaselineState } from "@/lib/baseline";
import { TIER_META, cx } from "@/components/ui/primitives";

/**
 * A learner's Baseline, as the Blueprint reports it: a score for each Level and an
 * overall score, one row per Sitting. With one Sitting it is the breakdown; with
 * more, the rows are the trend.
 *
 * The table twin of the My progress trend chart (#71): the same Sittings as the
 * chart, kept for a screen reader and for anyone who would rather read the numbers.
 * It also stands alone where a chart would say nothing, on the assessment results.
 */
export function BaselineResults({
  state,
  highlight,
}: {
  state: Pick<BaselineState, "sittings" | "levels" | "levelsCompleted">;
  /** The Sitting to emphasise, usually the one just submitted. */
  highlight?: number;
}) {
  if (state.sittings.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Your baseline scores, by level and overall, for each sitting</caption>
        <thead>
          <tr className="border-b border-line text-left">
            <th scope="col" className="py-2 pr-4 font-semibold text-grey">
              Sitting
            </th>
            {state.levels.map((level) => (
              <th key={level.slug} scope="col" className="px-3 py-2 text-right font-semibold text-grey">
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true" className={cx("size-2 rounded-full", TIER_META[level.tier]?.dotClass)} />
                  {level.title}
                </span>
              </th>
            ))}
            <th scope="col" className="py-2 pl-3 text-right font-semibold text-navy">
              Overall
            </th>
          </tr>
        </thead>
        <tbody>
          {state.sittings.map((sitting) => (
            <tr
              key={sitting.sittingNo}
              className={cx(
                "border-b border-line last:border-b-0",
                highlight === sitting.sittingNo && "bg-pink-50",
              )}
            >
              <th scope="row" className="py-2.5 pr-4 text-left font-medium text-navy">
                {sittingLabel(state, sitting)}
              </th>
              {state.levels.map((level) => {
                const s = sitting.levelScores[level.slug];
                return (
                  <td key={level.slug} className="px-3 py-2.5 text-right tabular-nums text-grey">
                    {s ? (
                      <>
                        {percent(s.score, s.max)}%
                        <span className="sr-only">
                          {" "}
                          ({s.score} of {s.max})
                        </span>
                      </>
                    ) : (
                      "n/a"
                    )}
                  </td>
                );
              })}
              <td className="py-2.5 pl-3 text-right font-semibold tabular-nums text-navy">
                {sitting.totalPct}%
                <span className="ml-1.5 text-xs font-normal text-grey">
                  {sitting.totalScore}/{sitting.totalMax}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
