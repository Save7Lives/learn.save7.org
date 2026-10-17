const CANONICAL_ORIGIN = "https://learn.save7.org";
const VERCEL_DEFAULT_DOMAIN = /^https?:\/\/[^/]*\.vercel\.app(\/|$)/i;

/**
 * The canonical public origin.
 *
 * SITE_URL is read before NEXT_PUBLIC_SITE_URL because Next inlines NEXT_PUBLIC_
 * variables into the bundle at build time, while SITE_URL is a plain server-side
 * variable read on each request. In production both are Vercel project environment
 * variables; changing the domain means editing them and redeploying.
 *
 * Certificate verification links are built from this, so a wrong value produces
 * certificates that point at a host which does not serve them. A *.vercel.app value
 * is the deployment placeholder, never the public origin, so it is ignored too.
 */
export function siteUrl(): string {
  const configured = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  const raw = configured?.trim().replace(/\/$/, "");
  // An unedited placeholder or a Vercel default domain is not the public origin.
  if (!raw || raw.includes("REPLACE_WITH") || VERCEL_DEFAULT_DOMAIN.test(raw)) {
    return CANONICAL_ORIGIN;
  }
  return raw;
}
