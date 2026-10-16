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
  // Added for the Editorial pages (#86).
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
