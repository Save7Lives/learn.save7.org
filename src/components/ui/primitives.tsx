import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { LevelTier } from "@/lib/constants";

/**
 * Shared UI primitives.
 *
 * Small and deliberately few. The brand has one hero colour used with restraint,
 * so there is exactly one primary button style and everything else recedes.
 */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// --- Buttons ---------------------------------------------------------------

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition " +
  // 44px minimum touch target: a significant share of learners are on a phone.
  "min-h-11 px-6 py-2.5 disabled:opacity-50 disabled:pointer-events-none";

const BUTTON_VARIANTS = {
  /** Pink. One per screen, on the single most important action. White on pink is 4.80:1. */
  primary: "bg-pink text-white hover:bg-navy shadow-sm",
  /** Navy. For confident secondary actions. */
  navy: "bg-navy text-white hover:bg-navy/90",
  outline: "border-2 border-line-strong text-navy hover:border-navy hover:bg-white",
  /** Navy outline on white: the secondary button of the Editorial pages, beside a pink primary. */
  secondary: "border-2 border-navy bg-white text-navy hover:bg-line",
  /** For use on navy surfaces, where teal becomes legible. */
  onNavy: "bg-teal text-navy hover:bg-teal-100 font-medium",
  quiet: "text-grey hover:text-navy hover:bg-line/50",
  /** A link-weight action: teal-ink, underlined. For "Back to the Level" and "Review your last attempt". */
  tertiary: "text-teal-ink underline underline-offset-4 hover:text-navy px-2",
} as const;

type ButtonVariant = keyof typeof BUTTON_VARIANTS;

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      className={cx(
        BUTTON_BASE,
        BUTTON_VARIANTS[variant],
        size === "sm" && "text-sm px-4",
        size === "lg" && "text-lg px-8 min-h-13",
        className,
      )}
      {...rest}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: "sm" | "md" | "lg" }) {
  return (
    <Link
      className={cx(
        BUTTON_BASE,
        BUTTON_VARIANTS[variant],
        size === "sm" && "text-sm px-4",
        size === "lg" && "text-lg px-8 min-h-13",
        className,
      )}
      {...rest}
    />
  );
}

// --- Surfaces --------------------------------------------------------------

export function Card({
  className,
  children,
  as: As = "div",
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "article" | "section" | "li";
}) {
  return (
    <As
      className={cx(
        "rounded-card border border-line bg-white shadow-[0_1px_2px_rgba(17,17,17,0.04)]",
        className,
      )}
    >
      {children}
    </As>
  );
}

// --- Typography ------------------------------------------------------------

export function Display({
  children,
  className,
  as: As = "h1",
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
}) {
  return <As className={cx("font-display", className)}>{children}</As>;
}

/** A small all-caps label, in Montserrat 700. */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cx(
        "font-display text-[0.8125rem] font-bold uppercase leading-snug tracking-[0.07em]",
        // Grey unless the page sets a colour: two text-* classes would fight on order.
        !className?.includes("text-") && "text-grey",
        className,
      )}
    >
      {children}
    </p>
  );
}

// --- Badges ----------------------------------------------------------------

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "teal" | "pink" | "review" | "correct" | "incorrect";
  className?: string;
}) {
  const tones = {
    neutral: "bg-line/50 text-grey border-line",
    // Navy text: brand teal is illegible on white.
    teal: "bg-teal-50 text-navy border-teal-line",
    pink: "bg-pink-50 text-navy border-pink-line",
    review: "bg-pink-50 text-navy border-pink-line",
    correct: "bg-teal-50 text-correct border-teal-line",
    incorrect: "bg-pink-50 text-incorrect border-pink-line",
  } as const;

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** The solid pink pill that marks the one recommended Level. White on pink is 4.80:1. */
export function RecommendedPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-pill bg-pink px-2.5 py-1 font-display text-xs font-bold uppercase tracking-[0.06em] text-white">
      {children}
    </span>
  );
}

/** A numbered circle: teal with navy text, or pink with white text. Decorative. */
export function NumberPill({
  n,
  tone,
  size = "md",
}: {
  n: number | string;
  tone: "pink" | "teal";
  size?: "sm" | "md";
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-grid shrink-0 place-items-center rounded-full font-display font-bold",
        size === "md" ? "size-8 text-sm" : "size-6 text-xs",
        tone === "pink" ? "bg-pink text-white" : "bg-teal text-navy",
      )}
    >
      {n}
    </span>
  );
}

/**
 * The "pending Save7 review" marker.
 *
 * This is the most important component in the design system. Any medical, legal
 * or statistical claim that has not been signed off carries one, so that
 * unverified material can never present itself to a learner as authoritative.
 * It is intentionally visible rather than subtle.
 */
export function PendingReview({
  children = "Pending Save7 review",
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Badge tone="review" className={className}>
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        aria-hidden="true"
        className="shrink-0"
      >
        <path d="M12 9v4" strokeLinecap="round" />
        <path d="M12 17h.01" strokeLinecap="round" />
        <path
          d="M10.3 3.9 2.4 17.6A1.9 1.9 0 0 0 4 20.5h16a1.9 1.9 0 0 0 1.6-2.9L13.7 3.9a1.9 1.9 0 0 0-3.4 0Z"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </Badge>
  );
}

/** Placeholder copy where the Save7 study guide has not yet been supplied. */
export function AwaitingContent({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "rounded-xl border border-dashed border-line-strong bg-line/40 px-4 py-3 text-sm text-grey",
        className,
      )}
    >
      <span className="font-semibold text-grey">Content pending.</span> This will be
      written from the Save7 study guide. It is intentionally blank rather than filled with
      unverified text.
    </div>
  );
}

// --- Level accents ---------------------------------------------------------

export const TIER_META: Record<
  LevelTier,
  { label: string; dotClass: string; textClass: string; softClass: string; borderClass: string }
> = {
  BEGINNER: {
    label: "Beginner",
    dotClass: "bg-teal",
    textClass: "text-teal-ink",
    softClass: "bg-teal-50",
    borderClass: "border-teal-line",
  },
  INTERMEDIATE: {
    label: "Intermediate",
    dotClass: "bg-teal",
    textClass: "text-teal-ink",
    softClass: "bg-teal-50",
    borderClass: "border-teal-line",
  },
  ADVANCED: {
    label: "Advanced",
    dotClass: "bg-teal",
    textClass: "text-teal-ink",
    softClass: "bg-teal-50",
    borderClass: "border-teal-line",
  },
};

export function TierDot({ tier, className }: { tier: LevelTier; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx("inline-block size-2.5 rounded-full", TIER_META[tier].dotClass, className)}
    />
  );
}

// --- Progress --------------------------------------------------------------

export function ProgressBar({
  value,
  label,
  tone = "pink",
  className,
}: {
  /** 0–100. */
  value: number;
  label: string;
  tone?: "pink" | "teal" | "navy";
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const fill = {
    pink: "bg-pink",
    teal: "bg-teal-ink",
    navy: "bg-navy",
  }[tone];

  return (
    <div
      className={cx("h-2 w-full overflow-hidden rounded-pill bg-line", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cx("h-full rounded-pill transition-[width] duration-500", fill)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
