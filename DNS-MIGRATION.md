# DNS for `learn.save7.org`

**`learn.save7.org` reaches the course on Vercel through two edits at xneelo, made
on 7 October 2026: one CNAME changed and one verification TXT record added. The
`save7.org` zone itself did not move. It is still at xneelo.**

This file now does two jobs.

1. It is the DNS record of how `learn.save7.org` reaches the app, and how to undo
   that.
2. It is the **only complete capture of the whole `save7.org` zone**, kept so the
   zone can be rebuilt if it is ever lost. xneelo refuses zone transfers, so there
   is no export to fall back on. If you are here to recover records, go straight to
   "The zone, record by record".

It replaces an earlier plan, to move the whole zone to Cloudflare so a Workers
custom domain could attach, which was abandoned. The reasons are kept briefly under
"Why not Cloudflare" so nobody re-proposes it without reading them.

**Still to do:** the post-launch configuration (`SITE_URL` and the Supabase redirect
URL) is not done yet; Gilbert reported the Google OAuth origin as done. See "After `learn.save7.org` reaches the
app". Nothing in DNS is blocked on it.

---

## What changed on 7 October 2026

Two records, both edited by hand at xneelo. Gilbert Liebenberg owns DNS and
infrastructure and makes the edits himself.

| Record | Before | After |
| --- | --- | --- |
| CNAME `learn` | `transplant-alchemy.pages.dev` — the old holding page, which answered `503` | `f5d209c593f287f5.vercel-dns-017.com.` |
| TXT `_vercel` | did not exist | `vc-domain-verify=learn.save7.org,98022079fd5a62255618` |

