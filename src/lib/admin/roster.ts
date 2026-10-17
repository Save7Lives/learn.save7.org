import "server-only";

import { supabaseServer } from "@/lib/supabase/server";
import type { AdminRole } from "@/lib/constants";

/**
 * Who the Learn Admins are (T95). `learn_admin_roster()` answers an Admin only, so
 * this is read with the signed-in Admin's own JWT like every other Admin read.
 *
 * Keyed on the Student where there is one: the Students screen marks a row by its
 * `learners` id. The Owner may be nobody's Student (never enrolled), so the Owner's
 * name is kept apart for the shell.
 */
export type AdminRoster = {
  /** Student id -> role, for the rows the Students screen shows. */
  byStudent: Record<string, AdminRole>;
  /** The Owner's name, or null while no Owner exists. */
  ownerName: string | null;
};

type RosterRow = { learner_id: string | null; role: string; name: string };

export async function loadAdminRoster(): Promise<AdminRoster> {
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc("learn_admin_roster");
  const rows = (data ?? []) as RosterRow[];

  const byStudent: Record<string, AdminRole> = {};
  let ownerName: string | null = null;
  for (const r of rows) {
    const role: AdminRole = r.role === "owner" ? "owner" : "admin";
    if (role === "owner") ownerName = r.name;
    if (r.learner_id) byStudent[r.learner_id] = role;
  }
  return { byStudent, ownerName };
}
