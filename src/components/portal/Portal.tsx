import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icons";
import { cx } from "@/components/ui/primitives";

/**
 * The Portal Register's shared pieces (#71): a card, a stat card, a status pill, a
 * rail stepper and a prompt card. They are written for My progress and shared with
 * the Admin shell (#72), so none of them knows about a Progress Record.
 *
 * Rules held here (#68): coloured text sits only on white, `pink-50` and `teal-50`;
 * `pink-100`, `teal-100` and `line` carry icons only; a status is a tint, a
 * hairline, an icon and navy text, never colour alone.
 */

export const PORTAL_SHADOW = "shadow-[0_1px_2px_rgba(12,23,59,0.05),0_6px_18px_rgba(12,23,59,0.05)]";

export function PortalCard({
  as: As = "div",
  tone = "white",
  plain,
  className,
  children,
  ...rest
}: {
  as?: "div" | "section" | "article" | "li" | "aside";
  /** White, `pink-50` (the one thing to do next) or `teal-50` (a quiet summary). */
  tone?: "white" | "pink" | "teal";
  /**
   * Just the border and fill: no padding, radius or shadow. The Editorial pages (#73)
   * set their own, so two competing padding classes never fight on stylesheet order.
   */
  plain?: boolean;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  return (
    <As
      className={cx(
        !plain && "rounded-card p-5 sm:px-6",
        "border",
        tone === "pink" && "border-pink-line bg-pink-50",
        tone === "teal" && "border-teal-line bg-teal-50",
        tone === "white" && cx("border-line bg-white", !plain && PORTAL_SHADOW),
        className,
      )}
      {...rest}
    >
      {children}
    </As>
  );
}

/** A tinted outline icon on a square chip. Position picks the tint, never meaning. */
export function IconChip({
  icon,
  tint,
  small,
}: {
  icon: IconName;
  tint: "pink" | "teal";
  small?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "grid shrink-0 place-items-center",
        small ? "size-8 rounded-[10px] sm:size-10 sm:rounded-xl" : "size-10 rounded-xl",
        tint === "pink" ? "bg-pink-100 text-pink" : "bg-teal-100 text-teal-ink",
      )}
    >
      <Icon name={icon} />
    </span>
  );
}

/** Chips alternate teal and pink by position. */
export const tintAt = (i: number): "pink" | "teal" => (i % 2 === 0 ? "teal" : "pink");

/** The deck's stat card: label and figure left, icon chip right (above them on a phone). */
export function StatCard({
  label,
  value,
  unit,
  sub,
  icon,
  tint,
}: {
  label: string;
  value: string;
  /** The small word after the figure: "of 11", "points". */
  unit?: string;
  sub: string;
  icon: IconName;
  tint: "pink" | "teal";
}) {
  return (
    <div
      className={cx(
        "flex flex-col-reverse justify-end gap-3 rounded-card border border-line bg-white p-3.5 sm:flex-row sm:justify-between sm:gap-2.5 sm:p-[18px]",
        PORTAL_SHADOW,
      )}
    >
      <div className="min-w-0">
        <p className="text-sm text-grey">{label}</p>
        <p className="mt-1 font-display text-2xl font-extrabold leading-tight text-navy sm:text-[1.75rem]">
          {value}
          {unit ? <span className="ml-1.5 font-sans text-sm font-medium text-grey">{unit}</span> : null}
        </p>
        <p className="mt-0.5 text-sm text-grey">{sub}</p>
      </div>
      <IconChip icon={icon} tint={tint} small />
    </div>
  );
}

export type StatusTone = "done" | "progress" | "none" | "warn";

const STATUS_TONE: Record<StatusTone, { box: string; icon: string; text: string }> = {
  done: { box: "border-teal-line bg-teal-50", icon: "text-teal-ink", text: "text-navy" },
  progress: { box: "border-line-strong bg-white", icon: "text-navy", text: "text-navy" },
  none: { box: "border-line bg-white", icon: "text-grey", text: "text-grey" },
  warn: { box: "border-pink-line bg-pink-50", icon: "text-pink", text: "text-navy" },
};

/** A status: tint, hairline, icon and navy text. The colour lives in the icon and border. */
export function StatusPill({
  tone,
  icon,
  children,
}: {
  tone: StatusTone;
  icon: IconName;
  children: ReactNode;
}) {
  const t = STATUS_TONE[tone];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border py-[3px] pl-2 pr-2.5 text-[0.8125rem] font-medium",
        t.box,
        t.text,
      )}
    >
      <Icon name={icon} className={cx("size-3.5 shrink-0 stroke-[2.25]", t.icon)} />
      {children}
    </span>
  );
}

