"use client";

import { useState } from "react";

import type { PublicSupabaseConfig } from "@/lib/supabase/config";
import { Button, ButtonLink } from "@/components/ui/primitives";
import { ConsentRow, ErrorNotice, Field, IconChip } from "@/components/ui/shared-parts";
import { AuthHeading } from "@/components/auth/AuthHeading";

/**
 * Registering for the course.
 *
 * **Registration comes first, and that ordering is the design.** Sign-in is
 * refused for an address that is not already on a list — `auth_enforce_save7_domain()`
 * admits a @save7.org account, an invited stakeholder, an active volunteer, or a
 * registered learner, and nothing else. A trigger cannot explain itself, which is
 * why this form exists and why the sign-in page points at it.
 *
 * The endpoint is an Edge Function rather than a route in this app: it holds
 * `service_role` to write a row a client must never be able to write, it
 * validates and throttles, and it records every attempt. See
 * save7-os/supabase/functions/register-learner.
 */
/** Courtesy only — mirrors register-learner's own check so most under-18
 * attempts never reach the network, but the endpoint is public and this is
 * trivially bypassable. The refusal that actually counts is server-side. */
function isAtLeast18(isoDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return false;
  const dob = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(dob.getTime()) || dob.getTime() > Date.now()) return false;

  const today = new Date();
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const hadBirthdayThisYear =
    today.getUTCMonth() > dob.getUTCMonth() ||
    (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() >= dob.getUTCDate());
  if (!hadBirthdayThisYear) age -= 1;
  return age >= 18;
}

const DOB_ERROR = "You must be 18 or older to register for this course.";
const CONSENT_ERROR =
  "We need your consent to store your name, email, date of birth and course progress.";

export function RegisterForm({ config }: { config: PublicSupabaseConfig }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  // Each message sits under the thing it is about. `formError` is for what the
  // server or the network says, which belongs to the whole form.
  const [dobError, setDobError] = useState<string | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDobError(null);
    setConsentError(null);
    setFormError(null);
    setState("sending");

    const form = new FormData(event.currentTarget);
    const dateOfBirth = String(form.get("dateOfBirth") ?? "");

    if (!dateOfBirth || !isAtLeast18(dateOfBirth)) {
      setState("idle");
      setDobError(DOB_ERROR);
      return;
    }

    if (!form.get("popiaConsent")) {
      setState("idle");
      setConsentError(CONSENT_ERROR);
      return;
    }

    try {
      const response = await fetch(`${config.url}/functions/v1/register-learner`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          // The anon key identifies the project, not the person. It grants
          // nothing on its own — the function verifies everything itself.
          authorization: `Bearer ${config.anonKey}`,
        },
        body: JSON.stringify({
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          email: form.get("email"),
          dateOfBirth,
          popiaConsent: true,
        }),
      });

      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setState("idle");
        setFormError(body.error ?? "Could not register. Try again in a moment.");
        return;
      }
      setState("done");
    } catch {
      setState("idle");
      setFormError("Could not reach Save7. Check your connection and try again.");
    }
  }

  if (state === "done") {
    // The page's own heading is replaced: the card now says the one thing that matters.
    return (
      <div>
        <IconChip icon="check-circle" tone="teal" className="mb-[18px]" />
        <AuthHeading title="You’re registered">
          Sign in with that same Google account to start the course.
        </AuthHeading>
        {/* Straight into the first Baseline Sitting, as #15 decided: it is the
            "before", and Stage content waits for it. */}
        <ButtonLink href="/login?next=/assessment/pre" className="mt-7 w-full">
          Sign in with Google
        </ButtonLink>
      </div>
    );
  }

  return (
    <div>
      <AuthHeading title="Register">
        You need your name, an email and your date of birth. This course is 18+ only. There is no
        password. You sign in with Google afterwards, using the address you give here.
      </AuthHeading>

      <form onSubmit={onSubmit} className="mt-7">
        <div className="grid gap-x-3.5 min-[560px]:grid-cols-2">
          <Field
            id="firstName"
            name="firstName"
            label="First name"
            required
            autoComplete="given-name"
          />
          <Field
            id="lastName"
            name="lastName"
            label="Surname"
            autoComplete="family-name"
            describedBy="name-help"
          />
        </div>
        <p id="name-help" className="-mt-1.5 mb-[18px] text-sm text-grey">
          The surname is the name that will appear on your certificate. You can change it later in
          your profile.
        </p>

        <Field
          id="email"
          name="email"
          label="Email address"
          type="email"
          required
          autoComplete="email"
          helper="Use the address of the Google account you will sign in with."
        />

        <Field
          id="dateOfBirth"
          name="dateOfBirth"
          label="Date of birth"
          type="date"
          required
          autoComplete="bday"
          max={new Date().toISOString().slice(0, 10)}
          helper={
            dobError
              ? undefined
              : "This course is for adults. You must be 18 or older to register. There is no exception, so please use your real date of birth."
          }
          error={dobError}
        />

        <ConsentRow id="popiaConsent" name="popiaConsent" error={consentError}>
          I agree that Save7 may store my name, email address, date of birth and course progress so
          that my learning and certificate can be recorded.{" "}
          <a href="/privacy" className="font-medium text-teal-ink underline underline-offset-[3px]">
            How we handle your information
          </a>
          .
        </ConsentRow>

        {formError ? <ErrorNotice lead={formError} className="mt-[18px]" /> : null}

        <Button type="submit" disabled={state === "sending"} className="mt-5 w-full">
          {state === "sending" ? "Registering…" : "Register"}
        </Button>

        <p className="mt-[18px] text-[0.9375rem] text-grey">
          Already registered?{" "}
          <a href="/login" className="font-medium text-teal-ink underline underline-offset-[3px]">
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}
