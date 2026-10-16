import { getSession } from "@/lib/auth";
import { getBaselineState } from "@/lib/baseline";
import { getPathwayForUser } from "@/lib/course";
import { LandingView } from "@/components/course/LandingView";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();

  const { levels } = await getPathwayForUser(session?.id ?? null);
  const baseline = session ? await getBaselineState(session.id) : null;

  return (
    <LandingView
      levels={levels}
      signedIn={Boolean(session)}
      baselinePending={Boolean(session && baseline && !baseline.completed)}
    />
  );
}
