import type { Metadata } from "next";
import { requireAdmin } from "@/lib/authz";
import { loadCatalogue, loadRules, loadStudents } from "@/lib/admin/data";
import { RuleView } from "@/components/admin/RuleView";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Eligibility rule" };

export default async function EligibilityPage(props: PageProps<"/admin/eligibility">) {
  // The layout guards too, but it renders alongside this page, so a signed-out visitor
  // would otherwise reach the loaders as `anon` before being sent to /login.
  await requireAdmin();
  const params = await props.searchParams;
  const saved = typeof params.saved === "string" && /^\d+$/.test(params.saved) ? Number(params.saved) : null;

  const catalogue = await loadCatalogue();
  const [students, rules] = await Promise.all([loadStudents(catalogue), loadRules()]);

  return <RuleView catalogue={catalogue} students={students} rules={rules} saved={saved} />;
}
