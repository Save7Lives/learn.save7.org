import { Save7Logo } from "@/components/ui/Save7Logo";
import { cx } from "@/components/ui/primitives";

/**
 * The mark with a live wordmark: Montserrat 800, SAVE in teal, SEVEN in pink (#40, #68).
 *
 * `surface` picks the legal colours. Teal as text is only legal on navy, so on
 * white SAVE takes `teal-ink`. Pink SEVEN is 3.64:1 on navy, so on navy the
 * lockup must be set at 20px (`text-xl`) or larger. Size comes from the text
 * size class in `className`; the mark scales with it.
 */
export function Save7Lockup({
  surface,
  className,
}: {
  surface: "white" | "navy";
  className?: string;
}) {
  const onNavy = surface === "navy";
  return (
    <span
      className={cx(
        "inline-flex items-center gap-[0.4em] font-display font-extrabold uppercase leading-none tracking-tight",
        className,
      )}
    >
      <Save7Logo className={cx("h-[1.15em] w-[1.15em] shrink-0", onNavy ? "text-teal" : "text-pink")} />
      <span>
        <span className={onNavy ? "text-teal" : "text-teal-ink"}>Save</span>
        <span className="text-pink">Seven</span>
      </span>
    </span>
  );
}
