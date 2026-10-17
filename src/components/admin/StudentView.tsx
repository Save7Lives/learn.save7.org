import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { StatCard, type RailState } from "@/components/portal/Portal";
import { LevelCard, type LevelCardStage } from "@/components/portal/LevelCard";
import { DataTable, CellSub } from "@/components/portal/DataTable";
import { Notice, Panel } from "@/components/portal/Panel";
import {
  SITTING_SLOTS,
  currentLevel,
  flagLabel,
  latestSitting,
  levelImprovement,
  liveCertificates,
  percent,
  heldFlags,
  stagesPassed,
  type Catalogue,
  type EligibilityRule,
  type StudentRecord,
} from "@/lib/admin/model";
import { formatDate, formatPct, formatPoints, formatShortDate, initials } from "@/lib/admin/format";
import type { ActivityEvent } from "@/lib/admin/data";

/**
 * A Student's Progress Record, "where they are" first (#72, #84): the four stat cards,
 * the eligibility line, each Level as a card with its Stage stepper, the Certificate
 * line, then the Baseline table with an Improvement row. Dashboard activity closes
 * the page (#81). Presentational: every state of a record renders from plain data.
 */

const EVENT_WORDS: Record<string, string> = {
  lesson_view: "Opened a lesson",
  quiz_start: "Started a Stage Quiz",
  quiz_submit: "Submitted a Stage Quiz",
  module_complete: "Finished a Stage’s lessons",
  level_start: "Started a Level",
  certificate_issue: "Certificate issued",
  video_progress: "Watched part of the film",
  profile_update: "Updated their profile",
};

