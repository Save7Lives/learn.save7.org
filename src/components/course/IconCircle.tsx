import { Icon, type IconName } from "@/components/ui/icons";
import { cx } from "@/components/ui/primitives";

/**
 * An icon in a tinted circle (#73). Editorial-only: the Portal's `IconChip` is a square
 * chip. `pink-100` and `teal-100` carry icons only, never text (#68), so a circle never
 * holds a word.
 */
export function IconCircle({
  name,
  tone,
  className,
}: {
  name: IconName;
  tone: "pink" | "teal";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "grid size-11 shrink-0 place-items-center rounded-full",
        tone === "pink" ? "bg-pink-100 text-pink" : "bg-teal-100 text-teal-ink",
        className,
      )}
    >
      <Icon name={name} className="size-6 shrink-0" />
    </span>
  );
}
