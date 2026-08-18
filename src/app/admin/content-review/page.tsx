import type { Metadata } from "next";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contentReviewItems } from "@/db/schema";
import { getReviewSummary } from "@/lib/analytics";
import { PageTitle, Section, StatCard } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/primitives";
import { ReviewItemRow } from "@/components/admin/ReviewItemRow";
import { setReviewStatusAction } from "./actions";
import type { ReviewStatus } from "@/lib/constants";

export const metadata: Metadata = { title: "Content review" };

/**
 * The content-review register.
 *
 * The register is *generated* from the course content itself — see
 * `deriveReviewItems()` in prisma/seed.ts — so it cannot drift out of date. A claim
 * cannot be added to a lesson without appearing here.
 *
 * Until an item is approved, learners see a visible "pending Save7 review" badge
 * wherever that claim appears. That is why the count on this page matters: it is not
 * a backlog, it is what the course is currently admitting it does not know.
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
    db.query.contentReviewItems.findMany({
      where: and(
        statusFilter !== "ALL" ? eq(contentReviewItems.status, statusFilter) : undefined,
        categoryFilter ? eq(contentReviewItems.category, categoryFilter) : undefined,
      ),
      // Severity first, so the launch-blocking items are always at the top.
      orderBy: [asc(contentReviewItems.severity), asc(contentReviewItems.location)],
      limit: 400,
      columns: {
        id: true,
        location: true,
        claim: true,
        category: true,
        status: true,
        severity: true,
        sourceHint: true,
        notes: true,
        entityType: true,
        reviewedAt: true,
      },
      with: { reviewedBy: { columns: { name: true } } },
    }),
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
                  reviewedAt: item.reviewedAt ? item.reviewedAt.toISOString() : null,
                  reviewedByName: item.reviewedBy?.name ?? null,
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
