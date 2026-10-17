"use client";

import { useActionState, useState } from "react";
import { Notice } from "@/components/portal/Panel";
import { cx } from "@/components/ui/primitives";
import { readsEligible } from "@/lib/admin/flags";
import { saveEligibilityRuleAction, type RuleFormState } from "@/app/admin/eligibility/actions";

/**
 * The Eligibility Rule editor (#72, #84): a checkbox per Level-complete flag, the
 * count that would read as eligible before anything is saved, and a save that always
 * makes version N+1. The count is worked out here from each Student's held flags
 * (names and ids never reach the browser), the same AND the database evaluator uses.
 */
export function RuleEditor({
  options,
  current,
  held,
  action = saveEligibilityRuleAction,
}: {
  options: Array<{ flag: string; label: string }>;
  current: { version: number; flags: string[] } | null;
  /** One list of held flags per Student, no identity. */
  held: string[][];
  /** The server action; a test page passes a stub. */
  action?: (previous: RuleFormState, formData: FormData) => Promise<RuleFormState>;
}) {
  const [state, submit, pending] = useActionState(action, undefined);
  const [selected, setSelected] = useState<string[]>(current?.flags ?? []);

  const same =
    current !== null && selected.length === current.flags.length && selected.every((f) => current.flags.includes(f));
  const empty = selected.length === 0;
  const total = held.length;
  const would = held.filter((h) => readsEligible(h, selected)).length;
  const now = current ? held.filter((h) => readsEligible(h, current.flags)).length : 0;
  const next = (current?.version ?? 0) + 1;

  const toggle = (flag: string) =>
    setSelected((s) => (s.includes(flag) ? s.filter((f) => f !== flag) : [...s, flag]));

  return (
    <form action={submit} className="flex flex-col gap-4">
      <input type="hidden" name="baseVersion" value={current?.version ?? ""} />

      <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
        <legend className="sr-only">Required flags</legend>
        {options.map((o) => {
          const on = selected.includes(o.flag);
          return (
            <label
              key={o.flag}
              className={cx(
                "flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] px-3.5 py-3",
                on ? "border-navy bg-teal-50" : "border-line-strong bg-white",
              )}
            >
              <input
                type="checkbox"
                name="flag"
                value={o.flag}
                checked={on}
                onChange={() => toggle(o.flag)}
                className="mt-0.5 size-5 shrink-0 accent-pink"
              />
              <span>
                <span className="block font-medium text-navy">{o.label}</span>
                <span className="block text-[0.8125rem] text-grey">A Student must have this flag to read as eligible.</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      {empty ? (
        <Notice tone="warn" icon="alert" role="status">
          A rule with no flags would make every Student eligible. Pick at least one.
        </Notice>
      ) : (
        <Notice icon="chart" role="status">
          <span className="font-medium">
            {would} of {total}
          </span>{" "}
          Students would read as eligible under this selection
          {same || !current ? "" : `, against ${now} under version ${current.version}`}. All flags must be true.
        </Notice>
      )}

      {state?.error ? (
        <Notice tone="warn" icon="alert" role="status">
          {state.error}
        </Notice>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={same || empty || pending}
          className="inline-flex min-h-11 items-center rounded-[10px] bg-pink px-4 text-sm font-semibold text-white hover:bg-navy disabled:cursor-not-allowed disabled:border-2 disabled:border-line disabled:bg-white disabled:text-grey disabled:hover:bg-white"
        >
          {pending ? "Saving…" : `Save as version ${next}`}
        </button>
        <span className="text-sm text-grey">
          {same
            ? "Change a flag to save a new version."
            : empty
              ? "Pick at least one flag to save."
              : current
              ? `Saving adds version ${next}. Version ${current.version} is kept as it is.`
              : "Saving adds version 1."}
        </span>
      </div>
    </form>
  );
}
