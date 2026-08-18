import type { Metadata } from "next";
import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  certificates,
  levels,
  moduleProgress,
  modules,
  quizAttempts,
  users,
} from "@/db/schema";
import { getLearnerSummary } from "@/lib/analytics";
import { getCourse } from "@/lib/course";
import { DataTable, PageTitle, Section, StatCard } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Learners" };

export default async function LearnersPage() {
  const [summary, course] = await Promise.all([getLearnerSummary(), getCourse()]);

  const learners = await db.query.users.findMany({
    where: eq(users.role, "LEARNER"),
    orderBy: desc(users.createdAt),
    limit: 200,
    columns: { id: true, name: true, createdAt: true, lastSeenAt: true },
    with: {
      attempts: {
        where: isNotNull(quizAttempts.submittedAt),
        columns: { kind: true, scorePct: true, attemptNo: true, levelId: true },
      },
      certificates: {
        where: isNull(certificates.revokedAt),
        columns: { publicId: true, awardTitleSnapshot: true },
      },
      moduleProgress: {
        where: eq(moduleProgress.status, "COMPLETE"),
        columns: { moduleId: true },
      },
    },
  });

  const [{ count: modulesTotal }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(modules)
    .innerJoin(levels, eq(modules.levelId, levels.id))
    .where(and(eq(levels.courseId, course.id), eq(modules.isMandatory, true)));

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
        <StatCard label="Active" value={summary.active} sub="Completed the baseline" />
        <StatCard
          label="Finished a level"
          value={summary.completedAnyLevel}
          sub={`${summary.completedCourse} finished all three`}
        />
        <StatCard
          label="Completion rate"
          value={
            summary.completionRatePct !== null ? `${summary.completionRatePct}%` : "—"
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
            const pre = learner.attempts.find((a) => a.kind === "PRE");
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
              pre ? `${pre.scorePct}%` : <span key="b" className="text-sand-400">Not taken</span>,
              posts.length > 0 ? (
                <span key="p">
                  {posts.map((p) => `${p.scorePct}%`).join(" · ")}
                </span>
              ) : (
                <span key="p" className="text-sand-400">
                  —
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
                  —
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
