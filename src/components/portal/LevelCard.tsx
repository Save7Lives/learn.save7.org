import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icons";
import { cx } from "@/components/ui/primitives";
import { Meter } from "./Panel";
import { PortalCard, StatusPill, StepDot, type RailState, type StatusTone } from "./Portal";

/**
 * A Level as a Portal card with its Stage stepper (#72, #84), shared with My progress
 * (#71). The stepper runs across on a wide card and down on a narrow one; each Stage
 * is a numbered dot (filled with a check, ringed, or plain) plus its status in words.
 */

export type LevelCardStage = {
  key: string;
  title: string;
  state: RailState;
  /** Under the title: "Passed 3 March 2027" and the latest attempt. */
  detail: ReactNode;
};

export function LevelCard({
  title,
  status,
  passed,
  total,
  stages,
  footer,
}: {
  title: string;
  status: { tone: StatusTone; icon: IconName; label: string };
  passed: number;
  total: number;
  stages: LevelCardStage[];
  footer?: { icon: IconName; text: ReactNode };
}) {
  return (
    <PortalCard as="section" aria-label={title} className="mb-4 min-w-0 sm:px-[22px] sm:py-5">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h3 className="font-display text-lg font-bold leading-snug text-navy">{title}</h3>
        <StatusPill tone={status.tone} icon={status.icon}>
          {status.label}
        </StatusPill>
      </div>
      <Meter className="mt-3" value={total ? (100 * passed) / total : 0} label={`${title}: ${passed} of ${total} Stages passed`} />
      <p className="mt-1.5 text-sm text-grey">
        {passed} of {total} Stages passed
      </p>

      <ol
        className="m-0 mt-[18px] grid list-none gap-3.5 p-0 min-[900px]:gap-0 min-[900px]:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
        style={{ "--n": stages.length } as React.CSSProperties}
      >
        {stages.map((st, i) => (
          <li
            key={st.key}
            aria-current={st.state === "current" ? "step" : undefined}
            className={cx(
              "relative grid grid-cols-[2rem_1fr] gap-x-3 min-[900px]:block min-[900px]:px-2 min-[900px]:text-center",
              // The dotted connector to the previous Stage, wide layout only.
              i > 0 &&
                "min-[900px]:before:absolute min-[900px]:before:right-[calc(50%+24px)] min-[900px]:before:top-[15px] min-[900px]:before:w-[calc(100%-48px)] min-[900px]:before:border-t-[3px] min-[900px]:before:border-dotted min-[900px]:before:border-line-strong min-[900px]:before:content-['']",
            )}
          >
            <StepDot
              n={i + 1}
              state={st.state}
              className="row-span-2 min-[900px]:mx-auto min-[900px]:mb-2.5"
            />
            <p className="text-[0.9375rem] font-medium leading-snug text-navy">{st.title}</p>
            <p className="mt-0.5 text-[0.8125rem] leading-snug text-grey">{st.detail}</p>
          </li>
        ))}
      </ol>

      {footer ? (
        <p className="mt-4 flex items-start gap-3 border-t border-line pt-3 text-sm text-grey">
          <Icon name={footer.icon} className="mt-0.5 size-5 shrink-0" />
          <span>{footer.text}</span>
        </p>
      ) : null}
    </PortalCard>
  );
}
