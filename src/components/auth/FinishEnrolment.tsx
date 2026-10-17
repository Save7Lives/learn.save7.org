"use client";

import { useActionState } from "react";

import type { FormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/primitives";
import { ConsentRow, DisclosureCard, Field } from "@/components/ui/shared-parts";

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
    <form action={formAction}>
      <input type="hidden" name="next" value={next} />

      <Field
        id="dateOfBirth"
        name="dateOfBirth"
        label="Date of birth"
        type="date"
        required
        autoComplete="bday"
        max={new Date().toISOString().slice(0, 10)}
        helper="This course is for adults. You must be 18 or older. There is no exception, so please use your real date of birth."
        error={state?.error}
      />

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
    <form action={formAction} className="space-y-[18px]">
      <input type="hidden" name="next" value={next} />

      <DisclosureCard title="What Save7 keeps, and who can see it">
        <ul>
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
        <p>
          <a href="/privacy" className="font-medium text-teal-ink underline underline-offset-[3px]">
            How we handle your information
          </a>
          , including your rights under POPIA.
        </p>
      </DisclosureCard>

      <ConsentRow id="popiaConsent" name="popiaConsent" error={state?.error}>
        I agree that Save7 may store my name, email address, date of birth and course
        progress so that my learning and certificate can be recorded.
      </ConsentRow>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Start the course"}
      </Button>
    </form>
  );
}
