import { AwaitingContent } from "@/components/ui/primitives";
import { LessonFilm } from "@/components/lesson/LessonFilm";
import { Markdown } from "@/components/lesson/Markdown";
import { LessonSections, type LessonSection } from "@/components/lesson/LessonSections";
import { LessonWidgetView } from "@/components/lesson/LessonWidget";
import { splitLessonBody } from "@/lib/lesson-widgets";
import {
  ModuleComplete,
  type ModuleCompleteContext,
} from "@/components/lesson/ModuleComplete";

export type LessonRow = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  bodyMarkdown: string | null;
  /** A film registered in src/lib/films.ts, shown above the prose, or null. */
  filmKey?: string | null;
};

type LessonBodyProps = {
  lesson: LessonRow;
  /** The CHECK step's Stage Quiz, built by the Stage page, which holds the learner's state. */
  stageQuiz?: React.ReactNode;
  /** Only needed by the COMPLETE step, which is generated from module data. */
  moduleContext?: ModuleCompleteContext;
};

/**
 * Renders one lesson.
 *
 * A lesson is its Markdown prose (content/<level>/<stage>/*.md, emitted into
 * `learn_lessons.body_markdown`). Two kinds add something the Stage page builds:
 * CHECK is the Stage Quiz (#57), and COMPLETE is generated from the Stage's own
 * data.
 *
 * The prose may carry interactive blocks between its paragraphs (`:::compare` and
 * the rest, `src/lib/lesson-widgets.ts`), and is cut into sections at its `##`
 * headings so that a long lesson gets a map of them (`LessonSections`).
 *
 * A lesson may also open with a film (`filmKey`, a registry key from the lesson's
 * `video:` front matter), shown above everything else. Beginner Stage 3's intro
 * is the only one (#61).
 *
 * The prior build dispatched here on `componentKey` to eleven interactive
 * components fed by jsonb payloads. No lesson had used one since #33, and #58
 * retired them: tables are Markdown now, and the film is the one media primitive.
 * `learn_lessons.component_key` survives as the column that carries the film's
 * registry key, and nothing in it is ever dispatched on or rendered as a URL.
 */
export function LessonBody(props: LessonBodyProps) {
  return (
    <>
      <LessonFilm filmKey={props.lesson.filmKey} />
      <LessonContent {...props} />
    </>
  );
}

function LessonContent({ lesson, stageQuiz, moduleContext }: LessonBodyProps) {
  // Key takeaways is the one kind with its own look, so it is applied here by kind
  // and the lesson's Markdown stays a plain list (globals.css, .takeaways).
  const prose = lesson.bodyMarkdown ? (
    <LessonSections
      sections={toSections(
        lesson.bodyMarkdown,
        lesson.kind === "TAKEAWAYS" ? "lesson-prose takeaways" : "lesson-prose",
      )}
    />
  ) : null;

  if (lesson.kind === "CHECK") {
    return <Wrapped prose={prose}>{stageQuiz ?? null}</Wrapped>;
  }

  if (lesson.kind === "COMPLETE") {
    return (
      <Wrapped prose={prose}>
        {moduleContext ? (
          <ModuleComplete context={moduleContext} />
        ) : (
          // Should not happen: the module page always supplies this. Renders
          // nothing rather than an "awaiting content" box, which would wrongly
          // suggest a gap in the course material.
          null
        )}
      </Wrapped>
    );
  }

  return prose ?? <AwaitingContent />;
}

function Wrapped({
  prose,
  children,
}: {
  prose: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      {prose ? <div className="mb-8">{prose}</div> : null}
      {children}
    </>
  );
}

/**
 * The lesson cut into sections at its `##` headings, each holding its prose and any
 * interactive blocks in order. Splitting on blank-line blocks is safe because the
 * renderer itself reads Markdown a block at a time, so the HTML is what it was.
 *
 * A block the parser refused is shown as prose. `loadLesson()` refuses the same
 * block, so this only guards content that reached the database some other way.
 */
function toSections(body: string, proseClass: string): LessonSection[] {
  type Part = { key: string; node: React.ReactNode };
  const sections: Array<{ title: string | null; parts: Part[] }> = [{ title: null, parts: [] }];
  const current = () => sections[sections.length - 1];
  const prose = (source: string, key: string) =>
    current().parts.push({ key, node: <Markdown key={key} source={source} className={proseClass} /> });

  splitLessonBody(body).forEach((segment, i) => {
    if (segment.kind === "widget") {
      current().parts.push({ key: `w${i}`, node: <LessonWidgetView key={`w${i}`} widget={segment.widget} /> });
      return;
    }
    let run: string[] = [];
    segment.source.split(/\n{2,}/).forEach((block, j) => {
      const heading = block.trim().match(/^## (.+)$/m);
      if (heading && block.trim().startsWith("## ")) {
        if (run.length) prose(run.join("\n\n"), `p${i}-${j}`);
        run = [];
        sections.push({ title: heading[1].replace(/[*_`]/g, "").trim(), parts: [] });
      }
      run.push(block);
    });
    if (run.length) prose(run.join("\n\n"), `p${i}-end`);
  });

  return sections
    .filter((s) => s.parts.length)
    .map((s) => ({ title: s.title, content: s.parts.map((p) => p.node) }));
}
