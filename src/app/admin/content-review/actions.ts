"use server";

import { requireAdmin } from "@/lib/authz";
import { supabaseServer } from "@/lib/supabase/server";
import type { ReviewStatus } from "@/lib/constants";

/**
 * Record a review decision.
 *
 * Who decided and when are both stored, because "approved by somebody at some
 * point" is not an audit trail for a medical or legal claim.
 */
export async function setReviewStatusAction(
  itemId: string,
  status: ReviewStatus,
  notes?: string,
): Promise<void> {
  await requireAdmin();

  const supabase = await supabaseServer();
  /* `cleared_by` references `people(id)`, so it is the staff member's people id, not
     the session's `learners` id (which is empty for staff who never enrolled). Writing
     the learner id broke the foreign key, and the failure was never read, so no
     decision here was ever recorded. */
  const { data: personId } = await supabase.rpc("app_person_id");
  if (!personId) throw new Error("Your account is not linked to a Save7 staff record.");

  const { error } = await supabase
    .from("learn_review_items")
    .update({
      status,
      cleared_by: personId as string,
      cleared_at: new Date().toISOString(),
      ...(notes !== undefined ? { notes: notes.slice(0, 4000) } : {}),
    })
    .eq("id", itemId);
  if (error) throw new Error("The decision could not be recorded.");

  // No revalidatePath: every route here reads cookies for the session, so all of
  // them are dynamic and none has a server-side cached entry to invalidate — its
  // only real effect would be clearing the client's router cache, which the
  // caller now does explicitly.
}
