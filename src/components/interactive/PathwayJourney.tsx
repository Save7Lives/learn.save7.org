"use client";

import { useState } from "react";
import { Badge, PendingReview, cx } from "@/components/ui/primitives";
import type { PathwayJourneyPayload } from "@/lib/lesson-payloads";

/**
 * The donor pathway, as a walkable sequence.
 *
 * This is the most reused component in the course: it carries Module 2's central
 * argument (where donations are lost), Module 5's full journey, Module 6's
 * determination-of-death process, Module 9's legal touchpoints, and Module 11's
 * recipient journey.
 *
 * The design decision that matters: when `showLossPoints` is set, each step can
 * be opened to reveal how a donation is lost *there*. Seeing the loss attached to
 * a specific step is what turns "there is a shortage" into "here is where it
 * breaks, and most of these are human".
 *
 * Layout is a vertical rail on every screen size. An earlier horizontal version
 * looked better on a desktop and was unusable on a phone, which is the wrong
 * trade for this audience.
 */
export function PathwayJourney({ payload }: { payload: PathwayJourneyPayload }) {
  const [openId, setOpenId] = useState<string | null>(payload.steps[0]?.id ?? null);

  return (
    <div>
      {payload.intro ? (
        <p className="mb-6 text-sand-600">{payload.intro}</p>
      ) : null}

      <ol className="relative">
        {payload.steps.map((step, i) => {
          const isOpen = openId === step.id;
          const isLast = i === payload.steps.length - 1;
          const lossCount = step.lossPoints?.length ?? 0;
          const panelId = `pathway-panel-${step.id}`;

          return (
            <li key={step.id} className="relative pb-2 pl-11 last:pb-0">
              {/* The connecting rail. Hidden from assistive tech — the ordered
                  list already communicates sequence. */}
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className="absolute left-[13px] top-8 h-[calc(100%-1rem)] w-0.5 bg-sand-200"
                />
              ) : null}

              <span
                aria-hidden="true"
                className={cx(
                  "absolute left-0 top-1 grid size-7 place-items-center rounded-full border-2 text-xs font-bold transition",
                  isOpen
                    ? "border-pink-button bg-pink-button text-white"
                    : "border-sand-300 bg-white text-sand-500",
                )}
              >
                {i + 1}
              </span>

              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenId(isOpen ? null : step.id)}
                  className="group w-full rounded-lg py-1 text-left"
                >
                  <span
                    className={cx(
                      "font-bold transition",
                      isOpen ? "text-ink" : "text-sand-700 group-hover:text-ink",
                    )}
                  >
                    {step.label}
                  </span>
                  {step.summary ? (
                    <span className="mt-0.5 block text-sm text-sand-500">
                      {step.summary}
                    </span>
                  ) : null}
                  {lossCount > 0 && !isOpen ? (
                    <span className="mt-1.5 inline-flex">
                      <Badge tone="incorrect">
                        {lossCount} way{lossCount === 1 ? "" : "s"} a donation is lost here
                      </Badge>
                    </span>
                  ) : null}
                </button>
              </h3>

              <div id={panelId} hidden={!isOpen} className="pb-4 pt-2">
                {step.detail ? (
                  step.awaitingContent ? (
                    <div className="rounded-xl border border-dashed border-sand-300 bg-sand-100/60 px-4 py-3 text-sm text-sand-600">
                      <span className="font-semibold text-sand-700">
                        Content pending.
                      </span>{" "}
                      This step will be described from the Save7 study guide.
                      {step.pendingReview ? (
                        <span className="ml-2 inline-flex align-middle">
                          <PendingReview />
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sand-700">{step.detail}</p>
                  )
                ) : null}

                {payload.showLossPoints && lossCount > 0 ? (
                  <div className="mt-4 rounded-xl border border-red-200 bg-incorrect-soft p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-incorrect">
                      Where a donation is lost here
                    </p>
                    <ul className="mt-3 space-y-3">
                      {step.lossPoints!.map((loss) => (
                        <li key={loss.id}>
                          <p className="text-sm font-bold text-ink">{loss.label}</p>
                          {loss.detail &&
                          !loss.detail.startsWith("_Content pending._") ? (
                            <p className="mt-0.5 text-sm text-sand-700">{loss.detail}</p>
                          ) : (
                            <p className="mt-0.5 text-sm italic text-sand-500">
                              Explanation pending Save7 study guide.
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
