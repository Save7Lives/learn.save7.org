import Image from "next/image";

/**
 * The official Save7 lockups, extracted from save7.org/brand-kit.
 *
 * Per the brand guidelines: the stacked lockup is the default for covers and
 * hero banners, and the horizontal lockup suits app bars and wide spaces. The
 * artwork is never recoloured — where a single-colour mark is needed on an ink
 * surface, the V7 mark is used as supplied.
 */

type Variant = "stacked" | "horizontal" | "mark";

const SOURCES: Record<Variant, { src: string; width: number; height: number }> = {
  stacked: { src: "/brand/Save7-logo-stacked.png", width: 1201, height: 585 },
  horizontal: { src: "/brand/Save7-logo-horizontal.png", width: 2182, height: 273 },
  mark: { src: "/brand/Save7-V7-mark.png", width: 1385, height: 1291 },
};

export function Save7Logo({
  variant = "horizontal",
  className,
  priority,
}: {
  variant?: Variant;
  className?: string;
  priority?: boolean;
}) {
  const { src, width, height } = SOURCES[variant];
  return (
    <Image
      src={src}
      width={width}
      height={height}
      priority={priority}
      className={className}
      alt="Save Seven"
    />
  );
}
