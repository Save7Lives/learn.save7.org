import type { Metadata } from "next";
import { getLearnerSummary } from "@/lib/analytics";
import { percent } from "@/lib/baseline";
import { supabaseServer } from "@/lib/supabase/server";
import { DataTable, PageTitle, Section, StatCard } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/primitives";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Learners" };

export default async function LearnersPage() {
  const summary = await getLearnerSummary();

  const supabase = await supabaseServer();

  /* Each learner with their Baseline Sittings, submitted attempts, live
     certificates and completed modules, embedded through the foreign keys on those
     four tables. Staff-only: the select policies on all five admit
     `app_is_staff()`, and a learner reading the same query sees one row — their
     own. */
  const { data: learnerRows } = await supabase
    .from("learners")
    .select(
      "id, name, created_at, last_seen_at, " +
        "learn_baseline_sittings(sitting_no, total_score, total_max), " +
        "learn_attempts(scope, score_pct, attempt_no, level_slug, submitted_at), " +
        "learn_certificates(code, award_title, revoked_at), " +
        "learn_module_progress(module_slug, status)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const learners = ((learnerRows ?? []) as unknown as Array<{
    id: string;
    name: string;
    created_at: string;
    last_seen_at: string | null;
    learn_baseline_sittings: Array<{
      sitting_no: number;
      total_score: number;
      total_max: number;
    }> | null;
    learn_attempts: Array<{
      scope: string;
      score_pct: number | null;
      attempt_no: number;
      level_slug: string | null;
      submitted_at: string | null;
    }> | null;
    learn_certificates: Array<{
      code: string;
      award_title: string | null;
      revoked_at: string | null;
    }> | null;
    learn_module_progress: Array<{ module_slug: string; status: string }> | null;
  }>).map((l) => ({
    id: l.id,
    name: l.name,
    createdAt: new Date(l.created_at),
    lastSeenAt: l.last_seen_at ? new Date(l.last_seen_at) : null,
    sittings: (l.learn_baseline_sittings ?? [])
      .map((s) => ({ sittingNo: s.sitting_no, pct: percent(s.total_score, s.total_max) }))
      .sort((a, b) => a.sittingNo - b.sittingNo),
    // Filtered here rather than in the query: PostgREST cannot filter an embedded
    // resource without also dropping parents that have none, which would hide
    // every learner who has not attempted anything yet.
    attempts: (l.learn_attempts ?? [])
      .filter((a) => a.submitted_at !== null)
      .map((a) => ({
        kind: a.scope,
        scorePct: a.score_pct,
        attemptNo: a.attempt_no,
        levelId: a.level_slug,
      })),
    certificates: (l.learn_certificates ?? [])
      .filter((c) => c.revoked_at === null)
      .map((c) => ({ publicId: c.code, awardTitleSnapshot: c.award_title ?? "" })),
    moduleProgress: (l.learn_module_progress ?? [])
      .filter((m) => m.status === "COMPLETE")
      .map((m) => ({ moduleId: m.module_slug })),
  }));

  const { count: modulesTotal } = await supabase
    .from("learn_modules")
    .select("slug", { count: "exact", head: true })
    .eq("is_mandatory", true);

  return (
    <>
      <PageTitle
        title="Learners"
        description="Email addresses are deliberately not listed here. Save7 needs to know whether the course is working, which does not require a browsable directory of personal contact details."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Registered"
          value={summary.registered}
          sub={`${summary.registeredLast30Days} in the last 30 days`}
        />
        <StatCard label="Active" value={summary.active} sub="Sat the first baseline" />
        <StatCard
          label="Finished a level"
          value={summary.completedAnyLevel}
          sub={`${summary.completedCourse} finished all three`}
        />
        <StatCard
          label="Completion rate"
          value={
            summary.completionRatePct !== null ? `${summary.completionRatePct}%` : "n/a"
          }
          sub="Of learners who started"
          tone="pink"
        />
      </div>

      <Section
        title="Individual progress"
        description="Most recent registrations first."
        className="mt-6"
      >
        <DataTable
          caption="Learner progress"
          columns={[
            "Learner",
            "Registered",
            "Baseline",
            "Assessments",
            "Modules",
            "Certificates",
          ]}
          rows={learners.map((learner) => {
            // Every Sitting in order, first to latest: the before-and-after in one cell.
            const baseline = learner.sittings.map((s) => `${s.pct}%`).join(" → ");
            const posts = learner.attempts.filter(
              (a) => a.kind === "POST" && a.attemptNo === 1,
            );
            return [
              <span key="n" className="font-semibold text-ink">
                {learner.name}
              </span>,
              <span key="d" className="whitespace-nowrap text-xs text-sand-500">
                {learner.createdAt.toLocaleDateString("en-ZA")}
              </span>,
              baseline ? (
                <span key="b" className="whitespace-nowrap">
                  {baseline}
                </span>
              ) : (
                <span key="b" className="text-sand-400">Not taken</span>
              ),
              posts.length > 0 ? (
                <span key="p">
                  {posts.map((p) => `${p.scorePct}%`).join(" · ")}
                </span>
              ) : (
                <span key="p" className="text-sand-400">
                  n/a
                </span>
              ),
              <span key="m">
                {learner.moduleProgress.length}/{modulesTotal}
              </span>,
              learner.certificates.length > 0 ? (
                <span key="c" className="flex flex-wrap gap-1">
                  {learner.certificates.map((cert) => (
                    <Badge key={cert.publicId} tone="teal">
                      {cert.awardTitleSnapshot}
                    </Badge>
                  ))}
                </span>
              ) : (
                <span key="c" className="text-sand-400">
                  n/a
                </span>
              ),
            ];
          })}
          emptyMessage="No learners registered yet."
        />
      </Section>
    </>
  );
}
