import Link from "next/link";
import { BaselineTrend, type TrendData } from "@/components/course/BaselineTrend";
import { Icon } from "@/components/ui/icons";
import { StatCard, PortalCard } from "@/components/portal/Portal";
import { FilterBar, FilterGroup } from "@/components/portal/FilterChips";
import { FigureRow, GroupHeading, Meter, Notice, PageHeader, Panel, SmallViewNotice } from "@/components/portal/Panel";
import { CellSub, DataTable } from "@/components/portal/DataTable";
import { SIGNED_UP_OPTIONS, SITTING_SLOTS, SMALL_VIEW, type Indicators, type MissedQuestion, type SignedUpWindow } from "@/lib/admin/model";
import { adminHref, formatPct, formatPoints } from "@/lib/admin/format";

/**
 * Overview (#72, #84): #18's five Growth Indicators, two supporting readouts (Stage
 * drop-off and the most missed questions, from #82) and a read-only eligibility card.
 * Presentational: the page fetches and slices, this draws.
 */

export type EligibilityCard = {
  version: number | null;
  flagLabels: string[];
  eligible: number;
  of: number;
};

export function OverviewView({
  indicators,
  totalStudents,
  signedUp,
  eligibility,
  missed,
}: {
  indicators: Indicators;
  totalStudents: number;
  signedUp: SignedUpWindow;
  eligibility: EligibilityCard;
  missed: MissedQuestion[];
}) {
  const n = indicators.students;
  const link = (v: string) => adminHref("/admin", { signed: v }, { signed: "all" });

  const trend: TrendData = {
    slots: SITTING_SLOTS.map((name, i) => {
      const t = indicators.trend[i];
      return {
        name,
        status: t.students === 0 ? "Not taken yet" : `${t.students} Student${t.students === 1 ? "" : "s"}`,
        taken: t.students > 0,
        offered: false,
      };
    }),
    series: [
      {
        slug: "average",
        title: "Average total score",
        values: indicators.trend.map((t) => (t.meanPct === null ? null : Math.round(t.meanPct))),
      },
    ],
    summary: `Average Baseline total at each Sitting: ${indicators.trend
      .map((t, i) => `${SITTING_SLOTS[i]}, ${t.meanPct === null ? "no Students" : `${Math.round(t.meanPct)}% across ${t.students} Students`}`)
      .join("; ")}.`,
  };

  return (
    <>
      <PageHeader title="Overview" lede="How the Course is going, read from every Student’s Progress Record." />

      <FilterBar count={n} total={totalStudents}>
        <FilterGroup
          label="Signed up"
          current={signedUp}
          options={SIGNED_UP_OPTIONS.map(([value, label]) => ({ value, label, href: link(value) }))}
        />
      </FilterBar>
      {n > 0 && n < SMALL_VIEW ? <SmallViewNotice n={n} /> : null}

      {n === 0 ? (
        <PortalCard className="py-7 text-center text-grey">
          No Students match this view. Widen the filter above.
        </PortalCard>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
            <StatCard
              label="Students"
              value={String(n)}
              sub={`${indicators.signedUpLast30} signed up in the last 30 days`}
              icon="users"
              tint="pink"
            />
            {indicators.completion.map((c) => (
              <StatCard
                key={c.slug}
                label={`Completed ${c.title}`}
                value={formatPct(c.pct)}
                sub={`${c.done} of ${c.of} Students`}
                icon="award"
                tint="teal"
              />
            ))}
          </div>

          <div className="mt-4 grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <Panel
              title="Baseline trend"
              lede="Average total score at each Sitting, as a percentage of the 20 questions."
              note="Sittings after the first are optional and each is taken by fewer Students, so the points are not the same group of Students."
            >
              <BaselineTrend data={trend} />
              <div className="mt-2">
                <DataTable
                  caption="Baseline trend as a table"
                  minWidth="22rem"
                  columns={[
                    { key: "s", header: "Sitting" },
                    { key: "n", header: "Students", align: "right" },
                    { key: "a", header: "Average total", align: "right" },
                  ]}
                  rows={indicators.trend.map((t) => ({
                    key: String(t.slot),
                    cells: [`${t.slot}. ${SITTING_SLOTS[t.slot - 1]}`, t.students, formatPct(t.meanPct)],
                  }))}
                />
              </div>
            </Panel>

            <Panel
              title="Improvement by Level"
              lede="Average change in that Level’s Baseline sub-score, from the first Sitting to the first Sitting taken after completing the Level."
            >
              {indicators.improvement.map((i) => (
                <FigureRow
                  key={i.slug}
                  name={i.title}
                  figure={formatPoints(i.meanChange)}
                  sub={
                    i.students
                      ? `Average of ${i.students} Student${i.students === 1 ? "" : "s"} who re-sat after completing it`
                      : "No one has re-sat after completing this Level yet"
                  }
                />
              ))}
            </Panel>
          </div>

          <div className="mt-4 grid items-start gap-4 min-[1100px]:grid-cols-2">
            <Panel
              title="Stage Quiz pass rate"
              lede="Of the Students who attempted each Stage Quiz, how many have passed it."
            >
              {indicators.stageQuiz.map((l) => (
                <div key={l.slug}>
                  <GroupHeading>{l.title}</GroupHeading>
                  {l.stages.map((s, i) => (
                    <StageRow
                      key={s.slug}
                      n={i + 1}
                      title={s.title}
                      sub={s.attempted ? `${s.passed} passed of ${s.attempted} who attempted` : "No one has attempted it yet"}
                      value={s.passPct}
                      label={`${s.title}: ${s.passed} of ${s.attempted} passed`}
                    />
                  ))}
                </div>
              ))}
            </Panel>

            <Panel
              title="Stage drop-off"
              lede="Of the Students who opened a Stage, how many have not passed its quiz yet. Some are still working on it."
            >
              {indicators.stageQuiz.map((l) => (
                <div key={l.slug}>
                  <GroupHeading>{l.title}</GroupHeading>
                  {l.stages.map((s, i) => (
                    <StageRow
                      key={s.slug}
                      n={i + 1}
                      title={s.title}
                      sub={s.started ? `${s.notPassed} of ${s.started} who opened it have not passed` : "No one has opened it yet"}
                      value={s.started ? (100 * s.notPassed) / s.started : null}
                      label={`${s.title}: ${s.notPassed} of ${s.started} not passed yet`}
                    />
                  ))}
                </div>
              ))}
            </Panel>
          </div>

          <div className="mt-4 grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Panel
              title="Most commonly missed questions"
              lede="The five Stage Quiz questions missed most often, across every Student. A question needs at least three answers to be listed."
            >
              {missed.length === 0 ? (
                <p className="text-sm text-grey">No question has enough answers to list yet.</p>
              ) : (
                <DataTable
                  caption="Most commonly missed Stage Quiz questions"
                  minWidth="30rem"
                  columns={[
                    { key: "q", header: "Question" },
                    { key: "m", header: "Missed", align: "right", nowrap: true },
                  ]}
                  rows={missed.map((q) => ({
                    key: q.id,
                    cells: [
                      <span key="q" className="block font-normal text-navy">
                        {q.prompt}
                        {q.stage ? <CellSub>{q.stage}</CellSub> : null}
                      </span>,
                      <span key="m" className="font-display text-base font-bold text-navy">
                        {q.missedPct}%<CellSub>{q.missed} of {q.answered}</CellSub>
                      </span>,
                    ],
                  }))}
                />
              )}
            </Panel>

            <Panel
              title="Nerve Center eligibility"
              aside={
                eligibility.version !== null ? (
                  <span className="inline-flex items-center rounded-pill bg-navy px-2.5 py-[3px] font-display text-xs font-bold uppercase leading-tight tracking-[0.06em] text-white">
                    Version {eligibility.version}
                  </span>
                ) : null
              }
              lede="Who currently reads as eligible under the Eligibility Rule."
            >
              {eligibility.version === null ? (
                <Notice icon="info">No Eligibility Rule has been saved yet, so no one reads as eligible.</Notice>
              ) : (
                <div className="flex flex-col gap-3">
                  <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                    {eligibility.flagLabels.map((f) => (
                      <li
                        key={f}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-teal-line bg-teal-50 py-1 pl-2 pr-2.5 text-[0.8125rem] font-medium text-navy"
                      >
                        <Icon name="check" className="size-3.5 shrink-0 stroke-[2.25] text-teal-ink" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <p className="font-display text-[2rem] font-extrabold leading-tight text-navy">
                    {eligibility.eligible}{" "}
                    <span className="font-sans text-[0.9375rem] font-medium text-grey">
                      of {eligibility.of} Students read as eligible
                    </span>
                  </p>
                  <Link
                    href="/admin/eligibility"
                    className="inline-flex items-center gap-1.5 text-[0.9375rem] font-medium text-teal-ink underline-offset-[3px] hover:underline"
                  >
                    Edit the rule
                    <Icon name="arrow" className="size-4" />
                  </Link>
                </div>
              )}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}

function StageRow({
  n,
  title,
  sub,
  value,
  label,
}: {
  n: number;
  title: string;
  sub: string;
  value: number | null;
  label: string;
}) {
  return (
    <div className="grid grid-cols-[28px_minmax(0,1fr)_3rem] items-center gap-x-3 gap-y-1 border-b border-line py-2 last:border-b-0 min-[640px]:grid-cols-[28px_minmax(0,1.5fr)_minmax(70px,1fr)_3rem]">
      <span className="inline-grid size-6 place-items-center rounded-full bg-teal font-display text-xs font-bold leading-none text-navy">
        {n}
      </span>
      <span className="text-sm font-medium leading-snug text-navy">
        {title}
        <span className="block text-xs font-normal text-grey">{sub}</span>
      </span>
      <Meter
        value={value ?? 0}
        label={label}
        className="col-span-2 col-start-2 row-start-2 min-[640px]:col-span-1 min-[640px]:col-start-3 min-[640px]:row-start-1"
      />
      <span className="text-right font-display text-[0.9375rem] font-bold text-navy min-[640px]:col-start-4">
        {formatPct(value)}
      </span>
    </div>
  );
}
