import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/components/ui/primitives";
import type { LevelWithPosition } from "@/lib/course";
import { StepDot } from "@/components/portal/Portal";
import { AwardNode } from "./AwardNode";

/**
 * The course map (#73): three Level groups on one dotted connector, a dot for each
 * Stage (numbers restart per Level) and an award node closing each group.
 *
 * Only the recommended Level's up-next Stage gets the ring, so the map points at one
 * place. Below 760px the groups stack, one per row, with no connector between them.
 * Signed out, every Stage's position is untouched and every dot is not started.
 */
export function CourseMap({
  levels,
  recommendedSlug,
}: {
  levels: LevelWithPosition[];
  /** The Level the page recommends: the Student's current Level, else the first. */
  recommendedSlug: string | undefined;
}) {
  const stageCount = levels.reduce((n, l) => n + l.modules.length, 0);
  const anyStarted = levels.some((l) => l.position.status !== "NOT_STARTED");

  return (
    <>
      <div
        role="group"
        aria-label={`The course: ${levels.length} Levels, ${stageCount} Stages, ${levels.length} certificates`}
        className="mb-1.5 mt-8 flex flex-col gap-6 rounded-[1.375rem] border border-line bg-white px-2 pb-4 pt-5 min-[760px]:flex-row min-[760px]:px-3 min-[760px]:pb-5 min-[760px]:pt-6"
      >
        {levels.map((level, li) => {
          const earned = level.position.certificateCode != null;
          return (
            <div
              key={level.slug}
              className="min-w-0 min-[760px]:[flex:var(--n)_1_0]"
              style={{ "--n": level.modules.length + 1 } as CSSProperties}
            >
              <div className="flex flex-col gap-0.5 px-3 pb-4">
                <b className="font-display text-lg font-bold leading-tight text-navy">{level.title}</b>
                <span className="text-[0.8125rem] text-grey">
                  {level.modules.length} Stages &middot; {level.estMinMinutes} to{" "}
                  {level.estMaxMinutes} min
                </span>
              </div>
              <ol className="m-0 flex list-none p-0">
                {level.modules.map((m, i) => {
                  const passed = m.position.state === "PASSED";
                  const isNext = level.slug === recommendedSlug && m.position.upNext;
                  return (
                    <Node key={m.slug} firstOfMap={li === 0 && i === 0} firstOfGroup={i === 0}>
                      <StepDot
                        n={i + 1}
                        state={passed ? "passed" : isNext ? "current" : "todo"}
                      />
                      <span className="sr-only">
                        Stage {i + 1}, {m.title}: {stageWord(passed, isNext)}
                      </span>
                    </Node>
                  );
                })}
                <Node firstOfMap={false} firstOfGroup={false}>
                  <AwardNode earned={earned} />
                  <span className="mt-1 text-xs leading-snug text-grey">Certificate</span>
                  <span className="sr-only">
                    {level.title} certificate,{" "}
                    {earned ? "earned" : "not yet earned"}
                  </span>
                </Node>
              </ol>
            </div>
          );
        })}
      </div>

      {anyStarted ? (
        <div aria-hidden="true" className="mx-1 mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.8125rem] text-grey">
          <Key><StepDot n={1} state="passed" className="size-5 text-[0.75rem]" />Quiz passed</Key>
          <Key><StepDot n={3} state="current" className="size-5 text-[0.75rem]" />Up next</Key>
          <Key><StepDot n={4} state="todo" className="size-5 text-[0.75rem]" />Not started</Key>
          <Key><AwardNode earned className="size-5" />Certificate earned</Key>
        </div>
      ) : (
        <p className="mx-1 mt-3 text-[0.8125rem] text-grey">
          Stage numbers restart in each Level. Every Level ends in its own certificate.
        </p>
      )}
    </>
  );
}

function stageWord(passed: boolean, isNext: boolean): string {
  return passed ? "quiz passed" : isNext ? "up next" : "not started";
}

function Key({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-2">{children}</span>;
}

/**
 * One node on the dotted connector. The dotted line is this node's left half, drawn
 * from the previous node, so the first node of the map has none; below 760px each
 * Level is its own row, so the first node of every group has none.
 */
function Node({
  children,
  firstOfMap,
  firstOfGroup,
}: {
  children: ReactNode;
  firstOfMap: boolean;
  firstOfGroup: boolean;
}) {
  return (
    <li
      className={cx(
        "relative flex min-w-0 flex-1 flex-col items-center text-center",
        "before:absolute before:left-[calc(-50%+22px)] before:right-[calc(50%+22px)] before:top-[15px] before:border-t-[3px] before:border-dotted before:border-line-strong before:content-['']",
        firstOfMap && "before:hidden",
        firstOfGroup && !firstOfMap && "max-[759px]:before:hidden",
      )}
    >
      {children}
    </li>
  );
}
