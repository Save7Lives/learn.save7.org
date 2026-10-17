import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icons";
import { cx } from "@/components/ui/primitives";
import { PortalCard, StatusPill } from "./Portal";

/**
 * Portal pieces beyond the stat card and status pill (#72, #84), shared with My
 * progress (#71): a panel with a heading, lede and note, a notice, a meter row, the
 * eyebrow-and-title page header and the figure rows of Improvement.
 */

/** A white card with a heading, an optional lede under it and an optional note at the foot. */
export function Panel({
  title,
  aside,
  lede,
  note,
  className,
  children,
}: {
  title: string;
  /** Beside the heading: a version pill, a count. */
  aside?: ReactNode;
  lede?: ReactNode;
  note?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <PortalCard as="section" aria-label={title} className={cx("min-w-0 sm:px-[22px] sm:py-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-3.5 gap-y-2.5">
        <h2 className="font-display text-lg font-bold leading-snug text-navy">{title}</h2>
        {aside}
      </div>
      {lede ? <p className="mb-3.5 mt-0.5 max-w-[70ch] text-sm leading-snug text-grey">{lede}</p> : null}
      {children}
      {note ? (
        <p className="mt-3.5 border-t border-line pt-3 text-[0.8125rem] leading-snug text-grey">{note}</p>
      ) : null}
    </PortalCard>
  );
}

/** A teal-tint notice with an icon; `tone="warn"` is the pink tint. Both carry words. */
export function Notice({
  tone = "info",
  icon,
  children,
  role,
}: {
  tone?: "info" | "warn";
  icon: IconName;
  children: ReactNode;
  role?: "status";
}) {
  return (
    <div
      role={role}
      className={cx(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        tone === "warn" ? "border-pink-line bg-pink-50" : "border-teal-line bg-teal-50",
      )}
    >
      <Icon name={icon} className={cx("mt-px size-5 shrink-0", tone === "warn" ? "text-pink" : "text-teal-ink")} />
      <span className="text-navy">{children}</span>
    </div>
  );
}

/** "Only 4 Students in this view": a pink status pill and what it means. */
export function SmallViewNotice({ n }: { n: number }) {
  return (
    <p className="mb-4 flex flex-wrap items-center gap-2">
      <StatusPill tone="warn" icon="alert">
        Only {n} Student{n === 1 ? "" : "s"} in this view
      </StatusPill>
      <span className="text-sm text-grey">Rates swing a lot at this size. Read the counts beside them.</span>
    </p>
  );
}

/** The Admin page header: eyebrow, title, lede, and actions on the right. */
export function PageHeader({
  title,
  lede,
  eyebrow = "Admin",
  children,
}: {
  title: string;
  lede?: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3.5">
      <div>
        <p className="font-display text-[0.8125rem] font-bold uppercase leading-snug tracking-[0.07em] text-pink">
          {eyebrow}
        </p>
        <h1 className="font-display text-[1.75rem] font-bold leading-tight tracking-[-0.01em] text-navy">{title}</h1>
        {lede ? <p className="mt-1.5 max-w-[62ch] text-sm leading-snug text-grey">{lede}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-3">{children}</div> : null}
    </div>
  );
}

/** A 0 to 100 bar that is a labelled image, so the figure beside it is the real signal. */
export function Meter({ value, label, className }: { value: number; label: string; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div role="img" aria-label={label} className={cx("h-2 overflow-hidden rounded-pill bg-line", className)}>
      <div className="h-full rounded-pill bg-teal-ink" style={{ width: `${v}%` }} />
    </div>
  );
}

/** A small uppercase group heading inside a panel. */
export function GroupHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 mt-4 font-display text-xs font-bold uppercase leading-snug tracking-[0.05em] text-grey first:mt-1">
      {children}
    </h3>
  );
}

/** One Level's figure row: name, the big figure, and what it is an average of. */
export function FigureRow({ name, figure, sub }: { name: string; figure: string; sub: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-3.5 gap-y-0.5 border-b border-line py-3 last:border-b-0">
      <span className="font-display text-base font-bold text-navy">{name}</span>
      <span className="text-right font-display text-2xl font-extrabold leading-tight text-navy">{figure}</span>
      <span className="col-span-2 text-[0.8125rem] text-grey">{sub}</span>
    </div>
  );
}
