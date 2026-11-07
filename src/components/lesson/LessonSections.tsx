"use client";

import { useEffect, useRef, useState } from "react";
import { RailStepper } from "@/components/portal/Portal";
import { useStepRailHeight } from "@/components/lesson/StepRail";

export type LessonSection = {
  /** The section's `##` heading as plain text, or null for prose before the first one. */
  title: string | null;
  content: React.ReactNode;
};

/** Fewer headings than this and a map is clutter: the step rail already says where you are. */
const MAP_MIN_SECTIONS = 3;

/**
 * A lesson's sections, with a map of them that follows the reader.
 *
 * The map is built from the lesson's own `##` headings, so an author writes nothing
 * for it. On a wide screen it sits beside the column and each heading jumps to its
 * section; below that it is a one-line strip under the step rail with a segment per
 * section. The strip is hidden from screen readers, which move by the headings
 * themselves.
 *
 * Both stick below the step rail, whose height changes with the screen and with its
 * "All steps" list, so it is measured rather than assumed.
 */
export function LessonSections({ sections }: { sections: LessonSection[] }) {
  const titled = sections.filter((s) => s.title !== null).length;
  const showMap = titled >= MAP_MIN_SECTIONS;
  const [active, setActive] = useState(0);
  const railHeight = useStepRailHeight(showMap);
  const refs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (!showMap) return;
    // The section crossing a band just above the middle of the screen is the one
    // being read.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.section));
        }
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [showMap, sections]);

  if (!showMap) {
    return sections.map((s, i) => (
      <section key={i} className="lesson-section">
        {s.content}
      </section>
    ));
  }

  const titles = sections.flatMap((s) => (s.title === null ? [] : [s.title]));
  // Each titled section's place in the map; prose before the first heading has none.
  const mapIndex = sections.map((s, i) =>
    s.title === null ? null : sections.slice(0, i).filter((t) => t.title !== null).length,
  );

  function jump(i: number) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    refs.current[i]?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        style={{ top: railHeight }}
        className="sticky z-20 -mx-5 mb-5 border-b border-line bg-white/95 px-5 py-2 backdrop-blur sm:-mx-8 sm:px-8 xl:hidden"
      >
        <p className="truncate text-[0.8125rem] leading-snug text-grey">
          Section {active + 1} of {titles.length}
          <span className="text-navy"> · {titles[active]}</span>
        </p>
        <div className="mt-1.5 flex gap-1">
          {titles.map((t, i) => (
            <span key={t} className={i <= active ? "h-1 flex-1 rounded-full bg-teal-ink" : "h-1 flex-1 rounded-full bg-line"} />
          ))}
        </div>
      </div>

      {sections.map((s, i) => {
        const index = mapIndex[i];
        return (
          <section
            key={i}
            className="lesson-section"
            data-section={index ?? undefined}
            style={{ scrollMarginTop: railHeight + 24 }}
            ref={(el) => {
              if (index !== null) refs.current[index] = el;
            }}
          >
            {s.content}
          </section>
        );
      })}

      <nav aria-label="Sections in this step" className="absolute inset-y-0 left-full ml-12 hidden w-56 xl:block">
        <div className="sticky" style={{ top: railHeight + 24 }}>
          <RailStepper
            label="Sections in this step"
            steps={titles.map((title, i) => ({
              key: title,
              title,
              state: i < active ? "passed" : i === active ? "current" : "todo",
              status: i === active ? "You are here" : i < active ? "Above" : "Further down",
              onSelect: () => jump(i),
            }))}
          />
        </div>
      </nav>
    </div>
  );
}
