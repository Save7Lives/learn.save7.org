/**
 * Where large media files are served from.
 *
 * The course video is 35 MB, which exceeds Cloudflare's 25 MiB per-file limit for
 * Workers static assets, so in production it lives in an R2 bucket on its own
 * hostname instead of in /public. R2 serves it directly: correct range-request
 * handling for seeking, CDN caching, and no Worker CPU spent streaming bytes.
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
 *                                  so the path is removed and the payload marked
 *                                  pending, which makes the player fall back to
 *                                  its placeholder instead of a dead <video>.
 *
 * State 3 exists because Save7 has not enabled R2 yet. Leaving the path in place
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

/**
 * Rewrite media paths inside a stored lesson payload.
 *
 * Payloads are opaque JSON authored in prisma/content, so this walks for the
 * known media keys rather than requiring every component to resolve its own URLs.
 */
export function resolvePayloadMedia(payloadJson: string | null): string | null {
  if (!payloadJson) return null;

  const base = mediaBase();
  const served = offloadedFilesAreServed();
  // Nothing to do: local development, where /public serves the file as authored.
  if (!base && served) return payloadJson;

  const MEDIA_KEYS = new Set(["src", "captionsSrc", "poster", "filePath"]);
  let removedMedia = false;

  const resolve = (value: string): string | null => {
    if (!isOffloaded(value)) return value;
    if (base) return `${base}${value}`;
    removedMedia = true;
    return null;
  };

  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);
    if (!node || typeof node !== "object") return node;

    return Object.fromEntries(
      Object.entries(node as Record<string, unknown>).map(([key, value]) => [
        key,
        MEDIA_KEYS.has(key) && typeof value === "string" ? resolve(value) : walk(value),
      ]),
    );
  };

  try {
    const resolved = walk(JSON.parse(payloadJson));

    // Tell the component why its file is missing, so it can say so on screen.
    // `awaitingAsset` is the flag the players already key on; `mediaPending`
    // distinguishes "not hosted yet" from "Save7 has not supplied it".
    if (removedMedia && resolved && typeof resolved === "object" && !Array.isArray(resolved)) {
      return JSON.stringify({ ...resolved, awaitingAsset: true, mediaPending: true });
    }
    return JSON.stringify(resolved);
  } catch {
    return payloadJson;
  }
}
