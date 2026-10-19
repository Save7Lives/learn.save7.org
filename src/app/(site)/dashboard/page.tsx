import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { getBaselineState } from "@/lib/baseline";
import { getPathwayForUser } from "@/lib/course";
import { getProfile } from "@/lib/profile";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { ProgressRegister } from "@/components/course/ProgressRegister";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My progress and profile" };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");

  const [{ levels, position }, baseline, profile] = await Promise.all([
    getPathwayForUser(user.id),
    getBaselineState(user.id),
    getProfile(user.id),
  ]);

  // Only reachable if the account was deleted mid-session.
  if (!profile) notFound();

  return (
    <>
      <ProgressRegister
        userName={user.name}
        baseline={baseline}
        levels={levels}
        position={position}
      />
      <ProfileSection profile={profile} hasCertificates={position.certificates.length > 0} />
    </>
  );
}
