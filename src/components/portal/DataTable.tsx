import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icons";
import { cx } from "@/components/ui/primitives";

/**
 * The Portal data table (#72, #84). Only the table scrolls sideways, inside its own
 * panel, so the page itself never does. A row can open a page: its first cell holds
 * the one real link and a stretched pseudo-element makes the whole row the target,
 * so keyboard and screen-reader users get a single link per row, not two.
 */

export type Column = {
  key: string;
  header: ReactNode;
  /** Visually hidden header, for a column with no title (the open arrow). */
  srOnly?: boolean;
  align?: "right";
  nowrap?: boolean;
};

/** A cell that runs across several columns: an explanation in place of per-column figures. */
export type SpanCell = { span: number; content: ReactNode };
const isSpan = (c: ReactNode | SpanCell): c is SpanCell =>
  typeof c === "object" && c !== null && "span" in c && "content" in c;

export type Row = {
  key: string;
  cells: Array<ReactNode | SpanCell>;
  /** Makes the first cell the row's link. */
  href?: string;
  linkLabel?: string;
};

export function DataTable({
  caption,
  columns,
  rows,
  empty = "Nothing to show.",
  minWidth = "44rem",
}: {
  caption: string;
  columns: Column[];
  rows: Row[];
  empty?: ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm" style={{ minWidth }}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cx(
                  "relative border-b border-line px-3 py-2.5 font-display text-xs font-bold uppercase leading-snug tracking-[0.05em] text-grey",
                  c.align === "right" && "text-right",
                )}
              >
                {c.srOnly ? <span className="sr-only">{c.header}</span> : c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-2 py-7 text-center text-grey">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.key}
                className={cx("relative border-b border-line last:border-b-0", row.href && "[transform:translateZ(0)]", row.href && "hover:bg-teal-50")}
              >
                {(() => {
                  let at = 0;
                  return row.cells.map((raw) => {
                    const span = isSpan(raw) ? raw.span : 1;
                    const cell = isSpan(raw) ? raw.content : raw;
                    const col = columns[at];
                    const first = at === 0;
                    at += span;
                    return (
                      <td
                        key={col.key}
                        colSpan={span > 1 ? span : undefined}
                        className={cx(
                          "px-3 py-3 align-middle",
                          col.align === "right" && span === 1 && "text-right",
                          col.nowrap && "whitespace-nowrap",
                          first && "font-medium text-navy",
                        )}
                      >
                        {first && row.href ? (
                          <Link
                            href={row.href}
                            aria-label={row.linkLabel}
                            className="text-navy no-underline underline-offset-[3px] after:absolute after:inset-0 after:content-[''] hover:underline"
                          >
                            {cell}
                          </Link>
                        ) : (
                          cell
                        )}
                      </td>
                    );
                  });
                })()}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/** The open arrow at the end of a linked row. Decorative: the row's link names it. */
export function OpenArrow() {
  return <Icon name="arrow" className="size-4 text-teal-ink" />;
}

/** A second line under a cell value: the count beside a rate, the Sitting beside a score. */
export function CellSub({ children }: { children: ReactNode }) {
  return <span className="block text-xs text-grey">{children}</span>;
}