The CNAME points `learn.save7.org` at the Vercel project `learn-save7-org` (team
"Save7", Hobby plan; default address `https://learn-save7-org.vercel.app`).
`learn.save7.org` has served the course since 7 October 2026, with a certificate
that Vercel issues and renews (Let's Encrypt).

**Why the TXT record exists.** The main site's Vercel team, a different Vercel
account, already holds `save7.org`, so the TXT record is what proves ownership of
`learn.save7.org` to Vercel. Vercel says it may be removed after verification. It is
in the table below because it is in the zone, and no decision to remove it has been
recorded.

**Every other record was left alone.** That includes the apex A record (the main
site, also on Vercel), the Google Workspace MX, SPF, DMARC, the Resend records, the
`os` and `volunteers` CNAMEs, and `staging`.

### How to undo it

Put the `learn` CNAME back to `transplant-alchemy.pages.dev` at xneelo. The TTL is
60 seconds, so the change shows quickly. Two cautions:

- That is a DNS rollback, not a take-down. It sends `learn.save7.org` back to the
  old holding page address, which last answered `503` when it was checked on
  22 September 2026. Its source (the `maintenance/` directory) has been deleted
  from the repository, and nobody has re-checked whether that Pages project still
  answers.
- **No maintenance or take-down procedure exists on Vercel yet.** That is an open
  item. If a bad deploy is the problem, no DNS change is needed: Vercel's Instant
  Rollback makes the previous production deployment available at the custom domain
  immediately.

---

## The zone today

| | |
| --- | --- |
| `save7.org` nameservers | `ns1.host-h.net`, `ns2.host-h.net`, `ns1.dns-h.com`, `ns2.dns-h.com` — **xneelo**, unchanged |
| Registrar | Tucows, through xneelo |
| Who edits records | Gilbert Liebenberg, by hand at xneelo |
| `learn.save7.org` | CNAME → `f5d209c593f287f5.vercel-dns-017.com.` (TTL 60 seconds), serving the course on Vercel |
| Certificate for `learn.save7.org` | Let's Encrypt, issued and renewed by Vercel |
| `save7.org` CAA records | **None**, as of 22 September 2026 |

---

## How the zone was captured

xneelo refuses zone transfers, so there is no way to download the zone as a file.
The table below was built by querying the authoritative nameserver
(`ns1.host-h.net`) directly and sweeping the names likely to exist. It was first
captured on **19 August 2026** and re-verified on **22 September 2026**, when every
line was confirmed still live unless the notes say otherwise. The only change since
is the two edits of 7 October 2026 above.

That method has a limit worth knowing: **a record at a name nobody probed will not be
in the table**. The capture has grown twice since the first pass. `os`, `volunteers` and
`learn` were not in the August capture and were found when the zone was re-swept on
22 September 2026, and the two Resend records (`send` and `resend._domainkey`) were
found on 30 September 2026 and were in neither earlier capture. Treat the table as
the best capture there is, not as proof of completeness.

## The zone, record by record

All names are relative to `save7.org`. **If this zone is ever rebuilt anywhere else,
check every line.** An import that silently misses one record is how email breaks,
and it breaks quietly: nobody notices a message that was never delivered.

| Type | Name | Value | Note |
| --- | --- | --- | --- |
| A | `save7.org` (@) | `76.76.21.21` (Vercel) |  |
| A | `www` | `76.76.21.21` |  |
| A | `mail` | `197.221.2.216` (xneelo) |  |
| CNAME | `staging` | `cname.vercel-dns.com` |  |
| CNAME | `ftp` | `www.save7.org` |  |
| CNAME | `smtp` | `mail.save7.org` |  |
| CNAME | `imap` | `mail.save7.org` |  |
| CNAME | `pop` | `mail.save7.org` |  |
| CNAME | `os` | `save7-os.pages.dev` | Found 22 September 2026. |
| CNAME | `volunteers` | `save7-volunteers.pages.dev` | Found 22 September 2026. |
| CNAME | `learn` | `f5d209c593f287f5.vercel-dns-017.com.` | **Changed 7 October 2026.** Was `transplant-alchemy.pages.dev`. Found 22 September 2026. |
| MX | `save7.org` (@) | `SMTP.GOOGLE.COM` priority `1` |  |
| TXT | `save7.org` (@) | `v=spf1 a mx include:spf.host-h.net include:_spf.google.com include:amazonses.com ~all` |  |
| TXT | `save7.org` (@) | `google-site-verification=ZSfcA5WdGbPCdqJSFyOQ4vDmQsOJlnpAZx5a0hgKH1Q` |  |
| TXT | `save7.org` (@) | `google-gws-recovery-domain-verification=53260319` |  |
| TXT | `_dmarc` | `v=DMARC1; p=none;` |  |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` priority `10` | Found 30 September 2026. Resend. |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDgz3HEN338LEViNsI3SrIYEmEAAOufo7AdnCTmHvApgQ4rxhgIOEzVBnQTLNzr0aw0Loh6ZUfyCOK1JJKwogncPS2ifr9rPkUfVxG643sy+t1qE/8OWXAsEeFqqFDPcYqbeYBnp334Rw1jbg2Biin1J/2BHDFBLsN0WNzKGYvakwIDAQAB` | Found 30 September 2026. Resend. |
| TXT | `_vercel` | `vc-domain-verify=learn.save7.org,98022079fd5a62255618` | **Added 7 October 2026.** Vercel domain verification. |

The apex and `www` A records point at the main site on Vercel, and `staging` is a
CNAME to Vercel as well. `mail` points at xneelo; `smtp`, `imap` and `pop` are CNAMEs
to `mail.save7.org`, and `ftp` is a CNAME to `www.save7.org`.

### Email is Google Workspace

Incoming mail routes to `SMTP.GOOGLE.COM`, so **the MX record and the SPF TXT record
matter more than anything else in the zone**. `mail.save7.org` still points at xneelo
and is presumably used by mail clients or outgoing mail, so keep it.

**DKIM for Google Workspace is unconfirmed.** Gilbert says DKIM is switched on in the
Google Admin console, but no `google._domainkey` record exists on the authoritative
nameservers or on a public resolver, and the only DKIM record found is Resend's. No
DKIM record was found at the common selectors (`google._domainkey`, `selector1`,
`selector2`, `default`, `k1`, `k2`, `mail`), re-swept on 22 September 2026 with the
same result. Either he was looking at a custom selector prefix or he meant the
Resend one. **Still open, and no longer a blocker.** Ask him for the selector shown
under Google Admin, Apps, Google Workspace, Gmail, Authenticate email, and add that
record to the table. A missing DKIM record hurts deliverability quietly rather than
visibly, so it is worth closing.

### Resend

The `send` MX and `resend._domainkey` TXT records are the sending records for Resend,
which sends through Amazon SES, and they are why the apex SPF carries
`include:amazonses.com`. Lose them and mail sent through Resend starts failing DKIM
quietly.

### `os` and `volunteers`

Both are other Save7 sites on `pages.dev` addresses, reached by external CNAME from
xneelo. They are Cloudflare Pages projects on another Cloudflare account, not on
`admin@save7.org`, which lists no Pages projects (checked 22 and 23 September 2026).
Which account owns them has not been confirmed. Nothing about them changed on
7 October 2026, and anything that touches them should be agreed with whoever owns
them first.

### No CAA records

Re-checked on 22 September 2026: `save7.org` publishes none, so nothing restricts
which certificate authority may issue for a hostname. Vercel's certificate for
`learn.save7.org` is issued by Let's Encrypt. If anyone adds a CAA record later, it
has to permit that, and a restrictive CAA record is a common silent cause of a
certificate that will not issue or renew. Re-check this if one is ever added.

---

## Verifying

Add `@ns1.host-h.net` to any of these to ask xneelo directly and skip resolver caches.

```
dig +short NS save7.org                  # still the four xneelo nameservers
dig +short CNAME learn.save7.org         # f5d209c593f287f5.vercel-dns-017.com.
dig +short TXT _vercel.save7.org         # "vc-domain-verify=learn.save7.org,98022079fd5a62255618"
curl -sI https://learn.save7.org         # a response from the course, not the old 503 holding page
```

The mail records and the other sites must be untouched:

```
dig +short MX save7.org                  # priority 1, SMTP.GOOGLE.COM
dig +short TXT save7.org                 # SPF and both Google strings
dig +short TXT _dmarc.save7.org          # v=DMARC1; p=none;
dig +short MX send.save7.org             # priority 10, feedback-smtp.us-east-1.amazonses.com
dig +short TXT resend._domainkey.save7.org   # the Resend DKIM key
dig +short save7.org                     # 76.76.21.21, main site still resolving
dig +short CNAME os.save7.org            # still save7-os.pages.dev
dig +short CNAME volunteers.save7.org    # still save7-volunteers.pages.dev
dig +short CNAME staging.save7.org       # still cname.vercel-dns.com
```

Send an email to an address on the domain and confirm it arrives. **Whether anyone
did that after the 7 October edit is not recorded here**, and the edit did not touch
mail records, but do it after any future edit to this zone, on the day, not a week
later.

---

## After `learn.save7.org` reaches the app

Four things, all of which fail quietly if skipped. **Status on 7 October 2026:
`SITE_URL` and the Supabase redirect URL are not done; the Google origin is reported
done (unverified); `register-learner` needs nothing.**

- **`SITE_URL` and `NEXT_PUBLIC_SITE_URL`** → `https://learn.save7.org`, in the Vercel
  project under Settings → Environment Variables (set for Production and Preview),
  **then redeploy**. A changed environment variable takes effect only after a redeploy
  (Deployments → the deployment's menu → Redeploy). Certificate verification links
  are built from `SITE_URL`, and both variables are currently a placeholder,
  `https://learn-save7-org.vercel.app`, so a certificate issued now would carry that
  address. Fix this before real certificates are issued: a link printed on a real
  certificate cannot be corrected without reissuing it. **To do.**
- **Supabase → Authentication → URL Configuration → Redirect URLs** → add
  `https://learn.save7.org/**`. **Leave the Site URL alone.** The Supabase project is
  shared with `os` and `volunteers`, and whether changing the Site URL is safe for
  them is unverified. Leave existing entries in place. **To do.**
- **Google Cloud console → the volunteer portal's OAuth client → Authorised
  JavaScript origins** → append `https://learn.save7.org`. **Append only.** That
  client is what `volunteers.save7.org` signs in with, and clearing an entry breaks
  the portal. Gilbert reported this origin already set up for `learn.save7.org` on
  30 September 2026. That cannot be checked from outside Google, so a sign-in test is
  the check.
- **`register-learner`'s CORS allow-list** already names `learn.save7.org` in code, so
  nothing is needed for this hostname. Redeploying the function only matters for
  preview URLs. **Nothing required for the live hostname.**

---

## Left over from the abandoned plan

Still sitting in the Cloudflare account `admin@save7.org`, unused, to be deleted once
Vercel is proven:

- **The `save7.org` zone**, added as **pending**. Nothing was ever switched: the
  nameservers at the registrar were never changed, so it does nothing.
- **The Worker `learn`**, which still answers at `https://learn.save7.workers.dev`.
  Before deleting it: `SITE_URL` used to name that hostname, so any certificate
  issued while that was true carries a verification link pointing at it. Whether any
  such certificate exists has not been checked.

The old holding-page project `transplant-alchemy.pages.dev` is a separate matter: it
was not on `admin@save7.org` when checked in September 2026, and which account owns
it was never confirmed.

---

## Why not Cloudflare

Until 7 October 2026 the plan was to move the whole `save7.org` zone to Cloudflare so
a Workers custom domain could attach. A Workers custom domain needs an active
Cloudflare zone and a hostname with no existing CNAME
([docs](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)).
Every route that would leave the zone at xneelo turned out to be closed. Partial
(CNAME) setup needs a Business or Enterprise plan
([docs](https://developers.cloudflare.com/dns/zone-setups/partial-setup/)),
delegating only `learn.save7.org` is Enterprise-only
([docs](https://developers.cloudflare.com/dns/zone-setups/subdomain-setup/)), and
Cloudflare for SaaS needed a spare domain already on Cloudflare nameservers, which
Save7 did not have (Cloudflare's documentation checked 22 September 2026; no spare
domain existed on 23 September 2026). The map's budget is zero.

Gilbert asked why the whole zone had to move for one subdomain, and Vercel was chosen
instead. Going back to Cloudflare Pages, which does tolerate an external zone, was
rejected as well: its Next.js adapter, `@cloudflare/next-on-pages`, is archived and
capped Next at 15.5.2, which carries GHSA-2xp9-vwfh-vxw4 (CVSS 9.5, an AVIF
image-optimization remote code execution). That advisory is fixed in Next 15.5.24 and
16.3.3, so the course must never go below Next 16.3.3.

Map tickets #51 (route A) and #64 (the nameserver move) are superseded by this
change.
