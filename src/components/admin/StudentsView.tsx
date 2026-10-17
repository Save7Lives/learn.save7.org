import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { PortalCard, StatusPill } from "@/components/portal/Portal";
import { FilterBar, FilterGroup } from "@/components/portal/FilterChips";
import { Meter, PageHeader, SmallViewNotice } from "@/components/portal/Panel";
import { CellSub, DataTable, OpenArrow } from "@/components/portal/DataTable";
import {
  PAGE_SIZE,
  SIGNED_UP_OPTIONS,
  SMALL_VIEW,
  currentLevel,
  latestSitting,
  liveCertificates,
  stagesPassed,
  type Catalogue,
  type SignedUpWindow,
  type StudentRecord,
} from "@/lib/admin/model";
import { adminHref, formatPct, formatShortDate } from "@/lib/admin/format";
import type { AdminRole } from "@/lib/constants";
import { AdminRoleButton } from "./AdminRoleButton";
import { AdminRoleMark } from "./AdminRoleMark";

/**
 * Students (#72, #84): everyone who has signed up, most recent first, from the
 * Progress Record only. The Role column marks Admins, and gives the Owner the
 * button that makes or removes one (T95). No email address, no date of birth and no "inactive" label:
 * "last active" is the one engagement figure, because an Admin has to see who has
 * gone quiet (#81).
 */

export type StudentsQuery = { q: string; signed: SignedUpWindow; level: string; page: number };

const DEFAULTS = { signed: "all", level: "any" };
const href = (p: Partial<StudentsQuery>, base: StudentsQuery) => {
  const m = { ...base, ...p };
  return adminHref(
    "/admin/students",
    { q: m.q, signed: m.signed, level: m.level, page: m.page > 1 ? m.page : undefined },
    DEFAULTS,
  );
};

export function CurrentLevelCell({ student, catalogue }: { student: StudentRecord; catalogue: Catalogue }) {
  const c = currentLevel(student, catalogue);
  if (c.kind === "awaiting")
    return (
      <StatusPill tone="none" icon="lock">
        Awaiting first Sitting
      </StatusPill>
    );
  if (c.kind === "complete")
    return (
      <StatusPill tone="done" icon="award">
        All complete
      </StatusPill>
    );
  return <>{c.title}</>;
}

export function EligiblePill({ student }: { student: StudentRecord }) {
  if (!student.signal)
    return (
      <StatusPill tone="none" icon="clock">
        Not evaluated
      </StatusPill>
    );
  return student.signal.eligible ? (
    <StatusPill tone="done" icon="check-circle">
      Eligible
    </StatusPill>
  ) : (
    <StatusPill tone="none" icon="clock">
      Not yet
    </StatusPill>
  );
}

