import { Card, cx } from "@/components/ui/primitives";

/** Small building blocks shared by the admin screens. */

export function PageTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl uppercase tracking-tight text-ink">
        {title}
      </h1>
      {description ? (
        <p className="mt-1.5 max-w-2xl text-sm text-sand-600">{description}</p>
      ) : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "neutral" | "pink" | "teal" | "warn";
}) {
  const tones = {
    neutral: "bg-white",
    pink: "bg-pink-50 border-pink-200",
    teal: "bg-teal-50 border-teal-100",
    warn: "bg-review-soft border-amber-200",
  } as const;

  return (
    <Card className={cx("p-5", tones[tone])}>
      <p className="text-xs font-bold uppercase tracking-wider text-sand-500">
        {label}
      </p>
      <p className="mt-1.5 font-display text-4xl text-ink">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-sand-500">{sub}</p> : null}
    </Card>
  );
}

/**
 * A horizontal bar chart.
 *
 * Hand-rolled rather than pulled from a charting library. Every chart Save7 needs is
 * a labelled bar; a chart dependency would add weight, a client boundary, and a
 * theming problem for something CSS already does. Each bar is also a table row in
 * effect, so the numbers stay readable to a screen reader.
 */
export function BarChart({
  data,
  max,
  valueSuffix = "",
  tone = "pink",
  emptyMessage = "No data yet.",
}: {
  data: Array<{ label: string; value: number | null; sub?: string }>;
  max?: number;
  valueSuffix?: string;
  tone?: "pink" | "teal" | "ink";
  emptyMessage?: string;
}) {
  const values = data.map((d) => d.value ?? 0);
  const ceiling = max ?? Math.max(1, ...values);
  const fill = { pink: "bg-pink", teal: "bg-teal-deep", ink: "bg-ink" }[tone];

  if (data.length === 0 || values.every((v) => v === 0)) {
    return <p className="text-sm text-sand-500">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-3">
      {data.map((row) => (
        <li key={row.label}>
          <div className="mb-1 flex items-baseline justify-between gap-4">
            <span className="text-sm text-ink">{row.label}</span>
            <span className="shrink-0 text-sm font-bold text-ink">
              {row.value === null ? "—" : `${row.value}${valueSuffix}`}
            </span>
          </div>
          <div
            aria-hidden="true"
            className="h-2.5 w-full overflow-hidden rounded-pill bg-sand-200"
          >
            <div
              className={cx("h-full rounded-pill", fill)}
              style={{
                width: `${row.value === null ? 0 : Math.max(1, (row.value / ceiling) * 100)}%`,
              }}
            />
          </div>
          {row.sub ? (
            <p className="mt-0.5 text-xs text-sand-500">{row.sub}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function Section({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cx("p-6", className)}>
      <h2 className="font-bold text-ink">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-sand-600">{description}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </Card>
  );
}

export function DataTable({
  columns,
  rows,
  caption,
  emptyMessage = "Nothing to show yet.",
}: {
  columns: string[];
  rows: React.ReactNode[][];
  caption: string;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-sand-500">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[38rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b-2 border-sand-300">
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="whitespace-nowrap py-2 pr-4 text-xs font-bold uppercase tracking-wider text-sand-500"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-sand-200 align-top">
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 pr-4 text-sand-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
