import { cx } from "@/components/ui/primitives";

/**
 * Before-and-after bars.
 *
 * Two bars on a shared 0–100 scale, so the gap between them is the message. Kept as
 * plain divs rather than a charting library: at two data points a chart dependency
 * would be pure overhead, and this stays legible when CSS fails to load.
 */
export function ImpactBars({
  beforePct,
  afterPct,
  beforeLabel,
  afterLabel,
}: {
  beforePct: number;
  afterPct: number;
  beforeLabel: string;
  afterLabel: string;
}) {
  const rows = [
    { key: "before", label: "Before", pct: beforePct, sub: beforeLabel, tone: "bg-sand-400" },
    { key: "after", label: "After", pct: afterPct, sub: afterLabel, tone: "bg-pink" },
  ];

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.key}>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-ink">{row.label}</span>
            <span className="font-display text-2xl text-ink">{row.pct}%</span>
          </div>
          {/* The bar is decorative; the figure above it carries the value, so the
              track is hidden from assistive tech to avoid reading it twice. */}
          <div
            aria-hidden="true"
            className="h-3 w-full overflow-hidden rounded-pill bg-sand-200"
          >
            <div
              className={cx("h-full rounded-pill transition-[width] duration-700", row.tone)}
              style={{ width: `${Math.max(2, Math.min(100, row.pct))}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-sand-500">{row.sub}</p>
        </div>
      ))}
    </div>
  );
}
