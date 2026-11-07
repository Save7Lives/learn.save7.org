"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { m } from "motion/react";
import { FlipIn, HeartBurst } from "@/components/motion/parts";
import { StepGlyph } from "@/components/course/CourseArt";
import { Icon } from "@/components/ui/icons";
import { ButtonLink, cx } from "@/components/ui/primitives";

/**
 * The learner's moments, drawn as the landing page's route ("The route grows", chosen
 * on the real course over a quieter and a fuller treatment): a marked paper's answers,
 * a Stage passed, the certificate, and Baseline improvement. Every state is said in
 * words or by an icon's shape as well as by colour, and every movement is one the
 * learner caused. Motion's `reducedMotion="user"` and the `Play` check keep them still
 * for anyone who asks.
 */

/**
 * Plays keyframes once, on arrival, over what the server already drew. For a page
 * that loads with the moment on it: the words are there before any JavaScript, and
 * only the movement waits for it.
 */
function Play({
  keyframes,
  delay = 0,
  duration = 600,
  easing = "cubic-bezier(0.16, 1, 0.3, 1)",
  className,
  style,
  children,
}: {
  keyframes: Keyframe[];
  style?: CSSProperties;
  delay?: number;
  duration?: number;
  easing?: string;
  className?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = el.animate(keyframes, { delay: delay * 1000, duration, easing, fill: "backwards" });
    return () => animation.cancel();
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <span ref={ref} className={className} style={style}>
      {children}
    </span>
  );
}

const POP = "cubic-bezier(0.34, 1.56, 0.64, 1)";

export type StageStop = { slug: string; title: string; passed: boolean };

// --- Answers -------------------------------------------------------------------

export type AnswerMark = "correct" | "wrong" | "unanswered";

/** The paper's answers as a row of stops on one line, each a link to its question. */
export function AnswerRoute({ marks }: { marks: AnswerMark[] }) {
  return (
    <ol className="relative mt-5 flex justify-between">
      <span aria-hidden="true" className="absolute inset-x-5 top-5 border-t-[3px] border-dotted border-line-strong" />
      {marks.map((mark, i) => (
        <li key={i} className="relative">
          <a href={`#answer-${i + 1}`} className="flex flex-col items-center gap-1.5 rounded-xl p-0.5 text-xs text-grey">
            <m.span
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.35 + i * 0.12, type: "spring", stiffness: 320, damping: 16 }}
              className={cx(
                "grid size-10 place-items-center rounded-full",
                mark === "correct"
                  ? "bg-teal-ink text-white"
                  : mark === "wrong"
                    ? "border-[3px] border-pink bg-white text-pink"
                    : "border-[3px] border-line-strong bg-white text-grey",
              )}
            >
              <Icon name={mark === "correct" ? "check" : mark === "wrong" ? "x" : "alert"} className="size-5 stroke-[2.5]" />
            </m.span>
            <span>
              Q{i + 1}
              <span className="sr-only">
                : {mark === "correct" ? "correct" : mark === "wrong" ? "not quite" : "not answered"}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ol>
  );
}

// --- Passing a Stage --------------------------------------------------------------

/**
 * The Level drawn as the landing page's route, with this Stage's stop turning to a
 * tick as the learner arrives. The certificate is the last stop.
 */
export function StageRoute({
  stages,
  currentSlug,
  certificateTitle,
  certificateEarned,
  celebrate,
}: {
  stages: StageStop[];
  currentSlug: string;
  certificateTitle: string;
  certificateEarned: boolean;
  celebrate: boolean;
}) {
  const left = stages.filter((s) => !s.passed).length;
  const nextSlug = stages.find((s) => !s.passed)?.slug;
  return (
    <ol className="relative mt-5 grid gap-1">
      <span aria-hidden="true" className="absolute bottom-5 left-[1.375rem] top-5 border-l-[3px] border-dotted border-line-strong" />
      {stages.map((s, i) => {
        const current = s.slug === currentSlug;
        const next = s.slug === nextSlug;
        return (
          <li key={s.slug} className="relative grid grid-cols-[2.75rem_1fr] items-center gap-x-3">
            <span className="relative flex justify-center">
              {current && celebrate ? <HeartBurst delay={0.9} radius={44} /> : null}
              <m.span
                initial={current && celebrate ? { scale: 0.5 } : false}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 300, damping: 12 }}
                className={cx(
                  "relative z-10 grid size-8 place-items-center rounded-full font-display text-xs font-bold",
                  s.passed ? "bg-teal-ink text-white" : next ? "bg-pink text-white ring-4 ring-pink-100" : "bg-teal text-navy",
                  current && "ring-4 ring-teal-100",
                )}
              >
                {s.passed ? <Icon name="check" className="size-4 stroke-[2.5]" /> : <span aria-hidden="true">{i + 1}</span>}
              </m.span>
            </span>
            <p className={cx("py-2 text-[1.0625rem] text-navy", current && "font-medium")}>
              <span className="sr-only">Stage {i + 1}: </span>
              {s.title}
              {s.passed ? <span className="sr-only"> (passed)</span> : null}
              {current && s.passed ? (
                <span className="ml-2 text-sm font-medium text-teal-ink">{celebrate ? "Just passed" : "This Stage"}</span>
              ) : null}
              {next ? <span className="ml-2 text-sm font-medium text-pink">Up next</span> : null}
            </p>
          </li>
        );
      })}
      <li className="relative grid grid-cols-[2.75rem_1fr] items-center gap-x-3">
        <span className="relative flex justify-center">
          <span className={cx("relative z-10 grid size-10 place-items-center rounded-full", certificateEarned ? "bg-pink text-white" : "border-[3px] border-pink bg-white text-pink")}>
            <Icon name="award" className="size-5" />
          </span>
        </span>
        <p className="py-2 text-navy">
          <span className="font-medium">&ldquo;{certificateTitle}&rdquo; certificate</span>
          <span className="ml-2 text-sm text-grey">
            {certificateEarned ? "Earned" : left === 1 ? "One Stage away" : `${left} Stages away`}
          </span>
        </p>
      </li>
    </ol>
  );
}

