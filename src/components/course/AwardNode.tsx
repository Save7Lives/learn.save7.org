import { Icon } from "@/components/ui/icons";
import { cx } from "@/components/ui/primitives";

/**
 * The node that closes a Level on the dotted stepper (#73): the Certificate, filled
 * teal once it is earned. Editorial-only. The Stage dots on the same line are the
 * Portal's `StepDot`, shared rather than built twice.
 */
export function AwardNode({ earned, className }: { earned: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "grid size-8 shrink-0 place-items-center rounded-full",
        earned ? "bg-teal text-navy" : "bg-teal-100 text-teal-ink",
        className,
      )}
    >
      <Icon name="award" className="size-4 shrink-0 stroke-[2.25]" />
    </span>
  );
}
