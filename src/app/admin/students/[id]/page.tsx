import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadActivity, loadCatalogue, loadRules, loadStudent } from "@/lib/admin/data";
import { loadAdminRoster } from "@/lib/admin/roster";
import { requireAdmin } from "@/lib/authz";
import { StudentView } from "@/components/admin/StudentView";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Student" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function StudentPage(props: PageProps<"/admin/students/[id]">) {
  const { id } = await props.params;
  if (!UUID.test(id)) notFound();

  const catalogue = await loadCatalogue();
  const student = await loadStudent(id, catalogue);
  if (!student) notFound();

  const [viewer, roster, rules, activity] = await Promise.all([
    requireAdmin(),
    loadAdminRoster(),
    loadRules(),
    loadActivity(id),
  ]);

  return (
    <StudentView
      student={student}
      catalogue={catalogue}
      rule={rules[0] ?? null}
      activity={activity}
      adminRole={roster.byStudent[id] ?? null}
      canGrant={viewer.adminRole === "owner"}
    />
  );
}