export function StudentView({
  student,
  catalogue,
  rule,
  activity,
}: {
  student: StudentRecord;
  catalogue: Catalogue;
  /** The current Eligibility Rule, or null before one is saved. */
  rule: EligibilityRule | null;
  activity: ActivityEvent[];
}) {
  const stagesTotal = catalogue.reduce((n, l) => n + l.stages.length, 0);
  const passed = stagesPassed(student);
  const certs = liveCertificates(student);
  const sitting = latestSitting(student);
  const first = student.sittings.some((s) => s.sittingNo === 1);
  const cur = currentLevel(student, catalogue);
  const stateText =
    cur.kind === "awaiting" ? "Awaiting first Sitting" : cur.kind === "complete" ? "All Levels complete" : `In progress on ${cur.title}`;

  /* The Stage they are up to: the first not passed, once Sitting 1 has opened them. */
  const allStages = catalogue.flatMap((l) => l.stages);
  const nextStage = first ? (allStages.find((s) => !student.stages[s.slug]?.passedAt)?.slug ?? null) : null;

  const held = heldFlags(student);
  const eligible = student.signal?.eligible ?? null;
  const needed = rule ? rule.requiredFlags.filter((f) => !held.includes(f)) : [];

  return (
    <>
      <p className="mb-3.5">
        <Link
          href="/admin/students"
          className="inline-flex min-h-11 items-center gap-1.5 text-[0.9375rem] font-medium text-teal-ink underline-offset-[3px] hover:underline"
        >
          <Icon name="back" className="size-4" />
          Students
        </Link>
      </p>

      <div className="mb-5 flex items-center gap-4">
        <span
          aria-hidden="true"
          className="grid size-[60px] shrink-0 place-items-center rounded-full bg-teal font-display text-lg font-bold leading-none text-navy"
        >
          {initials(student.name)}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-[1.75rem] font-bold leading-tight tracking-[-0.01em] text-navy">{student.name}</h1>
          <p className="mt-1 text-sm text-grey">
            Signed up {formatDate(student.signedUpAt)} · {stateText} · Last active {formatDate(student.lastActiveAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
        <StatCard label="Stages passed" value={String(passed)} unit={`of ${stagesTotal}`} sub="Stage Quizzes passed" icon="book" tint="teal" />
        <StatCard label="Certificates" value={String(certs.length)} unit={`of ${catalogue.length}`} sub="One per Level" icon="award" tint="pink" />
        <StatCard label="Baseline Sittings" value={String(student.sittings.length)} unit="of 4" sub="Taken so far" icon="clock" tint="teal" />
        <StatCard
          label="Latest Baseline"
          value={sitting ? formatPct(sitting.totalPct) : "Not taken"}
          unit={sitting ? `${sitting.totalScore} of ${sitting.totalMax}` : undefined}
          sub={sitting ? `Sitting ${sitting.sittingNo}` : "No Sitting yet"}
          icon="chart"
          tint="pink"
        />
      </div>

      <div className="mt-4">
        <Notice icon="shield">
          <span className="font-medium">Nerve Center eligibility:</span>{" "}
          {eligible === null || !student.signal ? (
            "not evaluated yet."
          ) : (
            <>
              {eligible ? "reads as eligible" : "does not yet read as eligible"} under rule version {student.signal.ruleVersion}, evaluated{" "}
              {formatDate(student.signal.evaluatedAt)}.
              {!eligible && rule && needed.length > 0 ? (
                <> Still needed: {needed.map((f) => flagLabel(f, catalogue)).join(", ")}.</>
              ) : null}
            </>
          )}
        </Notice>
      </div>

      <h2 className="mb-3 mt-6 font-display text-[1.375rem] font-bold leading-tight text-navy">Levels and Stages</h2>
      {catalogue.map((level) => {
        const done = level.stages.filter((s) => student.stages[s.slug]?.passedAt).length;
        const completedAt = student.levelCompletedAt[level.slug];
        const certificate =
          certs.find((c) => c.levelSlug === level.slug) ??
          student.certificates.find((c) => c.levelSlug === level.slug) ??
          null;
        const onThisLevel = nextStage !== null && level.stages.some((s) => s.slug === nextStage);

        const status = completedAt
          ? { tone: "done" as const, icon: "award" as const, label: certificate && !certificate.revokedAt ? "Certificate issued" : "Level complete" }
          : done > 0 || onThisLevel
            ? { tone: "progress" as const, icon: "clock" as const, label: "In progress" }
            : { tone: "none" as const, icon: "lock" as const, label: "Not started" };

        const stages: LevelCardStage[] = level.stages.map((st) => {
          const rec = student.stages[st.slug];
          const latest = rec?.latest;
          const attempt = latest ? `Latest attempt ${latest.score} of ${latest.max}` : null;
          let state: RailState;
          let detail: React.ReactNode;
          if (rec?.passedAt) {
            state = "passed";
            detail = (
              <>
                <span className="font-medium text-navy">Passed {formatShortDate(rec.passedAt)}</span>
                {attempt ? (
                  <>
                    <br />
                    {attempt}
                    {latest && !latest.passed ? ", not passed. The Stage stays complete." : ""}
                  </>
                ) : null}
              </>
            );
          } else if (!first) {
            state = "locked";
            detail = "Opens after the first Sitting";
          } else if (st.slug === nextStage) {
            state = "current";
            detail = attempt ? (
              <>
                <span className="font-medium text-navy">Not passed yet</span>
                <br />
                {attempt}, not passed
              </>
            ) : (
              <>
                <span className="font-medium text-navy">Next up</span>
                <br />
                Not attempted
              </>
            );
          } else {
            state = "todo";
            detail = attempt ? `${attempt}, not passed` : "Not attempted";
          }
          return { key: st.slug, title: st.title, state, detail };
        });

        return (
          <LevelCard
            key={level.slug}
            title={level.title}
            status={status}
            passed={done}
            total={level.stages.length}
            stages={stages}
            footer={
              certificate
                ? {
                    icon: "award",
                    text: (
                      <>
                        <span className="font-medium text-navy">
                          Certificate {certificate.revokedAt ? "revoked" : `issued ${formatDate(certificate.issuedAt)}`}
                        </span>
                        , public ID <span className="font-mono text-[0.8125rem] text-navy">{certificate.code}</span>
                      </>
                    ),
                  }
                : { icon: "lock", text: "No Certificate yet. It is issued when every Stage Quiz in this Level is passed." }
            }
          />
        );
      })}

      <Panel
        title="Baseline Sittings"
        lede="Up to four, on a fixed schedule. Each stores its scores by Level, never the answers."
        className="mt-6"
      >
        <DataTable
          caption={`${student.name}: Baseline Sittings, with Improvement by Level`}
          minWidth="40rem"
          columns={[
            { key: "s", header: "Sitting", nowrap: true },
            { key: "t", header: "Taken", nowrap: true },
            ...catalogue.map((l) => ({ key: l.slug, header: l.title, align: "right" as const })),
            { key: "tot", header: "Total", align: "right" as const },
          ]}
          rows={[
            ...[1, 2, 3, 4].map((slot) => {
              const t = student.sittings.find((x) => x.sittingNo === slot);
              const name = `${slot}. ${SITTING_SLOTS[slot - 1]}`;
              if (t) {
                return {
                  key: `s${slot}`,
                  cells: [
                    name,
                    formatShortDate(t.submittedAt),
                    ...catalogue.map((l) => {
                      const s = t.levelScores[l.slug];
                      return s ? (
                        <span key={l.slug}>
                          {percent(s.score, s.max)}%<CellSub>{s.score} of {s.max}</CellSub>
                        </span>
                      ) : (
                        <span key={l.slug} className="text-grey">
                          n/a
                        </span>
                      );
                    }),
                    <span key="tot">
                      <span className="font-medium text-navy">{t.totalPct}%</span>
                      <CellSub>{t.totalScore} of {t.totalMax}</CellSub>
                    </span>,
                  ],
                };
              }
              const owed = slot === 1 ? true : !!student.levelCompletedAt[catalogue[slot - 2]?.slug ?? ""];
              return {
                key: `s${slot}`,
                cells: [
                  name,
                  {
                    span: catalogue.length + 2,
                    content: (
                      <span className="text-grey">
                        {slot === 1
                          ? "Not taken yet. Stage content stays closed until it is."
                          : owed
                            ? "Offered, not taken. Later Sittings are never required."
                            : `Not yet owed. It follows completing ${catalogue[slot - 2]?.title ?? "a Level"}.`}
                      </span>
                    ),
                  },
                ],
              };
            }),
            {
              key: "imp",
              cells: [
                "Improvement",
                <span key="d" className="block max-w-[14rem] whitespace-normal text-xs text-grey">
                  Sitting after the Level, against Sitting 1
                </span>,
                ...catalogue.map((l) => {
                  const imp = levelImprovement(student.sittings, l.slug, student.levelCompletedAt[l.slug] ?? null);
                  return imp ? (
                    <span key={l.slug} className="font-medium text-navy">
                      {formatPoints(imp.change)}
                    </span>
                  ) : (
                    <span key={l.slug} className="text-grey">
                      n/a
                    </span>
                  );
                }),
                <span key="e" />,
              ],
            },
          ]}
        />
      </Panel>

      <Panel
        title="Recent activity"
        lede="The latest things this Student did on the dashboard. No device or location is recorded."
        className="mt-4"
      >
        {activity.length === 0 ? (
          <p className="text-sm text-grey">No activity recorded yet.</p>
        ) : (
          <DataTable
            caption={`${student.name}: recent dashboard activity`}
            minWidth="22rem"
            columns={[
              { key: "w", header: "What" },
              { key: "d", header: "When", align: "right", nowrap: true },
            ]}
            rows={activity.map((e, i) => ({
              key: `${i}-${e.at.getTime()}`,
              cells: [
                <span key="w" className="font-normal text-navy">
                  {EVENT_WORDS[e.type] ?? e.type}
                  {e.stage ? <CellSub>{e.stage}</CellSub> : null}
                </span>,
                formatShortDate(e.at),
              ],
            }))}
          />
        )}
      </Panel>
    </>
  );
}
