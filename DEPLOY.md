# Deploying Transplant Alchemy 101 to Cloudflare

Everything is ready to deploy. What remains needs **your Cloudflare account**, so
those steps are commands for you to run — I cannot authenticate as Save7, and I
should not: publishing the course is your decision, not mine.

Read [Before you launch](#before-you-launch) first. There are 13 items flagged as
launch-blocking in the content-review register.

---

## Live now

The Worker is deployed and serving:

**https://transplant-alchemy.zubayyrparak.workers.dev**

| | Status |
|---|---|
| Deployed to Cloudflare Workers | Live, version `b1dc564a` |
| D1 database | `906e5372-8b73-4073-8e78-c701ac64c07d` — schema applied, 683 content rows loaded |
| `AUTH_SECRET` | Set as a Worker secret |
| Registration on production | Tested end to end, then the test account was deleted |
| Learners in production | 0 — metrics start clean, and there is no default admin |
| Site URL | `https://transplant-alchemy.zubayyrparak.workers.dev` — the URL that actually resolves. Certificates verified on production. |
| **Video** | **Not hosted. R2 is deferred until Save7's own bank details are used. See step 5.** |
| Custom domain | Not attached. `learn.save7.org` needs a DNS move first — see step 9. The site runs fine without it. |

---

## What was verified before deploying

| | Status |
|---|---|
| Runs on Cloudflare Workers | Verified locally on `workerd` — the real runtime, not an emulator |
| Database on Cloudflare D1 | Verified: full journey read and written to D1 |
| Registration, login, sessions | Verified on Workers (bcrypt included) |
| Baseline → modules → assessment → impact → certificate | Walked end to end on Workers |
| Assessment integrity | Answer key never sent to the browser; baseline not retakeable; only attempt 1 counts |
| Admin access control | Learners get 404; a validly-signed token claiming `role: ADMIN` is rejected |
| 35 MB video | Excluded from the Worker bundle, served from R2 instead |

Not yet done, because it needs your account: creating the D1 database, creating the
R2 bucket, setting secrets, and the deploy itself.

---

## Deploying from GitHub (recommended)

Cloudflare Workers Builds watches a GitHub repository and redeploys on every push.
That is better than deploying from a laptop: the deploy is reproducible, there is a
record of what shipped, and it does not depend on one person's machine.

The code is already committed on the `main` branch. What is left needs your GitHub
and Cloudflare accounts.

### Make the repository private

**Recommended: private.** Two reasons, both concrete:

1. `public/resources/` holds ten third-party academic PDFs — ISHLT consensus
   documents, SAMJ papers, the SATCS reference file. Save7 was given them for the
   course; a public repository republishes them, which is a different thing from
   citing them.
2. Module 9's legal content and Module 10's clinical criteria have not been
   reviewed yet. A public repository is a public claim.

Nothing about the build requires a public repository, so private costs you nothing.

### Push it

The `gh` CLI is not installed on this machine, so create the repository through
github.com — **New repository**, name it `transplant-alchemy`, set it **Private**,
and do **not** add a README, licence or `.gitignore` (the repo already has them).

Then:

```bash
git remote add origin https://github.com/<your-org>/transplant-alchemy.git
```

```bash
git push -u origin main
```

GitHub will ask for a username and password; the "password" is a **personal access
token**, not your account password (github.com → Settings → Developer settings →
Personal access tokens → Fine-grained tokens, with Contents: read and write). macOS
will store it in your keychain, so this is once-only.

### Connect Cloudflare to the repository

Cloudflare dashboard → **Workers & Pages** → **Create** → **Workers** → **Import a
repository**. Authorise GitHub, pick `transplant-alchemy`, then set:

| Setting | Value |
|---|---|
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx wrangler deploy` |
| Branch | `main` |

Leave the build output directory empty — `wrangler.jsonc` already points at
`.open-next/worker.js`.

**Finish steps 2 to 7 below before the first build**, or the deploy will fail on the
placeholder database id. Cloudflare reads `wrangler.jsonc` from the repository, so
the D1 id and the URLs must be committed:

```bash
git commit -am "Point wrangler at the real D1 database and domain"
```

```bash
git push
```

`AUTH_SECRET` is the exception — it is a Worker secret, set once with
`wrangler secret put` (step 6), and it is never committed.

### After that

Every push to `main` builds and deploys. Content changes become: edit
`prisma/content/`, check locally, push, then apply with the reseed endpoint (see
[Updating content](#updating-content-after-launch)).

> **If the build fails on `better-sqlite3`:** that package is only used for local
> development, but `npm ci` still installs it, and it compiles from source if no
> prebuilt binary matches Cloudflare's build image. It is not needed to build the
> Worker, so the fix is to skip it — set the build command to
> `npm ci --omit=optional && npx opennextjs-cloudflare build`, or move
> `better-sqlite3` into `devDependencies` and use `npm ci --omit=dev` for the
> install. Nothing in the deployed Worker touches it: on Workers the D1 binding is
> always present, so that code path is unreachable.

---

## One-time setup

Do these regardless of whether you deploy from GitHub or from your laptop.

### 1. Sign in

```bash
npx wrangler login
```

### 2. Create the database

```bash
npx wrangler d1 create transplant-alchemy
```

Copy the `database_id` it prints into `wrangler.jsonc`, replacing
`REPLACE_WITH_D1_DATABASE_ID`.

### 3. Create the schema

```bash
npx wrangler d1 migrations apply transplant-alchemy --remote
```

### 4. Load the course content

```bash
npx wrangler d1 execute transplant-alchemy --remote --file=prisma/d1-bootstrap/0001_content.sql
```

683 rows: the course, 3 levels, 13 modules, 97 lessons, 23 resources, 91 questions,
352 answer choices, and the 103-item content-review register.

This file is **bootstrap only** — it clears the content tables first, and clearing
questions cascades to learner answers. After launch, content updates go through
[Updating content](#updating-content-after-launch) instead. Regenerate it with
`npm run db:export` if you change the content before first deploy.

### 5. Create the video bucket

**Deferred by Save7** — R2 needs a payment method on the account, and that will be
added with Save7's bank details rather than a personal card. Nothing else waits on
it, and the site does not break in the meantime: with no bucket configured,
`src/lib/media.ts` removes the video path and Module 5 renders the player's "not
hosted yet" state, listing the chapters and saying plainly that the film is
finished but not yet uploaded. That is deliberate — a `<video>` pointing at a
missing file would look like a bug in the site.

When the account is ready:

```bash
npx wrangler r2 bucket create save7-media
```

Upload the video:

```bash
npx wrangler r2 object put save7-media/media/journey-of-a-gift.mp4 --file=public/media/journey-of-a-gift.mp4 --remote
```

Then, in the Cloudflare dashboard, give the bucket a public hostname (R2 → your
bucket → Settings → Public access; either the r2.dev subdomain or a custom domain
such as `media.save7.org`). Put that hostname in `wrangler.jsonc` as
`MEDIA_BASE_URL`, with no trailing slash.

Then redeploy, so the Worker picks up the new variable. Nothing else changes —
the video path lives in the lesson payload already.

**Until this is done, Module 5 has no video.** The 35 MB file is over Cloudflare's
25 MiB limit for Workers assets, so it is deliberately excluded from the deploy
(see `public/.assetsignore`). R2's free tier covers 10 GB and egress is free, so
this file will not cost anything to serve — the payment method is only there
because R2 requires one to be on file.

### 6. Set the session secret

```bash
openssl rand -base64 48
```

```bash
npx wrangler secret put AUTH_SECRET
```

Paste the generated value when prompted. It is a secret, so it is **not** in
`wrangler.jsonc` — and note that changing it later signs everyone out.

### 7. Set the public URL

Done — `wrangler.jsonc` sets both `SITE_URL` and `NEXT_PUBLIC_SITE_URL` to
`https://transplant-alchemy.zubayyrparak.workers.dev`.

That is the workers.dev hostname rather than `learn.save7.org`, deliberately: it
is the one that resolves today, so a certificate issued now carries a link that
works. Pointing it at the intended domain before that domain exists would print
dead links onto real certificates, which cannot be corrected after the fact
without reissuing them.

`SITE_URL` is the one that takes effect. Next inlines `NEXT_PUBLIC_` variables
into the bundle when it builds, and on Cloudflare the build happens before deploy
variables are applied, so a public variable would freeze whatever the build
machine had. `SITE_URL` is read at runtime, which means changing the domain is a
config change and a redeploy, not a rebuild.

**Changing the domain later is this one line and a deploy, with no rebuild:**

```bash
npx wrangler deploy
```

`SITE_URL` is read at runtime, so the built bundle does not depend on it. Verified
by doing exactly that: the variable was changed and deployed without rebuilding,
and a certificate on production then printed the new host.

### 8. Deploy

If you connected GitHub, push instead — Cloudflare builds and deploys:

```bash
git push
```

Or deploy straight from this machine:

```bash
npm run cf:deploy
```

### 9. Attach your domain

**This needs a DNS decision first.** `save7.org` is not on Cloudflare — its
nameservers are `ns1.host-h.net` / `ns1.dns-h.com` (Host Africa), and the main
site resolves to `76.76.21.21`, which is Vercel. A Cloudflare Worker can only
answer on a hostname whose zone is in your Cloudflare account, so
`learn.save7.org` cannot be attached as things stand. Pointing a CNAME at
`transplant-alchemy.zubayyrparak.workers.dev` from Host Africa does **not** work
either — Cloudflare rejects a Host header it has no zone for.

Three ways forward:

**A. Move `save7.org` DNS to Cloudflare** (free, and what makes the rest simple).
Add the domain in Cloudflare, let it import the existing records, **check them
against Host Africa's zone line by line — especially `MX`**, then change the
nameservers at the registrar. Save7 receives email on this domain, so a missing
`MX` record means lost mail, not just a broken website. The Vercel site keeps
working as long as its `A`/`CNAME` records come across. Once the zone is live:
Workers & Pages → `transplant-alchemy` → Settings → Domains & Routes → Add custom
domain → `learn.save7.org`.

**B. Use a domain you already have on Cloudflare**, if there is one. Same last
step, no migration.

**C. Stay on `transplant-alchemy.zubayyrparak.workers.dev`** — this is the current
setup. It works, it has HTTPS, certificates verify against it, and it costs
nothing. The only thing wrong with it is that it reads like a personal project
rather than Save7.

There is a free half-measure: the `zubayyrparak` part is the **account's**
workers.dev subdomain, and it can be renamed in the dashboard (Workers & Pages →
Overview → the subdomain shown in the sidebar). Renaming it to `save7` would give
`transplant-alchemy.save7.workers.dev`. Note that this **breaks the existing URL**
for anyone holding it, so do it before sharing the link, not after — and it needs
`SITE_URL` updated and a deploy afterwards.

Whoever administers `save7.org` DNS has to do A or B; it is registrar access, not
something in this repository.

### 10. Create your admin account

Register through the site like any learner, then promote yourself:

```bash
npx wrangler d1 execute transplant-alchemy --remote --command "UPDATE User SET role='ADMIN' WHERE email='you@save7.org'"
```

No admin account ships in the content import, deliberately — a default password in
a public repository is an open door. `/admin` returns 404 to non-admins, so nobody
can even tell it exists.

---

## Changing the database schema after launch

Content updates go through the reseed endpoint, but a *schema* change needs a
migration. Order matters — the migration first, the deploy second, or every query
touching the new columns fails in between:

1. Add a numbered file to `prisma/d1-migrations/`, ending with a semicolon
2. `npm run db:push` and check locally
3. Apply it to production: `npx wrangler d1 migrations apply transplant-alchemy --remote`
4. Then build and deploy

Migrations are recorded in D1's `d1_migrations` table, so re-running is safe: only
unapplied files execute.

---

## Giving someone else control of the domain and deploys

Two ways, and the first is better.

### Through the repository (recommended)

Connect Workers Builds to the GitHub repository (see
[Deploying from GitHub](#deploying-from-github-recommended)). Deploys then run under
your Cloudflare account, triggered by merges to `main`.

Once that is set up, a collaborator with **Write access on GitHub** can change where
the course lives without ever holding your Cloudflare credentials:

1. Uncomment the `routes` block in `wrangler.jsonc` and set the hostname
2. Set `SITE_URL` and `NEXT_PUBLIC_SITE_URL` to the same origin
3. Open a pull request

You review it, merge it, and the deploy attaches the domain and issues the
certificate. The change is visible, reversible, and recorded — which clicking in a
dashboard is not. They cannot see learner data, rotate `AUTH_SECRET`, or touch the
database.

**This is the whole reason the hostname is configuration rather than a dashboard
setting.** `SITE_URL` is read at runtime, so no rebuild is involved either.

### Through the Cloudflare account

Only if they genuinely need dashboard access — enabling R2, reading logs, managing
DNS records directly:

Cloudflare dashboard → **Manage Account** → **Members** → **Invite**. Grant the
narrowest role that fits, rather than Super Administrator:

| They need to | Role |
|---|---|
| Deploy Workers, attach domains | Workers Admin |
| Manage DNS for save7.org | DNS |
| Enable and manage R2 | Workers Admin (covers R2) |
| Everything except billing and member management | Administrator |

Super Administrator can remove you, change billing, and delete the account. There is
almost never a reason to grant it.

Note that account members can read D1, and D1 holds learner records — names, email
addresses, assessment answers. Under POPIA that is personal information, so keep the
list of people with account access short and deliberate.

### The part neither option solves

`learn.save7.org` cannot be attached by anyone — you, a collaborator, or me — until
`save7.org` DNS is on Cloudflare. That needs the **registrar** login at Host Africa
to change nameservers, which is a third credential, separate from GitHub and
Cloudflare. See step 9.

---

## Updating content after launch

Once people are enrolled, **never** re-run the bootstrap SQL. Instead:

1. Edit the files in `prisma/content/`
2. `npm run db:seed` locally, and check the result at `localhost:3000`
3. `npm run cf:deploy`
4. Sign in as an admin and apply the content:

```bash
curl -X POST https://learn.save7.org/api/admin/reseed -H "Cookie: save7_session=<your session cookie>"
```

That endpoint upserts on stable authoring keys. It never touches learner accounts,
attempts, progress or certificates, and it never resets a review decision you have
already recorded — so signing off a claim survives every future deploy.

---

## Before you launch

The content-review register currently holds **13 launch-blocking items**, visible
at `/admin/content-review` with the most severe first:

- **Module 9 (The Law)** — legal provisions that I could not verify against the
  *current consolidated* National Health Act. Your study guide may predate
  amendments.
- **Module 12 (FACTS)** — the eight-step sequence. The acronym, its Wits Transplant
  origin and its intended users are verified against de Jager et al., *SAMJ*
  2019;109(9). The step names came from the Organ and Tissue Donation Reference
  File, which is gated and could not be read, so the list is second-hand.
- **10 assessment items** on brain death and the law, needing a sign-off that the
  marked-correct answer is correct.

Your brief said: *"Before publishing this information, verify legal claims against
current authoritative South African sources."* Every flagged claim carries a visible
"Pending Save7 review" badge, so nothing is presented to a learner as settled fact —
but a lawyer has not read Module 9.

You have chosen to launch publicly. That is your call, and it is recorded here so
the position is not ambiguous later.

If you change your mind and want reviewer-only access first, put Cloudflare Access
in front of the Worker (Zero Trust → Access → Applications), which needs no code
change and is one setting to remove afterwards.

### Also outstanding

- **Statistics** are 2010–2019 decade totals from the study guide, date-stamped
  everywhere they appear. They are seven years old; fresher ODF or SATCS figures
  would make Module 2 land considerably harder.
- **Three citations** are incomplete: the current SATCS URL, a link to the
  consolidated National Health Act, and the Reference File itself.
- **The video has no captions or transcript.** You have said these are not needed;
  noting it because it is the one accessibility gap in an otherwise
  WCAG-conformant build.
- **The privacy notice** needs your information officer's name, the hosting
  location, and a data-retention period.
- **Certificate wording** has not been signed off.

---

## Costs

| | |
|---|---|
| Workers | Free tier covers 100,000 requests/day. Paid is $5/month. |
| D1 | Free tier covers 5 GB and 5 million row reads/day. This course is far below that. |
| R2 | Free tier covers 10 GB stored and unlimited egress via your domain. The video is 35 MB. |

For an awareness course, expect this to run at no cost, or $5/month if you exceed
the Workers free tier.

**On password hashing:** bcrypt at cost 12 takes roughly 200 ms of CPU per sign-in,
which is far more than a typical request. Registration was tested on the deployed
Worker and **worked**, so this is not a blocker — but it is the one operation with
any real CPU cost, so if sign-ups ever start failing while the rest of the site is
fine, that is where to look. The Workers Paid plan ($5/month) raises the CPU
ceiling substantially.

---

## Local development

```bash
npm run dev
```

Runs against a local SQLite file at `prisma/dev.db`, with fast refresh. This is the
right loop for content and UI work.

```bash
npm run cf:preview
```

Builds and runs the actual Worker against a local D1, which is what caught the
problems this port had to solve. Slower, but it is the truth.

Other useful commands:

```bash
npm run verify
```

Drives a real learner through the entire journey against the database and asserts
44 behaviours, including every assessment-integrity guarantee. Run it after
touching anything in `src/lib/`.

```bash
npm run db:seed          # apply course content locally
npm run db:seed:demo     # 18 synthetic learners, to exercise the admin dashboard
npm run db:export        # regenerate the D1 bootstrap SQL
npm run cf:types         # regenerate Worker types after editing wrangler.jsonc
```
