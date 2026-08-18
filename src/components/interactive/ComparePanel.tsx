"use client";

import { useState } from "react";
import { PendingReview, cx } from "@/components/ui/primitives";
import type { ComparePanelPayload } from "@/lib/lesson-payloads";

const PENDING = "_Content pending._";

/**
 * A side-by-side comparison.
 *
 * Carries the single most important distinction in the course — brain death
 * versus coma versus vegetative state — plus the routes to donation and the
 * organ-by-organ comparison in the advanced level.
 *
 * On a wide screen this is a real table, because comparison is exactly what
 * tables are for and a screen reader can navigate one properly. Below `md` it
 * becomes a set of column-per-card panels with a selector, because a four-column
 * table on a phone is unreadable. Both render from the same data; neither is a
 * degraded version of the other.
 */
export function ComparePanel({ payload }: { payload: ComparePanelPayload }) {
  const [activeColumn, setActiveColumn] = useState(
    payload.columns.find((c) => c.emphasis)?.id ?? payload.columns[0]?.id ?? "",
  );

  const cell = (value: string | undefined) =>
    !value || value.startsWith(PENDING) ? (
      <span className="text-sm italic text-sand-400">Pending study guide</span>
    ) : (
      <span className="text-sm text-sand-700">{value}</span>
    );

  return (
    <div>
      {payload.intro ? <p className="mb-6 text-sand-600">{payload.intro}</p> : null}

      {/* --- Wide screens: a genuine comparison table --------------------- */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Comparison of {payload.columns.map((c) => c.label).join(", ")}
          </caption>
          <thead>
            <tr>
              <td className="w-40" />
              {payload.columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={cx(
                    "border-b-2 p-3 align-bottom",
                    col.emphasis
                      ? "border-pink bg-pink-50"
                      : "border-sand-300",
                  )}
                >
                  <span className="block font-bold text-ink">{col.label}</span>
                  {col.caption ? (
                    <span className="mt-1 block text-xs font-normal text-sand-500">
                      {col.caption}
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payload.rows.map((row) => (
              <tr key={row.id} className="border-b border-sand-200 align-top">
                <th scope="row" className="p-3 text-sm font-semibold text-ink">
                  {row.label}
                  {row.pendingReview ? (
                    <span className="mt-1.5 block">
                      <PendingReview />
                    </span>
                  ) : null}
                </th>
                {payload.columns.map((col) => (
                  <td
                    key={col.id}
                    className={cx("p-3", col.emphasis && "bg-pink-50/40")}
                  >
                    {cell(row.cells[col.id])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Narrow screens: one column at a time ------------------------- */}
      <div className="md:hidden">
        <div
          role="tablist"
          aria-label="Choose what to compare"
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2"
        >
          {payload.columns.map((col) => (
            <button
              key={col.id}
              role="tab"
              aria-selected={activeColumn === col.id}
              aria-controls={`compare-${col.id}`}
              id={`compare-tab-${col.id}`}
              onClick={() => setActiveColumn(col.id)}
              className={cx(
                "min-h-11 shrink-0 rounded-pill border-2 px-4 text-sm font-semibold transition",
                activeColumn === col.id
                  ? "border-pink-button bg-pink-button text-white"
                  : "border-sand-200 bg-white text-sand-600",
              )}
            >
              {col.label}
            </button>
          ))}
        </div>

        {payload.columns.map((col) => (
          <div
            key={col.id}
            role="tabpanel"
            id={`compare-${col.id}`}
            aria-labelledby={`compare-tab-${col.id}`}
            hidden={activeColumn !== col.id}
            className="mt-3 rounded-card border border-sand-200 bg-white p-5"
          >
            <h3 className="font-bold text-ink">{col.label}</h3>
            {col.caption ? (
              <p className="mt-1 text-xs text-sand-500">{col.caption}</p>
            ) : null}
            <dl className="mt-4 space-y-4">
              {payload.rows.map((row) => (
                <div key={row.id} className="border-t border-sand-200 pt-3">
                  <dt className="text-sm font-semibold text-ink">{row.label}</dt>
                  <dd className="mt-1">{cell(row.cells[col.id])}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {payload.bottomLine ? (
        <div className="mt-6 rounded-card border-2 border-ink bg-ink p-5 text-cream">
          <p className="text-xs font-bold uppercase tracking-wider text-teal">
            The bottom line
          </p>
          <p className="mt-2 text-lg font-medium">{payload.bottomLine}</p>
          {payload.bottomLinePendingReview ? (
            <p className="mt-3">
              <PendingReview>Pending Save7 clinical review</PendingReview>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