export function StudentsView({
  catalogue,
  rows,
  matching,
  total,
  query,
  roles,
  canGrant,
}: {
  catalogue: Catalogue;
  /** This page's Students. */
  rows: StudentRecord[];
  /** How many match the filters and the search, across every page. */
  matching: number;
  total: number;
  query: StudentsQuery;
  /** Student id to role, for the Students who are Admins (T95). */
  roles: Record<string, AdminRole>;
  /** True for the Owner, who alone sees "Make admin" and "Remove admin". */
  canGrant: boolean;
}) {
  const stagesTotal = catalogue.reduce((n, l) => n + l.stages.length, 0);
  const pages = Math.max(1, Math.ceil(matching / PAGE_SIZE));
  const page = Math.min(query.page, pages);
  const from = matching === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, matching);

  const levelOptions = [
    { value: "any", label: "Any" },
    { value: "awaiting", label: "Awaiting first Sitting" },
    ...catalogue.map((l) => ({ value: l.slug, label: l.title })),
    { value: "complete", label: "All complete" },
  ];

  const pagerLink =
    "inline-flex min-h-10 items-center rounded-[10px] border-2 border-navy bg-white px-4 text-sm font-semibold text-navy no-underline hover:bg-line";
  const pagerOff =
    "inline-flex min-h-10 items-center rounded-[10px] border-2 border-line bg-white px-4 text-sm font-semibold text-grey";

  return (
    <>
      <PageHeader
        title="Students"
        lede="Everyone with an account, most recent signup first. Email addresses are not listed."
      >
        <form action="/admin/students" method="get" role="search" className="flex items-center gap-2">
          {query.signed !== "all" ? <input type="hidden" name="signed" value={query.signed} /> : null}
          {query.level !== "any" ? <input type="hidden" name="level" value={query.level} /> : null}
          <label className="flex min-h-11 min-w-0 items-center gap-2 rounded-[10px] border-[1.5px] border-line-strong bg-white px-3 text-grey focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-[3px] focus-within:outline-navy">
            <Icon name="search" className="size-5 shrink-0" />
            <span className="sr-only">Search Students by name</span>
            <input
              type="search"
              name="q"
              defaultValue={query.q}
              placeholder="Search Students"
              className="w-full min-w-0 border-0 bg-transparent text-[0.9375rem] text-navy outline-none placeholder:text-grey sm:w-56"
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-[10px] border-2 border-navy bg-white px-4 text-sm font-semibold text-navy hover:bg-line"
          >
            Search
          </button>
        </form>
      </PageHeader>

      <FilterBar count={matching} total={total}>
        <FilterGroup
          label="Signed up"
          current={query.signed}
          options={SIGNED_UP_OPTIONS.map(([value, label]) => ({ value, label, href: href({ signed: value, page: 1 }, query) }))}
        />
        <FilterGroup
          label="Current Level"
          current={query.level}
          options={levelOptions.map((o) => ({ ...o, href: href({ level: o.value, page: 1 }, query) }))}
        />
      </FilterBar>
      {matching > 0 && matching < SMALL_VIEW ? <SmallViewNotice n={matching} /> : null}

      <PortalCard as="section" aria-label="Students" className="min-w-0 sm:px-[22px] sm:py-5">
        <DataTable
          caption="Students, most recent signup first"
          minWidth="70rem"
          empty="No Students match."
          columns={[
            { key: "s", header: "Student" },
            { key: "ro", header: "Role", nowrap: true },
            { key: "su", header: "Signed up", nowrap: true },
            { key: "la", header: "Last active", nowrap: true },
            { key: "cl", header: "Current Level", nowrap: true },
            { key: "sp", header: "Stages passed", nowrap: true },
            { key: "lb", header: "Latest Baseline", nowrap: true },
            { key: "ce", header: "Certificates", align: "right", nowrap: true },
            { key: "el", header: "Nerve Center", nowrap: true },
            { key: "go", header: "Open", srOnly: true },
          ]}
          rows={rows.map((s) => {
            const sitting = latestSitting(s);
            const passed = stagesPassed(s);
            return {
              key: s.id,
              href: `/admin/students/${s.id}`,
              linkLabel: `${s.name}, open their Progress Record`,
              cells: [
                <span key="s" className="whitespace-nowrap">
                  {s.name}
                </span>,
                <span key="ro" className="inline-flex items-center gap-3">
                  {roles[s.id] ? <AdminRoleMark role={roles[s.id]} /> : <span className="font-normal text-grey">Student</span>}
                  {canGrant && roles[s.id] !== "owner" ? (
                    <AdminRoleButton studentId={s.id} studentName={s.name} isAdmin={roles[s.id] === "admin"} />
                  ) : null}
                </span>,
                formatShortDate(s.signedUpAt),
                formatShortDate(s.lastActiveAt),
                <CurrentLevelCell key="cl" student={s} catalogue={catalogue} />,
                <span key="sp" className="inline-flex items-center gap-2 whitespace-nowrap">
                  <Meter className="w-14" value={stagesTotal ? (100 * passed) / stagesTotal : 0} label={`${passed} of ${stagesTotal} Stages passed`} />
                  {passed} of {stagesTotal}
                </span>,
                sitting ? (
                  <span key="lb">
                    {formatPct(sitting.totalPct)}
                    <CellSub>
                      Sitting {sitting.sittingNo}, {sitting.totalScore} of {sitting.totalMax}
                    </CellSub>
                  </span>
                ) : (
                  <span key="lb" className="text-grey">
                    Not taken
                  </span>
                ),
                `${liveCertificates(s).length} of ${catalogue.length}`,
                <EligiblePill key="el" student={s} />,
                <OpenArrow key="go" />,
              ],
            };
          })}
        />
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-sm text-grey">
          <p>
            Showing {from} to {to} of {matching}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={href({ page: page - 1 }, query)} className={pagerLink} rel="prev">
                Previous
              </Link>
            ) : (
              <span className={pagerOff} aria-disabled="true">
                Previous
              </span>
            )}
            {page < pages ? (
              <Link href={href({ page: page + 1 }, query)} className={pagerLink} rel="next">
                Next
              </Link>
            ) : (
              <span className={pagerOff} aria-disabled="true">
                Next
              </span>
            )}
          </div>
        </div>
      </PortalCard>
    </>
  );
}
