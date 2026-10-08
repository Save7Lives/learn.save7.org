# Deploying Save7 Learn to Vercel

The course is **deployed and live** at `https://learn.save7.org`, serving from Vercel
since 7 October 2026. What remains needs **your accounts** — the Vercel project, the
Supabase console and the Google Cloud console — so those steps are for you to do. I
cannot sign in to Save7's accounts, and I should not: publishing the course is your
decision, not mine.

Read [Before you launch](#before-you-launch) first. It says what the content-review
register does and does not tell you about sign-off.

The course is hosted on **Vercel**, deployed from GitHub by Vercel's Git integration.
If you remember an earlier version of this guide, it described Cloudflare Workers
(and before that Cloudflare Pages), with `wrangler` and `npm run deploy`. None of
that exists any more: there is no deploy command, and the domain is attached with
one CNAME and one TXT record at xneelo. [Step 9](#9-attach-your-domain) says what
changed and why.

---

## Outstanding right now, and who can clear it

Four things. None of them is waiting on code.

### 1. `learn.save7.org` is live; three settings still need the new hostname

Checked on 7 October 2026:

```bash
dig +short learn.save7.org
curl -sI https://learn.save7.org
```

The first answers with the Vercel CNAME target (`f5d209c593f287f5.vercel-dns-017.com.`)
and the second with `200` from `server: Vercel`. The certificate is Let's Encrypt,
issued and renewed by Vercel.

**What is still outstanding is configuration that names the hostname.** Two of the
three items are not done; Gilbert reported the third as done (status 7 October 2026):

- **Vercel project → Settings → Environment Variables.** `SITE_URL` and
  `NEXT_PUBLIC_SITE_URL` are both a placeholder, `https://learn-save7-org.vercel.app`.
  Change both to `https://learn.save7.org` and redeploy — certificate verification
  links are built from `SITE_URL`. Step 7 has the detail.
- **Supabase → Authentication → URL Configuration → Redirect URLs.** Add
  `https://learn.save7.org/**`. Gates the `signInWithOAuth` fallback, which uses
  `redirectTo: window.location.origin + pathname`. Leave the **Site URL** alone.
- **Google Cloud console → the volunteer portal's OAuth client → Authorised
  JavaScript origins.** Gates `signInWithIdToken`, which `GoogleSignIn.tsx`
  prefers. **Append** `https://learn.save7.org`; never replace the list, it is
  shared with volunteers.save7.org. Gilbert reported this entry already made for
  `learn.save7.org` on 30 September 2026. That cannot be checked from outside Google,
  so signing in is the check.

Both console entries must be made, and they gate different code paths, so doing one
leaves a broken route. Step 6b covers them. `register-learner` needs nothing for the
live domain: its allow-list already admits `https://learn.save7.org` (step 3).

These are deploy-time configuration that no build, typecheck or lint can catch, and
**they fail silently** — in the browser a missing entry reads as "Could not reach
Save7", which looks like an outage rather than a missing allow-list entry. The same
was true of the `register-learner` allow-list before it was fixed. When a journey
step fails on the live site, check these before suspecting the code.

### 2. The Hobby plan has limits nobody has resolved

The course runs on Vercel's free **Hobby** plan, on a team named `Save7`. Two
constraints come with it, and neither is settled:

- **Hobby is non-commercial only** (Vercel's fair-use guidelines). Commercial means
  anyone is paid for the site's production, including a paid employee or consultant
  writing code; donations are fine. Nobody has confirmed the course meets that.
  Upgrading to Pro is the fallback, at a cost the project's zero budget does not
  cover — see [Costs](#costs).
- **Hobby cannot deploy a private repository owned by a GitHub organization.** That
  is why the code repository is **public for now, deliberately**. It contains the
  quiz answer keys, so it must be made private before launch, and that then needs
  Vercel Pro or moving the repository to a personal GitHub account. See
  [Make the repository private before launch](#make-the-repository-private-before-launch).

On a Hobby team the commit author must be the team owner for private repositories,
and for public ones collaboration is free. Pushes by `zzubyr7x` to the current public
repository do deploy (checked 7 October 2026: `fc18150` reached production), so the
owner-only rule does not bite today. It would for a private repository, and that case
is untested.

### 3. There is no way to take the site down on purpose

The old `maintenance/` holding page was a Cloudflare Pages worker, and it was deleted
with the Cloudflare tooling. **No maintenance or take-down procedure exists on
Vercel.** This is an open item, not a known procedure. What exists is Instant
Rollback (step 8), which returns to an earlier deployment of the course, not to a
holding page.

### 4. Cloudflare leftovers to delete once Vercel is proven

Two things are still sitting in the Cloudflare account `admin@save7.org`:

- the pending `save7.org` zone, added for the abandoned nameserver move (nothing was
  ever switched to it);
- the Worker `learn`, last deployed 23 September 2026, which still answers at
  `https://learn.save7.workers.dev`. Until it is deleted it is a second live copy of
  the course on a public hostname.

Delete both once Vercel is proven. The old Pages project (`transplant-alchemy.pages.dev`)
is no longer pointed at by anything; whether it has been deleted, and on which
Cloudflare account it lives, is not recorded here.

---

## Where this stands

| | Status |
|---|---|
| Host | **Vercel**, Hobby (free) plan, team `Save7`, project `learn-save7-org`. Default address `https://learn-save7-org.vercel.app` |
| Build | A plain `next build` (the `build` script). No adapter and no `vercel.json`; every route is rendered on demand |
| Framework | Next **16.3.6**, React 19.2.8 |
| Source | GitHub `Save7Lives/learn.save7.org`, **public for now** (see [Outstanding](#2-the-hobby-plan-has-limits-nobody-has-resolved)). The old `zzubyr7x/...` URLs redirect |
| Deploys | Vercel's Git integration: every push builds, `main` publishes to `learn.save7.org`, every other branch gets a preview URL |
| Hostname | `https://learn.save7.org` — serving since 2026-10-07. Certificate issued and renewed by Vercel (Let's Encrypt) |
| Backend | The Save7 Supabase project — the same one the OS and the volunteer portal use |
| Database migrations | `save7-os/supabase/migrations/`, from `0091` (the schema) onward; `0121` at the time of writing |
| Sign-in | Google, verified by Supabase. No passwords, no `AUTH_SECRET` |
| Registration endpoint | `register-learner`, deployed 2026-09-23. Its allow-list admits `https://learn.save7.org`, the old Workers hostnames and `localhost`. It does **not** admit `learn-save7-org.vercel.app` or Vercel preview URLs — step 3 |
| Video | Ships with the app and plays from the same origin. Supabase Storage (`learn-media`) is the intended long-term home — step 5 |
| Public URL variables | **Placeholder, to be changed** to `https://learn.save7.org` and redeployed — step 7 |

There is no adapter, so nothing caps the Next version and patches can be taken as they
land. The floor is **16.3.3**: that release is where the September 2026 AVIF
image-optimization RCE (GHSA-2xp9-vwfh-vxw4, CVSS 9.5) was fixed (15.5.24 on the 15.5
line). Never go below it.

---

## What has been verified, and what has not

| | Status |
|---|---|
| Gates | `npm ci`, `npm run typecheck`, `npm run lint` and `npm run build` from a clean checkout, no `.env` needed. That is what `build.yml` runs on every push to `main` and every pull request |
| Answer-key isolation | Run against the live project 2026-09-23: `verify_learn_isolation()` passes, `learn_choices` and `learn_questions` both deny with 401, `learn_options_pub` denies and does not carry `is_correct`. HANDOVER §5 has the commands — no database credentials needed |
| Production smoke test | 2026-10-07 against `learn.save7.org`, unauthenticated: `/`, `/login`, `/register` and `/privacy` all `200`; `/dashboard` and `/admin` `307` to `/login?next=…`; the Supabase URL and the Google client id both appear in `/login`, so runtime configuration is reaching the page. `/media/journey-of-a-gift.mp4` serves as `video/mp4`, and a range request returns `206`. `/certificate/[publicId]` was not repeated on Vercel |
| Content load | 0094's probe asserts all six counts and the one-correct-answer invariant |

**Not verified, and you should know it before launch:**

| | |
|---|---|
| Anything behind sign-in | The smoke test above is unauthenticated. Nothing past the login wall has been exercised on the live site. |
| The end-to-end journey | The 53-assertion suite drove the old SQLite database and was removed with it. Nothing equivalent runs against Supabase yet. |
| Google sign-in on production | The flow is the volunteer portal's, unchanged, but it has not been walked on `learn.save7.org`. Both paths need an allow-list entry added by hand: `signInWithIdToken` needs the Google **Authorised JavaScript origins**, and the `signInWithOAuth` fallback needs Supabase's **Redirect URLs** — step 6b covers both. The Redirect URL is not made yet; Gilbert reported the Google origin as made on 30 September 2026, which cannot be checked from outside Google |
| Marking against real data | The rules moved into SQL functions whose probes are structural, not behavioural |
| Pushes by `zzubyr7x` | They deploy on the Hobby team while the repository is public (checked 7 October 2026 with `fc18150`); a private repository is untested — see [Outstanding](#2-the-hobby-plan-has-limits-nobody-has-resolved) |
| Certificate links | `SITE_URL` is still the placeholder, so the verification link a certificate shows is not yet the intended host — step 7 |

The journey row is the real gap. The rules it used to check are now enforced in SQL
or in `src/lib/`, but nothing exercises them end to end. The Baseline's cap of four
Sittings is a CHECK and a UNIQUE in 0110, and unanswered counting as incorrect is in
the marking functions (first 0097). That Improvement comes only from Baseline
Sittings is app code in `src/lib/analytics.ts`, not a database rule.

---

## Deploying from GitHub

Vercel's **Git integration** watches the repository and builds every push. That is
better than deploying from a laptop: the deploy is reproducible, there is a record of
what shipped, and it does not depend on one person's machine. It is also the only way
this course deploys.

`.github/workflows/build.yml` deliberately does **not** deploy. It runs `npm ci`,
`typecheck`, `lint` and `build` as gates on every push to `main` and every pull
request, and nothing else — two systems deploying the same site would race. A red
build here is the signal; the deploy is Vercel's job.

### How a push becomes a deployment

| You push | What Vercel does |
|---|---|
| `main` | Builds and publishes to `https://learn.save7.org` — production |
| any other branch | Builds a preview deployment with its own URL |

The repository is `Save7Lives/learn.save7.org`, on the GitHub organisation. It was
renamed from `transplant-alchemy` and moved from a personal account earlier; the old
`zzubyr7x/...` URLs redirect.

The build is a plain `next build`. Nothing in the repository configures it further:
there is no `vercel.json`, no adapter, and `next.config.ts` is empty. Configuration
that varies between environments lives in the Vercel project's environment variables
(step 6), not in the repository — apart from the three public values that are also
committed in `.env.example` for local development.

There is no secret to set. Every value the app needs is public by design — see
step 6 — and the service-role key must never be added.

A deployment without the Supabase variables throws on the server rather than
rendering a sign-in that cannot work, and `/login` is where it shows first. That
applies to preview deployments too, which is why step 6 sets every variable for both
Production and Preview.

### Make the repository private before launch

It is public today, deliberately, and that cannot stay. Three reasons, all concrete:

1. The repository contains the **quiz answer keys** — `isCorrect` in
   `prisma/content/*.ts` and in the generated SQL. A browser is kept from reading
   them (step 4); a public repository publishes them.
2. `public/resources/` holds ten third-party academic PDFs — ISHLT consensus
   documents, SAMJ papers, the SATCS reference file. Save7 was given them for the
   course; a public repository republishes them, which is a different thing from
   citing them.
3. The legal Stages, Intermediate Stage 3 and Advanced Stage 3, have not been
   reviewed by a lawyer, and no lesson prose has a recorded sign-off. A public
   repository is a public claim.

**Why it is public anyway:** Vercel's Hobby plan cannot deploy a private repository
owned by a GitHub organization. Going private therefore means one of two things, and
neither is decided:

- upgrade to **Vercel Pro**, which costs money the project's budget does not have
  (see [Costs](#costs)); or
- **move the repository to a personal GitHub account.** The `Save7-NPO` account is an
  owner of the organisation.

### After that

Every push builds. Content changes become: edit `prisma/content/`, run
`npm run content:emit`, and push the regenerated migration with `supabase db push`
(see [Updating content](#updating-content-after-launch)).

---

## One-time setup

These are the steps that stand the course up from nothing. Most are already done for
the live deployment; they are kept as the record of what it needs, and as the order
to follow if the Vercel project or the Supabase project ever has to be rebuilt.

### 1. Know where it runs

Nothing here deploys from a laptop, so there is no command-line sign-in. The course is
the Vercel project **`learn-save7-org`**, on the **Save7** team (Hobby plan), at
`https://learn-save7-org.vercel.app`, and its production branch is `main`.

Everything below that says "in the Vercel project" — environment variables, the
domain, redeploys, rollback — is done on that project, so you need access to the
Save7 team. How to grant someone that access is covered in
[Giving someone else control](#giving-someone-else-control-of-the-domain-and-deploys).

### 2. Apply the database

**There is no database to create.** The backend is the Save7 Supabase project —
the same one `os.save7.org` and `volunteers.save7.org` use — and the course's
schema, content and question bank are migrations in the `save7-os` repository.
`supabase db push` applies every migration not yet applied, so what follows is
the foundation it started from, not everything it will run.

```bash
cd ../save7-os && supabase db push
```

Always pass `--workdir` (pointing at the `save7-os` checkout) and
`--project-ref zbaoziisqroqxfwcnhlb`: a directory that is not linked defaults to the
wrong project. The same goes for the `supabase functions deploy` and
`supabase secrets set` commands in step 3.

The first eight it applied, in order, were:

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

0094's 131 questions included the volunteer portal's **forty gate questions**, so the
clinical and layman's quizzes and the course read from one bank.

Later migrations changed what those eight first built. `0110` replaced the once-only
baseline with up to four Baseline Sittings. `0112` swept 0094's thirteen modules and
their questions, to make way for the three-Level, eleven-Stage outline, and `0113`
made each Stage Quiz five questions and gated the Certificate on passing them.
Content has arrived since as `0114`–`0116`, `0118`, `0120` and `0121`, written by
`npm run content:emit`.

### 3. Deploy the registration endpoint

Sign-in is refused for an address that is not already on a list, so registration
has to work before anybody can sign in:

```bash
cd ../save7-os && supabase functions deploy register-learner
```

The function's CORS allow-list decides which sites a browser may call it from, and it
is in code in `save7-os`, not in a console. As written there it admits:

- `https://learn.save7.org`, exactly — so the live domain works without any change;
- the old Workers hostnames, `learn.save7.workers.dev` and its per-version
  previews, which are scoped to that one Worker rather than matched as `*.workers.dev`;
- `localhost` and `127.0.0.1`, on any port.

It does **not** admit `learn-save7-org.vercel.app` or the preview URLs Vercel gives
other branches, so registration on those is refused by the browser's CORS check,
which the page reports as "Could not reach Save7". **That is an open item, not a
known fix:** admitting Vercel previews would be a change in `save7-os`, the shape of
the preview hostnames is not recorded here, and it must stay scoped to this project.
A wildcard on `vercel.app` would admit every Vercel project on the internet, and this
is the one endpoint here that anybody can call without a token.

Redeploying the function matters only if that allow-list changes, or if the deployed
copy has fallen behind the source.

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

### 5. The film

*The Journey of a Gift* is shown at the top of Beginner Stage 3, with its captions,
a transcript and a note. Its three files are in `public/media/` (the film is 34.6
MiB), under names that carry their content hash, and **they ship with the app**:
Vercel serves them from the same origin, the film as `video/mp4` with range requests,
which is what seeking needs. The 25 MiB per-file asset cap that used to force the film
elsewhere was a Cloudflare limit and no longer applies. `npm run media:check` is what
keeps the names, the captions and the registry (`src/lib/films.ts`) in agreement, and
CI runs it.

**Supabase Storage, public bucket `learn-media`, is still the intended long-term
home** (map #23). Moving there is three steps, all in [MEDIA-HOSTING.md](MEDIA-HOSTING.md):

1. **`npm run media:upload`** needs a Supabase secret key in `.env.secrets`
   (git-ignored). It creates the bucket, uploads the three files with a one-year cache,
   and proves against the public URL that each comes back with the right content type,
   answers a range request with `206`, carries the one-year `cache-control`, and
   allows cross-origin reads. It exits non-zero if any of that fails. The key must
   never be committed, put in `.env`, or added to the Vercel project.
2. **Set `MEDIA_BASE_URL`** in the Vercel project, for Production and Preview, to the
   value the script prints, and **redeploy**: a changed variable reaches a running
   deployment only that way. Do not set it before step 1 passes. Pointing the app at
   files that are not there is the one way to get a dead player where the same-origin
   copy would have worked.
3. **`npm run media:verify`** repeats step 1's proofs against the bucket at any time,
   with no secret.

`MEDIA_BASE_URL` is **optional**. Unset, the film is served from `public/media`.

### 6. Set the environment variables

Environment variables live in the Vercel project, under **Settings → Environment
Variables**, and are set for **Production and Preview**. The three that configure the
backend:

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the same page |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | the volunteer portal's Google client id |

The same three values are committed in `.env.example`, which is what local development
copies. `SITE_URL` and `NEXT_PUBLIC_SITE_URL` are step 7, and `MEDIA_BASE_URL` is
step 5.

**Changing a variable does not change a running deployment.** It takes effect only
after a redeploy: **Deployments** → the deployment's menu → **Redeploy**.

**Set each variable for both Production and Preview, and check both carry it after an
edit.** An edit that reached only one of them is a real trap, and the old Pages setup
fell into it: the Supabase values once landed in a preview-only block, so previews
worked and production would have thrown on `/login`.

**None of these is a secret.** The anon key is public by design and grants nothing
on its own; a Google client id appears in every page that uses Google sign-in. Row
level security is what protects the data — see `verify_learn_isolation()` in step 4.

There is no `AUTH_SECRET` any more. The app no longer mints its own session
cookie: the Supabase cookie is the session, and it carries the JWT that row level
security reads. If you are looking for it because an older copy of this guide
mentioned it, it is gone along with password sign-in.

⚠️ **Never put the service-role key in the Vercel project, in the repository, or in
`.env`.** It bypasses every policy. The app does not need it and must not have it.

### 6b. Let Google and Supabase know the hostname

**Both of these fail silently, and this is the step most likely to be missed.**
Sign-in has two paths and each one has its own allow-list, held in a different
console. The course now lives at `https://learn.save7.org`, which neither list has been
told about. **Neither entry is made yet** (status 7 October 2026).

**Supabase → Authentication → URL Configuration.** Add the hostname to the
redirect allow-list under **Redirect URLs**:

```
https://learn.save7.org/**
```

**Leave the Site URL alone.** This Supabase project is shared with `os.save7.org` and
`volunteers.save7.org`, and whether changing the Site URL is safe for them has not
been checked.

Without this, `signInWithOAuth` — the fallback path — returns the learner to a
refused redirect after they have already approved the Google prompt.

**Google Cloud console → the volunteer portal's OAuth client → Authorised
JavaScript origins.** Add `https://learn.save7.org`, **appending rather than
replacing**: that client is what `volunteers.save7.org` signs in with, and
clearing an existing entry breaks the portal. Gilbert reported this entry already made
for `learn.save7.org` on 30 September 2026, which cannot be checked from outside
Google, so a sign-in test is the check.

Without this, Identity Services still draws a perfectly convincing button and 403s
an iframe request the moment it is pressed — a failure the page cannot observe, and
the reason the "Continue with Google" fallback is never hidden.

⚠️ **The registration endpoint has a third allow-list of its own**, in code, and
the live domain is already on it (step 3). It is deliberately not a wildcard, because
that endpoint is the one thing anybody can call without a token.

For local sign-in, `npm run dev` serves on port 3000 unless told otherwise, so the
matching Supabase entry would be `http://localhost:3000/**`. An earlier version of
this list named port 4327, which nothing in the repository uses.

If entries for `https://learn.save7.workers.dev` were ever added to either list, they
can come out when the Worker is deleted (see Outstanding, item 4). Whether they were
is not recorded here.

**Vercel preview deployments are on none of the three lists.** Signing in or
registering on a preview URL is therefore not expected to work. This has not been
tested. Previews are for looking at pages and checking the build; walk the journey on
`learn.save7.org`, not on a preview. Whether to add a pattern for them has not been
decided.

### 7. Set the public URL

`SITE_URL` and `NEXT_PUBLIC_SITE_URL` in the Vercel project set the host that
certificate verification links are built from.

**Today both are a placeholder, `https://learn-save7-org.vercel.app`. They must be
changed to `https://learn.save7.org` and the project redeployed. That step is still
to do.**

Until it is done, the verification link shown on a certificate names the placeholder
host rather than the domain Save7 intends people to use. The link is built each time
the certificate page is rendered, so changing the variable corrects the page from then
on. A copy someone has already printed or saved keeps the host it showed at the time,
and that cannot be corrected without reissuing it — so this is worth doing before real
certificates are issued.

`SITE_URL` is the one that takes effect. Next inlines `NEXT_PUBLIC_` variables into
the bundle when it builds, so a public variable would freeze whatever the build
had. `SITE_URL` is a plain server-side variable read on each request, and
`src/lib/site.ts` reads it first. Set both to the same value so they cannot disagree.

Changing the domain later is this one pair of variables and a redeploy
(**Deployments** → the deployment's menu → **Redeploy**); nothing in the code needs to
change. That has not been done on Vercel yet, so it is untested here.

### 8. Deploy

Push:

```bash
git push
```

Vercel builds the push. A push to `main` is a production deployment at
`https://learn.save7.org`; a push to any other branch is a preview deployment with
its own URL. **A push to `main` is the deploy**, so apply any migration that code
reads *before* pushing it — see
[Changing the database schema](#changing-the-database-schema-after-launch).

To redeploy without a code change — after editing an environment variable, for
example — use **Deployments** → the deployment's menu → **Redeploy**.

To put a version up without promoting it to the live hostname, push a branch: it gets
a preview deployment and production is untouched. That is also the closest thing to a
production check that exists, because there is no local runtime for the host (see
[Local development](#local-development)).

**Rolling back:** Vercel's **Instant Rollback** makes the previous production
deployment available at the custom domain instantly. It rolls the *code* back and
nothing else: the database is the Supabase project, and a migration applied for the
bad deploy stays applied. Check that the older code still works against the current
schema before relying on it.

### 9. Attach your domain

**Done on 7 October 2026.** `learn.save7.org` is attached to the Vercel project (in
the project, **Settings → Domains**) and serves the course. The certificate is Let's
Encrypt, issued and renewed by Vercel.

The zone stays at **xneelo**. Nothing moved to Cloudflare, and the nameservers are
unchanged: `ns1.host-h.net`, `ns2.host-h.net`, `ns1.dns-h.com` and `ns2.dns-h.com`.
The registrar is Tucows, through xneelo. Gilbert owns DNS and infrastructure and
edits the records himself.

Two records changed at xneelo:

| Type | Name | Value |
| --- | --- | --- |
| CNAME | `learn` | `f5d209c593f287f5.vercel-dns-017.com.` |
| TXT | `_vercel` | `vc-domain-verify=learn.save7.org,98022079fd5a62255618` |

The CNAME replaced `transplant-alchemy.pages.dev`, the old 503 holding page. The TXT
record proves ownership, because the main site's Vercel team — another account —
already holds `save7.org`. Vercel says it may be removed after verification.

**Every other record is untouched:** the apex (the main site, on Vercel), Google
Workspace mail, SPF, DMARC, the Resend records, and the `os`, `volunteers` and
`staging` subdomains. The record table in DNS-MIGRATION.md is the only complete
capture of the zone, because xneelo refuses zone transfers. Keep it as a recovery
record, and read it before touching anything at xneelo.

**Rolling the domain back** means putting the `learn` CNAME back (the TTL is 60
seconds). That is a DNS rollback, and it is not how to undo a bad deploy: a bad deploy
is Instant Rollback in step 8.

**An open note:** the Google Workspace DKIM selector was never confirmed — no
`google._domainkey` record exists in the zone. It is no longer a blocker.

**Why Vercel, and not Cloudflare.** The plan before this was to move the whole
`save7.org` zone to Cloudflare, so that a Workers custom domain could attach.
Cloudflare's single-subdomain delegation is Enterprise-only, and Cloudflare for SaaS
needed a spare domain. Gilbert asked why the whole zone had to move, then chose Vercel
instead. Going back to Cloudflare Pages was rejected: `@cloudflare/next-on-pages` is
archived and capped Next at 15.5.2, which carries the GHSA-2xp9-vwfh-vxw4 advisory.
The Cloudflare zone was added but left pending and is unused. Map tickets #51 (route A)
and #64 (the nameserver move) are superseded by this.

---

## Changing the database schema after launch

Both content and schema changes are migrations now, and they live in the
`save7-os` repository because they belong to the project that serves them. Order
matters — the migration first, the deploy second, or every query touching the new
columns fails in between:

1. Add a numbered file to `save7-os/supabase/migrations/`
2. `cd ../save7-os && supabase db push`
3. Then build and deploy this app

On Vercel the deploy is the push, so that third step is the push of the code that
reads the new columns.

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

Three things are held in three places: the code that deploys (GitHub), the Vercel
project's settings (Vercel), and the DNS records (xneelo). The first is the easiest to
share.

### Through the repository (recommended)

Vercel's Git integration deploys what is pushed to the GitHub repository (see
[Deploying from GitHub](#deploying-from-github)). A collaborator with **Write access
on GitHub** can push a branch, which builds a preview, and merge to `main`, which
deploys to production — without ever holding a Vercel credential. The change is
visible, reversible, and recorded. They cannot see learner data or touch the database;
that lives on the Supabase project, which this repository has no privileged access to.

What this route **cannot** do is change the domain or the environment variables. The
hostname is no longer declarable in code, as it was on Workers: it is attached in the
Vercel project under **Settings → Domains**, and the DNS records are at xneelo. The
variables are in the Vercel project.

On a Hobby team, the commit author must be the team owner for private repositories;
for public repositories collaboration is free. That is one more reason the question in
[Make the repository private before launch](#make-the-repository-private-before-launch)
has to be answered with the Vercel plan in mind.

### Through the Vercel team

Only if they genuinely need to change environment variables, redeploy, roll back, or
manage the domain themselves. That needs access to the **Save7** team on Vercel.
**How to invite someone, and which roles Vercel offers, is not recorded here**, and
neither is what the Hobby plan allows for team members. Look at what the team's
settings offer, and grant the narrowest access that fits rather than the broadest.

Note that learner records — names, email addresses, assessment answers — are in the
**Supabase** project, not in the Vercel project, which holds only public values. So
Vercel access does not by itself reach personal information, and Supabase access
does. Under POPIA that is personal information: keep the Supabase list short and
deliberate, and remember that the Supabase project also holds the organisation's books.

### The part neither option solves

The DNS records for `learn.save7.org` are at xneelo, and the zone stays there. Nobody
can change them from GitHub or from Vercel: Gilbert owns DNS and infrastructure, and
edits records himself. A change of hostname waits on whoever holds that access, however
the Vercel side is arranged. This is not a platform requirement as it was on Workers;
it is only who holds the xneelo login.

---

## Updating content after launch

Content is applied by migration, and the generated migration is an **upsert keyed
on the authoring identifier** — so a correction updates rows in place rather than
replacing them. That matters more than idempotence usually does: a question row
deleted and reinserted would take every answer ever recorded against it, and the
improvement figures with them.

1. Edit the files in `prisma/content/`
2. `npm run content:emit` — writes the content migration at the next free number
   in `../save7-os/supabase/migrations/`, plus a copy in `prisma/supabase/`. To
   emit one part alone, pass `--only=course`, `--only=baseline` or `--only=gate`
   (e.g. `npm run content:emit -- --only=gate`, which is how save7-os `0118` was
   made).
3. `cd ../save7-os && supabase db push`

The generated migration upserts on stable authoring keys. It never touches learner
accounts, attempts, progress or certificates, and it never resets a review decision
already recorded — so signing off a claim survives every future deploy.

The admin reseed endpoint is gone. It re-seeded the course from the running app,
which is not possible now that content arrives as SQL — the trade is that a content
change is slower and is reviewable in a pull request.

---

## Before you launch

The content-review register at `/admin/content-review` lists every Stage Quiz,
Baseline and clinical gate question. **As of 7 October 2026 all 205 are marked
approved, and none carries a Save7 reviewer's name.** Each was approved by the
content generator because it names the document its answer was checked against.
None was approved by a person at Save7. The page shows who signed each item off,
and approving or rejecting an item there is what puts a name against it.

Two things the register cannot show you:

- **Lesson prose is not in it.** The lessons name their sources in the text and in
  each Stage's further reading, but nothing records that Save7 has read them. A
  sign-off on the prose has to happen outside the app.
- **Learners see no badge.** A question still needing verification reaches
  learners exactly as an approved one does.

Your brief said: *"Before publishing this information, verify legal claims against
current authoritative South African sources."* Nothing records that a lawyer has
read the legal Stages: Intermediate Stage 3 (The South African Legal Framework) and
Advanced Stage 3 (Consent and End-of-Life Ethics, In Depth).

You have chosen to launch publicly. That is your call, and it is recorded here so
the position is not ambiguous later.

If you change your mind and want reviewer-only access first, **there is no recorded
way to do it on Vercel.** The earlier suggestion was to put Cloudflare Access in front
of the Worker, and the course is no longer behind Cloudflare. No Vercel equivalent has
been looked into, so reviewer-only access is an open item that would need its own
decision.

### Also outstanding

- **National statistics stop at 2021.** Beginner Stage 1 leads with the SATS/SATCS
  five-year report, 2017–2021, and keeps the ODF's 2010–2019 decade totals only as
  dated background. Figures reported for 2024 are marked as not independently
  verified. Newer verified figures would make Stage 1 land harder.
- **The film's captions have not been checked by someone listening.** Their timing came
  from speech recognition. MEDIA-HOSTING.md says how, and names two moments (about 2:15
  and 4:48) where the transcript and the recogniser disagreed on a word. The captions
  also cover only what is said: the film's on-screen text and diagrams are not
  described anywhere, which WCAG SC 1.2.3 (Level A) asks for, and nothing has decided
  that is not needed.
- **The privacy notice** needs the responsible party's registered name and address,
  your information officer's name and contact details, an address for access and
  deletion requests, where the data is hosted and in which country, how long records
  are kept, and a legal review against POPIA. `/privacy` lists the same six.
- **Certificate wording** has not been signed off.

---

## Costs

| | |
|---|---|
| Vercel | The **Hobby** plan is free, but **non-commercial only** (Vercel's fair-use guidelines): commercial means anyone is paid for the site's production, including a paid employee or consultant writing code; donations are fine. Nobody has confirmed the course meets that. **Pro** is $20 per developer seat per month. |
| Supabase | Shared with the OS and the volunteer portal, so the course adds no new bill. |
| Supabase Storage | If the video moves there (step 5), it is one 34.6 MiB object in the shared project. Check that project's plan allowance rather than trusting a number here. |

For an awareness course, expect this to run at no cost on Hobby — if it counts as
non-commercial, which is unconfirmed. If it does not, or if the repository has to be
private, the fallback is Pro at $20 per developer seat per month, against a project
budget of zero.

The one CPU-heavy operation this app used to have is gone with password sign-in:
bcrypt at cost 12 spent roughly 200 ms per sign-in, and nothing now hashes
anything. Sign-in is a Google credential verified by Supabase, and the server's own
work is a handful of HTTPS calls.

---

## Local development

Copy the example environment first. Every value in it is public by design:

```bash
cp .env.example .env
```

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

**There is no local runtime check of the host any more.** The old `npm run preview`
ran the built Worker on workerd, and it is gone. Vercel's preview deployments from
branch pushes are the closest thing to production that exists, with the sign-in limits
described in step 6b.

Other useful commands:

```bash
npm run content:emit     # regenerate the migration that loads the course
npm run build            # the production build, as the CI gate runs it
npm run typecheck        # next typegen && tsc --noEmit
npm run lint             # eslint
```

Before claiming anything works:

```bash
npm run typecheck && npm run lint && npm run build
```

**There is no journey suite any more.** `npm run verify` drove a learner through
the whole course against the local SQLite file and asserted 53 behaviours; it was
removed with the database it depended on. Until it is rewritten against Supabase,
the assessment-integrity rules are covered only by the structural probes inside the
migrations — so changes to marking deserve manual walking through.

One thing `npm run build` will catch that `next dev` will not: a rendering route
missing `export const dynamic = "force-dynamic"`. Next will happily prerender a route
at build time and bake in whatever configuration the build machine had. The routes
that render carry the directive for that reason, and it is load-bearing rather than
cosmetic: the CI build has no Supabase values (`build.yml` sets none), so a route that
tried to prerender fails there. This was found by the build failing on a missing
Supabase URL while prerendering `/login`.
