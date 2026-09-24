import { percent, sittingLabel, type BaselineState } from "@/lib/baseline";
import { TIER_META, cx } from "@/components/ui/primitives";

/**
 * A learner's Baseline, as the Blueprint reports it: a score for each Level and an
 * overall score, one row per Sitting. With one Sitting it is the breakdown; with
 * more, the rows are the trend.
 *
 * A table rather than a chart. At one to four points a line says nothing a row of
 * numbers does not, and a table stays readable without CSS and to a screen reader.
 * The full trend chart belongs to the progress dashboard's own build (#17).
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
          <tr className="border-b border-sand-200 text-left">
            <th scope="col" className="py-2 pr-4 font-semibold text-sand-500">
              Sitting
            </th>
            {state.levels.map((level) => (
              <th key={level.slug} scope="col" className="px-3 py-2 text-right font-semibold text-sand-500">
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true" className={cx("size-2 rounded-full", TIER_META[level.tier]?.dotClass)} />
                  {level.title}
                </span>
              </th>
            ))}
            <th scope="col" className="py-2 pl-3 text-right font-semibold text-ink">
              Overall
            </th>
          </tr>
        </thead>
        <tbody>
          {state.sittings.map((sitting) => (
            <tr
              key={sitting.sittingNo}
              className={cx(
                "border-b border-sand-100 last:border-b-0",
                highlight === sitting.sittingNo && "bg-pink-50/60",
              )}
            >
              <th scope="row" className="py-2.5 pr-4 text-left font-medium text-ink">
                {sittingLabel(state, sitting)}
              </th>
              {state.levels.map((level) => {
                const s = sitting.levelScores[level.slug];
                return (
                  <td key={level.slug} className="px-3 py-2.5 text-right tabular-nums text-sand-700">
                    {s ? (
                      <>
                        {percent(s.score, s.max)}%
                        <span className="sr-only">
                          {" "}
                          ({s.score} of {s.max})
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                );
              })}
              <td className="py-2.5 pl-3 text-right font-semibold tabular-nums text-ink">
                {sitting.totalPct}%
                <span className="ml-1.5 text-xs font-normal text-sand-500">
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
