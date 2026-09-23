import { AwaitingContent, PendingReview } from "@/components/ui/primitives";
import { parsePayload } from "@/lib/lesson-payloads";
import type {
  ChapterVideoPayload,
  ComparePanelPayload,
  EligibilityMatrixPayload,
  MythFlipPayload,
  OrganExplorerPayload,
  PathwayJourneyPayload,
  ResourceListPayload,
  ScenarioDialoguePayload,
  StudyGuidePayload,
  TakeawayListPayload,
  TeamRosterPayload,
} from "@/lib/lesson-payloads";

import { ChapterVideo } from "@/components/interactive/ChapterVideo";
import { ComparePanel } from "@/components/interactive/ComparePanel";
import { EligibilityMatrix } from "@/components/interactive/EligibilityMatrix";
import { MythFlip } from "@/components/interactive/MythFlip";
import { OrganExplorer } from "@/components/interactive/OrganExplorer";
import { PathwayJourney } from "@/components/interactive/PathwayJourney";
import { ResourceList, type ResourceRow } from "@/components/interactive/ResourceList";
import { ScenarioDialogue } from "@/components/interactive/ScenarioDialogue";
import { TakeawayList } from "@/components/interactive/TakeawayList";
import { TeamRoster } from "@/components/interactive/TeamRoster";
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
  componentKey: string | null;
  payloadJson: string | null;
};

/**
 * Renders one lesson.
 *
 * The dispatch on `componentKey` is the seam that keeps course content out of the
 * codebase: a lesson is a database row naming a component and carrying its data,
 * so Save7 can eventually author lessons through a CMS without a deploy. Adding a
 * new kind of interaction means adding one case here and one payload type.
 */
export function LessonBody({
  lesson,
  stageQuiz,
  resources,
  moduleContext,
}: {
  lesson: LessonRow;
  /** The CHECK step's Stage Quiz, built by the Stage page, which holds the learner's state. */
  stageQuiz?: React.ReactNode;
  resources: ResourceRow[];
  /** Only needed by the COMPLETE step, which is generated from module data. */
  moduleContext?: ModuleCompleteContext;
}) {
  const prose = lesson.bodyMarkdown ? <Markdown source={lesson.bodyMarkdown} /> : null;

  switch (lesson.componentKey) {
    case "OrganExplorer":
      return (
        <Wrapped prose={prose}>
          <OrganExplorer
            payload={parsePayload<OrganExplorerPayload>(lesson.payloadJson)!}
          />
        </Wrapped>
      );

    case "PathwayJourney":
      return (
        <Wrapped prose={prose}>
          <PathwayJourney
            payload={parsePayload<PathwayJourneyPayload>(lesson.payloadJson)!}
          />
        </Wrapped>
      );

    case "MythFlip":
      return (
        <Wrapped prose={prose}>
          <MythFlip payload={parsePayload<MythFlipPayload>(lesson.payloadJson)!} />
        </Wrapped>
      );

    case "ScenarioDialogue":
      return (
        <Wrapped prose={prose}>
          <ScenarioDialogue
            payload={parsePayload<ScenarioDialoguePayload>(lesson.payloadJson)!}
          />
        </Wrapped>
      );

    case "ComparePanel":
      return (
        <Wrapped prose={prose}>
          <ComparePanel payload={parsePayload<ComparePanelPayload>(lesson.payloadJson)!} />
        </Wrapped>
      );

    case "TeamRoster":
      return (
        <Wrapped prose={prose}>
          <TeamRoster payload={parsePayload<TeamRosterPayload>(lesson.payloadJson)!} />
        </Wrapped>
      );

    case "EligibilityMatrix":
      return (
        <Wrapped prose={prose}>
          <EligibilityMatrix
            payload={parsePayload<EligibilityMatrixPayload>(lesson.payloadJson)!}
          />
        </Wrapped>
      );

    case "ChapterVideo":
      return (
        <Wrapped prose={prose}>
          <ChapterVideo payload={parsePayload<ChapterVideoPayload>(lesson.payloadJson)!} />
        </Wrapped>
      );

    case "TakeawayList":
      return (
        <Wrapped prose={prose}>
          <TakeawayList payload={parsePayload<TakeawayListPayload>(lesson.payloadJson)!} />
        </Wrapped>
      );

    case "ResourceList":
      return (
        <Wrapped prose={prose}>
          <ResourceList
            payload={parsePayload<ResourceListPayload>(lesson.payloadJson)}
            resources={resources}
          />
        </Wrapped>
      );

    default:
      break;
  }

  // Lessons without a component: the study guide, and plain prose steps.
  /* The CHECK step is the Stage Quiz (#57). The inline check-your-understanding
     block it used to hold (QuizBlock, CHECK-scope questions) has no content since
     #33, and whether any interactive component returns is #58's question. */
  if (lesson.kind === "CHECK") {
    return <Wrapped prose={prose}>{stageQuiz ?? null}</Wrapped>;
  }

  /* Since #33, a study guide and a reading list are Markdown prose in the lesson
     itself (content/<level>/<stage>/*.md). The payload and resources-table forms
     below are the prior build's, kept as the fallback for a lesson without prose. */
  if (lesson.kind === "STUDY_GUIDE") {
    if (prose) return prose;
    return (
      <StudyGuide payload={parsePayload<StudyGuidePayload>(lesson.payloadJson)} />
    );
  }

  if (lesson.kind === "FURTHER_READING") {
    if (prose) {
      // No empty-state box under written prose: it would suggest a gap that isn't there.
      return resources.length > 0 ? (
        <Wrapped prose={prose}>
          <ResourceList payload={null} resources={resources} />
        </Wrapped>
      ) : (
        prose
      );
    }
    return <ResourceList payload={null} resources={resources} />;
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

const PENDING = "_Content pending._";

function StudyGuide({ payload }: { payload: StudyGuidePayload | null }) {
  if (!payload) return <AwaitingContent />;

  return (
    <div>
      {payload.summary ? <p className="text-sand-600">{payload.summary}</p> : null}

      <div className="mt-6 space-y-5">
        {payload.sections?.map((section) => {
          const hasBody = section.body && !section.body.startsWith(PENDING);
          return (
            <section
              key={section.id}
              className="rounded-card border border-sand-200 bg-white p-5"
            >
              <h3 className="font-bold text-ink">{section.heading}</h3>

              {hasBody ? (
                <div className="prose-save7 mt-2 text-sm">
                  <Markdown source={section.body!} />
                </div>
              ) : section.bullets?.length ? null : (
                <AwaitingContent className="mt-3" />
              )}

              {section.bullets?.length ? (
                <ul className="mt-3 space-y-1.5">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2.5 text-sm text-sand-700">
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-pink-200"
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}

              {section.pendingReview ? (
                <p className="mt-3">
                  <PendingReview />
                </p>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
