"use client";

import { m, useReducedMotion, useScroll, useTransform } from "motion/react";

/**
 * The decoration of a public hero (landing page, course introduction): a `teal-100`
 * blob top right, a `pink-50` blob with a `pink-line` border bottom left, and the
 * teal-and-pink circle pair. Signed-in pages have none.
 *
 * Nothing here ever carries text: `teal-100` is an icon fill only (#68). The copy
 * column is held to 58% of the hero so it never reaches a blob, and below 760px the
 * big blob and the pair are hidden and the small one shrinks. The parent needs
 * `relative overflow-hidden`, and its content needs `relative z-10`.
 *
 * In motion: the circle pair pops in on a spring, then drifts slowly round each other
 * while the page sits still (a 20 second loop); as the page scrolls the shapes
 * drift at their own speeds, the big blob down and the pair up, so the hero has
 * depth. All of it stops for reduced motion.
 */
export function HeroDecoration() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const drift = useTransform(scrollY, [0, 600], [0, reduce ? 0 : 90]);
  const rise = useTransform(scrollY, [0, 600], [0, reduce ? 0 : -60]);
  return (
    <>
      <m.div
        aria-hidden="true"
        style={{ y: drift }}
        className="pointer-events-none absolute -right-[190px] -top-[230px] hidden size-[520px] rounded-full bg-teal-100 min-[760px]:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[150px] -left-[140px] size-[240px] rounded-full border border-pink-line bg-pink-50 min-[760px]:-bottom-[230px] min-[760px]:-left-[190px] min-[760px]:size-[360px]"
      />
      <m.div
        aria-hidden="true"
        style={{ y: rise }}
        className="pointer-events-none absolute right-16 top-[52px] hidden h-[90px] w-[120px] min-[760px]:block"
      >
        {/* The outer <i> drifts slowly while the page sits idle (CSS, globals.css);
            the inner one pops in. Separate elements, so the two transforms never
            overwrite each other. */}
        <i className="animate-drift-a absolute right-0 top-0 size-[72px]">
          <m.i
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 220, damping: 12 }}
            className="block size-full rounded-full bg-teal"
          />
        </i>
        <i className="animate-drift-b absolute bottom-0 left-0 size-10">
          <m.i
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.45, type: "spring", stiffness: 220, damping: 12 }}
            className="block size-full rounded-full bg-pink"
          />
        </i>
      </m.div>
    </>
  );
}
