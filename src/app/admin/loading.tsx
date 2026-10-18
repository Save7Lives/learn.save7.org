/**
 * Shown inside the admin shell while a tab's page renders.
 *
 * Every admin page is dynamic and reads whole tables, so a tab click waits on the
 * database. The layout (header and tabs) stays on screen; this fills the page area
 * so the click answers at once. `role="status"` tells a screen reader the same.
 */
export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">Loading</span>
      <div
        aria-hidden="true"
        className="h-8 w-56 animate-pulse rounded bg-line motion-reduce:animate-none"
      />
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-white motion-reduce:animate-none"
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="h-64 animate-pulse rounded-lg bg-white motion-reduce:animate-none"
      />
    </div>
  );
}
