"use server";

import { redirect } from "next/navigation";

import {
  claimLearner,
  destroySession,
  getSession,
  recordConsent,
  recordDateOfBirth,
} from "@/lib/auth";
import { safeNext } from "@/lib/authz";
import { validateName } from "@/lib/profile";

export type FormState = { error?: string } | undefined;

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

/**
 * Finishing enrolment, step one: date of birth.
 *
 * There is deliberately no age check here, not even the courtesy one
 * RegisterForm makes. At registration a refusal in the browser leaves nothing
 * behind, because no row exists yet. Here `learn_claim_me()` has already written
 * one, so an under-18 date has to reach `learn_record_date_of_birth()`, which
 * deletes the row and logs the refusal. Refusing in the browser would leave both
 * the row and the person where they are.
 */
export async function recordDateOfBirthAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const next = safeNext(formData.get("next"));
  const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim();

  // Shape only, so the database is never handed "2001-02-31" to choke on.
  const parsed = new Date(`${dateOfBirth}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== dateOfBirth
  ) {
    return { error: "Please enter your date of birth." };
  }

  const result = await recordDateOfBirth(dateOfBirth);
  if (!result.ok) return { error: result.error };

  // Under 18: the row is already gone. Signing out is what stops the next page
  // load from enrolling them again and asking the same question in a loop.
  if (!result.ofAge) {
    await destroySession();
    redirect("/enrol/refused");
  }

  redirect(`/enrol?next=${encodeURIComponent(next)}`);
}

/** Finishing enrolment, step two: consent. Refused until an adult date is on record. */
export async function recordConsentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const next = safeNext(formData.get("next"));
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (session.enrolment === "date-of-birth") redirect(`/enrol?next=${encodeURIComponent(next)}`);

  if (!formData.get("popiaConsent")) {
    return {
      error: "We need your consent to store your name, email, date of birth and course progress.",
    };
  }

  const result = await recordConsent();
  if (!result.ok) return { error: result.error };

  redirect(next);
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
