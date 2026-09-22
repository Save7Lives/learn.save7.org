import type { Metadata } from "next";
import { getKnowledgeSummary, getMostMissedQuestions } from "@/lib/analytics";
import {
  BarChart,
  DataTable,
  PageTitle,
  Section,
  StatCard,
} from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/primitives";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Cloudflare applies at deploy time. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Knowledge impact" };

export default async function KnowledgePage() {
  const [knowledge, missed] = await Promise.all([
    getKnowledgeSummary(),
    getMostMissedQuestions(1, 40),
  ]);

  const assessed = knowledge.perLevel.filter((l) => l.postCount > 0);

  return (
    <>
      <PageTitle
        title="Knowledge impact"
        description="Only each learner's first attempt counts toward these figures. Including retakes would make the reported learning gain drift upward over time and turn the platform's central claim into something unfalsifiable."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Average baseline"
          value={
            knowledge.averageBaselinePct !== null
              ? `${knowledge.averageBaselinePct}%`
              : "—"
          }
          sub={`${knowledge.baselineCount} baselines recorded`}
        />
        <StatCard
          label="Levels assessed"
          value={`${assessed.length}/${knowledge.perLevel.length}`}
          sub="With at least one submission"
        />
        <StatCard
          label="Average improvement"
          value={
            assessed.length > 0
              ? `${Math.round(
                  assessed.reduce((s, l) => s + (l.averagePointChange ?? 0), 0) /
                    assessed.length,
                )} pp`
              : "—"
          }
          tone="pink"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Section
          title="Baseline score distribution"
          description="Where learners are before the course. A left-heavy shape is the expected and desirable pattern."
        >
          <BarChart
            data={knowledge.baselineDistribution.map((b) => ({
              label: b.bucket,
              value: b.count,
            }))}
            tone="ink"
            valueSuffix=" learners"
          />
        </Section>

        <Section
          title="Post-assessment distribution"
          description="First attempts only, across all levels."
        >
          <BarChart
            data={knowledge.postDistribution.map((b) => ({
              label: b.bucket,
              value: b.count,
            }))}
            tone="pink"
            valueSuffix=" learners"
          />
        </Section>
      </div>

      <Section
        title="By level"
        description="Average score, improvement against the baseline, and the share of learners reaching the pass mark on their best attempt."
        className="mt-4"
      >
        <DataTable
          caption="Knowledge impact by level"
          columns={[
            "Level",
            "Assessed",
            "Average score",
            "Average change",
            "Pass rate",
          ]}
          rows={knowledge.perLevel.map((l) => [
            <span key="t" className="font-semibold text-ink">
              {l.title}
            </span>,
            l.postCount,
            l.averagePostPct !== null ? `${l.averagePostPct}%` : "—",
            l.averagePointChange !== null ? (
              <span
                key="c"
                className={
                  l.averagePointChange >= 0
                    ? "font-semibold text-correct"
                    : "font-semibold text-incorrect"
                }
              >
                {l.averagePointChange >= 0 ? "+" : ""}
                {l.averagePointChange} pp
              </span>
            ) : (
              "—"
            ),
            l.passRatePct !== null ? `${l.passRatePct}%` : "—",
          ])}
          emptyMessage="No assessments submitted yet."
        />
      </Section>

      <Section
        title="Most commonly missed questions"
        description="Ranked by the share of answers that were wrong. Treat a high rate as a signal about the teaching, not the learners."
        className="mt-4"
      >
        <DataTable
          caption="Most commonly missed questions"
          columns={["Question", "Where", "Topic", "Wrong", "Rate"]}
          rows={missed.map((q) => [
            <span key="p" className="text-ink">
              {q.prompt}
            </span>,
            <span key="w" className="whitespace-nowrap text-xs text-sand-500">
              {q.scope === "PRE"
                ? "Baseline"
                : q.moduleTitle
                  ? q.moduleTitle
                  : (q.levelTitle ?? "—")}
            </span>,
            <Badge key="t" tone="neutral">
              {q.topicTag}
            </Badge>,
            `${q.incorrect}/${q.answered}`,
            <span
              key="r"
              className={
                q.incorrectRatePct >= 60
                  ? "font-bold text-incorrect"
                  : "font-semibold text-ink"
              }
            >
              {q.incorrectRatePct}%
            </span>,
          ])}
          emptyMessage="Not enough answers recorded yet."
        />
      </Section>
    </>
  );
}