// --- The certificate ---------------------------------------------------------------

/** The certificate as a small sheet: what it says, not the printable document. */
function MiniCertificate({ certificateTitle, levelTitle, publicId }: { certificateTitle: string; levelTitle: string; publicId: string }) {
  return (
    <div className="relative overflow-hidden rounded-[14px] border border-line bg-white px-5 py-6 text-center shadow-md">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-pink" />
      <StepGlyph index={3} className="mx-auto size-11" />
      <p className="mt-3 font-display text-xs font-bold uppercase tracking-[0.07em] text-teal-ink">Save7 Learn</p>
      <p className="mt-1 font-display text-lg font-bold text-navy">&ldquo;{certificateTitle}&rdquo;</p>
      <p className="mt-1 text-sm text-grey">{levelTitle} Level</p>
      <p className="mt-3 text-xs text-grey">{publicId}</p>
    </div>
  );
}

/**
 * The certificate earned on the last Stage Quiz of a Level: a small sheet that flips
 * in beside the words, the route's last stop made real.
 */
export function CertificateEarned({
  certificateTitle,
  levelTitle,
  publicId,
  fresh,
}: {
  certificateTitle: string;
  levelTitle: string;
  publicId: string;
  fresh: boolean;
}) {
  return (
    <div className="mt-[18px] grid items-center gap-5 rounded-[14px] border border-pink-line bg-pink-50 p-5 sm:grid-cols-[13rem_1fr]">
      <FlipIn delay={fresh ? 1.1 : 0}>
        <MiniCertificate certificateTitle={certificateTitle} levelTitle={levelTitle} publicId={publicId} />
      </FlipIn>
      <div>
        <p className="font-display text-xl font-bold text-navy">You finished {levelTitle}.</p>
        <p className="mb-3 mt-1 text-sm text-grey">That was the last Stage Quiz in this Level, so the certificate is yours.</p>
        <ButtonLink href={`/certificate/${publicId}`}>View my certificate</ButtonLink>
      </div>
    </div>
  );
}

// --- Improvement ------------------------------------------------------------------

type Point = { label: string; pct: number };

/** The first Sitting and the latest as two stops, the line between filling in. */
export function ImprovementRoute({ first, latest }: { first: Point; latest: Point }) {
  const change = latest.pct - first.pct;
  return (
    <div className="mt-4">
      <p className="text-navy">
        From your first sitting to now:{" "}
        <span className="font-display font-bold">
          {change >= 0 ? "+" : "−"}
          {Math.abs(change)} points
        </span>
      </p>
      <div className="relative mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <div className="text-center">
          <span className="grid size-14 place-items-center rounded-full border-[3px] border-navy bg-white font-display text-sm font-bold text-navy">
            {first.pct}%
          </span>
        </div>
        <div aria-hidden="true" className="relative h-[3px]">
          <span className="absolute inset-0 border-t-[3px] border-dotted border-line-strong" />
          <Play
            className="absolute inset-0 origin-left rounded-full bg-teal"
            keyframes={[{ transform: "scaleX(0)" }, { transform: "none" }]}
            delay={0.4}
            duration={1000}
          />
        </div>
        <Play
          className="block text-center"
          keyframes={[{ transform: "scale(0.5)", opacity: 0 }, { transform: "none", opacity: 1 }]}
          delay={1.3}
          duration={500}
          easing={POP}
        >
          <span className="grid size-14 place-items-center rounded-full bg-teal-ink font-display text-sm font-bold text-white">
            {latest.pct}%
          </span>
        </Play>
      </div>
      <div className="mt-2 flex justify-between text-sm text-grey">
        <span>{first.label}</span>
        <span>{latest.label}</span>
      </div>
    </div>
  );
}
