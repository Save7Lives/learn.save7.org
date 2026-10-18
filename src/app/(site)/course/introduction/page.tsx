import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { getPathwayForUser } from "@/lib/course";
import { IntroductionView } from "@/components/course/IntroductionView";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Course introduction",
  description:
    "How Save7 Learn works: three levels, what's included, and how your learning is measured.",
};

export default async function IntroductionPage() {
  const session = await getSession();
  const { levels, position } = await getPathwayForUser(session?.id ?? null);

  return (
    <IntroductionView
      levels={levels}
      currentLevelSlug={position.currentLevelSlug}
      signedIn={Boolean(session)}
      baselineCompleted={Boolean(session) && position.contentOpen}
    />
  );
}
