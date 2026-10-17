import type { SVGProps } from "react";

/**
 * Outline icons on a 24px grid, drawn for the Portal Register (#68, #71). One
 * stroke weight, `currentColor`, always decorative: the word beside an icon carries
 * the meaning, never the icon alone.
 */
const PATHS = {
  book: (
    <>
      <path d="M2.5 4.5h6A3.5 3.5 0 0 1 12 8v12.5a2.5 2.5 0 0 0-2.5-2.5h-7z" />
      <path d="M21.5 4.5h-6A3.5 3.5 0 0 0 12 8v12.5a2.5 2.5 0 0 1 2.5-2.5h7z" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="M8.6 14.2 7 22l5-3 5 3-1.6-7.8" />
    </>
  ),
  chart: <path d="M4 20V11M10 20V4M16 20v-7M22 20H2" />,
  trend: (
    <>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.7 2.7L16 9.5" />
    </>
  ),
  "x-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  circle: <circle cx="12" cy="12" r="8.5" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8v.01" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  "arrow-left": <path d="M19 12H5M11 6l-6 6 6 6" />,
  // Added for the reader, Stage Quiz and Baseline (#74).
  x: <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />,
  alert: (
    <>
      <path d="M12 3.5 21.5 20h-19z" />
      <path d="M12 10v4" />
      <path d="M12 17.2v.01" />
    </>
  ),
  file: (
    <>
      <path d="M14 3.5H7A2.5 2.5 0 0 0 4.5 6v12A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5V9z" />
      <path d="M14 3.5V9h5.5M8.5 13.5h7M8.5 17h5" />
    </>
  ),
  quiz: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.6" />
      <path d="M12 16.9v.01" />
    </>
  ),
  flag: <path d="M5 21V4M5 4h11.5l-2.5 4 2.5 4H5" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 12h.01" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11A8 8 0 0 0 5.6 6.6L4 8.5" />
      <path d="M4 4v4.5h4.5" />
      <path d="M4 13a8 8 0 0 0 14.4 4.4l1.6-1.9" />
      <path d="M20 20v-4.5h-4.5" />
    </>
  ),
  chev: <path d="m6 9 6 6 6-6" />,
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <circle cx="17.5" cy="9" r="2.5" />
      <path d="M17.5 14a5 5 0 0 1 4 5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v6c0 4.4 3.1 7.7 7.5 9 4.4-1.3 7.5-4.6 7.5-9V6z" />
      <path d="m8.7 12 2.3 2.3 4.3-4.6" />
    </>
  ),
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  "log-out": (
    <>
      <path d="M9 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H9" />
      <path d="M16 8l4 4-4 4M20 12H9" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  className,
  ...rest
}: { name: IconName } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className ?? "size-5 shrink-0"}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