export type RailState = "passed" | "current" | "todo" | "locked";

export type RailStep = {
  key: string;
  title: string;
  state: RailState;
  /** The status word beside the title. */
  status: string;
  href?: string;
};

/**
 * A numbered stepper dot: passed (teal fill, check), current (thick navy ring), todo
 * (grey ring) or locked (dashed, lock). Fill, ring and weight tell them apart, never
 * colour alone. Shared by the rail stepper here and the Editorial pages' course map
 * and Level timeline (#73), so there is one dot.
 */
export function StepDot({
  n,
  state,
  className,
}: {
  n: number;
  state: RailState;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "relative grid size-8 shrink-0 place-items-center rounded-full font-display text-sm font-bold",
        state === "passed" && "bg-teal text-navy",
        state === "current" && "border-[3px] border-navy bg-white text-navy",
        state === "todo" && "border-2 border-line-strong bg-white text-grey",
        state === "locked" && "border-2 border-dashed border-line-strong bg-white text-grey",
        className,
      )}
    >
      {state === "passed" ? (
        <Icon name="check" className="size-4 shrink-0 stroke-[2.5]" />
      ) : state === "locked" ? (
        <Icon name="lock" className="size-4 shrink-0 stroke-[2.5]" />
      ) : (
        n
      )}
    </span>
  );
}

/**
 * A vertical rail of numbered steps on a dotted connector. A passed step is a
 * filled pill with a check, the current one is ringed in navy, a locked one is
 * dashed with a lock. Each carries a status word, so state is never the ring alone.
 */
export function RailStepper({ steps, label }: { steps: RailStep[]; label: string }) {
  return (
    <ol aria-label={label} className="m-0 mt-4 list-none p-0">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        const body = (
          <>
            <StepDot n={i + 1} state={step.state} />
            <span className="block">
              <span className="block pt-[5px] text-[0.9375rem] font-medium leading-snug text-navy underline-offset-[3px] group-hover:underline">
                {step.title}
              </span>
              <span
                className={cx(
                  "mt-0.5 block text-[0.8125rem]",
                  step.state === "current" ? "font-medium text-navy" : "text-grey",
                )}
              >
                {step.status}
              </span>
            </span>
          </>
        );
        const cls = cx(
          "grid grid-cols-[2rem_1fr] gap-x-3 no-underline",
          last ? "pb-0.5" : "pb-4",
          // The dotted connector to the next step.
          !last &&
            "before:absolute before:bottom-1 before:left-3.5 before:top-9 before:border-l-[3px] before:border-dotted before:border-line-strong before:content-['']",
        );
        return (
          <li key={step.key} className="relative" aria-current={step.state === "current" ? "step" : undefined}>
            {step.href ? (
              <Link href={step.href} className={cx(cls, "group")}>
                {body}
              </Link>
            ) : (
              <div className={cls}>{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** A prompt card: icon chip, eyebrow, title, text and one action. */
export function PromptCard({
  tone,
  icon,
  eyebrow,
  title,
  children,
  action,
}: {
  tone: "pink" | "white";
  icon: IconName;
  eyebrow: string;
  title: string;
  children: ReactNode;
  action: ReactNode;
}) {
  return (
    <PortalCard
      as="section"
      tone={tone}
      aria-label={title}
      className={cx("flex flex-wrap items-center justify-between gap-x-5 gap-y-4", tone === "pink" && "shadow-none")}
    >
      <div className="flex min-w-0 flex-[1_1_22rem] items-start gap-3.5">
        <IconChip icon={icon} tint={tone === "pink" ? "pink" : "teal"} />
        <div>
          <p
            className={cx(
              "font-display text-[0.8125rem] font-bold uppercase leading-snug tracking-[0.07em]",
              tone === "pink" ? "text-pink" : "text-teal-ink",
            )}
          >
            {eyebrow}
          </p>
          <h2 className="mt-0.5 font-display text-lg font-bold leading-snug text-navy">{title}</h2>
          <p className="mt-1 max-w-[62ch] text-[0.9375rem] leading-normal text-grey">{children}</p>
        </div>
      </div>
      {action}
    </PortalCard>
  );
}
