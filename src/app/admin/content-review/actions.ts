"use server";

import { revalidatePath } from "next/cache";
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

  revalidatePath("/admin/content-review");
  revalidatePath("/admin");
}
