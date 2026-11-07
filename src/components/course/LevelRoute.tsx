import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/parts";
import { Icon } from "@/components/ui/icons";
import { ButtonLink, Display, RecommendedPill, cx } from "@/components/ui/primitives";
import type { LevelWithPosition } from "@/lib/course";
import { LevelGlyph } from "./CourseArt";

/** The marker column and the content column, so every stop sits on the one line. */
const ROW = "grid grid-cols-[2.75rem_1fr] gap-x-3 min-[760px]:grid-cols-[6rem_1fr]";
/** The line's x: the middle of the marker column, inside the section's padding. */
const LINE_X = "left-[calc(0.75rem+1.375rem)] min-[760px]:left-[calc(1.5rem+3rem)]";

/** A marker sitting on the line, in the marker column. Pops in when scrolled to. */
function Stop({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div className="relative flex justify-center">
      <Reveal as="span" from="pop" className={cx("relative z-10 grid place-items-center rounded-full", className)}>
        {children}
      </Reveal>
    </div>
  );
}

/**
 * The Level chooser on the landing page and the course introduction, drawn as a route (prototype D, chosen on
 * zubayr-prototypes-ui). One dotted line runs from the section heading through every
 * Stage of every Level to the Advanced certificate, so the section is the course map
 * and no separate map is drawn. A teal line fills it as the section scrolls past
 * (globals.css, `.route-fill`), where the browser can tie that to the scroll.
 *
 * Stage numbers restart in each Level. Passed Stages are filled teal-ink with a tick;
 * the recommended Level's up-next Stage is pink with a ring and says "Up next" in
 * words, so colour never carries the state alone. Levels are told apart by name and
 * by drawing, never by colour (#10).
 */
export function LevelRoute({
  levels,
  recommendedSlug,
  signedIn,
  intro,
  title = "Choose your learning level",
}: {
  levels: LevelWithPosition[];
  /** The Level the page recommends: the Student's current Level, else the first. */
  recommendedSlug: string | undefined;
  signedIn: boolean;
  intro: ReactNode;
  /** The section heading. The course introduction names it for what the route shows. */
  title?: string;
}) {
  return (
    <section id="levels" className="scroll-mt-32 pb-20 min-[760px]:pb-28">
      <div className="relative mx-auto max-w-[64rem] px-3 min-[760px]:px-6">
        <span aria-hidden="true" className={cx("absolute bottom-[4.5rem] top-6 -ml-[1.5px] border-l-[3px] border-dotted border-line-strong", LINE_X)} />
        <span aria-hidden="true" className={cx("route-fill absolute bottom-[4.5rem] top-6 -ml-[1.5px] w-[3px] rounded-full bg-teal", LINE_X)} />

        <div className={ROW}>
          <Stop className="mt-1 size-10 bg-pink text-white ring-8 ring-pink-50 min-[760px]:size-12">
            <Icon name="flag" className="size-5" />
          </Stop>
          <div>
            <Display as="h2" className="text-[1.75rem] font-extrabold leading-[1.1] tracking-tight text-navy min-[760px]:text-[2.75rem]">
              {title}
            </Display>
            <div className="mt-4 max-w-[60ch] text-[1.0625rem] leading-[1.7] text-grey">{intro}</div>
          </div>
        </div>

        {levels.map((level, li) => {
          const p = level.position;
          const started = signedIn && p.status !== "NOT_STARTED";
          const recommended = level.slug === recommendedSlug;
          const href = signedIn
            ? started && p.resumeStageSlug
              ? `/levels/${level.slug}/modules/${p.resumeStageSlug}`
              : `/levels/${level.slug}`
            : `/register?next=${encodeURIComponent(`/levels/${level.slug}`)}`;

          return (
            <div key={level.slug} className="mt-14 min-[760px]:mt-20">
              <div className={ROW}>
                <Stop className="size-11 border-[3px] border-navy bg-white min-[760px]:size-16">
                  <span aria-hidden="true" className="font-display text-base font-bold text-navy min-[760px]:text-xl">
                    {li + 1}
                  </span>
                </Stop>
                <Reveal className="grid gap-6 min-[760px]:grid-cols-[1fr_11rem] min-[760px]:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Display as="h3" className="text-[1.75rem] font-bold leading-tight text-navy min-[760px]:text-[2.25rem]">
                        {level.title}
                      </Display>
                      {recommended && !started ? <RecommendedPill>Recommended start</RecommendedPill> : null}
                      {p.complete ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-navy">
                          <Icon name="check-circle" className="size-4 text-teal-ink" /> Complete
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-grey">{level.strapline}</p>
                    <p className="mt-3 max-w-[56ch] font-medium text-navy">{level.goal}</p>
                    <p className="mt-3 flex flex-wrap items-center gap-x-2 text-sm text-grey">
                      <Icon name="clock" className="size-4 text-teal-ink" />
                      {level.estMinMinutes} to {level.estMaxMinutes} minutes &middot; {level.modules.length} Stages
                      {started ? (
                        <>
                          {" "}
                          &middot; {p.stagesPassed} of {p.stagesTotal} passed
                        </>
                      ) : null}
                    </p>
                  </div>
                  <LevelGlyph index={li} className="hidden h-24 w-auto min-[760px]:block" />
                </Reveal>
              </div>

              <ol className="mt-6 grid gap-1">
                {level.modules.map((m, si) => {
                  const passed = m.position.state === "PASSED";
                  const next = recommended && m.position.upNext;
                  return (
                    <li key={m.slug} className={cx(ROW, "items-center")}>
                      <Stop
                        className={cx(
                          "size-7 font-display text-xs font-bold",
                          passed ? "bg-teal-ink text-white" : next ? "bg-pink text-white ring-4 ring-pink-100" : "bg-teal text-navy",
                        )}
                      >
                        {passed ? <Icon name="check" className="size-4" /> : <span aria-hidden="true">{si + 1}</span>}
                      </Stop>
                      <p className="py-2 text-[1.0625rem] text-navy">
                        <span className="sr-only">Stage {si + 1}: </span>
                        {m.title}
                        {passed ? <span className="sr-only"> (passed)</span> : null}
                        {next ? <span className="ml-2 text-sm font-medium text-pink">Up next</span> : null}
                      </p>
                    </li>
                  );
                })}
                <li className={cx(ROW, "items-center")}>
                  <Stop className="size-9 bg-pink text-white">
                    <Icon name="award" className="size-5" />
                  </Stop>
                  <p className="py-2 font-medium text-navy">
                    &ldquo;{level.certificateTitle}&rdquo; certificate
                    {p.certificateCode ? (
                      <Link href={`/certificate/${p.certificateCode}`} className="ml-2 text-sm text-teal-ink underline underline-offset-4">
                        View certificate
                      </Link>
                    ) : null}
                  </p>
                </li>
              </ol>

              <div className={cx(ROW, "mt-5")}>
                <div />
                <div>
                  <ButtonLink href={href} variant={recommended ? "primary" : "secondary"}>
                    {p.complete ? "Review this level" : started ? "Continue" : `Start ${level.title}`}
                  </ButtonLink>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
