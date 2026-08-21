"use server";

import { redirect } from "next/navigation";

import { claimLearner, destroySession } from "@/lib/auth";
import { validateName } from "@/lib/profile";

export type FormState = { error?: string } | undefined;

/** Only allow same-site relative redirects, so `?next=` cannot become an open redirect. */
function safeNext(raw: unknown): string {
  const value = typeof raw === "string" ? raw : "";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

/**
 * Finish enrolment for an account that is already signed in.
 *
 * Sign-in itself happens in the browser, against Supabase, because the Google
 * ID-token flow is a browser flow — there is no server action that can hold a
 * Google credential. What is left for the server is the part that must not be
 * client-writable: the `learners` row, created by `learn_claim_me()`.
 *
 * Called once after a successful sign-in, and idempotent, so a refresh or a
 * second tab does not create a second enrolment.
 */
export async function claimAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const first = String(formData.get("firstName") ?? "");
  const last = String(formData.get("lastName") ?? "");

  // Shared with the profile page, so enrolment and editing cannot drift apart
  // and start accepting different things.
  if (first || last) {
    const validated = validateName(first, last);
    if (!validated.ok) return { error: validated.error };
  }

  const result = await claimLearner(first || undefined, last || undefined);
  if (!result.ok) return { error: result.error };

  redirect(safeNext(formData.get("next")));
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
