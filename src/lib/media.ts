/**
 * Where large media files are served from.
 *
 * The course video is 35 MB. It ships with the app in /public, which Vercel serves
 * same-origin with the right content type and range requests, so it plays with
 * nothing configured. The map settled Supabase Storage (public bucket `learn-media`)
 * as its permanent home: once the file is uploaded (scripts/upload-media.mjs) and
 * MEDIA_BASE_URL is set, paths under /media/ are rewritten to that host.
 *
 * Any host will do that gets three things right: content-type video/mp4, HTTP range
 * requests for seeking, and CDN caching. Note that raw.githubusercontent.com is NOT a
 * valid host: it serves mp4 as application/octet-stream with nosniff, which browsers
 * refuse to play in a <video>. See MEDIA-HOSTING.md.
 *
 * MEDIA_BASE_URL is read on the server and the absolute URL is passed to the client,
 * rather than exposing a NEXT_PUBLIC_ variable. Public env vars are inlined at build
 * time, which would bake the hostname into the bundle.
 *
 * Two states: base set, so offloaded paths are rewritten to the bucket; base unset,
 * so the path is returned unchanged and /public serves the file.
 */

/** Paths under these prefixes are relocated to MEDIA_BASE_URL when it is set. */
const OFFLOADED_PREFIXES = ["/media/"];

function isOffloaded(path: string): boolean {
  return OFFLOADED_PREFIXES.some((p) => path.startsWith(p));
}

/** The configured bucket hostname, or null if unset or still a placeholder. */
function mediaBase(): string | null {
  const raw = process.env.MEDIA_BASE_URL?.trim().replace(/\/$/, "");
  // An unedited REPLACE_WITH_… placeholder is "unset", not a hostname to build
  // broken URLs from.
  if (!raw || raw.includes("REPLACE_WITH")) return null;
  return raw;
}

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (!isOffloaded(path)) return path;

  const base = mediaBase();
  if (base) return `${base}${path}`;
  return path;
}
