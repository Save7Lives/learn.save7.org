import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { Display, Eyebrow } from "@/components/ui/primitives";
import { getSession } from "@/lib/auth";
import { publicConfig } from "@/lib/supabase/config";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Register" };

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/dashboard");

  return (
    <div>
      <Eyebrow>Transplant Alchemy 101</Eyebrow>
      <Display className="mt-3">Register</Display>
      <p className="mt-4 text-ink/70">
        You need your name, an email and your date of birth. This course is 18+ only. There
        is no password. You sign in with Google afterwards, using the address you give here.
      </p>

      <div className="mt-8">
        <RegisterForm config={publicConfig()} />
      </div>
    </div>
  );
}
