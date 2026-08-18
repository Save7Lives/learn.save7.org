"use client";

import { useState } from "react";
import { Badge, Button, Card, PendingReview, cx } from "@/components/ui/primitives";
import type { ScenarioDialoguePayload } from "@/lib/lesson-payloads";

const PENDING = "_Content pending._";

/**
 * Conversation practice.
 *
 * The pedagogical heart of the course, used in Module 4 and again, much harder, in
 * Module 12.
 *
 * Three deliberate design choices:
 *
 * 1. **More than one response is "strong".** Real conversations do not have a
 *    single right answer, and marking one option correct would teach learners to
 *    look for a script instead of listening.
 * 2. **Feedback is given for every option, including the strong ones.** Knowing
 *    *why* something works is what transfers to a conversation the course never
 *    anticipated.
 * 3. **Optional reflection before the options appear.** Committing to your own
 *    words first, then seeing the alternatives, is far more useful than
 *    recognising a good answer in a list. It is optional because forcing typing on
 *    a phone would just make people skip the module.
 */
export function ScenarioDialogue({ payload }: { payload: ScenarioDialoguePayload }) {
  return (
    <div>
      {payload.intro ? <p className="mb-6 text-sand-600">{payload.intro}</p> : null}

      {payload.framework ? <FrameworkPanel framework={payload.framework} /> : null}

      <div className="space-y-8">
        {payload.scenarios.map((scenario, i) => (
          <Scenario key={scenario.id} scenario={scenario} index={i} />
        ))}
      </div>
    </div>
  );
}

function FrameworkPanel({
  framework,
}: {
  framework: NonNullable<ScenarioDialoguePayload["framework"]>;
}) {
  return (
    <Card className="mb-8 bg-sand-100/70 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-display text-xl text-ink">
          The {framework.name} framework
        </h3>
        {framework.pendingReview ? <PendingReview /> : null}
      </div>
      <p className="mt-2 text-sm text-sand-600">
        The steps below are placeholders. The {framework.name} framework must be
        reproduced from Save7&apos;s own communication material rather than
        reconstructed, so the letters are shown without invented meanings.
      </p>
      <ol className="mt-4 flex flex-wrap gap-2">
        {framework.steps.map((step) => (
          <li
            key={step.letter}
            className="flex items-center gap-2 rounded-pill border border-sand-300 bg-white px-3 py-1.5"
          >
            <span className="font-display text-lg text-pink-600">{step.letter}</span>
            <span className="text-sm italic text-sand-500">awaiting Save7 material</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

const QUALITY: Record<
  "strong" | "workable" | "poor",
  { label: string; tone: "correct" | "review" | "incorrect"; ring: string }
> = {
  strong: { label: "Strong response", tone: "correct", ring: "border-correct" },
  workable: { label: "Workable, with care", tone: "review", ring: "border-review" },
  poor: { label: "This will cost you the conversation", tone: "incorrect", ring: "border-incorrect" },
};

function Scenario({
  scenario,
  index,
}: {
  scenario: ScenarioDialoguePayload["scenarios"][number];
  index: number;
}) {
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");
  const [revealed, setRevealed] = useState(!scenario.reflectPrompt);

  const chosen = scenario.options.find((o) => o.id === chosenId) ?? null;

  return (
    <Card as="article" className="overflow-hidden">
      {/* The quote, on ink. Giving the objection real visual weight matters —
          these are things people actually say, not strawmen to knock down. */}
      <div className="on-ink bg-ink p-6 text-cream">
        <p className="text-xs font-bold uppercase tracking-wider text-teal">
          Scenario {index + 1} · {scenario.speaker}
        </p>
        <blockquote className="mt-3 text-xl font-medium leading-snug">
          &ldquo;{scenario.quote}&rdquo;
        </blockquote>
      </div>

      <div className="p-6">
        {scenario.whatsReallyHappening ? (
          <div className="mb-6 rounded-xl bg-teal-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-deep">
              What is really going on
            </p>
            <p className="mt-1.5 text-sm text-ink">{scenario.whatsReallyHappening}</p>
          </div>
        ) : null}

        {/* Reflection step, before the options are visible. */}
        {scenario.reflectPrompt && !revealed ? (
          <div>
            <label
              htmlFor={`reflect-${scenario.id}`}
              className="block font-semibold text-ink"
            >
              {scenario.reflectPrompt}
            </label>
            <textarea
              id={`reflect-${scenario.id}`}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-sand-300 bg-white p-3 text-ink"
              placeholder="Optional — in your own words."
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button onClick={() => setRevealed(true)}>
                Show me some responses
              </Button>
              <p className="text-xs text-sand-500">
                Your answer stays on this page and is not recorded.
              </p>
            </div>
          </div>
        ) : null}

        {revealed ? (
          <>
            {reflection.trim() ? (
              <div className="mb-5 rounded-xl border border-sand-200 bg-sand-100/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-sand-500">
                  What you said
                </p>
                <p className="mt-1 text-sm italic text-ink">{reflection}</p>
                <p className="mt-2 text-xs text-sand-500">
                  Compare it with the options below — several of them are good, and
                  yours may be better than all of them.
                </p>
              </div>
            ) : null}

            <fieldset>
              <legend className="font-semibold text-ink">
                How would you respond?
              </legend>
              <div className="mt-3 space-y-2.5">
                {scenario.options.map((option) => {
                  const isChosen = chosenId === option.id;
                  const showState = chosen !== null;
                  const meta = QUALITY[option.quality];

                  return (
                    <div key={option.id}>
                      <button
                        type="button"
                        onClick={() => setChosenId(option.id)}
                        aria-pressed={isChosen}
                        className={cx(
                          "w-full rounded-xl border-2 px-4 py-3.5 text-left transition",
                          isChosen
                            ? meta.ring
                            : showState
                              ? "border-sand-200 bg-white opacity-60 hover:opacity-100"
                              : "border-sand-200 bg-white hover:border-sand-300",
                        )}
                      >
                        <span className="text-ink">{option.text}</span>
                        {isChosen ? (
                          <span className="mt-2 block">
                            <Badge tone={meta.tone}>{meta.label}</Badge>
                          </span>
                        ) : null}
                      </button>

                      {isChosen ? (
                        <div
                          className={cx(
                            "mt-2 rounded-xl p-4 text-sm",
                            option.quality === "strong"
                              ? "bg-correct-soft text-ink"
                              : option.quality === "workable"
                                ? "bg-review-soft text-ink"
                                : "bg-incorrect-soft text-ink",
                          )}
                          role="status"
                        >
                          {option.feedback}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </fieldset>

            {chosen ? (
              <div className="mt-5 border-t border-sand-200 pt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-sand-500">
                  The teaching point
                </p>
                {scenario.debrief && !scenario.debrief.includes(PENDING) ? (
                  <p className="mt-1.5 text-sand-700">{scenario.debrief}</p>
                ) : scenario.debrief ? (
                  <>
                    <p className="mt-1.5 text-sand-700">
                      {scenario.debrief.split(PENDING)[0].trim()}
                    </p>
                    <p className="mt-2 text-sm italic text-sand-500">
                      Further explanation pending the Save7 study guide.
                    </p>
                  </>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {scenario.options.filter((o) => o.quality === "strong").length > 1 ? (
                    <Badge tone="neutral">
                      More than one response here works — there is no single script
                    </Badge>
                  ) : null}
                  {scenario.pendingReview ? <PendingReview /> : null}
                </div>

                <button
                  type="button"
                  onClick={() => setChosenId(null)}
                  className="mt-4 text-sm font-semibold text-pink-600 underline"
                >
                  Try a different response
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </Card>
  );
}
