import { Card, Eyebrow } from "@/components/ui/primitives";

export type StageEndContext = {
  coreQuestion: string;
  /** The Read Mark: the Stage has been read before. Not completion. */
  alreadyRead: boolean;
};

/**
 * The end of every Stage, under its Stage Quiz.
 *
 * The Stage Quiz is the last step. There used to be a separate Finish step after it
 * (save7-os 0148 deletes it); what it said now closes the quiz step, shown whenever
 * the learner is not mid-paper: the question the Stage opened with, what finishing
 * records, and the Stage's sources. The deliberate action is the runner's "Finish
 * this Stage" button, immediately below, with where it leads beneath it.
 *
 * Nothing here depends on the quiz. Whether it is passed, the latest mark and the
 * route through the Level are the Stage Quiz's own, because only it knows about an
 * attempt marked a moment ago.
 *
 * Everything above the sources is derived from the Stage's own data. The one
 * authored part is the sources list, the Stage's `sources.md`, which names every
 * document the Stage relies on.
 *
 * Finishing records that the Stage was *read*. A Stage counts as complete when its
 * Stage Quiz is passed (Progress Record, CONTEXT.md), and the quiz card above says
 * that rather than let "finish" imply it.
 */
export function StageEnd({
  context,
  sources,
}: {
  context: StageEndContext;
  /** The Stage's sources list (its `sources.md`), rendered last. */
  sources?: React.ReactNode;
}) {
  const { coreQuestion, alreadyRead } = context;

  return (
    <div className="mt-9">
      {/* The Stage opened with this question. Closing the loop on it is the point. */}
      <Card className="border-teal-line bg-teal-50 p-5">
        <Eyebrow className="text-teal-ink">The question this Stage asked</Eyebrow>
        <p className="mt-2 text-lg font-medium leading-7 text-navy">{coreQuestion}</p>
        <p className="mt-2.5 text-sm text-grey">
          Could you answer that in a conversation now, in your own words? That is the only test that
          matters here.
        </p>
      </Card>

      <p className="mt-5 text-base leading-7 text-grey">
        {alreadyRead
          ? "This Stage is recorded as read. You can revisit any step at any time. Nothing is locked once you have been through it."
          : "Finishing records that you have read this Stage, so you can stop here and pick up later without losing your place."}
      </p>


      {sources ? (
        <section className="mt-9 border-t border-line pt-6">
          <h3 className="t-h3 text-navy">Sources for this Stage</h3>
          <div className="mt-3">{sources}</div>
        </section>
      ) : null}
    </div>
  );
}
