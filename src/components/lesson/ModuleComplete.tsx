import Link from "next/link";
import { Badge, Card, Display, Eyebrow } from "@/components/ui/primitives";

export type ModuleCompleteContext = {
  moduleTitle: string;
  coreQuestion: string;
  /** Pulled from this module's own takeaways lesson — already written and reviewed. */
  takeaways: string[];
  nextModuleTitle: string | null;
  levelTitle: string;
  levelSlug: string;
  /** True when this is the last module in the level, so the assessment is next. */
  isLastInLevel: boolean;
  certificateTitle: string;
  alreadyComplete: boolean;
};

/**
 * The final step of every module.
 *
 * The brief asks for an explicit completion step rather than inferring completion
 * from scrolling, and this is it: a recap, then a deliberate action (the button
 * lives in the runner's footer, immediately below).
 *
 * Everything here is derived from the module's own data — its core question, its
 * takeaways, its position in the level. Nothing is authored per module. That means
 * it cannot drift out of sync with the content, and it adds nothing to Save7's
 * review queue, which a thirteenth hand-written summary would.
 *
 * Recapping at the point of completion is also the pedagogically useful moment:
 * the learner is asked whether they could now answer the question the module
 * opened with, which is the only test that matters for this course.
 */
export function ModuleComplete({ context }: { context: ModuleCompleteContext }) {
  const {
    coreQuestion,
    takeaways,
    nextModuleTitle,
    levelTitle,
    levelSlug,
    isLastInLevel,
    certificateTitle,
    alreadyComplete,
  } = context;

  return (
    <div>
      {/* The module opened with this question. Closing the loop on it is the
          point of the step. */}
      <Card className="border-teal-100 bg-teal-50 p-6">
        <Eyebrow className="text-teal-deep">The question this module asked</Eyebrow>
        <p className="mt-2 text-lg font-medium text-ink">{coreQuestion}</p>
        <p className="mt-3 text-sm text-sand-700">
          Could you answer that in a conversation now, in your own words? That is the
          only test that matters here.
        </p>
      </Card>

      {takeaways.length > 0 ? (
        <section className="mt-8">
          <Display as="h3" className="text-xl text-ink">
            What you covered
          </Display>
          <ul className="mt-4 space-y-2">
            {takeaways.map((takeaway, i) => (
              <li key={i} className="flex gap-3 text-sand-700">
                <span aria-hidden="true" className="mt-1 shrink-0 text-correct">
                  ✓
                </span>
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-sand-500">
            The{" "}
            <span className="font-semibold text-sand-600">study guide</span> step has
            this in writing if you want to keep it.
          </p>
        </section>
      ) : null}

      <section className="mt-8 border-t border-sand-200 pt-6">
        <Display as="h3" className="text-xl text-ink">
          {alreadyComplete ? "You've completed this module" : "Ready to mark it complete?"}
        </Display>

        {alreadyComplete ? (
          <p className="mt-2 text-sand-700">
            This module is recorded as complete. You can revisit any step at any time —
            nothing is locked once you have been through it.
          </p>
        ) : (
          <p className="mt-2 text-sand-700">
            Marking the module complete records your progress, so you can stop here and
            pick up later without losing your place.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {isLastInLevel ? (
            <>
              <Badge tone="pink">Last module in {levelTitle}</Badge>
              <p className="text-sm text-sand-600">
                Completing this unlocks the assessment — pass it and you earn the{" "}
                <strong className="text-ink">&ldquo;{certificateTitle}&rdquo;</strong>{" "}
                certificate.
              </p>
            </>
          ) : nextModuleTitle ? (
            <p className="text-sm text-sand-600">
              Next up:{" "}
              <strong className="text-ink">{nextModuleTitle}</strong>. The button below
              takes you straight there.
            </p>
          ) : null}
        </div>

        <p className="mt-4 text-sm text-sand-500">
          Or go back to{" "}
          <Link
            href={`/levels/${levelSlug}`}
            className="font-semibold text-pink-600 underline"
          >
            all modules in {levelTitle}
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
