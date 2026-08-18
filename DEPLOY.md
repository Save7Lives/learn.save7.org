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
| **Video** | **Not working yet — needs R2 enabled. See step 5.** |
| **Custom domain** | **Not attached yet. See step 9.** |

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

**If you skip this, Module 5 has no video.** The 35 MB file is over Cloudflare's
25 MiB limit for Workers assets, so it is deliberately excluded from the deploy
(see `public/.assetsignore`).

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

In `wrangler.jsonc`, replace `NEXT_PUBLIC_SITE_URL`'s placeholder with the real
origin, e.g. `https://learn.save7.org`. Certificate verification links are built
from this, so a wrong value produces certificates pointing at the wrong host.

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

In the Cloudflare dashboard: Workers & Pages → `transplant-alchemy` → Settings →
Domains & Routes → Add custom domain. Because your DNS is already on Cloudflare,
this issues the certificate and routes traffic without a separate DNS record.

### 10. Create your admin account

Register through the site like any learner, then promote yourself:

```bash
npx wrangler d1 execute transplant-alchemy --remote --command "UPDATE User SET role='ADMIN' WHERE email='you@save7.org'"
```

No admin account ships in the content import, deliberately — a default password in
a public repository is an open door. `/admin` returns 404 to non-admins, so nobody
can even tell it exists.

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
