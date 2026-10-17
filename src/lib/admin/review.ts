import "server-only";

import { supabaseServer } from "@/lib/supabase/server";

/** The content-review register's counts, for its stat cards. */
export type ReviewSummary = {
  total: number;
  needsVerification: number;
  approved: number;
  rejected: number;
  blockingLaunch: number;
  byCategory: Array<{ category: string; count: number }>;
};

export async function getReviewSummary(): Promise<ReviewSummary> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("learn_review_items")
    .select("status, category, severity");

  const items = (data ?? []) as unknown as Array<{
    status: string;
    category: string;
    severity: number;
  }>;

  const byCategory = ["MEDICAL", "LEGAL", "STATISTIC"].map((category) => ({
    category,
    count: items.filter(
      (i) => i.category === category && i.status === "NEEDS_VERIFICATION",
    ).length,
  }));

  return {
    total: items.length,
    needsVerification: items.filter((i) => i.status === "NEEDS_VERIFICATION").length,
    approved: items.filter((i) => i.status === "APPROVED").length,
    rejected: items.filter((i) => i.status === "REJECTED").length,
    blockingLaunch: items.filter(
      (i) => i.status === "NEEDS_VERIFICATION" && i.severity === 1,
    ).length,
    byCategory,
  };
}
