"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authz";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contentReviewItems } from "@/db/schema";
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

  await db
    .update(contentReviewItems)
    .set({
      status,
      reviewedById: admin.id,
      reviewedAt: new Date(),
      ...(notes !== undefined ? { notes: notes.slice(0, 4000) } : {}),
    })
    .where(eq(contentReviewItems.id, itemId));

  revalidatePath("/admin/content-review");
  revalidatePath("/admin");
}
