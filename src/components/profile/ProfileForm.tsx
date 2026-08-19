"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/primitives";
import { NAME_MAX } from "@/lib/constants";
import type { ProfileFormState } from "@/app/(site)/profile/actions";

/**
 * Edit your own name.
 *
 * Deliberately plain: two fields and a save button. The interesting behaviour is
 * on the server (see src/lib/profile.ts), which also corrects the name on any
 * certificate already issued.
 */
export function ProfileForm({
  action,
  firstName,
  lastName,
  hasCertificates,
}: {
  action: (prev: ProfileFormState, formData: FormData) => Promise<ProfileFormState>;
  firstName: string;
  lastName: string;
  /** Changes the wording: a name change also rewrites issued certificates. */
  hasCertificates: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="mt-6 space-y-5" noValidate>
      <div className="space-y-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
        <Field
          label="First name"
          name="firstName"
          defaultValue={firstName}
          autoComplete="given-name"
          maxLength={NAME_MAX}
          required
        />
        <Field
          label="Surname"
          name="lastName"
          defaultValue={lastName}
          autoComplete="family-name"
          maxLength={NAME_MAX}
          required
        />
      </div>

      <p className="text-sm text-sand-600">
        {hasCertificates
          ? "This is the name on your certificate. Correcting it here updates the certificates you have already earned."
          : "This is the name that will appear on your certificate."}
      </p>

      {/* aria-live so the outcome is announced, not just shown. */}
      <div aria-live="polite">
        {state?.error ? (
          <p className="rounded-xl border border-pink/30 bg-pink/5 px-4 py-3 text-sm font-semibold text-pink-600">
            {state.error}
          </p>
        ) : null}
        {state?.savedName ? (
          <p className="rounded-xl border border-teal/40 bg-teal/10 px-4 py-3 text-sm font-semibold text-ink">
            Saved. Your name is now {state.savedName}.
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  ...rest
}: React.ComponentProps<"input"> & { label: string; name: string }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        className="min-h-11 w-full rounded-xl border border-sand-300 bg-white px-4 text-ink placeholder:text-sand-400"
        {...rest}
      />
    </div>
  );
}
