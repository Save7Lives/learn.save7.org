import { AwaitingContent } from "@/components/ui/primitives";
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
};

/**
 * Renders one lesson.
 *
 * A lesson is its Markdown prose (content/<level>/<stage>/*.md, emitted into
 * `learn_lessons.body_markdown`). Two kinds add something the Stage page builds:
 * CHECK is the Stage Quiz (#57), and COMPLETE is generated from the Stage's own
 * data.
 *
 * The prior build dispatched here on `componentKey` to eleven interactive
 * components fed by jsonb payloads. No lesson had used one since #33, and #58
 * retired them: tables are Markdown now, and the Stage 3 film gets a primitive
 * of its own (#61).
 */
export function LessonBody({
  lesson,
  stageQuiz,
  moduleContext,
}: {
  lesson: LessonRow;
  /** The CHECK step's Stage Quiz, built by the Stage page, which holds the learner's state. */
  stageQuiz?: React.ReactNode;
  /** Only needed by the COMPLETE step, which is generated from module data. */
  moduleContext?: ModuleCompleteContext;
}) {
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
