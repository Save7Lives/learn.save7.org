import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { getBaselineState } from "@/lib/baseline";
import { getPathwayForUser } from "@/lib/course";
import { BaselineRecorded } from "@/components/course/BaselineRecorded";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Baseline recorded" };

/**
 * The Baseline's results: the latest Sitting's score overall and one row per Level,
 * and once there is a later Sitting, a mark on each bar at the first Sitting's
 * value. `BaselineResults` (the table) is not drawn here: five columns scroll
 * sideways at 375px, and My Progress keeps it as the chart's twin.
 *
 * The score is shown, but framed carefully and without a pass mark, a grade or
 * any comparison to other learners. A low first Sitting is the most useful
 * possible starting point, and the copy says so — a learner who feels they have
 * failed before the course begins is a learner who leaves. The questions are not
 * reviewed: they come back at every Sitting (see lib/baseline.ts).
 */
export default async function BaselineDonePage() {
  const user = await requireUser("/assessment/pre/done");
  const baseline = await getBaselineState(user.id);

  if (!baseline.completed) redirect("/assessment/pre");

  const { levels } = await getPathwayForUser(user.id);
  const next = levels.find((l) => l.progress?.status !== "COMPLETE") ?? null;

  return (
    <BaselineRecorded
      baseline={baseline}
      nextLevel={
        next
          ? { slug: next.slug, title: next.title, notStarted: next.progress?.status === "NOT_STARTED" }
          : null
      }
    />
  );
}
