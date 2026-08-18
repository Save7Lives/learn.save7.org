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
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition " +
  // 44px minimum touch target: a significant share of learners are on a phone.
  "min-h-11 px-6 py-2.5 disabled:opacity-50 disabled:pointer-events-none";

const BUTTON_VARIANTS = {
  /**
   * Pink. One per screen, on the single most important action.
   *
   * Uses --color-pink-button rather than brand pink: white on brand pink is
   * 4.31:1, marginally under the 4.5:1 minimum for a button label. The shade is
   * imperceptibly different and the label is now legible to everyone.
   */
  primary: "bg-pink-button text-white hover:bg-pink-600 active:bg-pink-700 shadow-sm",
  /** Ink. For confident secondary actions. */
  ink: "bg-ink text-cream hover:bg-sand-800",
  outline: "border-2 border-ink/15 text-ink hover:border-ink/40 hover:bg-white",
  /** For use on ink surfaces, where teal becomes legible. */
  onInk: "bg-teal text-ink hover:bg-teal-100 font-bold",
  quiet: "text-sand-600 hover:text-ink hover:bg-sand-100",
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
        "rounded-card border border-sand-200 bg-white shadow-[0_1px_2px_rgba(17,17,17,0.04)]",
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

/** A small all-caps label. Uses Inter, not Anton — Anton is headlines only. */
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
        "text-xs font-bold uppercase tracking-[0.14em] text-sand-500",
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
    neutral: "bg-sand-100 text-sand-700 border-sand-200",
    // teal-deep, not brand teal: brand teal is illegible on white.
    teal: "bg-teal-50 text-teal-deep border-teal-100",
    pink: "bg-pink-50 text-pink-700 border-pink-200",
    review: "bg-review-soft text-review border-amber-200",
    correct: "bg-correct-soft text-correct border-teal-100",
    incorrect: "bg-incorrect-soft text-incorrect border-red-200",
  } as const;

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
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
        "rounded-xl border border-dashed border-sand-300 bg-sand-100/60 px-4 py-3 text-sm text-sand-600",
        className,
      )}
    >
      <span className="font-semibold text-sand-700">Content pending.</span> This will be
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
    dotClass: "bg-level-beginner",
    textClass: "text-level-beginner",
    softClass: "bg-level-beginner-soft",
    borderClass: "border-level-beginner/25",
  },
  INTERMEDIATE: {
    label: "Intermediate",
    dotClass: "bg-level-intermediate",
    textClass: "text-level-intermediate",
    softClass: "bg-level-intermediate-soft",
    borderClass: "border-level-intermediate/25",
  },
  ADVANCED: {
    label: "Advanced",
    dotClass: "bg-level-advanced",
    textClass: "text-level-advanced",
    softClass: "bg-level-advanced-soft",
    borderClass: "border-level-advanced/25",
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
  tone?: "pink" | "teal" | "ink";
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const fill = {
    pink: "bg-pink",
    teal: "bg-teal-deep",
    ink: "bg-ink",
  }[tone];

  return (
    <div
      className={cx("h-2 w-full overflow-hidden rounded-pill bg-sand-200", className)}
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
