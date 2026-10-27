"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";
import { Icon } from "@/components/ui/icons";
import { cx } from "@/components/ui/primitives";

/**
 * The site's motion pieces. Two rules hold for all of them:
 *
 * - Content is never hidden by the server. A learner on a slow phone sees every word
 *   before any JavaScript arrives; motion is added afterwards, and only to what is
 *   still below the fold or what changed because the learner did something.
 * - Nothing moves for anyone whose device asks for reduced motion.
 */

const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
/** A slight overshoot, so a pop reads as a spring without loading one. */
const EASE_BACK = "cubic-bezier(0.34, 1.56, 0.64, 1)";

const FROM = {
  rise: { opacity: 0, transform: "translateY(24px)" },
  pop: { opacity: 0, transform: "scale(0.4)" },
};

/**
 * Rises (or pops) into place the first time it scrolls into view. Anything already
 * on screen when the page loads stays exactly where the server drew it. The browser's
 * own IntersectionObserver and Web Animations do the work, so this costs no library.
 */
export function Reveal({
  as: As = "div",
  from = "rise",
  delay = 0,
  className,
  style,
  children,
}: {
  as?: "div" | "li" | "span";
  from?: keyof typeof FROM;
  /** Seconds. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  // Before paint, so an element below the fold is hidden before it is ever seen.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    const hidden = el.animate([FROM[from]], { fill: "forwards" });
    const stop = () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        stop();
        el.animate([FROM[from], { opacity: 1, transform: "none" }], {
          duration: from === "pop" ? 500 : 600,
          delay: delay * 1000,
          easing: from === "pop" ? EASE_BACK : EASE_OUT,
          fill: "backwards",
        });
        hidden.cancel();
      },
      { threshold: 0.2 },
    );
    // A jump straight past it (an anchor link, a fast fling) may never cross the
    // threshold, so anything whose top has gone above the screen is simply shown.
    const onScroll = () => {
      if (el.getBoundingClientRect().top >= 0) return;
      stop();
      hidden.cancel();
    };
    observer.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      stop();
      hidden.cancel();
    };
  }, [from, delay]);

  return (
    <As ref={ref as React.Ref<never>} className={className} style={style}>
      {children}
    </As>
  );
}

/**
 * A number that counts up from zero when it first appears. The server and screen
 * readers get the real number; only the drawn digits count.
 */
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const reduce = useReducedMotion();
  const digits = useRef<HTMLSpanElement>(null);

  // Writes the digits straight to the DOM: a frame-by-frame count has no business
  // re-rendering React. Before paint, so the real number never flashes first.
  useLayoutEffect(() => {
    const el = digits.current;
    if (!el || reduce || value === 0) return;
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      el.textContent = String(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    el.textContent = "0";
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      el.textContent = String(value);
    };
  }, [value, duration, reduce]);

  return (
    <>
      <span ref={digits} aria-hidden="true">
        {value}
      </span>
      <span className="sr-only">{value}</span>
    </>
  );
}

const BURST = Array.from({ length: 10 }, (_, i) => ({
  angle: (i / 10) * Math.PI * 2 - Math.PI / 2,
  colour: i % 2 ? "var(--color-teal)" : "var(--color-pink)",
}));

/**
 * A ring of hearts in pink and teal that bursts out from behind its parent once.
 * Purely decorative: the words beside it say what happened. The parent needs
 * `relative`.
 */
export function HeartBurst({ delay = 0.6, radius = 72 }: { delay?: number; radius?: number }) {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2">
      {BURST.map((b, i) => (
        <m.span
          key={i}
          className="absolute -left-2 -top-2"
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
          animate={{ x: Math.cos(b.angle) * radius, y: Math.sin(b.angle) * radius, opacity: [0, 1, 0], scale: 1 }}
          transition={{ delay, duration: 0.9, ease: "easeOut" }}
        >
          <Icon name="heart" className="size-4" style={{ color: b.colour, fill: b.colour }} />
        </m.span>
      ))}
    </span>
  );
}

/**
 * A marked answer that reacts once it is seen: a short shake for a wrong choice the
 * learner made, a small pop for the right one. Other choices sit still.
 */
export function Settle({
  tone,
  delay = 0,
  className,
  children,
}: {
  tone: "ok" | "bad" | null;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const whileInView =
    tone === "bad" ? { x: [0, -6, 6, -4, 4, 0] } : tone === "ok" ? { scale: [1, 1.03, 1] } : undefined;
  return (
    <m.div
      className={className}
      whileInView={whileInView}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: 0.45, delay }}
    >
      {children}
    </m.div>
  );
}

/** Flips in from the side, once, when it mounts. For a moment the learner caused. */
export function FlipIn({ delay = 0.3, className, children }: { delay?: number; className?: string; children: ReactNode }) {
  return (
    <div className={cx("[perspective:1000px]", className)}>
      <m.div
        initial={{ rotateY: -80, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ delay, type: "spring", stiffness: 90, damping: 14 }}
      >
        {children}
      </m.div>
    </div>
  );
}
