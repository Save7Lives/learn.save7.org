import type { ComponentProps, ReactNode } from "react";

import { Icon, type IconName } from "@/components/ui/icons";
import { cx } from "@/components/ui/primitives";

/**
 * Shared parts of the sign-in, register and enrolment re-cut (#70, built in #26),
 * written to be reused: the privacy page (#35) takes the disclosure card, the
 * callout card, the icon chip and the stacked table from here rather than drawing
 * its own.
 *
 * Rules that hold for all of them. Coloured text is only legal on white, pink-50 and
 * teal-50 (never on a -100 or `line`). Emphasis is Lexend 500, never bold. Navy is
 * text, a ring or an outline here, never a surface. Icons are decorative: the words
 * beside them carry the meaning.
 */

// --- Icon chip -------------------------------------------------------------

const CHIP_TONES = {
  teal: "bg-teal-100 text-teal-ink",
  pink: "bg-pink-100 text-pink",
  neutral: "bg-line text-navy",
} as const;

/** An icon in a tinted circle (or rounded square). Carries an icon only, never text. */
export function IconChip({
  icon,
  tone = "teal",
  shape = "circle",
  className,
}: {
  icon: IconName;
  tone?: keyof typeof CHIP_TONES;
  shape?: "circle" | "square";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "grid shrink-0 place-items-center",
        shape === "circle" ? "size-12 rounded-full" : "size-10 rounded-xl",
        CHIP_TONES[tone],
        className,
      )}
    >
      <Icon name={icon} />
    </span>
  );
}

// --- Field with helper and error --------------------------------------------

/** An error under the field it belongs to: alert icon, then the words, in `incorrect`. */
export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-incorrect">
      <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

const INPUT_BASE =
  "block w-full min-h-12 rounded-[10px] bg-white px-3.5 py-2.5 text-base text-navy";

/**
 * A labelled input with an optional helper and an error beneath it. The error swaps
 * the 1.5px `line-strong` border for a 2px `incorrect` one and is announced.
 * `describedBy` adds ids (a shared note under a row of fields, say).
 */
export function Field({
  id,
  label,
  helper,
  error,
  describedBy,
  className,
  ...input
}: {
  id: string;
  label: string;
  helper?: ReactNode;
  error?: ReactNode;
  describedBy?: string;
} & Omit<ComponentProps<"input">, "id" | "className"> & { className?: string }) {
  const ids = [helper ? `${id}-help` : "", error ? `${id}-error` : "", describedBy ?? ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cx("mb-[18px]", className)}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids || undefined}
        className={cx(
          INPUT_BASE,
          error ? "border-2 border-incorrect" : "border-[1.5px] border-line-strong",
        )}
        {...input}
      />
      {helper ? (
        <p id={`${id}-help`} className="mt-1.5 text-sm text-grey">
          {helper}
        </p>
      ) : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </div>
  );
}

// --- Consent row -------------------------------------------------------------

/** A bordered row with a 22px pink checkbox. The error variant is a 2px `incorrect` border. */
export function ConsentRow({
  id,
  name,
  error,
  children,
}: {
  id: string;
  name: string;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div
        className={cx(
          "flex items-start gap-3 rounded-xl bg-white px-4 py-3.5 text-[0.9375rem] leading-normal text-grey",
          error ? "border-2 border-incorrect" : "border-[1.5px] border-line-strong",
        )}
      >
        <input
          type="checkbox"
          id={id}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-px size-[22px] shrink-0 accent-pink"
        />
        <label htmlFor={id} className="cursor-pointer">
          {children}
        </label>
      </div>
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </div>
  );
}

// --- Notices -----------------------------------------------------------------

/**
 * A problem that belongs to the whole form, not one field: a pink-50 card with a 1.5px
 * `incorrect` border and an alert icon. `lead` is the first sentence, at weight 500.
 * Children (a secondary button, say) follow it.
 */
export function ErrorNotice({
  lead,
  children,
  className,
}: {
  lead: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cx(
        "flex items-start gap-3 rounded-[14px] border-[1.5px] border-incorrect bg-pink-50 px-4 py-3.5 text-[0.9375rem] leading-normal text-navy",
        className,
      )}
    >
      <Icon name="alert" className="mt-0.5 size-5 shrink-0 text-incorrect" />
      <div>
        <span className="font-medium">{lead}</span>
        {children}
      </div>
    </div>
  );
}

