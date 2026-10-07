import { AwaitingContent } from "@/components/ui/primitives";
import { LessonFilm } from "@/components/lesson/LessonFilm";
import { Markdown } from "@/components/lesson/Markdown";
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
  const prose = lesson.bodyMarkdown ? <Markdown source={lesson.bodyMarkdown} /> : null;

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
