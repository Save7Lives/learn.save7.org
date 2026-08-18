/**
 * The canonical public origin.
 *
 * SITE_URL is read before NEXT_PUBLIC_SITE_URL because Next inlines
 * NEXT_PUBLIC_ variables into the bundle at build time. On Cloudflare the build
 * and the deploy are separate steps — `wrangler.jsonc` vars are applied at deploy
 * — so a public variable would freeze whatever the build machine happened to
 * have. SITE_URL is a plain runtime variable, which makes changing the domain a
 * config change rather than a rebuild.
 *
 * Certificate verification links are built from this, so a wrong value produces
 * certificates that point at a host which does not serve them.
 */
export function siteUrl(): string {
  const configured = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  const raw = configured?.trim().replace(/\/$/, "");
  // An unedited wrangler.jsonc placeholder is not an origin.
  if (!raw || raw.includes("REPLACE_WITH")) return "https://save7.org";
  return raw;
}
