import type { Metadata } from "next";
import Link from "next/link";
import {
  getKnowledgeSummary,
  getLearnerSummary,
  getModuleEngagement,
  getMostMissedQuestions,
  getReviewSummary,
} from "@/lib/analytics";
import { BarChart, PageTitle, Section, StatCard } from "@/components/admin/AdminUi";
import { Badge, ButtonLink } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  const [learners, knowledge, missed, engagement, review] = await Promise.all([
    getLearnerSummary(),
    getKnowledgeSummary(),
    getMostMissedQuestions(1, 5),
    getModuleEngagement(),
    getReviewSummary(),
  ]);

  const assessedLevels = knowledge.perLevel.filter((l) => l.postCount > 0);
  const averageGain =
    assessedLevels.length > 0
      ? Math.round(
          assessedLevels.reduce((sum, l) => sum + (l.averagePointChange ?? 0), 0) /
            assessedLevels.length,
        )
      : null;

  // Biggest drop-off: where the most learners started and did not finish.
  const dropOff = [...engagement].sort((a, b) => b.dropped - a.dropped)[0] ?? null;

  return (
    <>
      <PageTitle
        title="Overview"
        description="Save7's headline question is whether people are learning — so knowledge movement leads, and engagement is context for it."
      />

      {/* The metric the platform exists to produce. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Average baseline"
          value={
            knowledge.averageBaselinePct !== null
              ? `${knowledge.averageBaselinePct}%`
              : "—"
          }
          sub={`${knowledge.baselineCount} learners assessed`}
        />
        <StatCard
          label="Average after"
          value={
            assessedLevels.length > 0
              ? `${Math.round(
                  assessedLevels.reduce((s, l) => s + (l.averagePostPct ?? 0), 0) /
                    assessedLevels.length,
                )}%`
              : "—"
          }
          sub="Across assessed levels"
        />
        <StatCard
          label="Average improvement"
          value={averageGain !== null ? `${averageGain >= 0 ? "+" : ""}${averageGain}` : "—"}
          sub="percentage points"
          tone="pink"
        />
        <StatCard
          label="Completion rate"
          value={
            learners.completionRatePct !== null ? `${learners.completionRatePct}%` : "—"
          }
          sub="Of learners who started"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Registered"
          value={learners.registered}
          sub={`${learners.registeredLast30Days} in the last 30 days`}
        />
        <StatCard
          label="Active"
          value={learners.active}
          sub="Completed the baseline"
        />
        <StatCard
          label="Finished a level"
          value={learners.completedAnyLevel}
          sub={`${learners.completedCourse} finished all three`}
        />
        <StatCard
          label="Awaiting review"
          value={review.needsVerification}
          sub={`${review.blockingLaunch} block launch`}
          tone={review.blockingLaunch > 0 ? "warn" : "neutral"}
        />
      </div>

      {/* Content review is surfaced on the overview because unverified medical and
          legal claims are the single biggest risk in this course. */}
      {review.blockingLaunch > 0 ? (
        <div className="mt-6 rounded-card border-2 border-review/40 bg-review-soft p-5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="review">Before public launch</Badge>
            <p className="flex-1 text-sm text-ink">
              <strong>{review.blockingLaunch} claims</strong> still need verification
              against authoritative sources. Learners currently see a &ldquo;pending
              review&rdquo; badge wherever this applies.
            </p>
            <ButtonLink href="/admin/content-review" size="sm" variant="ink">
              Review them
            </ButtonLink>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Section
          title="Improvement by level"
          description="Average percentage-point change between the baseline and each level's first assessment."
        >
          <BarChart
            data={knowledge.perLevel.map((l) => ({
              label: l.title,
              value: l.averagePointChange,
              sub:
                l.postCount > 0
                  ? `${l.postCount} assessed · average score ${l.averagePostPct}% · pass rate ${l.passRatePct}%`
                  : "Not yet assessed",
            }))}
            valueSuffix=" pp"
            emptyMessage="No level assessments submitted yet."
          />
        </Section>

        <Section
          title="Most commonly missed"
          description="A question most learners fail is usually a teaching problem in the module before it."
        >
          {missed.length === 0 ? (
            <p className="text-sm text-sand-500">
              Not enough answers recorded yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {missed.map((q) => (
                <li key={q.questionId} className="border-b border-sand-200 pb-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-sm text-ink">{q.prompt}</p>
                    <span className="shrink-0 font-display text-xl text-pink-600">
                      {q.incorrectRatePct}%
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-sand-500">
                    {q.incorrect} of {q.answered} wrong · {q.topicTag}
                    {q.moduleTitle ? ` · ${q.moduleTitle}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4">
            <Link
              href="/admin/knowledge"
              className="text-sm font-semibold text-pink-600 underline"
            >
              See the full list
            </Link>
          </p>
        </Section>
      </div>

      {dropOff && dropOff.dropped > 0 ? (
        <Section
          title="Biggest drop-off"
          description="Where learners most often start a module and do not finish it."
          className="mt-4"
        >
          <p className="text-ink">
            <strong>{dropOff.title}</strong>{" "}
            <span className="text-sand-500">({dropOff.levelTitle})</span>
          </p>
          <p className="mt-1 text-sm text-sand-600">
            {dropOff.dropped} of {dropOff.started} learners who started this module have
            not completed it
            {dropOff.completionRatePct !== null
              ? ` — a ${dropOff.completionRatePct}% completion rate`
              : ""}
            .
          </p>
          <p className="mt-3">
            <Link
              href="/admin/engagement"
              className="text-sm font-semibold text-pink-600 underline"
            >
              See every module
            </Link>
          </p>
        </Section>
      ) : null}
    </>
  );
}
