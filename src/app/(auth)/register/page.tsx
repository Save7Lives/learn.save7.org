import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { Display, Eyebrow } from "@/components/ui/primitives";
import { getSession } from "@/lib/auth";
import { publicConfig } from "@/lib/supabase/config";

export const runtime = "edge";

export const metadata: Metadata = { title: "Register" };

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/dashboard");

  return (
    <div>
      <Eyebrow>Transplant Alchemy 101</Eyebrow>
      <Display className="mt-3">Register</Display>
      <p className="mt-4 text-ink/70">
        You only need your name and an email. There is no password — you sign in with Google
        afterwards, using the address you give here.
      </p>

      <div className="mt-8">
        <RegisterForm config={publicConfig()} />
      </div>
    </div>
  );
}
