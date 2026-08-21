import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { getBaselineState, getModuleForUser } from "@/lib/course";
import { getCheckQuestions } from "@/lib/quiz";
import { ModuleRunner, type RunnerLesson } from "@/components/lesson/ModuleRunner";
import { LessonBody } from "@/components/lesson/LessonBody";
import { TIER_META } from "@/components/ui/primitives";
import type { LevelTier } from "@/lib/constants";
import { mediaUrl, resolvePayloadMedia } from "@/lib/media";
import { completeModuleAction, viewLessonAction } from "../../../actions";

/**
 * Edge runtime, required by Cloudflare Pages.
 *
 * `@cloudflare/next-on-pages` refuses to build a route that renders on the
 * Node runtime — every server-rendered route on Pages runs on workerd. This is
 * the whole reason the app is pinned to Next 15.5.2: the adapter supports no
 * higher, and OpenNext (which does not need this) supports no lower.
 */
export const runtime = "edge";

export async function generateMetadata(
  props: PageProps<"/levels/[level]/modules/[module]">,
): Promise<Metadata> {
  const { level, module: moduleSlug } = await props.params;
  const data = await getModuleForUser(null, level, moduleSlug);
  if (!data) return { title: "Module not found" };
  return { title: data.module.title, description: data.module.coreQuestion };
}

export default async function ModulePage(
  props: PageProps<"/levels/[level]/modules/[module]">,
) {
  const { level: levelSlug, module: moduleSlug } = await props.params;
  const user = await requireUser(`/levels/${levelSlug}/modules/${moduleSlug}`);

  // The baseline is a gate: without it there is nothing to measure improvement
  // against, which is the whole point of the assessment design.
  const baseline = await getBaselineState(user.id);
  if (!baseline.completed) redirect("/assessment/pre");

  const data = await getModuleForUser(user.id, levelSlug, moduleSlug);
  if (!data) notFound();

  const { level, module: mod, siblings, progress } = data;
  const tier = level.tier as LevelTier;

  // Inline check questions are fetched here and rendered on the server, so the
  // answer key is never serialised into the client bundle.
  const checkQuestions = await getCheckQuestions(mod.id);

  const resources = mod.resources.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    type: r.type,
    isRequired: r.isRequired,
    source: r.source,
    author: r.author,
    externalUrl: r.externalUrl,
    filePath: mediaUrl(r.filePath),
    licenceNote: r.licenceNote,
    isStub: r.isStub,
  }));

  const currentIndex = siblings.findIndex((s) => s.slug === moduleSlug);
  const nextSibling = siblings[currentIndex + 1] ?? null;

  // The completion step is generated from the module's own data rather than
  // authored per module, so it can never drift from the content above it.
  const takeawayLesson = mod.lessons.find((l) => l.kind === "TAKEAWAYS");
  const takeaways = (() => {
    if (!takeawayLesson?.payloadJson) return [];
    try {
      const parsed = JSON.parse(takeawayLesson.payloadJson) as {
        takeaways?: Array<{ text?: string }>;
      };
      return (parsed.takeaways ?? [])
        .map((t) => t.text)
        .filter((t): t is string => typeof t === "string" && t.length > 0);
    } catch {
      return [];
    }
  })();

  const moduleContext = {
    moduleTitle: mod.title,
    coreQuestion: mod.coreQuestion,
    takeaways,
    nextModuleTitle: nextSibling?.title ?? null,
    levelTitle: level.title,
    levelSlug,
    isLastInLevel: nextSibling === null,
    certificateTitle: level.certificateTitle,
    alreadyComplete: progress?.status === "COMPLETE",
  };

  const lessons: RunnerLesson[] = mod.lessons.map((lesson) => ({
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    kind: lesson.kind,
    content: (
      <LessonBody
        lesson={{ ...lesson, payloadJson: resolvePayloadMedia(lesson.payloadJson) }}
        questions={lesson.kind === "CHECK" ? checkQuestions : []}
        resources={resources}
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
      moduleTitle={mod.title}
      moduleNumber={mod.order}
      coreQuestion={mod.coreQuestion}
      levelTitle={level.title}
      tierLabel={TIER_META[tier].label}
      tierDotClass={TIER_META[tier].dotClass}
      estMinutes={mod.estMinutes}
      isComplete={progress?.status === "COMPLETE"}
      initialLessonIndex={lastIndex >= 0 ? lastIndex : 0}
      onViewLesson={viewLessonAction}
      onComplete={completeModuleAction}
      nextModuleTitle={nextSibling?.title ?? null}
    />
  );
}
