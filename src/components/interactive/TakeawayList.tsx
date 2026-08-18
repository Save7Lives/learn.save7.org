import { PendingReview } from "@/components/ui/primitives";
import type { TakeawayListPayload } from "@/lib/lesson-payloads";

/**
 * Key takeaways.
 *
 * A server component — there is nothing to interact with, so there is no reason to
 * ship JavaScript for it.
 */
export function TakeawayList({ payload }: { payload: TakeawayListPayload }) {
  return (
    <ul className="space-y-3">
      {payload.takeaways.map((takeaway, i) => (
        <li
          key={takeaway.id}
          className="flex gap-4 rounded-card border border-sand-200 bg-white p-4"
        >
          <span
            aria-hidden="true"
            className="font-display text-2xl leading-none text-pink-300"
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <p className="font-medium text-ink">{takeaway.text}</p>
            {takeaway.detail ? (
              <p className="mt-1 text-sm text-sand-600">{takeaway.detail}</p>
            ) : null}
            {takeaway.pendingReview ? (
              <p className="mt-2">
                <PendingReview />
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
