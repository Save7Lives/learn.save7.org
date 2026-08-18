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
 * Unset (local development) means same-origin, so /public keeps working.
 */

/** Paths under these prefixes are relocated to MEDIA_BASE_URL when it is set. */
const OFFLOADED_PREFIXES = ["/media/"];

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  const base = process.env.MEDIA_BASE_URL?.replace(/\/$/, "");
  if (!base) return path;
  if (!OFFLOADED_PREFIXES.some((p) => path.startsWith(p))) return path;

  return `${base}${path}`;
}

/**
 * Rewrite media paths inside a stored lesson payload.
 *
 * Payloads are opaque JSON authored in prisma/content, so this walks for the
 * known media keys rather than requiring every component to resolve its own URLs.
 */
export function resolvePayloadMedia(payloadJson: string | null): string | null {
  if (!payloadJson) return null;
  if (!process.env.MEDIA_BASE_URL) return payloadJson;

  const MEDIA_KEYS = new Set(["src", "captionsSrc", "poster", "filePath"]);

  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);
    if (!node || typeof node !== "object") return node;

    return Object.fromEntries(
      Object.entries(node as Record<string, unknown>).map(([key, value]) => [
        key,
        MEDIA_KEYS.has(key) && typeof value === "string" ? mediaUrl(value) : walk(value),
      ]),
    );
  };

  try {
    return JSON.stringify(walk(JSON.parse(payloadJson)));
  } catch {
    return payloadJson;
  }
}
