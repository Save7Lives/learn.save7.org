/**
 * Shown under the site header while a learner page renders.
 *
 * Every learner page is dynamic and waits on the database, so a header click needs
 * an answer at once. The header stays on screen; this fills the page area.
 * `role="status"` tells a screen reader the same.
 */
export function PageLoading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-8">
      <span className="sr-only">Loading</span>
      <div aria-hidden="true" className="h-8 w-56 animate-pulse rounded bg-line motion-reduce:animate-none" />
      <div aria-hidden="true" className="h-40 animate-pulse rounded-lg bg-line/60 motion-reduce:animate-none" />
      <div aria-hidden="true" className="h-64 animate-pulse rounded-lg bg-line/60 motion-reduce:animate-none" />
    </div>
  );
}
