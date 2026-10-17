/** The Learn site's own origin, used when nothing usable is configured. */
const CANONICAL_ORIGIN = "https://learn.save7.org";

/**
 * The canonical public origin.
 *
 * SITE_URL is read before NEXT_PUBLIC_SITE_URL because Next inlines NEXT_PUBLIC_
 * variables into the bundle at build time, while SITE_URL is a plain server-side
 * variable read on each request. In production both are Vercel project environment
 * variables; changing the domain means editing them and redeploying.
 *
 * Certificate verification links are built from this, so a wrong value produces
 * certificates that point at a host which does not serve them.
 */
export function siteUrl(): string {
  const configured = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  const raw = configured?.trim().replace(/\/$/, "");
  // An unedited placeholder is not an origin.
  if (!raw || raw.includes("REPLACE_WITH")) return CANONICAL_ORIGIN;
  // Vercel's default hostname is where the project was first deployed, not where
  // Save7 sends people. On the production deployment it is a leftover placeholder,
  // and a certificate that names it points its checker at the wrong host. Preview
  // deployments (VERCEL_ENV=preview) and local runs keep whatever they were given.
  if (
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL_ENV !== "preview" &&
    isVercelDefaultHost(raw)
  ) {
    return CANONICAL_ORIGIN;
  }
  return raw;
}

function isVercelDefaultHost(origin: string): boolean {
  try {
    return new URL(origin).hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}
