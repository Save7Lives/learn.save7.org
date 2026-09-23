# DNS for `learn.save7.org`

**The plan this file used to describe — Gilbert adds one CNAME at xneelo and the
course answers on it — does not work any more.** That was written for Cloudflare
**Pages**, which will serve a custom domain on a subdomain with the zone left at an
external provider. The course is a Cloudflare **Worker** again, and Workers
reinstates the requirement the Pages detour removed: the zone has to be on
Cloudflare.

This document is now the open question rather than the procedure, because the way
forward is a decision about the whole `save7.org` zone and that decision is not
this repository's to make.

**Nothing is blocked by it.** The Worker **is deployed** and serves the entire
course at `https://learn.save7.workers.dev`, sign-in included, and `SITE_URL`
already names that hostname so certificates carry a link that works. Moving to
`learn.save7.org` later is a `wrangler.jsonc` edit and a deploy, with no rebuild.

---

## What is true today

Checked on 22 September 2026 and re-checked on **23 September 2026** against the
authoritative nameservers and the live hostnames, not carried over from an earlier
draft. Two rows changed between those dates and are marked.

| | |
| --- | --- |
| `save7.org` nameservers | `ns1/ns2.host-h.net`, `ns1/ns2.dns-h.com` — **xneelo**, not Cloudflare |
| `learn.save7.org` | **Exists.** CNAME → `transplant-alchemy.pages.dev` |
| What it serves | `503` — the holding page in `maintenance/`, from the old Pages project |
| `learn.save7.workers.dev` | **`200`** — serving the real course (`x-opennext: 1`, `x-powered-by: Next.js`). **Changed 23 Sep**; it was `404 / error code 1042` on 22 Sep |
| The Worker `learn` | **Deployed** — `2026-09-23T09:18:20Z`, author `admin@save7.org`, version `111783bb` at 100%. **Changed 23 Sep**; it did not exist on 22 Sep |
| Cloudflare zones on `admin@save7.org` | **Zero.** `GET /client/v4/zones` returns `total_count: 0` |
| Cloudflare Pages projects on `admin@save7.org` | **Zero.** `wrangler pages project list` returns nothing |
| `save7.org` CAA records | **None** — no certificate authority restriction to unpick |

Two of those matter more than they look.

**`learn.save7.org` already being a CNAME is itself an obstacle.** Cloudflare is
explicit that you cannot create a Custom Domain
"on a hostname with an existing CNAME DNS record"
([Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)).
If the zone moves to Cloudflare and that record is imported along with everything
else, attaching the Worker to `learn.save7.org` will fail until the record is
deleted. Delete it as part of the move, not as a surprise afterwards.

**Save7's Cloudflare estate is split across at least two accounts, and the one we
deploy from is nearly empty.** `admin@save7.org` holds zero zones and zero Pages
projects — just the `learn` Worker — while `transplant-alchemy.pages.dev`,
`save7-os.pages.dev` and `save7-volunteers.pages.dev` all still answer. The likely
reading is that those live on the personal Cloudflare account that made the first
deploy. That is unconfirmed, and it is worth confirming: taking the holding page
down, or retiring that project, needs whichever account owns it.

This is not just bookkeeping. It changes the migration plan — see
"`os` and `volunteers` are on another Cloudflare account" below.

---

## Why a Worker needs the zone

Four checks against Cloudflare's documentation, all made on 22 September 2026.
Each one closes a route that would otherwise avoid moving the zone.

