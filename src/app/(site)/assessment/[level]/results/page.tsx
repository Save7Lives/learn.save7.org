import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { getLevelBySlug } from "@/lib/course";
import { getKnowledgeImpact } from "@/lib/impact";
import { issueCertificateIfEarned } from "@/lib/certificates";
import {
  Badge,
  ButtonLink,
  Card,
  Display,
  Eyebrow,
  ProgressBar,
} from "@/components/ui/primitives";
import { ImpactBars } from "@/components/course/ImpactBars";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Cloudflare applies at deploy time. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Your learning journey" };

/**
 * The knowledge impact screen.
 *
 * Deliberately non-competitive: no rank, no percentile, no comparison to other
 * learners. The only comparison is the learner against their own starting point,
 * which is the only comparison that means anything educationally.
 */
export default async function ResultsPage(
  props: PageProps<"/assessment/[level]/results">,
) {
  const { level: levelSlug } = await props.params;
  const user = await requireUser(`/assessment/${levelSlug}/results`);

  const level = await getLevelBySlug(levelSlug);
  if (!level) notFound();

  const impact = await getKnowledgeImpact(user.id, level.id);
  if (!impact.after) redirect(`/levels/${levelSlug}`);

  // Issuing here rather than during grading keeps the grader free of side effects,
  // and this is the first screen where the learner could possibly have earned it.
  const certificate = await issueCertificateIfEarned(user.id, level.id);

  const gained = impact.absolutePointChange ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
      <Eyebrow>{level.title} · assessment complete</Eyebrow>
      <Display as="h1" className="mt-4 text-display text-ink">
        Your learning journey
      </Display>

      {/* --- Headline comparison ------------------------------------------ */}
      <Card className="mt-8 overflow-hidden">
        <div className="grid sm:grid-cols-3">
          <div className="border-b border-sand-200 p-6 sm:border-b-0 sm:border-r">
            <p className="text-xs font-bold uppercase tracking-wider text-sand-500">
              Before the course
            </p>
            <p className="mt-2 font-display text-5xl text-sand-500">
              {impact.before ? `${impact.before.scorePct}%` : "—"}
            </p>
            <p className="mt-1 text-xs text-sand-400">
              {impact.before
                ? `${impact.before.raw} of ${impact.before.max} · baseline`
                : "No baseline recorded"}
            </p>
          </div>

          <div className="border-b border-sand-200 p-6 sm:border-b-0 sm:border-r">
            <p className="text-xs font-bold uppercase tracking-wider text-sand-500">
              After the course
            </p>
            <p className="mt-2 font-display text-5xl text-ink">
              {impact.after.scorePct}%
            </p>
            <p className="mt-1 text-xs text-sand-400">
              {impact.after.raw} of {impact.after.max} · {level.title}
            </p>
          </div>

          <div className="bg-pink-50 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-pink-700">
              Knowledge improvement
            </p>
            <p className="mt-2 font-display text-5xl text-pink">
              {gained >= 0 ? "+" : ""}
              {gained}
            </p>
            <p className="mt-1 text-xs text-pink-700">
              percentage points
              {impact.relativeChangePct !== null && impact.relativeChangePct > 0
                ? ` · +${impact.relativeChangePct}% relative`
                : ""}
            </p>
          </div>
        </div>

        <div className="border-t border-sand-200 bg-sand-50 px-6 py-4">
          <p className="text-sm text-sand-600">
            These are two different sets of questions — a general baseline and this
            level&apos;s assessment — so treat the headline figure as a broad measure.
            The comparison below is the precise one.
          </p>
        </div>
      </Card>

      {/* --- Matched-pair comparison -------------------------------------- */}
      {impact.paired ? (
        <Card className="mt-6 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Display as="h2" className="text-title text-ink">
              Like-for-like
            </Display>
            {impact.paired.isConfident ? (
              <Badge tone="teal">
                {impact.paired.pairCount} matched questions
              </Badge>
            ) : (
              <Badge tone="review">
                Only {impact.paired.pairCount} matched question
                {impact.paired.pairCount === 1 ? "" : "s"} — indicative only
              </Badge>
            )}
          </div>

          <p className="mt-3 text-sand-600">
            {impact.paired.isConfident ? (
              <>
                {impact.paired.pairCount} questions in this assessment test exactly the
                same ideas as questions in your baseline. Comparing only those is the
                fairest measure of what actually changed.
              </>
            ) : (
              <>
                This level covers material the general baseline barely touched, so only{" "}
                {impact.paired.pairCount} question
                {impact.paired.pairCount === 1 ? "" : "s"} can be compared directly. That
                is too few to draw a firm conclusion from, and we would rather say so
                than present it as a trend.
              </>
            )}
          </p>

          <div className="mt-6">
            <ImpactBars
              beforePct={impact.paired.beforePct}
              afterPct={impact.paired.afterPct}
              beforeLabel={`${impact.paired.correctBefore} of ${impact.paired.pairCount} before`}
              afterLabel={`${impact.paired.correctAfter} of ${impact.paired.pairCount} after`}
            />
          </div>

          {/* Per-topic movement, so improvement is legible rather than abstract. */}
          <ul className="mt-6 space-y-2">
            {impact.paired.movements.map((movement) => {
              const state = movement.wasCorrectBefore
                ? movement.isCorrectAfter
                  ? "held"
                  : "lost"
                : movement.isCorrectAfter
                  ? "gained"
                  : "still";
              const meta = {
                gained: { label: "Now correct", tone: "correct" as const },
                held: { label: "Still correct", tone: "neutral" as const },
                lost: { label: "Was correct before", tone: "review" as const },
                still: { label: "Worth revisiting", tone: "incorrect" as const },
              }[state];

              return (
                <li
                  key={movement.pairKey}
                  className="flex flex-wrap items-center gap-3 border-b border-sand-200 pb-2 text-sm"
                >
                  <span className="flex-1 text-sand-700">{movement.beforePrompt}</span>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      {/* --- Certificate outcome ------------------------------------------ */}
      <Card
        className={
          impact.passed
            ? "mt-6 border-pink-200 bg-pink-50/50 p-6"
            : "mt-6 bg-sand-100/60 p-6"
        }
      >
        {impact.passed ? (
          <>
            <Display as="h2" className="text-title text-ink">
              You&apos;ve completed {level.title}
            </Display>
            <p className="mt-3 text-sand-700">
              You scored {impact.bestScorePct}%, which earns the{" "}
              <strong className="text-ink">
                &ldquo;{level.certificateTitle}&rdquo;
              </strong>{" "}
              certificate.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {certificate ? (
                <ButtonLink href={`/certificate/${certificate.publicId}`} size="lg">
                  View my certificate
                </ButtonLink>
              ) : null}
              <ButtonLink href="/#levels" size="lg" variant="outline">
                Choose another level
              </ButtonLink>
              <ButtonLink href="/dashboard" size="lg" variant="outline">
                My progress
              </ButtonLink>
            </div>
          </>
        ) : (
          <>
            <Display as="h2" className="text-title text-ink">
              Not quite there yet
            </Display>
            <p className="mt-3 text-sand-700">
              You scored {impact.after.scorePct}% and the certificate needs{" "}
              {impact.passMarkPct}%. There is no limit on attempts, and your first score
              stays on record as the measure of what you learned — so retaking costs you
              nothing.
            </p>
            <div className="mt-4">
              <ProgressBar
                value={(impact.after.scorePct / impact.passMarkPct) * 100}
                label="Progress toward the pass mark"
              />
              <p className="mt-1.5 text-xs text-sand-500">
                {impact.passMarkPct - impact.after.scorePct} percentage points to go
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink href={`/levels/${levelSlug}`} size="lg">
                Review the modules
              </ButtonLink>
              <ButtonLink href={`/assessment/${levelSlug}`} size="lg" variant="outline">
                Retake the assessment
              </ButtonLink>
            </div>
          </>
        )}
      </Card>

      <p className="mt-8 text-sm text-sand-500">
        There is no leaderboard and no ranking here — the only comparison that matters
        is with where you started.{" "}
        <Link href="/privacy" className="underline">
          What we do with these scores
        </Link>
        .
      </p>
    </div>
  );
}
