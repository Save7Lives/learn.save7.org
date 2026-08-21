import { claimLearner } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "edge";

/**
 * Enrol the signed-in account on the course.
 *
 * Called by the sign-in page once Supabase has a session. A route rather than a
 * server action because the caller is a browser flow finishing a Google
 * credential exchange, and it needs a plain fetch it can await.
 *
 * The address is never taken from the request. `learn_claim_me()` reads it from
 * the JWT, so a caller cannot enrol somebody else by naming them.
 */
export async function POST() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const meta = (user.user_metadata ?? {}) as { given_name?: string; family_name?: string };
  const result = await claimLearner(meta.given_name, meta.family_name);

  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  return Response.json({ ok: true, id: result.id });
}
