import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { signUpAction } from "../actions";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Create your account" };

export default async function RegisterPage(props: PageProps<"/register">) {
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/dashboard");

  const { next } = await props.searchParams;
  return (
    <AuthForm
      mode="signup"
      action={signUpAction}
      next={typeof next === "string" ? next : undefined}
    />
  );
}
