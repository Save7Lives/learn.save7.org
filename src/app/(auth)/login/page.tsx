import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GoogleSignIn } from "@/components/auth/GoogleSignIn";
import { Display, Eyebrow } from "@/components/ui/primitives";
import { getSession } from "@/lib/auth";
import { publicConfig } from "@/lib/supabase/config";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  // Already signed in? Don't show a sign-in page.
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/dashboard");

  const { next } = await props.searchParams;

  return (
    <div>
      <Eyebrow>Transplant Alchemy 101</Eyebrow>
      <Display className="mt-3">Sign in</Display>
      <p className="mt-4 text-ink/70">
        With the same Google account Save7 knows you by. Volunteers, staff and learners all
        sign in here.
      </p>

      <div className="mt-8">
        <GoogleSignIn config={publicConfig()} next={typeof next === "string" ? next : undefined} />
      </div>
    </div>
  );
}
