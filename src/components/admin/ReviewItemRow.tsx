"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, cx } from "@/components/ui/primitives";
import type { ReviewStatus } from "@/lib/constants";

export type ReviewItem = {
  id: string;
  location: string;
  claim: string;
  category: string;
  status: ReviewStatus;
  severity: number;
  sourceHint: string | null;
  notes: string | null;
  entityType: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
};

const CATEGORY_TONES = {
  MEDICAL: "teal",
  LEGAL: "pink",
  STATISTIC: "neutral",
} as const;

export function ReviewItemRow({
  item,
  onSetStatus,
}: {
  item: ReviewItem;
  onSetStatus: (id: string, status: ReviewStatus, notes?: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function decide(status: ReviewStatus) {
    startTransition(async () => {
      await onSetStatus(item.id, status, notes);
      // Re-fetches this route's server components, so the row shows the decision
      // that was just recorded. The supported replacement for revalidatePath(),
      // which cannot be called on this platform.
      router.refresh();
    });
  }

  return (
    <li
      className={cx(
        "rounded-card border bg-white p-4",
        item.status === "APPROVED"
          ? "border-correct/30"
          : item.status === "REJECTED"
            ? "border-incorrect/30"
            : item.severity === 1
              ? "border-review/40"
              : "border-sand-200",
      )}
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              tone={
                CATEGORY_TONES[item.category as keyof typeof CATEGORY_TONES] ?? "neutral"
              }
            >
              {item.category}
            </Badge>
            {item.severity === 1 ? (
              <Badge tone="review">Blocks launch</Badge>
            ) : null}
            <span className="text-xs text-sand-500">{item.location}</span>
            <span className="text-xs text-sand-400">· {item.entityType}</span>
          </div>

          <p className="mt-2 text-sm text-ink">{item.claim}</p>

          {item.sourceHint ? (
            <p className="mt-1.5 text-xs text-sand-500">
              <span className="font-semibold">Source needed:</span> {item.sourceHint}
            </p>
          ) : null}

          {item.status !== "NEEDS_VERIFICATION" ? (
            <p className="mt-1.5 text-xs text-sand-500">
              {item.status === "APPROVED" ? "Approved" : "Rejected"}
              {item.reviewedByName ? ` by ${item.reviewedByName}` : ""}
              {item.reviewedAt
                ? ` on ${new Date(item.reviewedAt).toLocaleDateString("en-ZA")}`
                : ""}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {item.status === "APPROVED" ? (
            <Badge tone="correct">Approved</Badge>
          ) : item.status === "REJECTED" ? (
            <Badge tone="incorrect">Rejected</Badge>
          ) : null}
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className="text-sm font-semibold text-pink-600 underline"
          >
            {expanded ? "Close" : "Review"}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="mt-4 border-t border-sand-200 pt-4">
          <label
            htmlFor={`notes-${item.id}`}
            className="block text-xs font-bold uppercase tracking-wider text-sand-500"
          >
            Reviewer notes
          </label>
          <textarea
            id={`notes-${item.id}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-sand-300 bg-white p-3 text-sm text-ink"
            placeholder="Record the source you verified against, or why this was rejected."
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => decide("APPROVED")}
              disabled={pending}
            >
              {pending ? "Saving…" : "Approve"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => decide("REJECTED")}
              disabled={pending}
            >
              Reject
            </Button>
            {item.status !== "NEEDS_VERIFICATION" ? (
              <Button
                size="sm"
                variant="quiet"
                onClick={() => decide("NEEDS_VERIFICATION")}
                disabled={pending}
              >
                Reopen
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}
