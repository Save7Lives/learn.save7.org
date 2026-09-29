/**
 * Where large media files are served from.
 *
 * The course video is 35 MB, which exceeds Cloudflare's 25 MiB per-file asset
 * limit, so in production it is served from its own hostname rather than from
 * /public. Any host will do that gets three things right: content-type video/mp4,
 * HTTP range requests for seeking, and CDN caching.
 *
 * Currently a GitHub Pages site; R2 once Save7's payment details are on the
 * Cloudflare account. Note that raw.githubusercontent.com is NOT a valid host: it
 * serves mp4 as application/octet-stream with nosniff, which browsers refuse to
 * play in a <video>. See MEDIA-HOSTING.md.
 *
 * MEDIA_BASE_URL is read on the server and the absolute URL is passed to the
 * client, rather than exposing a NEXT_PUBLIC_ variable. Public env vars are
 * inlined at build time, which would bake the hostname into the bundle and mean
 * a rebuild to move the file — this way it is deploy-time configuration.
 *
 * Three states, not two:
 *
 *   1. base set                  → rewrite offloaded paths to the bucket
 *   2. base unset, off Workers   → same-origin; /public serves the file (local dev)
 *   3. base unset, on Workers    → the file is not deployed and cannot be served,
 *                                  so `mediaUrl()` returns null, and the caller
 *                                  shows a placeholder instead of a dead <video>.
 *
 * State 3 exists because no media host is configured yet. Leaving the path in place
 * would render a player that silently fails — worse than saying plainly that the
 * film is not hosted yet.
 */

/** Paths under these prefixes are relocated to MEDIA_BASE_URL when it is set. */
const OFFLOADED_PREFIXES = ["/media/"];

function isOffloaded(path: string): boolean {
  return OFFLOADED_PREFIXES.some((p) => path.startsWith(p));
}

/** The configured bucket hostname, or null if unset or still a placeholder. */
function mediaBase(): string | null {
  const raw = process.env.MEDIA_BASE_URL?.trim().replace(/\/$/, "");
  // wrangler.jsonc ships REPLACE_WITH_… placeholders; an unedited one is "unset",
  // not a hostname to build broken URLs from.
  if (!raw || raw.includes("REPLACE_WITH")) return null;
  return raw;
}

/**
 * Whether this is the Workers runtime.
 *
 * workerd sets this exact user agent. Used rather than a Cloudflare import so
 * this module stays dependency-free and safe to evaluate anywhere.
 */
function isWorkersRuntime(): boolean {
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}

/** Whether an offloaded file can actually be fetched in this environment. */
function offloadedFilesAreServed(): boolean {
  if (mediaBase()) return true;
  // On Workers /media/* is excluded from the deploy (see public/.assetsignore),
  // so with no bucket configured there is nowhere for it to come from.
  return !isWorkersRuntime();
}

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (!isOffloaded(path)) return path;

  const base = mediaBase();
  if (base) return `${base}${path}`;
  return offloadedFilesAreServed() ? path : null;
}
