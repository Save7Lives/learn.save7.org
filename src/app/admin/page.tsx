import type { Metadata } from "next";
import { loadCatalogue, loadMissedQuestions, loadRules, loadStudents } from "@/lib/admin/data";
import {
  SIGNED_UP_OPTIONS,
  eligibleCount,
  flagLabel,
  indicators,
  inWindow,
  type SignedUpWindow,
} from "@/lib/admin/model";
import { OverviewView } from "@/components/admin/OverviewView";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminOverviewPage(props: PageProps<"/admin">) {
  const params = await props.searchParams;
  const signed = SIGNED_UP_OPTIONS.some(([v]) => v === params.signed) ? (params.signed as SignedUpWindow) : "all";

  const catalogue = await loadCatalogue();
  const [students, rules, missed] = await Promise.all([loadStudents(catalogue), loadRules(), loadMissedQuestions(5)]);

  const now = new Date();
  /* Only the signup window slices the Indicators. Filtering them by current Level is
     circular: Students now on Advanced have nearly all completed the Levels before it. */
  const view = students.filter((s) => inWindow(s, signed, now));
  const rule = rules[0] ?? null;

  return (
    <OverviewView
      indicators={indicators(view, catalogue, now)}
      totalStudents={students.length}
      signedUp={signed}
      missed={missed}
      eligibility={{
        version: rule?.version ?? null,
        flagLabels: rule ? rule.requiredFlags.map((f) => flagLabel(f, catalogue)) : [],
        eligible: eligibleCount(view),
        of: view.length,
      }}
    />
  );
}
