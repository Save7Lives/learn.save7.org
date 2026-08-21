/**
 * The Supabase project this app talks to.
 *
 * The same project the OS and the volunteer portal use — that is the whole point.
 * A volunteer who takes the course is one identity with a `volunteers` row and a
 * `learners` row, which is what lets the portal show their progress.
 *
 * ── WHY THE BROWSER IS HANDED THIS RATHER THAN READING IT ────────────────────
 * `NEXT_PUBLIC_*` variables are **inlined by Next at build time**, and Cloudflare
 * applies `wrangler.jsonc` vars at **runtime**. So a client component reading
 * `process.env.NEXT_PUBLIC_SUPABASE_URL` on Pages gets whatever was present on the
 * build machine — `undefined`, for a git-connected build — and sign-in breaks with
 * no error the server can see.
 *
 * So the values are read on the server, where runtime vars work, and passed to the
 * client components that need them. One build then runs in any environment, and
 * changing project or hostname is a variable change rather than a rebuild.
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
        "Project Settings → API. On Cloudflare Pages they are vars in wrangler.jsonc.",
    );
  }

  return {
    url,
    anonKey,
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? null,
  };
}
