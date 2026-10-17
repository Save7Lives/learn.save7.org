"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/authz";
import { supabaseServer } from "@/lib/supabase/server";
import { levelFlag } from "@/lib/admin/flags";
import { currentUserId } from "@/lib/admin/actors";

export type RuleFormState = { error?: string } | undefined;

/**
 * Save the Eligibility Rule as a new version (#72, #84).
 *
 * Never an edit: the only write is an insert into `learn_eligibility_rules`, which
 * has no update or delete policy, so an old version cannot change even from here. The
 * version number is the database's (`nextval`), and `created_by_user` must be the
 * caller's own sign-in or the insert policy refuses it (T98). Saving re-evaluates every
 * Student under the new rule (#83's trigger), so this action does not touch signals.
 *
 * Checked again here, not only in the editor: a rule with no flags would make every
 * Student eligible, a flag that is not a Level's reads as nobody, and an unchanged
 * list or a stale page must not mint a pointless version.
 */
export async function saveEligibilityRuleAction(
  _previous: RuleFormState,
  formData: FormData,
): Promise<RuleFormState> {
  await requireAdmin();
  const supabase = await supabaseServer();

  const [levels, current, userId] = await Promise.all([
    supabase.from("learn_levels").select("slug").order("position"),
    supabase
      .from("learn_eligibility_rules")
      .select("version, required_flags")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle(),
    currentUserId(),
  ]);

  const allowed = ((levels.data ?? []) as Array<{ slug: string }>).map((l) => levelFlag(l.slug));
  const picked = new Set(formData.getAll("flag").map(String));
  const flags = allowed.filter((f) => picked.has(f));

  if (flags.length === 0) {
    return { error: "A rule with no flags would make every Student eligible. Pick at least one." };
  }
  if (flags.length !== picked.size) {
    return { error: "One of those flags is not a Level. Reload the page and try again." };
  }

  const head = current.data as { version: number; required_flags: string[] } | null;
  if (String(head?.version ?? "") !== String(formData.get("baseVersion") ?? "")) {
    return { error: "Someone saved a newer version while you were editing. Reload the page to see it." };
  }
  if (head && head.required_flags.length === flags.length && head.required_flags.every((f) => flags.includes(f))) {
    return { error: "That is already the current rule. Change a flag to save a new version." };
  }

  if (!userId) return { error: "Your session has ended. Sign in again to save the rule." };

  const { data, error } = await supabase
    .from("learn_eligibility_rules")
    .insert({ required_flags: flags, created_by_user: userId })
    .select("version")
    .single();
  if (error || !data) return { error: "The rule could not be saved. Nothing was changed." };

  redirect(`/admin/eligibility?saved=${(data as { version: number }).version}`);
}
