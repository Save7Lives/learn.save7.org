import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { getBaselineState } from "@/lib/baseline";
import { getModuleForUser } from "@/lib/course";
import { getStageQuizStates } from "@/lib/quiz";
import { ModuleRunner, type RunnerLesson } from "@/components/lesson/ModuleRunner";
import { LessonBody } from "@/components/lesson/LessonBody";
import { StageQuiz } from "@/components/quiz/StageQuiz";
import {
  completeModuleAction,
  readStageQuizAction,
  startStageQuizAction,
  submitStageQuizAction,
  viewLessonAction,
} from "../../../actions";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/levels/[level]/modules/[module]">,
): Promise<Metadata> {
  const { level, module: moduleSlug } = await props.params;
  const data = await getModuleForUser(null, level, moduleSlug);
  if (!data) return { title: "Stage not found" };
  return { title: data.module.title, description: data.module.coreQuestion };
}

export default async function ModulePage(
  props: PageProps<"/levels/[level]/modules/[module]">,
) {
  const { level: levelSlug, module: moduleSlug } = await props.params;
  const user = await requireUser(`/levels/${levelSlug}/modules/${moduleSlug}`);

  // The first Baseline Sitting is a gate: a "before" taken after reading a Stage
  // is not a before, and without it there is nothing to measure improvement
  // against (#54). Its score gates nothing, and no later Sitting is required.
  const baseline = await getBaselineState(user.id);
  if (!baseline.completed) redirect("/assessment/pre");

  const data = await getModuleForUser(user.id, levelSlug, moduleSlug);
  if (!data) notFound();

  const { level, module: mod, siblings, progress } = data;

  // The CHECK step is this Stage's quiz, and the Stage stepper draws every Stage's
  // dot from its quiz. Only where the learner stands is read here, for all the
  // Level's Stages at once; the paper is drawn when they open it, so visiting a
  // Stage never starts an attempt.
  const quizStates = await getStageQuizStates(siblings.map((s) => s.slug));
  const quizState = quizStates.get(mod.id) ?? null;
  const stageQuiz = (
    <StageQuiz
      stageSlug={mod.id}
      passMarkPct={level.passMarkPct}
      certificateTitle={level.certificateTitle}
      initialState={quizState}
      onStart={startStageQuizAction}
      onSubmit={submitStageQuizAction}
      onReview={readStageQuizAction}
    />
  );

  const stages = siblings.map((s) => ({
    slug: s.slug,
    title: s.title,
    passed: quizStates.get(s.slug)?.passedAt != null,
  }));

  const currentIndex = siblings.findIndex((s) => s.slug === moduleSlug);
  const nextSibling = siblings[currentIndex + 1] ?? null;

  // The Finish step is generated from the Stage's own data rather than authored
  // per Stage, so it can never drift from the content above it.
  const moduleContext = {
    stageTitle: mod.title,
    coreQuestion: mod.coreQuestion,
    nextStageTitle: nextSibling?.title ?? null,
    levelTitle: level.title,
    levelSlug,
    isLastInLevel: nextSibling === null,
    certificateTitle: level.certificateTitle,
    alreadyComplete: progress?.status === "COMPLETE",
    quizPassed: quizState?.passedAt != null,
  };

  const lessons: RunnerLesson[] = mod.lessons.map((lesson) => ({
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    kind: lesson.kind,
    content: (
      <LessonBody
        lesson={lesson}
        stageQuiz={lesson.kind === "CHECK" ? stageQuiz : undefined}
        moduleContext={lesson.kind === "COMPLETE" ? moduleContext : undefined}
      />
    ),
  }));

  // Resume where they left off.
  const lastIndex = progress?.lastLessonId
    ? mod.lessons.findIndex((l) => l.id === progress.lastLessonId)
    : 0;

  return (
    <ModuleRunner
      lessons={lessons}
      levelSlug={levelSlug}
      moduleSlug={moduleSlug}
      stageTitle={mod.title}
      stageNumber={currentIndex + 1}
      stages={stages}
      coreQuestion={mod.coreQuestion}
      levelTitle={level.title}
      estMinutes={mod.estMinutes}
      isComplete={progress?.status === "COMPLETE"}
      initialLessonIndex={lastIndex >= 0 ? lastIndex : 0}
      onViewLesson={viewLessonAction}
      onComplete={completeModuleAction}
      nextStageTitle={nextSibling?.title ?? null}
    />
  );
}
