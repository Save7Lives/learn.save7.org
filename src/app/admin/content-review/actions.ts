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
  const admin = await requireAdmin();

  const supabase = await supabaseServer();
  await supabase
    .from("learn_review_items")
    .update({
      status,
      cleared_by: admin.id,
      cleared_at: new Date().toISOString(),
      ...(notes !== undefined ? { notes: notes.slice(0, 4000) } : {}),
    })
    .eq("id", itemId);

  // No revalidatePath: every route here reads cookies for the session, so all of
  // them are dynamic and none has a server-side cached entry to invalidate — its
  // only real effect would be clearing the client's router cache, which the
  // caller now does explicitly. On @cloudflare/next-on-pages on-demand
  // revalidation is unsupported in any case.
}
