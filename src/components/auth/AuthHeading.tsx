import type { ReactNode } from "react";

import { Eyebrow } from "@/components/ui/primitives";

/**
 * The heading block of every card on the backdrop: pink eyebrow, navy Montserrat 800
 * title in sentence case, grey lede.
 */
export function AuthHeading({
  eyebrow = "Save7 Learn",
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  /** The lede. */
  children?: ReactNode;
}) {
  return (
    <header>
      <Eyebrow className="text-pink">{eyebrow}</Eyebrow>
      <h1 className="t-h1 mt-2.5 text-navy">{title}</h1>
      {children ? <p className="mt-3 text-base leading-[1.6] text-grey">{children}</p> : null}
    </header>
  );
}
