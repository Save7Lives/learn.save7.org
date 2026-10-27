"use client";

import type { ReactNode } from "react";
import { LazyMotion, MotionConfig } from "motion/react";

// The animation features arrive in their own chunk after the page is interactive,
// so the first load carries only Motion's small `m` shell. `domMax` rather than
// `domAnimation` because the step rail's highlight is a shared-layout animation.
const loadFeatures = () => import("./features").then((mod) => mod.default);

/**
 * Motion for the whole site shell. `strict` makes a stray `motion.div` throw in
 * development, since it would pull the full bundle back in: use `m.div`.
 * `reducedMotion="user"` drops transforms for anyone whose device asks for less
 * motion, alongside the global CSS rule in globals.css.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
