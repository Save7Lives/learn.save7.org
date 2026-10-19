import type { Metadata } from "next";
import { requireAdmin } from "@/lib/authz";
import { getReviewSummary } from "@/lib/admin/review";
import { loadActorNames } from "@/lib/admin/actors";
import { supabaseServer } from "@/lib/supabase/server";
import { StatCard } from "@/components/portal/Portal";
import { PageHeader, Panel } from "@/components/portal/Panel";
import { FilterGroup } from "@/components/portal/FilterChips";
import { Badge } from "@/components/ui/primitives";
import { ReviewItemRow } from "@/components/admin/ReviewItemRow";
import { setReviewStatusAction } from "./actions";
import type { ReviewStatus } from "@/lib/constants";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Content review" };

/**
 * The content-review register.
 *
 * The register is *generated* from the course content: see the `learn_review_items`
 * upserts in scripts/emit-supabase-content.ts. Every Stage Quiz, Baseline and
 * clinical gate question lands here on emit, so none can be added without
 * appearing. It is APPROVED when its `verifiedAgainst` names a source, and
 * NEEDS_VERIFICATION otherwise. Lesson prose never lands here. It has no review
 * mechanism.
 *
 * A decision recorded on this page is the only kind with a name and a date on it
 * (cleared_by_user, cleared_at). An emitter approval carries neither, and the emit only
 * ever promotes an outstanding item, so it never reverts a decision made here.
 *
 * Nothing learner-facing reads this table, so an unapproved item reaches learners
 * without a badge. The needs-verification count is what the course admits it has
 * not sourced. It does not gate what learners see.
 */
export default async function ContentReviewPage(
  props: PageProps<"/admin/content-review">,
) {
  // The layout guards too, but it renders alongside this page, so a signed-out visitor
  // would otherwise reach the loaders as `anon` before being sent to /login.
  await requireAdmin();
  const params = await props.searchParams;
  const statusFilter =
    typeof params.status === "string" ? params.status : "NEEDS_VERIFICATION";
  const categoryFilter = typeof params.category === "string" ? params.category : null;

  const [summary, items] = await Promise.all([
    getReviewSummary(),
    (async () => {
      const supabase = await supabaseServer();
      let query = supabase
        .from("learn_review_items")
        .select(
          "id, location, claim, category, status, severity, source_hint, notes, entity_type, entity_ref, cleared_at, cleared_by_user",
        )
        // Severity first, so the launch-blocking items are always at the top.
        .order("severity")
        .order("location")
        .limit(400);

      if (statusFilter !== "ALL") query = query.eq("status", statusFilter);
      if (categoryFilter) query = query.eq("category", categoryFilter);

      const { data } = await query;
      const rows = (data ?? []) as unknown as Array<{
        id: string;
        location: string;
        claim: string;
        category: string;
        status: string;
        severity: number;
        source_hint: string | null;
        notes: string | null;
        entity_type: string;
        entity_ref: string;
        cleared_at: string | null;
        /* The Admin who signed it off, by sign-in; named below. */
        cleared_by_user: string | null;
      }>;
      const names = await loadActorNames(rows.map((r) => r.cleared_by_user));
      return rows.map((r) => ({
        id: r.id,
        location: r.location,
        claim: r.claim,
        category: r.category,
        status: r.status,
        severity: r.severity,
        sourceHint: r.source_hint,
        notes: r.notes,
        entityType: r.entity_type,
        entityRef: r.entity_ref,
        reviewedAt: r.cleared_at,
        reviewedByName: (r.cleared_by_user && names.get(r.cleared_by_user)) || null,
      }));
    })(),
  ]);

  const filters: Array<{ label: string; status: string; count: number }> = [
    { label: "Needs verification", status: "NEEDS_VERIFICATION", count: summary.needsVerification },
    { label: "Approved", status: "APPROVED", count: summary.approved },
    { label: "Rejected", status: "REJECTED", count: summary.rejected },
    { label: "All", status: "ALL", count: summary.total },
  ];

  return (
    <>
      <PageHeader
        title="Content review"
        lede="Every Stage Quiz, Baseline and clinical gate question, generated from the content itself. A question is approved on generation only when it names the document it was checked against. Lesson prose is not listed here, and learners see no badge on an unapproved question."
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
        <StatCard
          label="Needs verification"
          value={String(summary.needsVerification)}
          sub={`of ${summary.total} registered claims`}
          icon="alert"
          tint="pink"
        />
        <StatCard
          label="Blocking launch"
          value={String(summary.blockingLaunch)}
          sub="Severity 1: must clear first"
          icon="flag"
          tint="teal"
        />
        <StatCard label="Approved" value={String(summary.approved)} sub="Named source or a person" icon="check-circle" tint="pink" />
        <StatCard
          label="By category"
          value={String(summary.byCategory.reduce((s, c) => s + c.count, 0))}
          sub={summary.byCategory.map((c) => `${c.category}: ${c.count}`).join(" · ")}
          icon="list"
          tint="teal"
        />
      </div>

      <Panel
        title="Register"
        lede="Your decision is recorded with your name and the date. Re-running the content generator never overrides an approval or a rejection made here."
        className="mt-4"
      >
        <div className="mb-5">
          <FilterGroup
            label="Status"
            current={statusFilter}
            options={filters.map((f) => ({
              value: f.status,
              label: `${f.label} ${f.count}`,
              href: `/admin/content-review?status=${f.status}`,
            }))}
          />
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-grey">
            Nothing in this view.
            {statusFilter === "NEEDS_VERIFICATION"
              ? " Every registered claim has been reviewed."
              : ""}
          </p>
        ) : (
          <ul className="space-y-2.5">
            {items.map((item) => (
              <ReviewItemRow
                key={item.id}
                item={{
                  id: item.id,
                  location: item.location,
                  claim: item.claim,
                  category: item.category,
                  status: item.status as ReviewStatus,
                  severity: item.severity,
                  sourceHint: item.sourceHint,
                  notes: item.notes,
                  entityType: item.entityType,
                  reviewedAt: item.reviewedAt,
                  reviewedByName: item.reviewedByName,
                }}
                onSetStatus={setReviewStatusAction}
              />
            ))}
          </ul>
        )}

        {items.length === 400 ? (
          <p className="mt-4 text-[0.8125rem] text-grey">
            Showing the first 400 items. Narrow the filter to see more.
          </p>
        ) : null}
      </Panel>

      <Panel
        title="What must clear before launch"
        lede="Most of this is lesson prose, which the register above does not list, so it is read and signed off outside this page."
        className="mt-4"
      >
        <ul className="space-y-2 text-sm text-grey">
          <li>
            · <Badge tone="review">Intermediate · Stage 1</Badge> Determination of
            death must be verified against the current South African guidelines,
            cited exactly.
          </li>
          <li>
            · <Badge tone="review">Intermediate · Stage 3, Advanced · Stage 3</Badge>{" "}
            The law. The National Health Act provisions must be checked against the
            consolidated text in force, not an older study guide.
          </li>
          <li>
            · <Badge tone="review">Beginner · Stage 2</Badge> Donor suitability.
            Outdated exclusion criteria are actively harmful, so this needs current
            guidance rather than merely available guidance.
          </li>
          <li>
            · <Badge tone="review">All Stages</Badge> Statistics must be date-stamped
            at publication. No author, year or identifier has been invented anywhere
            in this course.
          </li>
        </ul>
      </Panel>
    </>
  );
}
