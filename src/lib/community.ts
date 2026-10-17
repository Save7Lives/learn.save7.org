/**
 * The Save7 WhatsApp community invite link (T94).
 *
 * One config value, `WHATSAPP_COMMUNITY_URL`, read on each request (the landing page
 * is rendered per request) so changing it is an environment edit in the Vercel
 * project, not a code change. The link is public once published: anyone who finds
 * it can join. If it is ever abused, reset the invite in WhatsApp and change this
 * one value.
 *
 * Unset, malformed or not an https URL means no link: the landing page then shows
 * no community card at all, rather than a dead button.
 */
export function whatsappCommunityUrl(): string | null {
  const raw = process.env.WHATSAPP_COMMUNITY_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
