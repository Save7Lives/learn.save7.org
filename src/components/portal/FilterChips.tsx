import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/components/ui/primitives";
import { PortalCard } from "./Portal";

/**
 * Filter chips (#72, #84): links that carry the choice in the URL, so a filtered view
 * can be shared and survives a reload, and there is no client state to keep in step.
 * The chosen chip is navy with white text and a heavier weight, and says so with
 * `aria-current`, so it is never colour alone.
 */

export type ChipOption = { value: string; label: string; href: string };

export function FilterGroup({
  label,
  options,
  current,
}: {
  label: string;
  options: ChipOption[];
  current: string;
}) {
  const id = `fg-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div>
      <p id={id} className="mb-1.5 font-display text-xs font-bold uppercase leading-snug tracking-[0.05em] text-grey">
        {label}
      </p>
      <div role="group" aria-labelledby={id} className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = o.value === current;
          return (
            <Link
              key={o.value}
              href={o.href}
              scroll={false}
              aria-current={on ? "true" : undefined}
              className={cx(
                "inline-flex min-h-9 items-center rounded-pill border-[1.5px] px-3.5 text-sm no-underline",
                on
                  ? "border-navy bg-navy font-semibold text-white"
                  : "border-line-strong bg-white font-medium text-navy hover:bg-teal-50",
              )}
            >
              {o.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** The bar that holds the groups and the "x of N Students" count at its end. */
export function FilterBar({
  count,
  total,
  children,
}: {
  count: number;
  total: number;
  children: ReactNode;
}) {
  return (
    <PortalCard className="mb-4 flex flex-wrap items-end gap-x-7 gap-y-3.5 sm:px-[18px] sm:py-3.5">
      {children}
      <p className="ml-auto text-sm text-grey" aria-live="polite">
        <span className="font-semibold text-navy">{count}</span> of {total} Students
      </p>
    </PortalCard>
  );
}
