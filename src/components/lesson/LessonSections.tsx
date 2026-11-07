export type LessonSection = {
  /** The section's `##` heading as plain text, or null for prose before the first one. */
  title: string | null;
  content: React.ReactNode;
};

/** Fewer headings than this and numbering them is clutter. */
const NUMBER_MIN_SECTIONS = 2;

/**
 * A lesson's sections, one `<section>` per `##` heading.
 *
 * With two headings or more, each heading carries its number (01, 02 ...), drawn by
 * globals.css from a counter, so an author writes nothing for it. On a wide screen
 * the number sits in the margin beside its heading. This replaced a section map that
 * stuck under a step rail: the reader has no rail now, and the numbers tell you how
 * far into a step you are without anything following you down the page.
 */
export function LessonSections({ sections }: { sections: LessonSection[] }) {
  const titled = sections.filter((s) => s.title !== null).length;
  return (
    <div className={titled >= NUMBER_MIN_SECTIONS ? "lesson-sections is-numbered" : "lesson-sections"}>
      {sections.map((s, i) => (
        <section key={i} className="lesson-section">
          {s.content}
        </section>
      ))}
    </div>
  );
}
