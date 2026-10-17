"use server";

import { requireAdmin } from "@/lib/authz";
import { supabaseServer } from "@/lib/supabase/server";
import { currentUserId } from "@/lib/admin/actors";
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
  /* Recorded against the sign-in (T98), which every Admin has: `cleared_by` is a
     `people` id, and an Admin who is only a Student has no such row. The update policy
     refuses any id but the caller's own. */
  const userId = await currentUserId();
  if (!userId) throw new Error("Your session has ended. Sign in again.");

  const { error } = await supabase
    .from("learn_review_items")
    .update({
      status,
      cleared_by_user: userId,
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
