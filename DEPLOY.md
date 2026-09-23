# Deploying Transplant Alchemy 101 to Cloudflare

Everything is ready to deploy. What remains needs **your Cloudflare account**, so
those steps are commands for you to run — I cannot authenticate as Save7, and I
should not: publishing the course is your decision, not mine.

Read [Before you launch](#before-you-launch) first. There are 13 items flagged as
launch-blocking in the content-review register.

The course is a **Cloudflare Worker** again, built by `@opennextjs/cloudflare`.
If you remember an earlier version of this guide saying the domain needed nothing
but one CNAME at xneelo, that was true of **Pages** and is not true of **Workers**.
[Step 9](#9-attach-your-domain) and DNS-MIGRATION.md carry the correction, and it
is the largest change in this document.

---

## Outstanding right now, and who can clear it

Four things. None of them is waiting on code.

### 1. The Worker is deployed; two console allow-lists are outstanding

Deployed **23 September 2026** by `admin@save7.org`, one version serving 100% of
traffic. Checked rather than assumed:

```bash
npx wrangler deployments list --name learn
curl -s -o /dev/null -w "%{http_code}\n" https://learn.save7.workers.dev/
```

The site answers `200` and renders. Runtime configuration is reaching it from
`wrangler.jsonc` and not from a build-time inline — the Supabase URL and the Google
client id both appear in `/login`, which is the trap in §2 of HANDOVER working
correctly. Protected routes redirect: `/dashboard` and `/admin` both `307` to
`/login?next=…`. `/media/*` is `404` and `/favicon.ico` is `200`, so `.assetsignore`
is doing its job.

`register-learner` now carries the Workers allow-list (`save7-os` `da07e83`,
deployed 23 September). Verified in both directions: `learn.save7.workers.dev` and
a hyphenated preview hostname are allowed; `evil.workers.dev`,
`other.save7.workers.dev`, `learn.save7.workers.dev.evil.com` and plain-`http://`
are all refused.

**What is still outstanding is two allow-lists that live in consoles**, covered by
step 6b. Both must be done, and they gate different code paths, so doing one leaves
a broken route:

- **Google Cloud console → the volunteer portal's OAuth client → Authorised
  JavaScript origins.** Gates `signInWithIdToken`, which `GoogleSignIn.tsx`
  prefers. **Append** `https://learn.save7.workers.dev`; never replace the list,
  it is shared with volunteers.save7.org.
- **Supabase → Authentication → URL Configuration → Redirect URLs.** Gates the
  `signInWithOAuth` fallback, which uses
  `redirectTo: window.location.origin + pathname`.

These are deploy-time configuration that no build, typecheck or lint can catch, and
**they fail silently** — in the browser a missing entry reads as "Could not reach
Save7", which looks like an outage rather than a missing allow-list entry. The same
was true of the `register-learner` allow-list before it was fixed. When a journey
step fails on the live site, check these before suspecting the code.

### 2. `learn.save7.org` currently serves the holding page, from somewhere else

Checked the same day:

```bash
dig +short learn.save7.org      # transplant-alchemy.pages.dev.
curl -sI https://learn.save7.org # 503
```

The hostname is a CNAME at xneelo pointing at the old **Pages** project, which is
still serving `maintenance/`'s 503 holding page. Two consequences worth knowing
before anybody expects a deploy to change what the public sees:

- **`npm run deploy` will not take the site out of maintenance.** It uploads the
  Worker; `learn.save7.org` still resolves to the Pages project. The hostname
  moves only when the DNS question in step 9 is answered.
- **`npx wrangler pages project list` on `admin@save7.org` returns nothing**,
  while `transplant-alchemy.pages.dev` still serves. The most likely reading is
  that the Pages project lives on a different Cloudflare account (the personal
  one the first deploy used). That is unconfirmed — whoever can see both accounts
  should confirm it, because retiring that project later needs whichever account
  owns it.

`maintenance/README.md` documents the holding page as a `wrangler pages deploy`,
which matches where it is deployed and **not** where the course now lives. Taking
it down is a Pages operation on that account, not a Workers one.

### 3. The content corrections are not in the database

Course content lives in Supabase, not in the bundle, so deploying does nothing for
it.

`prisma/supabase/0102_learn_content.sql` was emitted in August and never copied
into `save7-os`, whose `0102` slot Gilbert has since taken for his own migration.
**Do not reuse that file's number.** Re-emit against the current sequence:

- **Proper route:** `npm run content:emit`, then copy the generated file into
  `save7-os/supabase/migrations/` under the next free number, then
  `supabase db push`.
- **Without that checkout:** `npm run content:apply` — see
  `scripts/apply-content.mjs`. It takes the connection string from the
  environment, runs the file in one transaction, records the migration so a later
  `db push` skips it, and prints the row counts. Idempotent, so a re-run is safe.

### 4. The video has nowhere to live

`journey-of-a-gift.mp4` is **34.6 MiB** against a **25 MiB per-file static-asset
cap**. That cap is the same on Workers as it was on Pages — re-checked against
Cloudflare's limits page during the port, not assumed to have improved with the
platform.

What did change is the mechanism. Pages ignored `public/.assetsignore` and needed
a post-build strip script; **Workers honours it**, verified by serving the built
output and watching `/media/journey-of-a-gift.mp4` return 404 while
`/favicon.ico` returned 200. `scripts/strip-oversized-media.mjs` is therefore
deleted, and the exclusion is one line of configuration instead of a build step.

The file's home is **Supabase Storage**, public bucket `learn-media` — see
[step 5](#5-host-the-video). `npm run media:upload` creates the bucket, uploads
the file, verifies it comes back as `video/mp4`, and prints the `MEDIA_BASE_URL`
to set. It needs the service-role key in the environment, which must never be
committed, put in `wrangler.jsonc`, or pasted into a chat.

---

## Where this stands

| | Status |
|---|---|
| Build target | Cloudflare **Workers**, via `@opennextjs/cloudflare` 1.20.6 |
| Framework | Next **16.3.6**, React 19.2.8 |
| Worker | `learn`, on the `admin@save7.org` account (`cab9730a43ee3fb2e8aaf3d36a25cb8d`) |
| Hostname | `https://learn.save7.workers.dev` — live, deployed 2026-09-23 09:18 UTC. The account's workers.dev subdomain is `save7` |
| Backend | The Save7 Supabase project — the same one the OS and the volunteer portal use |
| Database migrations | `save7-os/supabase/migrations/0091`–`0098` |
| Sign-in | Google, verified by Supabase. No passwords, no `AUTH_SECRET` |
| Registration endpoint | `register-learner` deployed 2026-09-23 with the Workers allow-list, verified allowing the live and preview hostnames and refusing four near-miss origins |
| **Video** | **Not hosted.** Supabase Storage, bucket `learn-media` — step 5 |
| Custom domain | Not attached, and **no longer a single CNAME edit** — step 9 |

The `@cloudflare/next-on-pages` adapter capped Next at 15.5.2, which is what made
the version problem intractable on Pages. `@opennextjs/cloudflare` peers at
`>=15.5.24 <16 || >=16.3.3` — a **floor**, not a ceiling — so patches can be taken
as they land. The floor is where the September 2026 AVIF image-optimization RCE
(GHSA-2xp9-vwfh-vxw4, CVSS 9.5) was fixed. Do not drop below it.

---

## What has been verified, and what has not

| | Status |
|---|---|
| Builds for Workers | `npm ci` then `npm run cf:build` from a clean checkout, no `.env` needed |
| Runs on `workerd` | `npm run preview` — the real runtime, not an emulator |
| Type and lint | `tsc --noEmit` and `eslint` clean |
| `.assetsignore` is honoured | Served the built output: the video 404s, `/favicon.ico` serves |
| Answer-key isolation | Run against the live project 2026-09-23: `verify_learn_isolation()` passes, `learn_choices` and `learn_questions` both deny with 401, `learn_options_pub` denies and does not carry `is_correct`. HANDOVER §5 has the commands — no database credentials needed |
| Production smoke test | 2026-09-23 against `learn.save7.workers.dev`: `/`, `/login`, `/register`, `/privacy` and `/certificate/[publicId]` all `200`; `/dashboard` and `/admin` `307` to `/login?next=…`; runtime vars reaching the page from `wrangler.jsonc` |
| Content load | 0094's probe asserts all six counts and the one-correct-answer invariant |

**Not verified, and you should know it before launch:**

| | |
|---|---|
| Anything behind sign-in | The smoke test above is unauthenticated. Nothing past the login wall has been exercised on the live site, and registration is currently blocked by the stale `register-learner` allow-list. |
| The end-to-end journey | The 53-assertion suite drove the old SQLite database and was removed with it. Nothing equivalent runs against Supabase yet. |
| Google sign-in on production | The flow is the volunteer portal's, unchanged, but it has not been walked on a `workers.dev` hostname. Both paths need an allow-list entry added by hand: `signInWithIdToken` needs the Google **Authorised JavaScript origins**, and the `signInWithOAuth` fallback needs Supabase's **Redirect URLs** — step 6b covers both |
| Marking against real data | The rules moved into SQL functions whose probes are structural, not behavioural |
| Workers Builds | The connection has never been made. The settings in the next section are what the configuration implies, not what a build has run. |

The journey row is the real gap. The rules it used to check — the baseline being
once-only, unanswered counting as incorrect, only attempt 1 counting — are now
stated in migrations 0097 and 0098 and enforced there, but nothing exercises them
end to end.

---

## Deploying from GitHub (recommended)

Cloudflare **Workers Builds** watches a GitHub repository and redeploys on every
push. That is better than deploying from a laptop: the deploy is reproducible,
there is a record of what shipped, and it does not depend on one person's machine.

`.github/workflows/build.yml` deliberately does **not** deploy. It runs `npm ci`,
`typecheck`, `lint` and `cf:build` as gates on every push and pull request, and
nothing else — two systems deploying the same Worker would race. A red build here
is the signal; the deploy is Cloudflare's job.

### Connect Cloudflare to the repository

The repository is `zzubyr7x/learn.save7.org`, **renamed from
`transplant-alchemy`**. That rename is the first thing to check: if a Git
connection was ever made under the old name, confirm it survived — a connection
pointing at a repository name that no longer exists is the kind of thing that
fails quietly, by simply never building. **This is an open question, not a known
problem.** Nobody has looked.

Cloudflare dashboard → **Workers & Pages** → the `learn` Worker → **Settings** →
**Builds** → connect the repository, then:

| Setting | Value |
|---|---|
| Branch | `main` |
| Build command | `npm run cf:build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | the repository root |

`cf:build` produces `.open-next/worker.js` and `.open-next/assets`, and
`wrangler.jsonc` names both, so the deploy step needs no arguments. There are no
compatibility flags to set in the dashboard either — `nodejs_compat` and
`global_fetch_strictly_public` are in `wrangler.jsonc`, which is where Workers
reads them from. `nodejs_compat` is not optional: the Next server needs Node
built-ins (crypto, buffer, async_hooks).

**Finish steps 2 to 7 below before the first build**, or the deploy will serve a
site that cannot reach its database. Cloudflare reads `wrangler.jsonc` from the
repository, so the Supabase values must be committed:

```bash
git commit -am "Point wrangler at the Supabase project"
```

```bash
git push
```

There is no secret to set. Every value the app needs is public by design — see
step 6 — and the service-role key must never be added.

### Keep the repository private

Two reasons, both concrete:

1. `public/resources/` holds ten third-party academic PDFs — ISHLT consensus
   documents, SAMJ papers, the SATCS reference file. Save7 was given them for the
   course; a public repository republishes them, which is a different thing from
   citing them.
2. Module 9's legal content and Module 10's clinical criteria have not been
   reviewed yet. A public repository is a public claim.

Nothing about the build requires a public repository, and Workers Builds works on
a private one, so private costs you nothing.

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

```bash
npx wrangler whoami
```

The second one matters more than it looks. The Worker must land on
`admin@save7.org` (`cab9730a43ee3fb2e8aaf3d36a25cb8d`), because that account's
`workers.dev` subdomain is `save7` — which is what makes the hostname
`learn.save7.workers.dev` rather than something on a personal account. Deploying
while logged in as somebody else produces a working site at the wrong address,
and every allow-list in step 6b then names the wrong host.

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

**This needs doing again even if you deployed it in August.** The function's CORS
allow-list was rewritten for Workers and the change is in the repository, not in
the deployed function. It now matches:

```
^https://([a-z0-9]+-)?learn\.save7\.workers\.dev$
```

Note the shape, because it is not the Pages shape. `wrangler versions upload`
publishes a per-version hostname that **hyphenates onto the same label** —
`<version-prefix>-learn.save7.workers.dev` — where a Pages preview added a
subdomain. It is deliberately not `*.workers.dev`, which would admit every Worker
on the internet.

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

### 5. Host the video

The video is 34.6 MiB and a single static asset may be 25 MiB, so it cannot ship
in the bundle. `public/.assetsignore` keeps `media/*` out of the upload — Workers
reads that file, which is why there is no strip script any more.

**Supabase Storage, public bucket `learn-media`.** That is the decision on the
map, and it replaces two earlier plans that are both superseded: **R2** (needs a
payment method on the Cloudflare account, which was waiting on Save7's bank
details) and **GitHub Pages from the orphan `media` branch** (needs a paid GitHub
plan for a private repository). Neither is the route any more. MEDIA-HOSTING.md
still describes the GitHub Pages route and has not been updated.

```bash
npm run media:upload
```

It creates the bucket, uploads the file, checks that it comes back as
`video/mp4` — a wrong content type is exactly how this fails, silently, in a
`<video>` element — and prints the `MEDIA_BASE_URL` to uncomment in
`wrangler.jsonc`. It reads the service-role key from the environment; see
`scripts/load-secrets.mjs`. That key must never be committed or put in
`wrangler.jsonc`.

Then redeploy, so the Worker picks up the new variable:

```bash
npm run deploy
```

**Until the bucket is serving, Module 5 has no video, and that is a designed
state rather than a broken one.** With `MEDIA_BASE_URL` unset, `src/lib/media.ts`
drops the path and the player renders its "not hosted yet" state, listing the
chapters and saying plainly that the film is finished but not yet uploaded. A
`<video>` pointing at a missing file would look like a bug in the site. Do not set
the variable before the object actually serves — that is the one way to get the
dead player instead of the honest placeholder.

### 6. Set the Supabase variables

Three values, in `wrangler.jsonc` under `vars`:

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the same page |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | the volunteer portal's Google client id |

**There is one `vars` block now, not two.** Pages needed a separate `env.preview`
block because it built preview branches as separate deployments with their own
variables, and an edit that reached only one of them was a real trap — the
Supabase values once landed in `env.preview` alone, so previews worked and
production would have thrown on `/login`. Workers previews are **versions of this
same Worker** and inherit these vars. Do not reintroduce a second block without a
reason.

**None of these is a secret, and none of them goes in `wrangler secret put`.**
The anon key is public by design and grants nothing on its own; a Google client id
appears in every page that uses Google sign-in. Row level security is what protects
the data — see `verify_learn_isolation()` in step 4.

There is **no `AUTH_SECRET` any more.** The app no longer mints its own session
cookie: the Supabase cookie is the session, and it carries the JWT that row level
security reads. If you are looking for it because an older copy of this guide
mentioned it, it is gone along with password sign-in.

⚠️ **Never put the service-role key in this file or in the Worker.** It bypasses
every policy, and `wrangler.jsonc` is committed to the repository. The app does
not need it and must not have it.

### 6b. Let Google and Supabase know the hostname

**Both of these fail silently, and this is the step most likely to be missed.**
Sign-in has two paths and each one has its own allow-list, held in a different
console. Moving to Workers changed the hostname, so both lists need editing again.

**Supabase → Authentication → URL Configuration.** Add the hostname to the
redirect allow-list, and set it as the Site URL if the course is the primary site
for it:

```
https://learn.save7.workers.dev
https://learn.save7.org
http://localhost:4327
```

Without this, `signInWithOAuth` — the fallback path — returns the learner to a
refused redirect after they have already approved the Google prompt.

**Google Cloud console → the volunteer portal's OAuth client → Authorised
JavaScript origins.** Add the same hostnames, **appending rather than
replacing**: that client is what `volunteers.save7.org` signs in with, and
clearing an existing entry breaks the portal.

Without this, Identity Services still draws a perfectly convincing button and 403s
an iframe request the moment it is pressed — a failure the page cannot observe, and
the reason the "Continue with Google" fallback is never hidden.

⚠️ **The registration endpoint has a third allow-list of its own**, in code, and
it has already been updated — but the function still needs redeploying, which is
step 3. It is deliberately not a wildcard, because that endpoint is the one thing
anybody can call without a token.

Per-version preview hostnames are covered by the regex in step 3, so a
`wrangler versions upload` preview signs in without further edits. The Supabase
and Google lists are exact strings and are not: a preview hostname pasted into a
browser will hit the redirect allow-list. That is expected, and the reason to walk
the journey on the deployed Worker rather than on a version preview.

### 7. Set the public URL

`wrangler.jsonc` sets both `SITE_URL` and `NEXT_PUBLIC_SITE_URL` to
`https://learn.save7.workers.dev`.

That is the `workers.dev` hostname rather than `learn.save7.org`, deliberately:
it is the one that will answer as soon as the Worker is deployed, whereas
`learn.save7.org` still points at the old Pages project and cannot be moved
without the decision in step 9. A certificate issued now should carry a link that
works. Pointing this at the intended domain before that domain reaches this Worker
would print dead links onto real certificates, which cannot be corrected after the
fact without reissuing them.

`SITE_URL` is the one that takes effect. Next inlines `NEXT_PUBLIC_` variables
into the bundle when it builds, and on Cloudflare the build happens before deploy
variables are applied, so a public variable would freeze whatever the build
machine had. `SITE_URL` is read at runtime, which means changing the domain is a
config change and a deploy, not a rebuild.

**Changing the domain later is this one line and a deploy, with no rebuild:**

```bash
npx wrangler deploy
```

This was verified on the Pages build by doing exactly that — the variable was
changed and deployed without rebuilding, and a certificate on production then
printed the new host. The mechanism is the same on Workers, but it has not been
repeated here, because nothing has been deployed yet.

### 8. Deploy

If you connected Workers Builds, push instead — Cloudflare builds and deploys:

```bash
git push
```

Or deploy straight from this machine:

```bash
npm run deploy
```

That runs `opennextjs-cloudflare build` and then the upload. To put a version up
without promoting it to the live hostname:

```bash
npx wrangler versions upload
```

which prints a `<version-prefix>-learn.save7.workers.dev` URL. That is the
hostname the CORS regex in step 3 exists for.

### 9. Attach your domain

**This is where Workers differs from Pages, and the difference is not small.**

An earlier version of this guide said no nameserver move was needed. That was
correct for **Pages**, which will serve a custom domain on a subdomain with the
zone left at an external provider. **Workers reinstates the requirement**, and the
single-CNAME plan recorded here and in DNS-MIGRATION.md — *Gilbert repoints one
CNAME at xneelo* — **does not work**. Checked against Cloudflare's documentation
on 22 September 2026:

- A **Workers Custom Domain** needs an active Cloudflare zone, and Cloudflare is
  explicit that you cannot create one
  "on a hostname with an existing CNAME DNS record or on a zone you do not own"
  ([docs](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)).
  Both halves bite here: the zone is at xneelo, and `learn.save7.org` *is* an
  existing CNAME today.
- A **Workers Route** needs an active zone plus a proxied, orange-clouded record
  on Cloudflare
  ([docs](https://developers.cloudflare.com/workers/configuration/routing/routes/)).
- **Partial (CNAME) zone setup**, which would let Cloudflare serve one hostname
  while xneelo keeps the zone, is a **Business or Enterprise** feature
  ([docs](https://developers.cloudflare.com/dns/zone-setups/partial-setup/)).
  Not available on Free.
- **Subdomain setup / delegation** is **Enterprise** only
  ([docs](https://developers.cloudflare.com/dns/zone-setups/subdomain-setup/)).

This project has a zero budget, so that leaves two free routes, and choosing
between them is **not a decision this repository can make**:

1. **Move the `save7.org` zone's nameservers to Cloudflare.** Free, and the
   normal way to do this. But it is a whole-zone move: every record — mail, SPF,
   DMARC, the apex on Vercel, `os.save7.org`, `volunteers.save7.org` — moves with
   it. That makes it **Gilbert's decision, not ours**, and DNS-MIGRATION.md holds
   the captured zone and the procedure.
2. **Cloudflare for SaaS custom hostnames.** Available on Free (100 hostnames
   included, then $0.10 each) and a Worker can be the origin
   ([docs](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/plans/)).
   It does not need `save7.org` on Cloudflare — but it does need **some other
   domain** whose nameservers point at Cloudflare to act as the SaaS zone.
   Whether Save7 has a spare domain is not known here.

**Nothing is blocked while this is open.** Once the Worker is deployed,
`https://learn.save7.workers.dev` serves the whole course, sign-in included, and
the end-to-end journey can be walked there. `SITE_URL` already names it, so
certificates issued in the meantime carry a link that works. Moving to
`learn.save7.org` later is a `wrangler.jsonc` edit and a deploy, not a rebuild.

DNS-MIGRATION.md is the document for this. Read it before touching anything at
xneelo.

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
[Deploying from GitHub](#deploying-from-github-recommended)). Deploys then run
under your Cloudflare account, triggered by merges to `main`.

Once that is set up, a collaborator with **Write access on GitHub** can change
where the course lives without ever holding your Cloudflare credentials:

1. Uncomment the `routes` block in `wrangler.jsonc` and set the hostname
2. Set `SITE_URL` and `NEXT_PUBLIC_SITE_URL` to the same origin
3. Open a pull request

You review it, merge it, and the deploy attaches the domain. The change is
visible, reversible, and recorded — which clicking in a dashboard is not. They
cannot see learner data or touch the database; that lives on the Supabase project,
which this repository has no privileged access to.

**That route only exists because the course is a Worker again.** A Pages custom
domain could only be attached in the dashboard. On Workers the hostname is
declarable in `wrangler.jsonc`, which is the whole reason the hostname is
configuration rather than a dashboard setting. `SITE_URL` is read at runtime, so
no rebuild is involved either.

It presupposes the zone is on Cloudflare. Until then the `routes` block claims a
hostname this Worker does not serve, which is why it is commented out.

### Through the Cloudflare account

Only if they genuinely need dashboard access — reading logs, managing DNS records
directly, connecting Workers Builds:

Cloudflare dashboard → **Manage Account** → **Members** → **Invite**. Grant the
narrowest role that fits, rather than Super Administrator:

| They need to | Role |
|---|---|
| Deploy Workers, attach domains | Workers Admin |
| Manage DNS for save7.org, once the zone is there | DNS |
| Manage R2 or other storage | Workers Admin |
| Everything except billing and member management | Administrator |

Super Administrator can remove you, change billing, and delete the account. There is
almost never a reason to grant it.

Note that learner records — names, email addresses, assessment answers — are in the
**Supabase** project now, not in the Cloudflare account. So Cloudflare access no
longer reaches personal information, and Supabase access does. Under POPIA that is
personal information either way: keep both lists short and deliberate, and remember
that the Supabase project also holds the organisation's books.

### The part neither option solves

`learn.save7.org` cannot be pointed at this Worker by anyone — you, a
collaborator, or me — while the zone is authoritative at xneelo. That is not a
permissions problem inside Cloudflare; it is the platform requirement in step 9.
Whoever holds the registrar and zone access at xneelo, and whoever gets to decide
that every other `save7.org` record moves, is the person this is waiting on.

---

## Updating content after launch

Content is applied by migration, and the generated migration is an **upsert keyed
on the authoring identifier** — so a correction updates rows in place rather than
replacing them. That matters more than idempotence usually does: a question row
deleted and reinserted would take every answer ever recorded against it, and the
improvement figures with them.

1. Edit the files in `prisma/content/`
2. `npm run content:emit` — regenerates the content migration
3. `cd ../save7-os && supabase db push`

The generated migration upserts on stable authoring keys. It never touches learner
accounts, attempts, progress or certificates, and it never resets a review decision
already recorded — so signing off a claim survives every future deploy.

The admin reseed endpoint is gone. It re-seeded the course from the running app,
which is not possible now that content arrives as SQL — the trade is that a content
change is slower and is reviewable in a pull request.

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
| Supabase Storage | The video is one 34.6 MiB object in the shared project. Check that project's plan allowance rather than trusting a number here. |
| Cloudflare for SaaS, if that route is taken | 100 custom hostnames included on Free, $0.10 each after. |
| DNS on Cloudflare, if the zone moves | Free. |

For an awareness course, expect this to run at no cost, or $5/month if you exceed
the Workers free tier.

The one CPU-heavy operation this app used to have is gone with password sign-in:
bcrypt at cost 12 spent roughly 200 ms per sign-in, and nothing now hashes
anything. Sign-in is a Google credential verified by Supabase, and the Worker's own
work is a handful of HTTPS calls.

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
npm run preview
```

Builds the Worker and runs it on **workerd** with the configuration from
`wrangler.jsonc` — the real runtime rather than `next dev`. Slower, but it is the
truth, and while nothing is deployed it is the closest thing to production that
exists.

Other useful commands:

```bash
npm run content:emit     # regenerate the migration that loads the course
npm run cf:build         # the full Workers bundle
npm run cf:types         # regenerate worker-configuration.d.ts from wrangler.jsonc
npm run typecheck        # tsc --noEmit
npm run lint             # eslint
```

Before claiming anything works:

```bash
npm run typecheck && npm run lint && npm run cf:build
```

**There is no journey suite any more.** `npm run verify` drove a learner through
the whole course against the local SQLite file and asserted 53 behaviours; it was
removed with the database it depended on. Until it is rewritten against Supabase,
the assessment-integrity rules are covered only by the structural probes inside the
migrations — so changes to marking deserve manual walking through.

One thing `npm run cf:build` will catch that `next dev` will not: a rendering route
missing `export const dynamic = "force-dynamic"`. OpenNext runs on the Node runtime,
where Next will happily prerender a route at build time and bake in whatever
configuration the build machine had. All 22 routes carry the directive for that
reason — it replaced `export const runtime = "edge"`, which OpenNext does not
support, and it is load-bearing rather than cosmetic. This was found by the build
failing on a missing Supabase URL while prerendering `/login`.
