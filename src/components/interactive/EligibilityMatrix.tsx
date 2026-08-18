"use client";

import { useState } from "react";
import { Badge, PendingReview, cx } from "@/components/ui/primitives";
import type { EligibilityMatrixPayload } from "@/lib/lesson-payloads";

const PENDING = "_Content pending._";

/**
 * "Does this rule me out?"
 *
 * Every factor resolves to a verdict from a fixed set rather than a bare yes or
 * no, because a confident exclusion from an advocate can permanently remove a
 * potential donor, and a confident "that's irrelevant" is equally inaccurate.
 *
 * One verdict is different: `stated-criteria`. Save7's study guide gives firm age
 * ranges for tissue donation, and reporting those as "assessed individually"
 * would misrepresent the source. Where the guidance states a criterion, the
 * component states it.
 *
 * The bottom line is pinned to the top rather than the bottom: it is the one thing
 * a learner must leave with even if they read nothing else.
 */
const VERDICTS: Record<
  EligibilityMatrixPayload["factors"][number]["verdict"],
  { label: string; tone: "teal" | "review" | "neutral" }
> = {
  "assessed-individually": { label: "Assessed individually", tone: "teal" },
  depends: { label: "It depends", tone: "review" },
  "rarely-absolute": { label: "Rarely an absolute barrier", tone: "neutral" },
  "stated-criteria": { label: "Stated criteria apply", tone: "neutral" },
};

export function EligibilityMatrix({ payload }: { payload: EligibilityMatrixPayload }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div>
      {payload.intro ? <p className="mb-6 text-sand-600">{payload.intro}</p> : null}

      <div className="rounded-card border-2 border-ink bg-ink p-5 text-cream">
        <p className="text-xs font-bold uppercase tracking-wider text-teal">
          Before anything else
        </p>
        <p className="mt-2 text-lg font-medium">{payload.bottomLine}</p>
        {payload.bottomLinePendingReview ? (
          <p className="mt-3">
            <PendingReview>Pending Save7 clinical review</PendingReview>
          </p>
        ) : null}
      </div>

      <ul className="mt-6 space-y-2.5">
        {payload.factors.map((factor) => {
          const isOpen = openId === factor.id;
          const panelId = `factor-${factor.id}`;
          const verdict = VERDICTS[factor.verdict];
          const hasReality = factor.reality && !factor.reality.startsWith(PENDING);

          return (
            <li key={factor.id}>
              <div
                className={cx(
                  "rounded-card border-2 transition",
                  isOpen ? "border-pink bg-pink-50/40" : "border-sand-200 bg-white",
                )}
              >
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenId(isOpen ? null : factor.id)}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left"
                  >
                    <span className="flex-1">
                      <span className="block font-bold text-ink">{factor.factor}</span>
                      <span className="mt-0.5 block text-sm italic text-sand-500">
                        {factor.commonAssumption}
                      </span>
                    </span>
                    <Badge tone={verdict.tone} className="shrink-0">
                      {verdict.label}
                    </Badge>
                  </button>
                </h3>

                <div id={panelId} hidden={!isOpen} className="px-5 pb-5">
                  <div className="border-t border-sand-200 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-sand-500">
                      How the question is actually answered
                    </p>
                    {hasReality ? (
                      <p className="mt-1.5 text-sand-700">{factor.reality}</p>
                    ) : (
                      <p className="mt-1.5 text-sm text-sand-600">
                        <span className="italic text-sand-500">
                          The detail here is pending current authoritative guidance.
                        </span>{" "}
                        {factor.verdict === "stated-criteria" ? (
                          <strong className="text-ink">
                            Save7&apos;s study guide states a criterion for this factor —
                            check it against the guide before quoting it.
                          </strong>
                        ) : (
                          <strong className="text-ink">
                            What does not change is the verdict: this is assessed by a
                            medical team at the time, not decided in advance by you or by
                            the donor.
                          </strong>
                        )}
                      </p>
                    )}
                    {factor.pendingReview ? (
                      <p className="mt-3">
                        <PendingReview>
                          Pending Save7 clinical review — outdated exclusion criteria are
                          actively harmful
                        </PendingReview>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
