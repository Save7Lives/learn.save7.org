"use client";

import { useState } from "react";
import { Badge, PendingReview, cx } from "@/components/ui/primitives";
import type { OrganExplorerPayload } from "@/lib/lesson-payloads";

const PENDING = "_Content pending._";

/**
 * What can be donated, and who needs it.
 *
 * Grouped into solid organs and tissue, because the breadth of tissue donation is
 * the thing public conversation consistently leaves out — a learner who finishes
 * Module 1 should not still think donation means hearts.
 */
export function OrganExplorer({ payload }: { payload: OrganExplorerPayload }) {
  const first = payload.groups[0]?.items[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(first);

  const all = payload.groups.flatMap((g) => g.items);
  const selected = all.find((i) => i.id === selectedId) ?? null;

  const field = (value: string | undefined) =>
    !value || value.startsWith(PENDING) ? null : value;

  return (
    <div>
      {payload.intro ? <p className="mb-6 text-sand-600">{payload.intro}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          {payload.groups.map((group) => (
            <section key={group.id}>
              <h3 className="font-bold text-ink">{group.label}</h3>
              {group.caption ? (
                <p className="mt-1 text-sm text-sand-500">{group.caption}</p>
              ) : null}

              <ul className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => {
                  const isSelected = selectedId === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        aria-pressed={isSelected}
                        className={cx(
                          "min-h-11 rounded-pill border-2 px-4 text-sm font-semibold transition",
                          isSelected
                            ? "border-pink-button bg-pink-button text-white"
                            : "border-sand-200 bg-white text-sand-700 hover:border-sand-400",
                        )}
                      >
                        {item.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        {/* aria-live so a screen reader hears the panel change on selection. */}
        <div
          aria-live="polite"
          className="rounded-card border border-sand-200 bg-white p-6"
        >
          {selected ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-2xl text-ink">{selected.name}</h3>
                <Badge tone={selected.category === "Tissue" ? "teal" : "neutral"}>
                  {selected.category}
                </Badge>
              </div>

              {selected.note ? (
                <p className="mt-3 text-sm text-sand-600">{selected.note}</p>
              ) : null}

              <dl className="mt-5 space-y-4">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-sand-500">
                    Why someone needs it
                  </dt>
                  <dd className="mt-1 text-sand-700">
                    {field(selected.whyNeeded) ?? (
                      <span className="text-sm italic text-sand-400">
                        Pending the Save7 study guide.
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-sand-500">
                    What a transplant gives back
                  </dt>
                  <dd className="mt-1 text-sand-700">
                    {field(selected.restores) ?? (
                      <span className="text-sm italic text-sand-400">
                        Pending the Save7 study guide.
                      </span>
                    )}
                  </dd>
                </div>
              </dl>

              {selected.pendingReview ? (
                <p className="mt-5">
                  <PendingReview>Pending Save7 clinical review</PendingReview>
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sand-500">Select an organ or tissue to learn about it.</p>
          )}
        </div>
      </div>
    </div>
  );
}
