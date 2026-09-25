"use client";

import { useActionState } from "react";

import type { FormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/primitives";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/**
 * The two questions `learn_claim_me()` never asks, one at a time.
 *
 * Staff, volunteers and stakeholders never pass through RegisterForm: the sign-in
 * trigger already admits them, so they arrive enrolled but unasked (#44). The
 * order is register-learner's: date of birth, then consent, so a minor is refused
 * before being asked to agree to anything.
 */
export function DateOfBirthForm({ action, next }: { action: Action; next: string }) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />

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
          This course is for adults. You must be 18 or older — there is no exception, so
          please use your real date of birth.
        </span>
      </label>

      {state?.error ? (
        <p className="text-sm text-crit" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Checking…" : "Continue"}
      </Button>
    </form>
  );
}

/**
 * The POPIA s.18 notice and the consent it asks for.
 *
 * Collapsed behind a summary, as the signup notice is (#15). It itemises date of
 * birth (#30) and says plainly that a certificate can be verified by anyone who
 * holds its ID (#24). /privacy is the full notice.
 */
export function ConsentForm({ action, next }: { action: Action; next: string }) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      <details className="rounded-lg border border-ink/15 px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium">
          What Save7 keeps, and who can see it
        </summary>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-ink/80">
          <li>
            <strong>Your name and email address</strong>, from your Google account. Your
            name is printed on your certificates, and you can correct it in your profile.
          </li>
          <li>
            <strong>Your date of birth</strong>, because this course is 18+ only. We keep
            the date rather than just a yes/no so that check can be reviewed later.
          </li>
          <li>
            <strong>Your course progress</strong>: the lessons you have read, your quiz
            and Baseline results, and the certificates you earn. Save7 staff can see it,
            to support learners and to find out whether the course is working.
          </li>
          <li>
            <strong>Anyone with a certificate&apos;s ID can check it.</strong> They see the
            name on it, the level, the date and whether it is still valid, and nothing
            else.
          </li>
          <li>
            If you are a Save7 volunteer, your course progress also shows in the volunteer
            portal, where it counts towards your vetting.
          </li>
        </ul>
        <p className="mt-3">
          <a href="/privacy" className="underline">
            How we handle your information
          </a>
          , including your rights under POPIA.
        </p>
      </details>

      <label className="flex gap-3 text-sm">
        <input type="checkbox" name="popiaConsent" className="mt-1" />
        <span>
          I agree that Save7 may store my name, email address, date of birth and course
          progress so that my learning and certificate can be recorded.
        </span>
      </label>

      {state?.error ? (
        <p className="text-sm text-crit" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Start the course"}
      </Button>
    </form>
  );
}
