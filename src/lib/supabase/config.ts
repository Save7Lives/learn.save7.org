/**
 * The Supabase project this app talks to.
 *
 * The same project the OS and the volunteer portal use — that is the whole point.
 * A volunteer who takes the course is one identity with a `volunteers` row and a
 * `learners` row, which is what lets the portal show their progress.
 *
 * ── WHY THE BROWSER IS HANDED THIS RATHER THAN READING IT ────────────────────
 * `NEXT_PUBLIC_*` variables are **inlined by Next at build time**. The app first ran
 * on Cloudflare, where `wrangler.jsonc` vars were applied at *deploy* time, so a
 * client component reading `process.env.NEXT_PUBLIC_SUPABASE_URL` got `undefined`
 * and sign-in broke with no error the server could see.
 *
 * So the values are read on the server and passed to the client components that need
 * them. Vercel makes project environment variables available at build time too, so
 * the indirection is no longer strictly required. It stays because it works
 * unchanged on any host, and because a build without the variables then fails on the
 * server with a clear message rather than shipping a client that silently cannot
 * sign anyone in.
 *
 * All three are public by design: the anon key grants nothing on its own, a Google
 * client id appears in every page that uses Google sign-in, and row level security
 * is the boundary. See save7-os/supabase/migrations/0091.
 */

export type PublicSupabaseConfig = {
  url: string;
  anonKey: string;
  /** Optional: without it, sign-in falls back to the shared redirect flow. */
  googleClientId: string | null;
};

/**
 * A storage key of this app's own.
 *
 * All three apps are served from *.save7.org, and a shared key would let one app's
 * session overwrite another's — the volunteer portal set `save7-volunteers-auth`
 * for the same reason. A learner opening the course must not sign a staff member
 * out of the books.
 */
export const STORAGE_KEY = "save7-learn-auth";

/** Server-side only: reads the runtime environment. */
export function publicConfig(): PublicSupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set. " +
        "Both are safe in client code — copy them from the Supabase dashboard, " +
        "Project Settings → API. On Vercel they are project environment variables; locally they are in .env (see .env.example).",
    );
  }

  return {
    url,
    anonKey,
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? null,
  };
}
