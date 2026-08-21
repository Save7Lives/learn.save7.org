import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { requireConfig, STORAGE_KEY } from "./config";

/**
 * The server-side Supabase client, for server components and route handlers.
 *
 * **It carries the learner's own JWT, not a service role key.** Every read this
 * app makes is therefore subject to the same row level security a browser would
 * face: a learner sees the course and their own progress, staff see the
 * analytics, and nobody sees `learn_choices.is_correct` because that table has no
 * policy at all. The app enforcing authorisation in `authz.ts` is the second
 * layer, not the only one.
 *
 * That is a deliberate choice over a service-role client, which would have made
 * every query trivially allowed and turned an app-level mistake into a data leak.
 * The one thing that needs to see the answer key is `learn_mark()`, which is
 * security definer in the database and returns a score rather than a key.
 */
export async function supabaseServer() {
  const { url, anonKey } = requireConfig();
  const jar = await cookies();

  return createServerClient(url, anonKey, {
    cookieOptions: { name: STORAGE_KEY },
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(items) {
        try {
          for (const { name, value, options } of items) {
            jar.set(name, value, options);
          }
        } catch {
          // Called from a server component, where the cookie jar is read-only.
          // Refreshed tokens are written by the route handler and the client
          // instead; swallowing here is what the Supabase SSR guide prescribes,
          // and the alternative is throwing on every render.
        }
      },
    },
  });
}
