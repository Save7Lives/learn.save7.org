import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { signInAction } from "../actions";
import { getSession } from "@/lib/auth";

/**
 * Edge runtime, required by Cloudflare Pages.
 *
 * `@cloudflare/next-on-pages` refuses to build a route that renders on the
 * Node runtime — every server-rendered route on Pages runs on workerd. This is
 * the whole reason the app is pinned to Next 15.5.2: the adapter supports no
 * higher, and OpenNext (which does not need this) supports no lower.
 */
export const runtime = "edge";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  // Already signed in? Don't show a login form.
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/dashboard");

  const { next } = await props.searchParams;
  return (
    <AuthForm
      mode="signin"
      action={signInAction}
      next={typeof next === "string" ? next : undefined}
    />
  );
}
