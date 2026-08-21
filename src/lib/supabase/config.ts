/**
 * The Supabase project this app talks to.
 *
 * The same project the OS and the volunteer portal use — that is the whole point.
 * A volunteer who takes the course is one identity with a `volunteers` row and a
 * `learners` row, which is what lets the portal show their progress.
 *
 * Both values are public by design: the anon key grants nothing on its own, and
 * row level security is the boundary. See save7-os/supabase/migrations/0091.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * A storage key of this app's own.
 *
 * All three apps are served from *.save7.org, and a shared key would let one
 * app's session overwrite another's — the volunteer portal learned this and set
 * `save7-volunteers-auth` for the same reason. A learner opening the course must
 * not sign a staff member out of the books.
 */
export const STORAGE_KEY = "save7-learn-auth";

export function requireConfig(): { url: string; anonKey: string } {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set. " +
        "Both are safe in client code — copy them from the Supabase dashboard, " +
        "Project Settings → API.",
    );
  }
  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
}
