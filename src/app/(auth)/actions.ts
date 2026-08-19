"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, loginUser, registerUser } from "@/lib/auth";

export type FormState = { error?: string } | undefined;

/** Only allow same-site relative redirects, so `?next=` cannot become an open redirect. */
function safeNext(raw: FormData["get"] extends never ? never : unknown): string {
  const value = typeof raw === "string" ? raw : "";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function signInAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await loginUser({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!result.ok) return { error: result.error };

  await createSession(result.user);
  redirect(result.user.role === "ADMIN" ? "/admin" : safeNext(formData.get("next")));
}

export async function signUpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await registerUser({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    popiaConsent: formData.get("popiaConsent") === "on",
  });

  if (!result.ok) return { error: result.error };

  await createSession(result.user);
  redirect(safeNext(formData.get("next")));
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
