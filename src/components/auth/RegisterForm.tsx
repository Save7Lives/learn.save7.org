"use client";

import { useState } from "react";

import type { PublicSupabaseConfig } from "@/lib/supabase/config";
import { Button, ButtonLink } from "@/components/ui/primitives";

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

export function RegisterForm({ config }: { config: PublicSupabaseConfig }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setState("sending");

    const form = new FormData(event.currentTarget);
    const dateOfBirth = String(form.get("dateOfBirth") ?? "");

    if (!dateOfBirth || !isAtLeast18(dateOfBirth)) {
      setState("idle");
      setError("You must be 18 or older to register for this course.");
      return;
    }

    if (!form.get("popiaConsent")) {
      setState("idle");
      setError("We need your consent to store your name, email, date of birth and course progress.");
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
        setError(body.error ?? "Could not register. Try again in a moment.");
        return;
      }
      setState("done");
    } catch {
      setState("idle");
      setError("Could not reach Save7. Check your connection and try again.");
    }
  }

  if (state === "done") {
    return (
      <div className="space-y-4">
        <p className="text-ink">
          You&apos;re registered. Sign in with that same Google account to start the course.
        </p>
        {/* Straight into the first Baseline Sitting, as #15 decided: it is the
            "before", and Stage content waits for it. */}
        <ButtonLink href="/login?next=/assessment/pre">Sign in with Google</ButtonLink>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <label className="block">
        <span className="text-sm font-medium">First name</span>
        <input name="firstName" required className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2" />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Surname</span>
        <input name="lastName" className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2" />
        <span className="mt-1 block text-xs text-ink/60">
          This is the name that will appear on your certificate. You can change it later in
          your profile.
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Email address</span>
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
        />
        <span className="mt-1 block text-xs text-ink/60">
          Use the address of the Google account you will sign in with.
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Date of birth</span>
        <input
          name="dateOfBirth"
          type="date"
          required
          max={new Date().toISOString().slice(0, 10)}
          className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
        />
        <span className="mt-1 block text-xs text-ink/60">
          This course is for adults. You must be 18 or older to register — there is no
          exception, so please use your real date of birth.
        </span>
      </label>

      <label className="flex gap-3 text-sm">
        <input type="checkbox" name="popiaConsent" className="mt-1" />
        <span>
          I agree that Save7 may store my name, email address, date of birth and course
          progress so that my learning and certificate can be recorded.{" "}
          <a href="/privacy" className="underline">
            How we handle your information
          </a>
          .
        </span>
      </label>

      {error ? (
        <p className="text-sm text-crit" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={state === "sending"} className="w-full">
        {state === "sending" ? "Registering…" : "Register"}
      </Button>
    </form>
  );
}
