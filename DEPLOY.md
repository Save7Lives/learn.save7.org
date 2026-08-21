# Deploying Transplant Alchemy 101 to Cloudflare

Everything is ready to deploy. What remains needs **your Cloudflare account**, so
those steps are commands for you to run — I cannot authenticate as Save7, and I
should not: publishing the course is your decision, not mine.

Read [Before you launch](#before-you-launch) first. There are 13 items flagged as
launch-blocking in the content-review register.

---

## Where this stands

**The previous deploy is superseded.** It ran on Cloudflare Workers against its own
D1 database with password sign-in. Both are gone: the app is built for Cloudflare
Pages, and the backend is the Save7 Supabase project. What was deployed at
the old `workers.dev` hostname no longer matches this repository.

| | Status |
|---|---|
| Build target | Cloudflare Pages, via `@cloudflare/next-on-pages` |
| Backend | The Save7 Supabase project — the same one the OS and the volunteer portal use |
| Database migrations | `save7-os/supabase/migrations/0091`–`0098` |
| Sign-in | Google, verified by Supabase. No passwords, no `AUTH_SECRET` |
| Registration endpoint | `register-learner`, needs deploying — step 3 |
| **Video** | **Not hosted. R2 is deferred until Save7's own bank details are used. See step 5.** |
| Custom domain | Not attached. `learn.save7.org` needs a DNS move first — see step 9 |

---

## What has been verified, and what has not

| | Status |
|---|---|
| Builds for Pages | Verified from a clean checkout: `npm ci` then `npm run pages:build`, no `.env` needed |
| Runs on `workerd` | Verified — the real runtime, not an emulator |
| Type and lint | `tsc --noEmit` and `eslint` clean |
| Answer-key isolation | Enforced by the database: `learn_choices` has no policy, and `verify_learn_isolation()` asserts it |
| Content load | 0094's probe asserts all six counts and the one-correct-answer invariant |

**Not verified, and you should know it before launch:**

| | |
|---|---|
| The end-to-end journey | The 53-assertion suite drove the old SQLite database and was removed with it. Nothing equivalent runs against Supabase yet. |
| Google sign-in on production | The flow is the volunteer portal's, unchanged, but it has not been walked on this hostname |
| Marking against real data | The rules moved into SQL functions whose probes are structural, not behavioural |

That first row is the real gap. The rules it used to check — the baseline being
once-only, unanswered counting as incorrect, only attempt 1 counting — are now
stated in migrations 0097 and 0098 and enforced there, but nothing exercises them
end to end.

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

Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to
Git**. Authorise GitHub, pick `transplant-alchemy`, then set:

| Setting | Value |
|---|---|
| Build command | `npm run pages:build` |
| Build output directory | `.vercel/output/static` |
| Branch | `main` |
| Compatibility flags | `nodejs_compat` |

`nodejs_compat` is not optional: the Next server needs Node built-ins (crypto,
buffer, async_hooks) even on the edge runtime.

**Finish steps 2 to 7 below before the first build**, or the deploy will serve a
site that cannot reach its database. Cloudflare reads `wrangler.jsonc` from the
repository, so the Supabase values and the URLs must be committed:

```bash
git commit -am "Point wrangler at the Supabase project and the domain"
```

```bash
git push
```

There is no secret to set. Every value the app needs is public by design — see
step 6 — and the service-role key must never be added.

### After that

Every push to `main` builds and deploys. Content changes become: edit
`prisma/content/`, run `npm run content:emit`, and push the regenerated migration
with `supabase db push` (see [Updating content](#updating-content-after-launch)).

---

## One-time setup

Do these regardless of whether you deploy from GitHub or from your laptop.

### 1. Sign in

```bash
npx wrangler login
```

### 2. Apply the database

**There is no database to create.** The backend is the Save7 Supabase project —
the same one `os.save7.org` and `volunteers.save7.org` use — and the course's
schema, content and question bank are migrations in the `save7-os` repository.

```bash
cd ../save7-os && supabase db push
```

That applies, in order:

| Migration | What it does |
| --- | --- |
| `0091_learn_course_bank` | Learners, course structure, the bank, attempts, RLS |
| `0092_learn_views_and_marking` | The views a browser may read, and the isolation checker |
| `0093_learn_content_shape` | Corrects 0091's content tables |
| `0094_learn_content` | The course: 3 levels, 13 modules, 97 lessons, 23 resources, 131 questions, 512 choices, 123 review items |
| `0095_learner_self_registration` | Who may hold an account, and enrolment |
| `0096_learn_parity` | Progress, events, and the derived-progress functions |
| `0097_learn_quiz_marking` | Marking, which needs the answer key |
| `0098_learn_certificates` | Issuing, public verification, renaming |

Each ends in a probe that raises rather than letting a half-applied migration
commit — 0094's asserts all six content counts and that every non-MULTI question
has exactly one correct answer.

The 131 questions include the volunteer portal's **forty gate questions**, so the
clinical and layman's quizzes and the course now read from one bank.

### 3. Deploy the registration endpoint

Sign-in is refused for an address that is not already on a list, so registration
has to work before anybody can sign in:

```bash
cd ../save7-os && supabase functions deploy register-learner
```

Set the throttle salt while you are there. Without it the function falls back to
the service key, which works but is not the intended state:

```bash
cd ../save7-os && supabase secrets set REGISTRATION_SALT="$(openssl rand -base64 32)"
```

### 4. Check what a browser can reach

Worth running once against the live project, because it is the assertion the whole
answer-key design rests on:

```sql
select verify_learn_isolation();
```

It confirms row level security is on for every `learn_*` table, that
`learn_choices` has **no policy at all**, that no view names `is_correct`, and that
`anon` has no direct read of the bank.

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

### 6. Set the Supabase variables

Three values, in `wrangler.jsonc` under `vars`, replacing the `SAVE7_` placeholders:

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the same page |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | the volunteer portal's Google client id |

**None of these is a secret, and none of them goes in `wrangler pages secret`.**
The anon key is public by design and grants nothing on its own; a Google client id
appears in every page that uses Google sign-in. Row level security is what protects
the data — see `verify_learn_isolation()` in step 4.

There is **no `AUTH_SECRET` any more.** The app no longer mints its own session
cookie: the Supabase cookie is the session, and it carries the JWT that row level
security reads. If you are looking for it because an older copy of this guide
mentioned it, it is gone along with password sign-in.

⚠️ **Never put the service-role key in this file or in the Pages project.** It
bypasses every policy, and `wrangler.jsonc` is committed to the repository. The app
does not need it and must not have it.

### 7. Set the public URL

Done — `wrangler.jsonc` sets both `SITE_URL` and `NEXT_PUBLIC_SITE_URL` to
`https://transplant-alchemy.zubayyrparak.workers.dev`.

That is the pages.dev hostname rather than `learn.save7.org`, deliberately: it
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
npm run pages:deploy
```

### 9. Attach your domain

**This needs a DNS decision first.** `save7.org` is not on Cloudflare — its
nameservers are `ns1.host-h.net` / `ns1.dns-h.com` (Host Africa), and the main
site resolves to `76.76.21.21`, which is Vercel. A Cloudflare Worker can only
answer on a hostname whose zone is in your Cloudflare account, so
`learn.save7.org` cannot be attached as things stand. Pointing a CNAME at
the `*.pages.dev` hostname from Host Africa does **not** work
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

**C. Stay on the `*.pages.dev` hostname** — this is the current
setup. It works, it has HTTPS, certificates verify against it, and it costs
nothing. The only thing wrong with it is that it reads like a personal project
rather than Save7.

There is a free half-measure: the `zubayyrparak` part is the **account's**
pages.dev subdomain, and it can be renamed in the dashboard (Workers & Pages →
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

Both content and schema changes are migrations now, and they live in the
`save7-os` repository because they belong to the project that serves them. Order
matters — the migration first, the deploy second, or every query touching the new
columns fails in between:

1. Add a numbered file to `save7-os/supabase/migrations/`
2. `cd ../save7-os && supabase db push`
3. Then build and deploy this app

Migrations are recorded by the Supabase CLI, so re-running is safe: only unapplied
files execute. **End any migration that touches a `learn_*` view or table with
`select verify_learn_isolation();`**, and any that touches a `vol_*` view with
`select verify_vol_views();` — the second is that repository's standing rule and the
course now has a view in that family.

There is no local Postgres in this setup, so a migration is verified by the probes
inside it. Write them: a migration that raises rolls itself back, which is how the
97-lessons-into-26-rows bug was caught rather than shipped.

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
dashboard is not. They cannot see learner data or touch the database — that lives on
the Supabase project, which this repository has no privileged access to.

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

Note that learner records — names, email addresses, assessment answers — are in the
**Supabase** project now, not in the Cloudflare account. So Cloudflare access no
longer reaches personal information, and Supabase access does. Under POPIA that is
personal information either way: keep both lists short and deliberate, and remember
that the Supabase project also holds the organisation's books.

### The part neither option solves

`learn.save7.org` cannot be attached by anyone — you, a collaborator, or me — until
`save7.org` DNS is on Cloudflare. That needs the **registrar** login at Host Africa
to change nameservers, which is a third credential, separate from GitHub and
Cloudflare. See step 9.

---

## Updating content after launch

Content is applied by migration, and the generated migration is an **upsert keyed
on the authoring identifier** — so a correction updates rows in place rather than
replacing them. That matters more than idempotence usually does: a question row
deleted and reinserted would take every answer ever recorded against it, and the
improvement figures with them.

1. Edit the files in `prisma/content/`
2. `npm run content:emit` — regenerates `save7-os/supabase/migrations/0094_learn_content.sql`
3. `cd ../save7-os && supabase db push`

The admin reseed endpoint is gone. It re-seeded the course from the running app,
which is not possible now that content arrives as SQL — the trade is that a content
change is slower and is reviewable in a pull request.

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
| Supabase | Shared with the OS and the volunteer portal, so the course adds no new bill. |
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

Runs against the **live Supabase project**, with fast refresh. There is no local
database: the schema, the content and the policies are on that project, and this is
the right loop for content and UI work.

That has a consequence worth stating plainly: local development writes to real
data. Sign in as yourself, and remember that a learner row you create is a row in
the same project as the organisation's books. There is no seeded admin to hide
behind.

```bash
npm run pages:dev
```

Builds and runs the actual Pages worker against Supabase — the real runtime rather
than `next dev`. Slower, but it is the truth.

Other useful commands:

```bash
npm run content:emit     # regenerate the migration that loads the course
npm run typecheck        # tsc --noEmit
npm run lint             # eslint
```

**There is no journey suite any more.** `npm run verify` drove a learner through
the whole course against the local SQLite file and asserted 53 behaviours; it was
removed with the database it depended on. Until it is rewritten against Supabase,
the assessment-integrity rules are covered only by the structural probes inside the
migrations — so changes to marking deserve manual walking through.
