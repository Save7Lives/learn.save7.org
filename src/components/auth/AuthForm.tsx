"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Display } from "@/components/ui/primitives";
import type { FormState } from "@/app/(auth)/actions";
import { NAME_MAX } from "@/lib/constants";

type Mode = "signin" | "signup";

export function AuthForm({
  mode,
  action,
  next,
}: {
  mode: Mode;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const isSignUp = mode === "signup";

  return (
    <div>
      <Display as="h1" className="text-display text-ink">
        {isSignUp ? "Create your account" : "Welcome back"}
      </Display>
      <p className="mt-3 text-sand-600">
        {isSignUp
          ? "You only need your name and an email. Your progress and scores are saved so you can stop and come back."
          : "Sign in to pick up where you left off."}
      </p>

      <form action={formAction} className="mt-8 space-y-5" noValidate>
        {next ? <input type="hidden" name="next" value={next} /> : null}

        {isSignUp ? (
          <div className="space-y-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
            <Field
              label="First name"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              maxLength={NAME_MAX}
            />
            <Field
              label="Surname"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              maxLength={NAME_MAX}
            />
            <p className="text-xs text-sand-500 sm:col-span-2">
              This is the name that will appear on your certificate. You can change it
              later in your profile.
            </p>
          </div>
        ) : null}

        <Field
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
          inputMode="email"
        />

        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          required
          hint={isSignUp ? "At least 8 characters." : undefined}
        />

        {isSignUp ? (
          <div className="rounded-xl border border-sand-200 bg-white p-4">
            <label className="flex gap-3 text-sm text-sand-700">
              <input
                type="checkbox"
                name="popiaConsent"
                required
                className="mt-0.5 size-4 shrink-0 accent-pink"
              />
              <span>
                I agree that Save7 may store my name, email address and course progress
                so that my learning and certificate can be recorded.{" "}
                <Link href="/privacy" className="font-semibold text-pink-600 underline">
                  How we handle your information
                </Link>
                .
              </span>
            </label>
          </div>
        ) : null}

        {/* aria-live so a screen reader announces a failure without the learner
            having to go looking for it. */}
        <div aria-live="polite">
          {state?.error ? (
            <p className="rounded-xl border border-red-200 bg-incorrect-soft px-4 py-3 text-sm font-medium text-incorrect">
              {state.error}
            </p>
          ) : null}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending
            ? isSignUp
              ? "Creating your account…"
              : "Signing in…"
            : isSignUp
              ? "Create account"
              : "Sign in"}
        </Button>
      </form>

      <p className="mt-8 text-sm text-sand-600">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-pink-600 underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to the course?{" "}
            <Link href="/register" className="font-semibold text-pink-600 underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  hint,
  ...rest
}: React.ComponentProps<"input"> & { label: string; name: string; hint?: string }) {
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-describedby={hintId}
        className="min-h-11 w-full rounded-xl border border-sand-300 bg-white px-4 text-ink placeholder:text-sand-400"
        {...rest}
      />
      {hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-sand-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
