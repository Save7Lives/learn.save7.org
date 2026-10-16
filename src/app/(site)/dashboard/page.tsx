import type { Metadata } from "next";
import { requireUser } from "@/lib/authz";
import { getBaselineState } from "@/lib/baseline";
import { getPathwayForUser, getLearnerCertificates } from "@/lib/course";
import { ProgressRegister } from "@/components/course/ProgressRegister";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My progress" };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");

  const [{ levels }, baseline, certificates] = await Promise.all([
    getPathwayForUser(user.id),
    getBaselineState(user.id),
    getLearnerCertificates(user.id),
  ]);

  return (
    <ProgressRegister
      userName={user.name}
      baseline={baseline}
      levels={levels}
      certificates={certificates}
    />
  );
}
