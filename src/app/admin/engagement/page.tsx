import type { Metadata } from "next";
import { getModuleEngagement } from "@/lib/analytics";
import { DataTable, PageTitle, Section, StatCard } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Engagement" };

function formatMinutes(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds}s`;
  return `${Math.round(seconds / 60)} min`;
}

export default async function EngagementPage() {
  const modules = await getModuleEngagement();

  const totalStarted = modules.reduce((s, m) => s + m.started, 0);
  const totalCompleted = modules.reduce((s, m) => s + m.completed, 0);
  const worst = [...modules]
    .filter((m) => m.started > 0)
    .sort((a, b) => (a.completionRatePct ?? 100) - (b.completionRatePct ?? 100))[0];

  return (
    <>
      <PageTitle
        title="Engagement"
        description="Time is reported as a median rather than a mean, because one learner leaving a tab open all afternoon would otherwise dominate the average."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Module starts"
          value={totalStarted}
          sub="Across all learners"
        />
        <StatCard
          label="Module completions"
          value={totalCompleted}
          sub={
            totalStarted > 0
              ? `${Math.round((totalCompleted / totalStarted) * 100)}% of starts`
              : undefined
          }
        />
        <StatCard
          label="Weakest module"
          value={worst?.completionRatePct !== undefined && worst?.completionRatePct !== null ? `${worst.completionRatePct}%` : "—"}
          sub={worst ? worst.title : "No data yet"}
          tone="warn"
        />
      </div>

      <Section
        title="Module by module"
        description="Where learners start, where they stop, and how long each module actually takes compared with its estimate."
        className="mt-6"
      >
        <DataTable
          caption="Engagement by module"
          columns={[
            "Module",
            "Level",
            "Started",
            "Completed",
            "Drop-off",
            "Median time",
            "Estimated",
          ]}
          rows={modules.map((m) => {
            const overrun =
              m.medianSeconds !== null && m.medianSeconds > m.estMinutes * 60 * 1.5;
            return [
              <span key="t" className="font-semibold text-ink">
                {m.order}. {m.title}
              </span>,
              <span key="l" className="whitespace-nowrap text-xs text-sand-500">
                {m.levelTitle}
              </span>,
              m.started,
              <span key="c">
                {m.completed}
                {m.completionRatePct !== null ? (
                  <span className="text-sand-400"> ({m.completionRatePct}%)</span>
                ) : null}
              </span>,
              m.dropped > 0 ? (
                <Badge key="d" tone={m.dropped >= 3 ? "incorrect" : "review"}>
                  {m.dropped}
                </Badge>
              ) : (
                <span key="d" className="text-sand-400">
                  0
                </span>
              ),
              <span key="m" className={overrun ? "font-semibold text-review" : undefined}>
                {formatMinutes(m.medianSeconds)}
              </span>,
              <span key="e" className="text-sand-400">
                {m.estMinutes} min
              </span>,
            ];
          })}
          emptyMessage="No module activity recorded yet."
        />
      </Section>

      <Section
        title="A note on what is not measured"
        description="Deliberate omissions, documented so nobody assumes the data exists."
        className="mt-4"
      >
        <ul className="space-y-2 text-sm text-sand-600">
          <li>
            · <strong className="text-ink">No IP addresses or device details.</strong>{" "}
            The event log stores neither, by design — see the privacy notice.
          </li>
          <li>
            · <strong className="text-ink">No video engagement yet.</strong> Watch-time
            reporting needs the video asset first; the hooks are in place in the
            ChapterVideo component.
          </li>
          <li>
            · <strong className="text-ink">No individual behavioural profiles.</strong>{" "}
            Save7 sees aggregates and per-module figures, not a timeline of one
            learner&apos;s actions.
          </li>
        </ul>
      </Section>
    </>
  );
}
