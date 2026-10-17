const ZA = "Africa/Johannesburg";

/** "3 March 2027". */
export const formatDate = (d: Date) =>
  d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: ZA });

/** "3 Mar 2027", for a table cell. */
export const formatShortDate = (d: Date) =>
  d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: ZA });

export const formatPct = (n: number | null) => (n === null ? "n/a" : `${Math.round(n)}%`);

/** Percentage points with a true minus sign: "+8 pp", "−3 pp". */
export function formatPoints(n: number | null): string {
  if (n === null) return "n/a";
  const r = Math.round(n);
  return `${r >= 0 ? "+" : "−"}${Math.abs(r)} pp`;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^\p{Lu}/u.test(w))
    .map((w) => w[0])
    .slice(0, 2)
    .join("") || "?";

/** The query string for an Admin link, leaving out anything at its default. */
export function adminHref(path: string, params: Record<string, string | number | undefined>, defaults: Record<string, string> = {}): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "" || String(v) === (defaults[k] ?? "")) continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}
