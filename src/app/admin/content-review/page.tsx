import type { Metadata } from "next";
import { getReviewSummary } from "@/lib/analytics";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTitle, Section, StatCard } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/primitives";
import { ReviewItemRow } from "@/components/admin/ReviewItemRow";
import { setReviewStatusAction } from "./actions";
import type { ReviewStatus } from "@/lib/constants";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Cloudflare applies at deploy time. A
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
 * (cleared_by, cleared_at). An emitter approval carries neither, and the emit only
 * ever promotes an outstanding item, so it never reverts a decision made here.
 *
 * Nothing learner-facing reads this table, so an unapproved item reaches learners
 * without a badge. The needs-verification count is what the course admits it has
 * not sourced. It does not gate what learners see.
 */
export default async function ContentReviewPage(
  props: PageProps<"/admin/content-review">,
) {
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
          "id, location, claim, category, status, severity, source_hint, notes, entity_type, entity_ref, cleared_at, people(name)",
        )
        // Severity first, so the launch-blocking items are always at the top.
        .order("severity")
        .order("location")
        .limit(400);

      if (statusFilter !== "ALL") query = query.eq("status", statusFilter);
      if (categoryFilter) query = query.eq("category", categoryFilter);

      const { data } = await query;
      return ((data ?? []) as unknown as Array<{
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
        /* The staff member who signed it off, embedded through cleared_by's
           foreign key into `people`. Readable here because this page is staff
           only; a learner reading `people` gets nothing. */
        people: { name: string } | null;
      }>).map((r) => ({
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
        reviewedByName: r.people?.name ?? null,
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
      <PageTitle
        title="Content review"
        description="Every medical, legal and statistical claim in the course, generated from the content itself. Nothing here is approved by default, and learners see a visible 'pending review' badge wherever a claim is unapproved."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Needs verification"
          value={summary.needsVerification}
          sub={`of ${summary.total} registered claims`}
          tone={summary.needsVerification > 0 ? "warn" : "neutral"}
        />
        <StatCard
          label="Blocking launch"
          value={summary.blockingLaunch}
          sub="Severity 1 — must clear first"
          tone={summary.blockingLaunch > 0 ? "warn" : "teal"}
        />
        <StatCard label="Approved" value={summary.approved} tone="teal" />
        <StatCard
          label="By category"
          value={summary.byCategory.reduce((s, c) => s + c.count, 0)}
          sub={summary.byCategory.map((c) => `${c.category}: ${c.count}`).join(" · ")}
        />
      </div>

      <Section
        title="Register"
        description="Approving an item removes the learner-facing badge from that claim. Re-running the content seed never un-approves what you have already signed off."
        className="mt-6"
      >
        <nav aria-label="Filter by status" className="mb-5 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <a
              key={filter.status}
              href={`/admin/content-review?status=${filter.status}`}
              className={
                filter.status === statusFilter
                  ? "rounded-pill bg-ink px-3.5 py-1.5 text-sm font-semibold text-cream"
                  : "rounded-pill border border-sand-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-sand-600 hover:border-sand-400"
              }
            >
              {filter.label}
              <span className="ml-1.5 opacity-60">{filter.count}</span>
            </a>
          ))}
        </nav>

        {items.length === 0 ? (
          <p className="text-sm text-sand-500">
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
          <p className="mt-4 text-xs text-sand-500">
            Showing the first 400 items. Narrow the filter to see more.
          </p>
        ) : null}
      </Section>

      <Section
        title="What must clear before launch"
        className="mt-4"
      >
        <ul className="space-y-2 text-sm text-sand-600">
          <li>
            · <Badge tone="review">Module 6</Badge> Determination of death — must be
            verified against the current South African guidelines, cited exactly.
          </li>
          <li>
            · <Badge tone="review">Module 9</Badge> The law — the National Health Act
            provisions must be checked against the consolidated text in force, not an
            older study guide.
          </li>
          <li>
            · <Badge tone="review">Module 8</Badge> Donor suitability — outdated
            exclusion criteria are actively harmful, so this needs current guidance
            rather than merely available guidance.
          </li>
          <li>
            · <Badge tone="review">All modules</Badge> Statistics must be date-stamped
            at publication, and every stub citation completed. No author, year or
            identifier has been invented anywhere in this course.
          </li>
        </ul>
      </Section>
    </>
  );
}
