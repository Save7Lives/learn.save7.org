import "server-only";

import { supabaseServer } from "@/lib/supabase/server";

/**
 * Who signed a decision off (T98). Eligibility Rule saves and review sign-offs are
 * recorded against the Admin's sign-in, the auth user id, because an Admin who is only
 * a Student has no staff record and the Owner may never have enrolled. The database
 * insists the id is the caller's own (`created_by_user = auth.uid()`), so this is the
 * value to write, not a claim the app makes.
 */
export async function currentUserId(): Promise<string | null> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Names for those sign-ins: the Student row's name, else the staff name, else the
 * address (`learn_actor_names`, which answers an Admin only). An id it cannot resolve,
 * such as an account since deleted, is simply absent from the map.
 */
export async function loadActorNames(ids: Array<string | null>): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return new Map();
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc("learn_actor_names", { ids: unique });
  return new Map(((data ?? []) as Array<{ user_id: string; name: string }>).map((r) => [r.user_id, r.name]));
}
