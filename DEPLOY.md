# Deploying Transplant Alchemy 101 to Cloudflare

Everything is ready to deploy. What remains needs **your Cloudflare account**, so
those steps are commands for you to run — I cannot authenticate as Save7, and I
should not: publishing the course is your decision, not mine.

Read [Before you launch](#before-you-launch) first. There are 13 items flagged as
launch-blocking in the content-review register.

---

## What is already done and verified

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

## One-time setup

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

**One caveat on the free tier:** password hashing (bcrypt, cost 12) uses roughly
200–300 ms of CPU per sign-in. The Workers free tier allows 10 ms of CPU per
request by default, so **sign-up and sign-in may fail on the free plan**. Everything
else is well within limits. If registration errors appear under load, that is the
cause, and the Workers Paid plan ($5/month, 30 s CPU) resolves it.

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