| Route | Requirement | Available here? |
| --- | --- | --- |
| **Workers Custom Domain** | An active Cloudflare zone, on a hostname with no existing CNAME, on a zone you own ([docs](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)) | Not while the zone is at xneelo |
| **Workers Route** | An active zone plus a proxied (orange-clouded) DNS record on Cloudflare ([docs](https://developers.cloudflare.com/workers/configuration/routing/routes/)) | Same |
| **Partial (CNAME) zone setup** — Cloudflare serves one hostname, xneelo keeps the zone | Business or Enterprise plan ([docs](https://developers.cloudflare.com/dns/zone-setups/partial-setup/)) | No — zero budget |
| **Subdomain setup / delegation** — delegate only `learn.save7.org` | Enterprise ([docs](https://developers.cloudflare.com/dns/zone-setups/subdomain-setup/)) | No |

Partial setup is the one that sounds like the answer and is not. It is exactly the
"keep the zone where it is, serve one hostname from Cloudflare" arrangement this
project wants, and it is gated behind a Business plan.

## What is left, and what each one costs

**This is an open decision.** It is recorded here as options rather than a
recommendation because the choice belongs to whoever owns `save7.org`. As of
23 September 2026 only two survive — move the zone, or stay where we are.

### 1. Move the `save7.org` nameservers to Cloudflare

Free, and the ordinary way to do this. The procedure is below and the captured
zone with it.

The cost is not money, it is blast radius. **Every record moves at once** — the MX
that carries Google Workspace mail, SPF, DMARC, the apex on Vercel,
`os.save7.org`, `volunteers.save7.org`, and the mail client hostnames. An import
that silently misses one record is how email breaks, and it breaks quietly:
nobody notices a message that was never delivered.

Gilbert edits records at xneelo by hand today. Moving the zone changes where he
does that for everything, not just for the course. **That makes this his decision
rather than ours**, and it should be taken as a zone migration in its own right,
not as a step in deploying a course.

Worth knowing before that conversation: `os.save7.org` and `volunteers.save7.org`
are already Cloudflare Pages projects reached by CNAME from xneelo. The estate is
part-way onto Cloudflare already — but those two work *because* Pages tolerates
external DNS, which is precisely what this course no longer does.

### 2. Cloudflare for SaaS on a different domain — **closed, 23 September 2026**

Custom hostnames are available on the **Free** plan — 100 included, then $0.10
each — and a Worker can be the origin
([plans](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/plans/)).
This was the route that does not touch `save7.org` at all.

It had one prerequisite, and **the prerequisite does not exist**: it needs some
other domain whose nameservers already point at Cloudflare, to act as the SaaS
zone. `admin@save7.org` holds **zero zones**, and no spare Cloudflare-nameservered
domain exists elsewhere either (confirmed 23 September 2026).

Acquiring a domain solely to issue `learn.save7.org`'s certificate through a zone
unrelated to `save7.org` costs real money and is worse than route 1 on every axis.
**This route is ruled out**, and the decision is therefore between route 1 and
staying on `workers.dev`.

### 3. Staying on `learn.save7.workers.dev`

This is what happens by default, and it is not a failure state. The course is
deployed and working there today. What it costs is
the address: a learner is asked to trust a health and legal course served from a
hostname that does not say Save7 on it, and a certificate verification link
printed on a real certificate carries that hostname for as long as it is issued
under it.

---

# The nameserver move

**This is the live procedure again**, not history. It was filed as reference while
the course was on Pages; the port back to Workers makes it the thing that has to
happen if route 1 is chosen.

The record capture below was taken from the authoritative nameservers
(`ns1.host-h.net`) on 19 August 2026 and re-verified on 22 September 2026. Every
line in the table was confirmed still live on that second date unless the notes
say otherwise.

## Add the zone as `save7.org`

In the Cloudflare dashboard, **Add a site** takes the zone — `save7.org`. Not
`learn@save7.org` (that is an email address) and not `learn.save7.org`: a
subdomain-only zone is **partial setup**, which needs a Business plan, or
**subdomain delegation**, which needs Enterprise. On the Free plan the unit is the
whole zone. The `learn` hostname is created afterwards, automatically, when the
Worker's custom domain is attached.

## Records that must exist in Cloudflare before the nameservers change

Cloudflare imports most of these automatically. **Check every line.** An import
that silently misses one record is how email breaks.

| Type  | Name             | Value                          | Proxy      |
| ----- | ---------------- | ------------------------------ | ---------- |
| A     | `save7.org` (@)  | `76.76.21.21` (Vercel)         | DNS only   |
| A     | `www`            | `76.76.21.21`                  | DNS only   |
| A     | `mail`           | `197.221.2.216` (xneelo)       | **DNS only** |
| CNAME | `staging`        | `cname.vercel-dns.com`         | DNS only   |
| CNAME | `ftp`            | `www.save7.org`                | DNS only   |
| CNAME | `smtp`           | `mail.save7.org`               | **DNS only** |
| CNAME | `imap`           | `mail.save7.org`               | **DNS only** |
| CNAME | `pop`            | `mail.save7.org`               | **DNS only** |
| CNAME | `os`             | `save7-os.pages.dev`           | **DNS only — see below** |
| CNAME | `volunteers`     | `save7-volunteers.pages.dev`   | **DNS only — see below** |
| CNAME | `learn`          | `transplant-alchemy.pages.dev` | **delete — see below** |
| MX    | `save7.org` (@)  | `SMTP.GOOGLE.COM` priority `1` | n/a        |
| TXT   | `save7.org` (@)  | `v=spf1 a mx include:spf.host-h.net include:_spf.google.com include:amazonses.com ~all` | n/a |
| TXT   | `save7.org` (@)  | `google-site-verification=ZSfcA5WdGbPCdqJSFyOQ4vDmQsOJlnpAZx5a0hgKH1Q` | n/a |
| TXT   | `save7.org` (@)  | `google-gws-recovery-domain-verification=53260319` | n/a |
| TXT   | `_dmarc`         | `v=DMARC1; p=none;`            | n/a        |

The last three CNAMEs were **not in the August capture** and were found by
re-sweeping the zone on 22 September 2026. Two of them serve live Save7 sites, so
a migration plan that does not mention them is a migration plan that can break
them.

### `learn` must be deleted, not imported

Cloudflare will import `learn` → `transplant-alchemy.pages.dev` along with the
rest, and that record is what blocks a Workers Custom Domain on the same hostname.
Sequence it deliberately:

1. Let the zone go active with the record imported, so nothing changes for anyone
   mid-move and the holding page keeps serving.
2. Confirm the Worker answers on `learn.save7.workers.dev`. **Already true** as of
   23 September 2026 — kept as a step because it is the thing that must hold before
   the next line is safe, not because it is outstanding work.
3. Then delete the `learn` CNAME and attach the custom domain.

Between 3's two halves the hostname resolves to nothing. Do it at a quiet hour,
not during a launch.

### `os` and `volunteers` are on another Cloudflare account

Both are Cloudflare Pages projects today, reached by external CNAME. They are
**not on `admin@save7.org`** — that account lists no Pages projects at all — so
they belong to a different Cloudflare account, presumably the same personal one
that holds `transplant-alchemy`.

That has a concrete consequence for this move: **import both records grey-cloud
(DNS only), and leave them that way.** They work today precisely *because* the
zone is external and nothing proxies them. Turning on the orange cloud would have
this zone proxying a hostname that another Cloudflare account is already proxying,
which is a well-known way to break a working Pages site — and two live Save7 sites
is the wrong place to find out exactly how. Cloudflare defaults new records to
proxied, so this is an active choice to make during the import, not something that
holds by itself.

Converting them properly — to Pages custom domains on an internal zone — is
possible later, but it needs the projects and the zone in the same account, so it
means either moving the projects or adding the zone to the other account.
**That is a change to two live sites and it is not part of this move.** Import the
records as they stand, grey-cloud, confirm both sites still load, and leave the
question for whoever owns them.

### Set mail records to "DNS only"

Cloudflare defaults new records to proxied (orange cloud). Proxying only works for
HTTP, so `mail`, `smtp`, `imap` and `pop` **must** be grey-cloud / DNS only, or mail
clients stop connecting. `ftp` likewise, and `os` and `volunteers` for the separate
reason given above.

The apex and `www` are listed as DNS only too. Proxying them may work, but it changes
how Vercel sees the traffic (TLS, redirects, caching). Keep the move boring: switch
DNS first, confirm nothing broke, then decide about proxying separately.

### Email is Google Workspace

Incoming mail routes to `SMTP.GOOGLE.COM`, so **the MX record and the SPF TXT record
matter more than anything else here**. `mail.save7.org` still points at xneelo
and is presumably used by mail clients or outgoing mail, so keep it.

No DKIM record was found at the common selectors (`google._domainkey`,
`selector1`, `selector2`, `default`, `k1`, `k2`, `mail`) — re-swept on
22 September 2026 with the same result. Either DKIM is not enabled in Google
Workspace, or it uses a selector these sweeps did not probe. **Worth confirming in
the Google Admin console before the switch**, because a missing DKIM record hurts
deliverability quietly rather than visibly, and a move is exactly when people
start blaming DNS for mail that was already unsigned.

### No CAA records

Re-checked on 22 September 2026: `save7.org` publishes none. Nothing will block
certificate issuance for a new hostname. A restrictive CAA record is a common
silent cause of a certificate stuck on "pending", so this is worth re-checking if
anyone adds one later.

## Then change the nameservers

Cloudflare will show two nameservers. Replace all four current ones at the registrar:

```
ns1.host-h.net    ns2.host-h.net    ns1.dns-h.com    ns2.dns-h.com
```

This is registrar access, not Cloudflare access. Propagation is usually minutes,
occasionally up to 48 hours. Cloudflare emails when the zone goes active.

## After the zone is active

Delete the imported `learn` CNAME first — see above — then attach the hostname to
the Worker. Either in the dashboard (Workers & Pages → `learn` → Settings →
Domains & Routes → Add custom domain → `learn.save7.org`), or by uncommenting the
`routes` block in `wrangler.jsonc` and deploying:

```jsonc
"routes": [{ "pattern": "learn.save7.org", "custom_domain": true }]
```

```bash
npm run deploy
```

**The second path is the reason being back on Workers is an improvement here.** A
Pages custom domain could only be attached by clicking in a dashboard. On Workers
the hostname is declarable in the committed config, so moving the course is a
reviewable pull request — which is also how someone can be given control of the
domain without being given a Cloudflare credential (DEPLOY.md, "Giving someone
else control").

## Verifying afterwards

```
dig +short NS save7.org          # should show two cloudflare.com nameservers
dig +short MX save7.org          # must still be SMTP.GOOGLE.COM
dig +short TXT save7.org         # SPF and both Google verification strings
dig +short save7.org             # main site still resolving
dig +short os.save7.org          # still save7-os.pages.dev
dig +short volunteers.save7.org  # still save7-volunteers.pages.dev
dig +short learn.save7.org       # resolves once the custom domain is attached
```

Send an email to an address on the domain and confirm it arrives. Do that on the day
of the switch, not a week later.

---

## After `learn.save7.org` reaches the Worker

Four things, all of which fail quietly if skipped.

- **`SITE_URL` and `NEXT_PUBLIC_SITE_URL`** in `wrangler.jsonc` →
  `https://learn.save7.org`, then `npm run deploy`. Certificate verification links
  are built from `SITE_URL`, which is read at runtime — so this is a deploy, not a
  rebuild. Do it **after** the domain resolves, never before: a dead link printed
  on a real certificate cannot be corrected without reissuing it.
- **Supabase → Authentication → URL Configuration** → add `https://learn.save7.org`
  to the redirect allow-list and set it as the Site URL. Leave
  `https://learn.save7.workers.dev` in place; certificates issued before the move
  point at it.
- **Google Cloud console → the volunteer portal's OAuth client → Authorised
  JavaScript origins** → add `https://learn.save7.org`, **appending**. That client
  is what `volunteers.save7.org` signs in with, and clearing an entry breaks the
  portal.
- **`register-learner`'s CORS allow-list** already names `learn.save7.org` in
  code, so nothing changes there for this hostname — **but the function still
  needs redeploying** for the Workers-era change it has not yet received: the
  preview pattern is now `^https://([a-z0-9]+-)?learn\.save7\.workers\.dev$`,
  because a Workers version preview hyphenates onto the same label where a Pages
  preview added a subdomain. See DEPLOY.md step 3.

The first three are the same three that were listed here when the plan was one
CNAME. They did not change with the platform; only the way the hostname arrives
did.