/** A quiet teal-50 note with an icon. Links inside it are weight 500. */
export function TealNote({
  icon = "lock",
  children,
  className,
}: {
  icon?: IconName;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex items-start gap-3 rounded-[14px] border border-teal-line bg-teal-50 px-4 py-3.5 text-[0.9375rem] leading-normal text-grey [&_a]:font-medium",
        className,
      )}
    >
      <Icon name={icon} className="mt-0.5 size-5 shrink-0 text-teal-ink" />
      <div>{children}</div>
    </div>
  );
}

// --- Stepper -----------------------------------------------------------------

/**
 * A dotted stepper. Done is a teal fill and a check, the current step a 3px navy ring,
 * an upcoming step a `line-strong` ring. Written for two steps (enrolment) but takes
 * any number of labels.
 */
export function Stepper({
  steps,
  current,
  label,
  className,
}: {
  steps: string[];
  /** 1-based. */
  current: number;
  label: string;
  className?: string;
}) {
  return (
    <ol aria-label={label} className={cx("mb-[22px] flex list-none p-0", className)}>
      {steps.map((step, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "now" : "todo";
        return (
          <li
            key={step}
            aria-current={state === "now" ? "step" : undefined}
            className={cx(
              "relative flex flex-1 flex-col items-center gap-2 text-center text-sm",
              state === "now" ? "font-display font-bold text-navy" : "font-medium text-grey",
              i > 0 &&
                "before:absolute before:right-[calc(50%+22px)] before:top-[15px] before:w-[calc(100%-44px)] before:border-t-[3px] before:border-dotted before:border-line-strong",
            )}
          >
            <span
              className={cx(
                "relative grid size-8 place-items-center rounded-full font-display text-sm leading-none",
                state === "now" ? "font-bold" : "font-medium",
                state === "done" ? "bg-teal text-navy" : "bg-white",
                state === "now" && "border-[3px] border-navy text-navy",
                state === "todo" && "border-2 border-line-strong text-grey",
              )}
            >
              {state === "done" ? <Icon name="check" className="size-4" strokeWidth={2.5} /> : n}
            </span>
            {step}
          </li>
        );
      })}
    </ol>
  );
}

// --- Disclosure and callout cards ---------------------------------------------

/**
 * A teal-50 card that opens: icon and title in the summary, a chevron that turns.
 * Collapsed unless `open`. Inside, prose is grey and `<strong>` is navy at 500.
 */
export function DisclosureCard({
  title,
  icon = "shield",
  open,
  children,
  className,
}: {
  title: string;
  icon?: IconName;
  open?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details
      open={open}
      className={cx("group rounded-[14px] border border-teal-line bg-teal-50", className)}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3.5 text-base font-medium leading-snug text-navy [&::-webkit-details-marker]:hidden">
        <Icon name={icon} className="size-5 shrink-0 text-teal-ink" />
        <span>{title}</span>
        <Icon
          name="chev"
          className="ml-auto size-5 shrink-0 text-teal-ink transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="px-[18px] pb-4 text-[0.9375rem] leading-normal text-grey [&_strong]:font-medium [&_strong]:text-navy [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li+li]:mt-2">
        {children}
      </div>
    </details>
  );
}

/** A pink-50 callout with a chip on the left: for the one point a page must not miss. */
export function CalloutCard({
  icon = "eye",
  children,
  className,
}: {
  icon?: IconName;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex items-start gap-4 rounded-2xl border border-pink-line bg-pink-50 p-5 text-navy [&_p]:mb-2.5 [&_p:last-child]:mb-0 [&_strong]:font-medium",
        className,
      )}
    >
      <IconChip icon={icon} tone="pink" />
      <div>{children}</div>
    </div>
  );
}

// --- Stacked table -------------------------------------------------------------

/**
 * A plain table that stacks into labelled cards under 40rem (the pattern lessons use,
 * #58). The first column is the row header; every other cell carries its column's
 * name in `data-label`, which the stacked layout prints above it. Styles are
 * `.stacked-table` in globals.css.
 */
export function StackedTable({
  columns,
  rows,
  className,
}: {
  columns: string[];
  rows: ReactNode[][];
  className?: string;
}) {
  return (
    <table className={cx("stacked-table", className)}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c} scope="col">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((cells, r) => (
          <tr key={r}>
            {cells.map((cell, c) =>
              c === 0 ? (
                <th key={c} scope="row">
                  {cell}
                </th>
              ) : (
                <td key={c} data-label={columns[c]}>
                  {cell}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
