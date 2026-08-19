# Moving save7.org DNS to Cloudflare

Needed so that `learn.save7.org` can be attached to the Worker. A Cloudflare Worker
can only answer on a hostname whose zone is in the Cloudflare account, and a CNAME
from another DNS host does not work — Cloudflare rejects a Host header for a zone it
does not have.

**Moving DNS is not moving hosting.** The main site stays on Vercel and email stays
on Google Workspace. Only the place the records are served from changes.

Captured from the authoritative nameservers (`ns1.host-h.net`) on 19 August 2026.

## Add the zone as `save7.org`

In the Cloudflare dashboard, **Add a site** takes the zone — `save7.org`. Not
`learn@save7.org` (that is an email address) and not `learn.save7.org`
(subdomain-only zones need a Business plan). The `learn` subdomain is created
afterwards, automatically, when the Worker's custom domain is attached.

## Records that must exist in Cloudflare before the nameservers change

Cloudflare imports most of these automatically. Check every line — an import that
silently misses one record is how email breaks.

| Type  | Name             | Value                          | Proxy      |
| ----- | ---------------- | ------------------------------ | ---------- |
| A     | `save7.org` (@)  | `76.76.21.21` (Vercel)         | DNS only   |
| A     | `www`            | `76.76.21.21`                  | DNS only   |
| A     | `mail`           | `197.221.2.216` (Host Africa)  | **DNS only** |
| CNAME | `staging`        | `cname.vercel-dns.com`         | DNS only   |
| CNAME | `ftp`            | `www.save7.org`                | DNS only   |
| CNAME | `smtp`           | `mail.save7.org`               | **DNS only** |
| CNAME | `imap`           | `mail.save7.org`               | **DNS only** |
| CNAME | `pop`            | `mail.save7.org`               | **DNS only** |
| MX    | `save7.org` (@)  | `SMTP.GOOGLE.COM` priority `1` | n/a        |
| TXT   | `save7.org` (@)  | `v=spf1 a mx include:spf.host-h.net include:_spf.google.com include:amazonses.com ~all` | n/a |
| TXT   | `save7.org` (@)  | `google-site-verification=ZSfcA5WdGbPCdqJSFyOQ4vDmQsOJlnpAZx5a0hgKH1Q` | n/a |
| TXT   | `save7.org` (@)  | `google-gws-recovery-domain-verification=53260319` | n/a |
| TXT   | `_dmarc`         | `v=DMARC1; p=none;`            | n/a        |

### Set mail records to "DNS only"

Cloudflare defaults new records to proxied (orange cloud). Proxying only works for
HTTP, so `mail`, `smtp`, `imap` and `pop` **must** be grey-cloud / DNS only, or mail
clients stop connecting. `ftp` likewise.

The apex and `www` are listed as DNS only too. Proxying them may work, but it changes
how Vercel sees the traffic (TLS, redirects, caching). Keep the move boring: switch
DNS first, confirm nothing broke, then decide about proxying separately.

### Email is Google Workspace

Incoming mail routes to `SMTP.GOOGLE.COM`, so **the MX record and the SPF TXT record
matter more than anything else here**. `mail.save7.org` still points at Host Africa
and is presumably used by mail clients or outgoing mail, so keep it.

No DKIM record was found at the common selectors (`google._domainkey`,
`selector1`, `default`, `k1`). Either DKIM is not enabled in Google Workspace, or it
uses a selector this sweep did not probe — worth confirming in the Google Admin
console before the switch, because a missing DKIM record hurts deliverability
quietly rather than visibly.

## Then change the nameservers

Cloudflare will show two nameservers. Replace all four current ones at the registrar:

```
ns1.host-h.net    ns2.host-h.net    ns1.dns-h.com    ns2.dns-h.com
```

This is registrar access, not Cloudflare access. Propagation is usually minutes,
occasionally up to 48 hours. Cloudflare emails when the zone goes active.

## After the zone is active

Attach the hostname to the Worker. Either in the dashboard (Workers & Pages →
`transplant-alchemy` → Settings → Domains & Routes → Add custom domain →
`learn.save7.org`), or by uncommenting the `routes` block in `wrangler.jsonc` and
deploying — that path makes the change a reviewable commit rather than a click.

Then `SITE_URL` and `NEXT_PUBLIC_SITE_URL` in `wrangler.jsonc` move to
`https://learn.save7.org` and the Worker is redeployed, so certificate verification
links print the new address. See DEPLOY.md step 7.

## Verifying afterwards

```
dig +short NS save7.org          # should show two cloudflare.com nameservers
dig +short MX save7.org          # must still be SMTP.GOOGLE.COM
dig +short save7.org             # main site still resolving
dig +short learn.save7.org       # resolves once the custom domain is attached
```

Send an email to an address on the domain and confirm it arrives. Do that on the day
of the switch, not a week later.
