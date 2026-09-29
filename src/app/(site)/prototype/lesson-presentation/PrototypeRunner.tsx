"use client";

/**
 * PROTOTYPE (T58), throwaway. The real ModuleRunner with stub actions, plus a
 * note saying what the current variant changed.
 *
 * Stepping records the current step in `?at=`, so flipping variants keeps you on
 * the same lesson. Nothing is written anywhere.
 */
import { ModuleRunner, type RunnerLesson } from "@/components/lesson/ModuleRunner";
import { PrototypeSwitcher } from "@/components/prototype/PrototypeSwitcher";

export type ProtoLesson = RunnerLesson;

export function PrototypeRunner({
  variant,
  variants,
  notes,
  changedStepTitle,
  lessons,
  initialLessonIndex,
  ...stage
}: {
  variant: string;
  variants: Array<{ key: string; name: string }>;
  notes: string[];
  changedStepTitle: string;
  lessons: ProtoLesson[];
  initialLessonIndex: number;
  moduleTitle: string;
  moduleNumber: number;
  coreQuestion: string;
  estMinutes: number;
  levelTitle: string;
  tierLabel: string;
  tierDotClass: string;
}) {
  async function onViewLesson(_stage: string, lessonId: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("at", lessonId);
    window.history.replaceState(null, "", url);
  }

  async function onComplete() {
    return { error: "Prototype: nothing is saved." };
  }

  const current = variants.find((v) => v.key === variant);

  return (
    <>
      <aside className="border-b-2 border-dashed border-teal-500/50 bg-white">
        <div className="mx-auto max-w-3xl px-5 py-4 text-sm sm:px-8">
          <p className="font-bold text-ink">
            Prototype · Variant {variant}: {current?.name}
          </p>
          <p className="mt-1 text-sand-600">
            The change is on the <strong>{changedStepTitle}</strong> step.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sand-600">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      </aside>

      <ModuleRunner
        lessons={lessons}
        levelSlug="beginner"
        moduleSlug="how-donation-works"
        isComplete={false}
        initialLessonIndex={initialLessonIndex}
        onViewLesson={onViewLesson}
        onComplete={onComplete}
        nextModuleTitle={null}
        {...stage}
      />

      <PrototypeSwitcher variants={variants} current={variant} />
    </>
  );
}
