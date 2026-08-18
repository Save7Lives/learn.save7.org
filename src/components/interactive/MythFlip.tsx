"use client";

import { useState } from "react";
import { PendingReview, cx } from "@/components/ui/primitives";
import type { MythFlipPayload } from "@/lib/lesson-payloads";

const PENDING = "_Content pending._";

/**
 * Myth and fact cards.
 *
 * Each card carries a third field the usual myth-busting format omits: *why the
 * myth persists*. That is the field that actually matters for an advocate —
 * knowing a belief is false does not help you talk to someone who holds it, but
 * understanding why it is persuasive does. Module 4 then has learners practise
 * against these same beliefs.
 */
export function MythFlip({ payload }: { payload: MythFlipPayload }) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      {payload.intro ? <p className="mb-6 text-sand-600">{payload.intro}</p> : null}

      <ul className="grid gap-4 sm:grid-cols-2">
        {payload.cards.map((card) => {
          const isOpen = flipped.has(card.id);
          const panelId = `myth-${card.id}`;
          const hasFact = card.fact && !card.fact.startsWith(PENDING);

          return (
            <li key={card.id}>
              <div
                className={cx(
                  "flex h-full flex-col rounded-card border-2 p-5 transition",
                  isOpen ? "border-teal-500 bg-teal-50" : "border-sand-200 bg-white",
                )}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-incorrect">
                  The myth
                </p>
                <p className="mt-2 font-medium text-ink">
                  &ldquo;{card.myth}&rdquo;
                </p>

                <div className="mt-4 flex-1" />

                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(card.id)}
                  className="self-start text-sm font-bold text-pink-600 underline"
                >
                  {isOpen ? "Hide the response" : "What's actually true?"}
                </button>

                <div id={panelId} hidden={!isOpen} className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-teal-deep">
                      The fact
                    </p>
                    {hasFact ? (
                      <p className="mt-1 text-sm text-ink">{card.fact}</p>
                    ) : (
                      <p className="mt-1 text-sm italic text-sand-500">
                        Pending the Save7 study guide — this correction must be
                        accurate, so it is left blank rather than guessed.
                      </p>
                    )}
                  </div>

                  {card.whyItPersists ? (
                    <div className="border-t border-teal-500/20 pt-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-sand-500">
                        Why people believe it
                      </p>
                      <p className="mt-1 text-sm text-sand-700">{card.whyItPersists}</p>
                    </div>
                  ) : null}

                  {card.pendingReview ? <PendingReview /> : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
