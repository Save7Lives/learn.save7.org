import { Icon } from "@/components/ui/icons";
import { Notice, PageHeader, Panel } from "@/components/portal/Panel";
import { DataTable } from "@/components/portal/DataTable";
import { flagLabel, heldFlags, eligibleCount, type Catalogue, type EligibilityRule, type StudentRecord } from "@/lib/admin/model";
import { levelFlag } from "@/lib/admin/flags";
import { formatShortDate } from "@/lib/admin/format";
import { RuleEditor } from "./RuleEditor";
import type { RuleFormState } from "@/app/admin/eligibility/actions";

/**
 * The Eligibility Rule screen (#72, #84): the current rule, an editor that saves a
 * new version, and the version history. A rule is data, never edited in place, so
 * the history is every version ever saved.
 */

export const VersionPill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-pill bg-navy px-2.5 py-[3px] font-display text-xs font-bold uppercase leading-tight tracking-[0.06em] text-white">
    {children}
  </span>
);

export function FlagChips({ flags, catalogue }: { flags: string[]; catalogue: Catalogue }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
      {flags.map((f) => (
        <li
          key={f}
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-line bg-teal-50 py-1 pl-2 pr-2.5 text-[0.8125rem] font-medium text-navy"
        >
          <Icon name="check" className="size-3.5 shrink-0 stroke-[2.25] text-teal-ink" />
          {flagLabel(f, catalogue)}
        </li>
      ))}
    </ul>
  );
}

export function RuleView({
  catalogue,
  students,
  rules,
  saved,
  action,
}: {
  catalogue: Catalogue;
  students: StudentRecord[];
  /** Every version, newest first. */
  rules: EligibilityRule[];
  /** The version just saved, from the redirect. */
  saved: number | null;
  action?: (previous: RuleFormState, formData: FormData) => Promise<RuleFormState>;
}) {
  const current = rules[0] ?? null;

  return (
    <>
      <PageHeader
        title="Eligibility rule"
        lede="Decides which Students read as eligible for Nerve Center. Editing creates a new version and never changes an old one."
      />

      {saved !== null ? (
        <div className="mb-4">
          <Notice icon="check-circle" role="status">
            Saved as version {saved}. Earlier versions are kept in the history below.
          </Notice>
        </div>
      ) : null}

      <div className="grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel
            title="Current rule"
            aside={current ? <VersionPill>Version {current.version}</VersionPill> : null}
            lede={
              current
                ? `Created ${formatShortDate(current.createdAt)}${current.createdByName ? ` by ${current.createdByName}` : ""}.`
                : "No rule has been saved yet."
            }
          >
            {current ? (
              <div className="flex flex-col gap-3">
                <FlagChips flags={current.requiredFlags} catalogue={catalogue} />
                <p className="font-display text-[2rem] font-extrabold leading-tight text-navy">
                  {eligibleCount(students)}{" "}
                  <span className="font-sans text-[0.9375rem] font-medium text-grey">
                    of {students.length} Students read as eligible
                  </span>
                </p>
              </div>
            ) : (
              <Notice icon="info">Until a rule is saved, no one reads as eligible.</Notice>
            )}
          </Panel>

          <Panel title="Version history">
            <DataTable
              caption="Every version of the Eligibility Rule, newest first"
              minWidth="34rem"
              empty="No versions yet."
              columns={[
                { key: "v", header: "Version", nowrap: true },
                { key: "f", header: "Required flags" },
                { key: "b", header: "Created by", nowrap: true },
                { key: "c", header: "Created", nowrap: true },
              ]}
              rows={rules.map((r, i) => ({
                key: String(r.version),
                cells: [
                  <span key="v" className="inline-flex items-center gap-2">
                    {r.version}
                    {i === 0 ? <VersionPill>Current</VersionPill> : null}
                  </span>,
                  <FlagChips key="f" flags={r.requiredFlags} catalogue={catalogue} />,
                  <span key="b" className="font-normal text-navy">
                    {r.createdByName ?? "Unknown"}
                  </span>,
                  <span key="c" className="font-normal text-navy">
                    {formatShortDate(r.createdAt)}
                  </span>,
                ],
              }))}
            />
          </Panel>
        </div>

        <Panel
          title="Edit the rule"
          lede="A Student reads as eligible when every flag below is true. The rule never reads Baseline scores or engagement."
        >
          <RuleEditor
            options={catalogue.map((l) => ({ flag: levelFlag(l.slug), label: `${l.title} Level complete` }))}
            current={current ? { version: current.version, flags: current.requiredFlags } : null}
            held={students.map(heldFlags)}
            action={action}
          />
        </Panel>
      </div>
    </>
  );
}
