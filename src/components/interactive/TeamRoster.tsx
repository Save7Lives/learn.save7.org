"use client";

import { useState } from "react";
import { Badge, PendingReview, cx } from "@/components/ui/primitives";
import type { TeamRosterPayload } from "@/lib/lesson-payloads";

const PENDING = "_Content pending._";

/** Meet the transplant team. Click a role to see what that person actually does. */
export function TeamRoster({ payload }: { payload: TeamRosterPayload }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    payload.members[0]?.id ?? null,
  );
  const selected = payload.members.find((m) => m.id === selectedId) ?? null;

  const people = payload.members.filter((m) => !m.isOrganisation);
  const orgs = payload.members.filter((m) => m.isOrganisation);

  return (
    <div>
      {payload.intro ? <p className="mb-6 text-sand-600">{payload.intro}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-5">
          <Group
            title="People"
            members={people}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <Group
            title="Organisations"
            members={orgs}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        <div
          aria-live="polite"
          className="rounded-card border border-sand-200 bg-white p-6 lg:sticky lg:top-24 lg:self-start"
        >
          {selected ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-2xl text-ink">{selected.role}</h3>
                {selected.isOrganisation ? (
                  <Badge tone="teal">Organisation</Badge>
                ) : null}
              </div>

              {selected.oneLiner ? (
                <p className="mt-2 font-medium text-sand-700">{selected.oneLiner}</p>
              ) : null}

              {selected.appearsAt ? (
                <p className="mt-4 text-sm text-sand-500">
                  <span className="font-semibold text-sand-600">In the pathway:</span>{" "}
                  {selected.appearsAt}
                </p>
              ) : null}

              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-sand-500">
                  What they do
                </p>
                {selected.responsibilities?.some(
                  (r) => !r.startsWith(PENDING),
                ) ? (
                  <ul className="mt-2 space-y-1.5">
                    {selected.responsibilities
                      .filter((r) => !r.startsWith(PENDING))
                      .map((r) => (
                        <li key={r} className="flex gap-2.5 text-sm text-sand-700">
                          <span
                            aria-hidden="true"
                            className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-deep"
                          />
                          {r}
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm italic text-sand-400">
                    Role description pending the Save7 study guide.
                  </p>
                )}
              </div>

              {selected.externalUrl ? (
                <a
                  href={selected.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-block text-sm font-semibold text-pink-600 underline"
                >
                  Visit their website
                </a>
              ) : null}

              {selected.pendingReview ? (
                <p className="mt-5">
                  <PendingReview />
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sand-500">Select a role to learn what they do.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Group({
  title,
  members,
  selectedId,
  onSelect,
}: {
  title: string;
  members: TeamRosterPayload["members"];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (members.length === 0) return null;
  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-wider text-sand-500">
        {title}
      </h3>
      <ul className="mt-2.5 grid gap-2 sm:grid-cols-2">
        {members.map((member) => {
          const isSelected = selectedId === member.id;
          return (
            <li key={member.id}>
              <button
                type="button"
                onClick={() => onSelect(member.id)}
                aria-pressed={isSelected}
                className={cx(
                  "min-h-11 w-full rounded-xl border-2 px-3.5 py-2.5 text-left text-sm font-semibold transition",
                  isSelected
                    ? "border-pink bg-pink-50 text-ink"
                    : "border-sand-200 bg-white text-sand-700 hover:border-sand-400",
                )}
              >
                {member.role}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
