import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { signInAction } from "../actions";
import { getSession } from "@/lib/auth";

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
