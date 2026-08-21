# DNS for `learn.save7.org`

**The nameserver move described below is not needed, and should not be done to get
the course online.** That plan was written when the course was a Cloudflare
**Worker**: a Worker can only answer on a hostname whose zone is in the Cloudflare
account, so the whole zone had to move.

The course is now on Cloudflare **Pages**, which supports a custom domain on a
subdomain with **external DNS**. Per Cloudflare's documentation, a subdomain needs
one CNAME at the existing provider and nothing else:

> add a CNAME record for your desired subdomain … This record should point to your
> custom Pages subdomain, for example, `<YOUR_SITE>.pages.dev`

## What to actually do

DNS for `save7.org` is at **xneelo** (`ns1/ns2.host-h.net`, `ns1/ns2.dns-h.com` —
earlier drafts of this file called that Host Africa, which was wrong).

**Order matters.** Cloudflare's docs: "Manually adding a custom CNAME record
pointing to your Cloudflare Pages site — without first associating the domain (or
subdomains) in the Cloudflare Pages dashboard — will result in your domain failing
to resolve."

1. **Cloudflare first.** Workers & Pages → `transplant-alchemy` → Custom domains →
   Set up a custom domain → `learn.save7.org`. It will detect that the zone is
   elsewhere and show what to create. If it asks for a TXT record for certificate
   validation, that goes at xneelo too.
2. **Then xneelo.** konsoleH → DNS zone for `save7.org` → Add DNS record:

   | Field | Value |
   | --- | --- |
   | Type | CNAME |
   | Host | `learn` (xneelo appends `.save7.org`) |
   | Points to | `transplant-alchemy.pages.dev` |
   | TTL | 300 while testing, then the default |

   **No A record.** Pages needs the CNAME so it can change its own IPs without
   breaking the site.
3. Wait for validation and the certificate — usually minutes.
   `dig +short learn.save7.org` is the quickest way to watch it.

**Nothing else moves.** MX, SPF, DMARC, the Google Workspace verification records,
`mail`/`smtp`/`imap`/`pop`, and the apex on Vercel all stay exactly where they are.
That removes the entire risk this document was written to manage: an import that
silently misses one record is how email breaks.

Checked on 21 August 2026 before the change: `learn.save7.org` did not exist, so
there was nothing to overwrite, and `save7.org` carries **no CAA records** — so no
certificate authority restriction can block issuance. A restrictive CAA record is a
common silent cause of a certificate stuck on "pending".

## After it resolves

Three things, all of which fail quietly if skipped:

- `SITE_URL` and `NEXT_PUBLIC_SITE_URL` in `wrangler.jsonc` → `https://learn.save7.org`,
  then redeploy. Certificate verification links are built from it.
- Supabase → Authentication → URL Configuration → add `https://learn.save7.org/**`
  to the redirect allow-list and set it as the Site URL.
- Google Cloud console → the volunteer portal's OAuth client → Authorised JavaScript
  origins → add `https://learn.save7.org`, **appending**: that client is what
  `volunteers.save7.org` signs in with.

`register-learner`'s CORS allow-list already names `learn.save7.org`, verified
against the live endpoint, so there is nothing to redeploy there.

---

# The nameserver move — kept for reference only

**You do not need this for `learn.save7.org`.** It is still the correct procedure if
Save7 ever wants the **apex** `save7.org` on Cloudflare, which does require a
nameserver change, and the captured zone below is worth keeping regardless: it is
what the records were before anybody touched them.

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
| A     | `mail`           | `197.221.2.216` (xneelo)  | **DNS only** |
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
matter more than anything else here**. `mail.save7.org` still points at xneelo
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
