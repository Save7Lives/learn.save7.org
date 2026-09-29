"use client";

/**
 * PROTOTYPE, throwaway. Floating bar for flipping between ?variant= keys.
 *
 * Keeps every other search param (so ?at= survives a flip), wraps at both ends,
 * answers ← and → unless focus is in a field, and renders nothing in production.
 */
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function PrototypeSwitcher({
  variants,
  current,
}: {
  variants: Array<{ key: string; name: string }>;
  current: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const index = Math.max(
    0,
    variants.findIndex((v) => v.key === current),
  );

  function go(step: number) {
    const next = variants[(index + step + variants.length) % variants.length];
    // Read the live URL, not a hook: the runner writes ?at= with replaceState.
    const params = new URLSearchParams(window.location.search);
    params.set("variant", next.key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (process.env.NODE_ENV === "production") return null;

  const v = variants[index];
  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="flex items-center gap-1 rounded-pill bg-ink px-2 py-1.5 text-cream shadow-lg ring-2 ring-teal">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous variant"
          className="grid size-10 place-items-center rounded-pill hover:bg-white/10"
        >
          ←
        </button>
        <span className="min-w-48 px-2 text-center text-sm font-semibold">
          {v.key} ({v.name})
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next variant"
          className="grid size-10 place-items-center rounded-pill hover:bg-white/10"
        >
          →
        </button>
      </div>
    </div>
  );
}
