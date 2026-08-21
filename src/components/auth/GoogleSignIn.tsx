"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

import { supabaseBrowser } from "@/lib/supabase/browser";
import type { PublicSupabaseConfig } from "@/lib/supabase/config";
import { Button } from "@/components/ui/primitives";

/**
 * Google sign-in, the same two paths the volunteer portal uses.
 *
 * **Preferred: Identity Services plus `signInWithIdToken`.** The client id belongs
 * to the volunteer portal's own Cloud project, whose consent screen is External —
 * that is what admits a personal Google account, while the OS's Cloud project
 * stays Internal because its Classroom scopes are sensitive and sensitive scopes
 * on an External screen need Google verification.
 *
 * **Fallback: `signInWithOAuth`**, the shared redirect flow. It runs when no
 * client id is configured or the Google script never loaded, and it is
 * deliberately never hidden. Identity Services renders a perfectly convincing
 * button on an unauthorised origin and 403s the moment it is pressed, and the
 * failure is a 403 on an iframe request that this page cannot observe. So the
 * answer is not to detect it but to always leave a second door.
 */
/**
 * The moment notification `prompt()` hands back.
 *
 * This is the reason there is one button rather than two. Google's *rendered*
 * button draws itself on an unauthorised origin and then 403s an iframe request
 * the page cannot observe — so a page relying on it alone has a control that looks
 * fine and silently does nothing. `prompt()` reports why it did not display,
 * including `unregistered_origin` and `invalid_client`, which is exactly the
 * failure the second button used to cover for.
 */
type PromptMoment = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  getNotDisplayedReason?: () => string;
  getSkippedReason?: () => string;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (listener?: (moment: PromptMoment) => void) => void;
        };
      };
    };
  }
}

/**
 * A nonce, in the two forms the two sides want: Google is given the SHA-256 hash
 * and Supabase the raw value, and Supabase hashes what it is given and compares.
 * Sending the same string to both makes the check pass while proving nothing,
 * which is the failure mode worth avoiding.
 */
async function makeNonce(): Promise<{ raw: string; hashed: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const raw = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { raw, hashed };
}

/** The trigger refuses an unregistered address, and a trigger cannot explain itself. */
const NOT_REGISTERED = /not allowed|restricted|save7|database error|500/i;

export function GoogleSignIn({
  config,
  next,
}: {
  /** Handed down by the server: these are runtime values, not build-time ones. */
  config: PublicSupabaseConfig;
  next?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [identityReady, setIdentityReady] = useState(false);
  const nonce = useRef<{ raw: string; hashed: string } | null>(null);

  /** Enrol, then go where they were headed. */
  const finish = useCallback(async () => {
    const response = await fetch("/api/auth/claim", { method: "POST" });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Signed in, but enrolment failed. Try again.");
      setBusy(false);
      return;
    }
    router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
  }, [next, router]);

  const onCredential = useCallback(
    async (credential: string) => {
      setBusy(true);
      setError(null);
      const supabase = supabaseBrowser(config);
      const { error: signInError } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: credential,
        nonce: nonce.current?.raw,
      });

      if (signInError) {
        setBusy(false);
        if (NOT_REGISTERED.test(signInError.message ?? "")) {
          setNeedsRegistration(true);
          setError(
            "That Google account is not registered with Save7 yet. Register first, using that same address.",
          );
          return;
        }
        setError(signInError.message || "Could not sign in.");
        return;
      }

      await finish();
    },
    [config, finish],
  );

  /**
   * Prepare Identity Services. No button is rendered — see PromptMoment above.
   */
  const initIdentity = useCallback(async () => {
    const clientId = config.googleClientId;
    const identity = window.google?.accounts?.id;
    if (!clientId || !identity) return;

    nonce.current = await makeNonce();
    identity.initialize({
      client_id: clientId,
      nonce: nonce.current.hashed,
      callback: (response: { credential?: string }) => {
        if (!response?.credential) {
          setError("Google returned no credential.");
          return;
        }
        void onCredential(response.credential);
      },
    });
    setIdentityReady(true);
  }, [config.googleClientId, onCredential]);

  /** The redirect flow. Lands back here, where Supabase reads the fragment. */
  const redirectFlow = useCallback(async () => {
    setBusy(true);
    setError(null);
    const supabase = supabaseBrowser(config);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
    if (oauthError) {
      setBusy(false);
      setError(oauthError.message || "Could not start Google sign-in.");
    }
  }, [config]);

  /**
   * What the button does.
   *
   * Tries the ID-token flow first, because it signs the learner in without leaving
   * the page and it is the flow whose consent screen admits a personal Google
   * account. If Google declines to show it — unregistered origin, wrong client, a
   * browser that will not do it, or a script that never loaded — the redirect flow
   * runs instead, with no second control for the learner to discover.
   */
  const signIn = useCallback(() => {
    const identity = window.google?.accounts?.id;
    if (!identityReady || !identity) {
      void redirectFlow();
      return;
    }

    setBusy(true);
    setError(null);
    identity.prompt((moment) => {
      if (moment.isNotDisplayed() || moment.isSkippedMoment()) {
        const reason =
          moment.getNotDisplayedReason?.() ?? moment.getSkippedReason?.() ?? "unknown";
        // `suppressed_by_user` is a deliberate dismissal — offering the redirect
        // immediately would be arguing with somebody who just said no.
        if (reason === "suppressed_by_user" || reason === "user_cancel") {
          setBusy(false);
          return;
        }
        void redirectFlow();
      }
    });
  }, [identityReady, redirectFlow]);

  /** Coming back from the redirect flow already signed in. */
  useEffect(() => {
    const supabase = supabaseBrowser(config);
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) await finish();
    })();
  }, [config, finish]);

  return (
    <div className="space-y-6">
      <Script src="https://accounts.google.com/gsi/client" async onLoad={() => void initIdentity()} />

      <Button type="button" onClick={signIn} disabled={busy} className="w-full">
        {busy ? "Signing in…" : "Continue with Google"}
      </Button>

      {error ? (
        <p className="text-sm text-crit" role="alert">
          {error}
          {needsRegistration ? (
            <>
              {" "}
              <a href="/register" className="underline">
                Register
              </a>
            </>
          ) : null}
        </p>
      ) : null}

      <p className="text-sm text-ink/60">
        Save7 uses your Google account, so there is no password to remember. You need to
        register before your first sign-in.
      </p>
    </div>
  );
}
