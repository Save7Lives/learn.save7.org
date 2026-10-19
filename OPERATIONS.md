# Operations: hosting, deploys, the database, the film and DNS

How Save7 Learn is hosted and shipped, what each setting is for, and what is still
open. The steps that change a live setting need Save7's own accounts (the Vercel
project, the Supabase console, the Google Cloud console, xneelo), so they are for a
person with that access to do; a session cannot sign in to them and should not.
HANDOVER.md has the database rules and the traps; README.md has running the app
locally.

---

## Where it stands

| | Status |
| --- | --- |
| Host | Vercel, Hobby (free) plan, team `Save7`, project `learn-save7-org`. Default address `https://learn-save7-org.vercel.app` |
| Build | A plain `next build` (the `build` script), no adapter; every route is rendered on demand. `vercel.json` sets only `"regions": ["dub1"]`, so functions run in Dublin, next to the database. `next.config.ts` holds only the redirects from the old Admin tabs |
| Framework | Next 16.4.2 (lockfile), React 19.2.8. The floor is 16.3.3 (README.md, *Architecture*) |
| Source | GitHub `Save7Lives/learn.save7.org`, public for now (*Open items*). The old `zzubyr7x/...` URLs redirect |
| Deploys | Vercel's Git integration: every push builds, `main` publishes to `learn.save7.org`, every other branch gets a preview URL |
| Hostname | `https://learn.save7.org`, serving since 2026-10-07. Certificate issued and renewed by Vercel (Let's Encrypt) |
| Backend | The Save7 Supabase project `zbaoziisqroqxfwcnhlb`, the same one the OS and the volunteer portal use |
| Database migrations | `save7-os/supabase/migrations/`, from `0091` (the schema) onward; production's head was `0139` on 2026-10-18 |
| Sign-in | Google, verified by Supabase. No passwords, no `AUTH_SECRET`. Walked on `learn.save7.org` on 2026-10-16 and 2026-10-17 (map #65, #66) |
| Registration endpoint | `register-learner`, in `save7-os`. Its allow-list admits `https://learn.save7.org`, the old Workers hostnames and `localhost`, not `vercel.app` (*Sign-in and registration allow-lists*) |
| Video | On the Supabase Storage bucket `learn-media`: `MEDIA_BASE_URL` was set and the site redeployed on 2026-10-08, as reported by the user (map #61). The same files also ship in `public/media` |
| Public URL variables | `SITE_URL` and `NEXT_PUBLIC_SITE_URL` are `https://learn.save7.org`: map #65 records them set and redeployed on 2026-10-16, and #51 records them set and checked on production on 2026-10-17, after a Certificate's "Verify at" address came out wrong |

---

## Open items

None of these is waiting on code.

**Hobby is non-commercial only** (Vercel's fair-use guidelines). Commercial means anyone
is paid for the site's production, including a paid employee or consultant writing
code; donations are fine. Nobody has confirmed the course meets that. Pro is the
fallback, at $20 per developer seat per month, against a project budget of zero (see
*Costs*).

**The repository is public on purpose, and must go private before launch.** It was
still public on 2026-10-18. Vercel's Hobby plan cannot deploy a private repository
owned by a GitHub organization, and this one is owned by `Save7Lives`. Three things in
it should not stay public:

1. The quiz answer keys: `isCorrect` in `prisma/content/*.ts` and in the generated SQL.
   A browser is kept from reading them (HANDOVER.md §1); a public repository publishes
   them.
2. `public/resources/` holds ten third-party academic PDFs (ISHLT consensus documents,
   SAMJ papers, the SATCS reference file). Save7 was given them for the course; a public
   repository republishes them, which is a different thing from citing them.
3. The legal Stages, Intermediate Stage 3 and Advanced Stage 3, have not been reviewed
   by a lawyer, and no lesson prose has a recorded sign-off. A public repository is a
   public claim.

Going private means one of two things, and neither is decided: upgrade to Vercel Pro,
or move the repository to a personal GitHub account (the `Save7-NPO` account is an owner
of the organisation). On a Hobby team the commit author must be the team owner for a
private repository; for a public one collaboration is free. Pushes by `zzubyr7x` deploy
today (checked 7 October 2026 with `fc18150`); the private case is untested.

**There is no way to take the site down on purpose.** The old `maintenance/` holding
page was a Cloudflare Pages worker, deleted with the Cloudflare tooling. No maintenance
or take-down procedure exists on Vercel. Instant Rollback (*Deploying*) returns to an
earlier deployment of the course, not to a holding page.

**Vercel preview URLs are on none of the sign-in or registration allow-lists**, so
signing in or registering on a preview is not expected to work. This has not been
tested, and whether to add a pattern for them has not been decided.

**The Google Workspace DKIM selector was never confirmed** (*DNS*). An open note, not a
blocker.

---

## Deploying

Vercel's Git integration watches the repository and builds every push. It is the only
way this course deploys: there is no deploy command and no command-line sign-in.

| You push | What Vercel does |
| --- | --- |
| `main` | Builds and publishes to `https://learn.save7.org`: production |
| any other branch | Builds a preview deployment with its own URL |

`.github/workflows/build.yml` deliberately does not deploy. It runs the gates on every
push to `main` and every pull request (`npm ci`, `typecheck`, `lint`, `media:check`,
`content:check`, `scripts/audit-gate.mjs`, `build`, and an accessibility job running
`check:vocabulary` and the public pages of `audit:a11y`), and nothing else: two systems deploying the same
site would race. A red build there is the signal; the deploy is Vercel's job.

`.github/workflows/live-check.yml` is the one workflow that looks at the deployed site. It
runs `npm run check:live` daily and on demand: a public Certificate page must print
`learn.save7.org/certificate/...` on its "Verify at" line. It exists because the fault it
guards (a placeholder in `SITE_URL`, #51) is a Vercel setting that no push changes.

A push to `main` is the deploy, so apply any migration that code reads before pushing
it (*Database*).

To redeploy without a code change, after editing an environment variable for example:
Deployments → the deployment's menu → Redeploy.

To put a version up without promoting it, push a branch: it gets a preview deployment
and production is untouched. That is the closest thing to a production check that
exists, because nothing runs the host locally, with the sign-in limits above.

**Rolling back:** Vercel's Instant Rollback makes the previous production deployment
available at the custom domain instantly. It rolls the code back and nothing else: the
database is the Supabase project, and a migration applied for the bad deploy stays
applied. Check that the older code still works against the current schema before
relying on it.

### A signed-in pass on production

Before filing a bug from a pass, run `gh pr list --state merged --limit 5` and compare it
with what production shows: a fix that merged mid-pass makes a bug stop reproducing, as the
Stage eyebrow did (#51). `npm run probe -- /route ...` prints status, title, heading and any
"Stage N of M" eyebrow for several routes at once; give it `COOKIE` for the signed-in view.
`npm run check:live` checks the certificate address. A pass that submits Stage Quizzes or sits
the Baseline writes to the real account, so name those writes in the report.

### Opening a pull request from a terminal

When the steps go to someone else to run, give one block that writes the body file and
creates the pull request, and make a missing file loud:

```bash
cat > pr-body.md <<'EOF'
<body>
EOF
[ -s pr-body.md ] || { echo "pr-body.md is empty"; exit 1; }
gh pr create --title "<title>" --body-file pr-body.md
```

A `[ -s file ] && gh ...` guard on its own skips silently when the file is missing, which is
how a pull request once went uncreated without any message.

---

## Environment variables

They live in the Vercel project under Settings → Environment Variables, set for both
Production and Preview. `.env.example` documents each one.

| Variable | What it is |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The same page |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | The volunteer portal's Google client id |
| `SITE_URL` | The public origin certificate verification links are built from. Read on the server per request, so it is the one that takes effect |
| `NEXT_PUBLIC_SITE_URL` | The same value. Next inlines `NEXT_PUBLIC_` variables into the bundle at build time, so it would freeze whatever the build had; `src/lib/site.ts` reads `SITE_URL` first. Set both to the same value so they cannot disagree. Add each as a plain variable: Vercel refuses to save a `NEXT_PUBLIC_` name as Sensitive, and a saved Sensitive variable cannot be switched back, only deleted and re-added |
| `MEDIA_BASE_URL` | Optional. Where the film is served from (*The Stage 3 film*); unset means `public/media` |
| `WHATSAPP_COMMUNITY_URL` | Optional. The Save7 WhatsApp community invite, shown as a card on the landing page only; unset hides the card. Read per request. If the invite is abused, reset it in WhatsApp and change this one value |

The first three are also committed in `.env.example`, which local development copies.

A changed variable does not change a running deployment. It takes effect only after a
redeploy.

Set each variable for both Production and Preview, and check both carry it after an
edit. An edit that reached only one is a real trap, and the old Pages setup fell into
it: the Supabase values once landed in a preview-only block, so previews worked and
production would have thrown on `/login`. A deployment without the Supabase variables
throws on the server rather than rendering a sign-in that cannot work, and `/login` is
where it shows first.

None of these is a secret. The anon key is public by design and grants nothing on its
own; a Google client id appears in every page that uses Google sign-in. Row level
security is what protects the data (HANDOVER.md §1). There is no `AUTH_SECRET` any more:
the Supabase cookie is the session, and it carries the JWT that row level security
reads.

Never put the service-role key in the Vercel project, in the repository, or in `.env`.
It bypasses every policy, and the app does not need it.

`SITE_URL` was a placeholder, `https://learn-save7-org.vercel.app`, until mid-October
2026. `siteUrl()` now ignores any `*.vercel.app` value and falls back to
`https://learn.save7.org` (007d388), so a placeholder cannot reach a certificate again. The link
is built each time the certificate page renders, so changing the variable corrects the
page from then on; a copy someone printed or saved keeps the host it showed. Changing
the domain later is this pair of variables and a redeploy, and nothing in the code.

---

## Sign-in and registration allow-lists

Sign-in has two paths, each with its own allow-list in a different console, and
registration has a third, in code. All three fail silently: in the browser a missing
entry reads as "Could not reach Save7", which looks like an outage rather than a
missing entry. When a journey step fails on the live site, check these before
suspecting the code. No build, typecheck or lint can catch them.

**Supabase → Authentication → URL Configuration → Redirect URLs** gates the
`signInWithOAuth` fallback, which uses `redirectTo: window.location.origin + pathname`.
It holds `https://learn.save7.org/**` (confirmed on map #65). Leave the Site URL alone:
the project is shared with `os.save7.org` and `volunteers.save7.org`, and whether
changing it is safe for them has not been checked. Without the entry, the learner is
returned to a refused redirect after already approving the Google prompt. For local
sign-in the entry would be `http://localhost:3000/**`.

**Google Cloud console → the volunteer portal's OAuth client → Authorised JavaScript
origins** gates `signInWithIdToken`, which `GoogleSignIn.tsx` prefers. It holds
`https://learn.save7.org` (Gilbert reported it made on 30 September 2026, and Google
sign-in worked on the live site on 2026-10-16). Append, never replace: that client is
what `volunteers.save7.org` signs in with, and clearing an entry breaks the portal.
Without the entry, Identity Services still draws a convincing button and 403s an
iframe request the moment it is pressed, a failure the page cannot observe, which is why
the "Continue with Google" fallback is never hidden.

**`register-learner`'s CORS allow-list** is in code in `save7-os`, not in a console. It
admits:

- `https://learn.save7.org`, exactly;
- the old Workers hostnames, `learn.save7.workers.dev` and its per-version previews,
  scoped to that one Worker rather than matched as `*.workers.dev`;
- `localhost` and `127.0.0.1`, on any port.

It does not admit `learn-save7-org.vercel.app` or Vercel preview URLs. Admitting them
would be a change in `save7-os`, the shape of the preview hostnames is not recorded
here, and it must stay scoped to this project: a wildcard on `vercel.app` would admit
every Vercel project on the internet, and this is the one endpoint anybody can call
without a token. The Workers entries can come out now that the Worker is gone.

Deploying the function, if the allow-list changes or the deployed copy falls behind the
source:

```bash
supabase functions deploy register-learner --workdir <save7-os checkout> --project-ref zbaoziisqroqxfwcnhlb
```

Always pass `--workdir` and `--project-ref` to project-scoped `supabase` commands: a
directory that is not linked defaults to the wrong project. Set the throttle salt the
same way; without it the function falls back to the service key, which works but is not
the intended state:

```bash
supabase secrets set REGISTRATION_SALT="$(openssl rand -base64 32)" --workdir <save7-os checkout> --project-ref zbaoziisqroqxfwcnhlb
```

---

## Database

There is no database to create. The backend is the Save7 Supabase project, and the
course's schema, content and question bank are migrations in the `save7-os` repository,
because they belong to the project that serves them.

### Applying a migration

From the `save7-os` checkout:

```bash
npm run db:push
```

That is `save7-os`'s own script: a verified backup of every public table, then
`supabase db push`. Its CLAUDE.md forbids a bare `supabase db push`. A push of
`save7-os`'s `main` applies nothing on its own: the Supabase GitHub integration that
used to apply migrations on push was disconnected (map #62, closed 2026-10-08). Write
every migration to be safe to run twice all the same.

Order matters. The migration first, the deploy second, or every query touching the new
columns fails in between:

1. Add a numbered file to `save7-os/supabase/migrations/`.
2. `npm run db:push` in `save7-os`.
3. Push the code that reads the new columns.

Migrations are recorded by the Supabase CLI, so re-running is safe: only unapplied files
execute. End any migration that touches a `learn_*` view or table with
`select verify_learn_isolation();`, and any that touches a `vol_*` view with
`select verify_vol_views();`. The second is that repository's standing rule, and the
course owns a view in that family. Put a probe at the end of every migration: one that
raises rolls itself back, which is how the 97-lessons-into-26-rows bug was caught
rather than shipped (HANDOVER.md §3). The end-to-end suite replays every migration into
a local Postgres, so it shows a migration applies to a copy.

### Updating content

Content is applied by migration, and the generated migration is an upsert keyed on the
authoring identifier, so a correction updates rows in place rather than replacing them.
That matters more than idempotence usually does: a question row deleted and reinserted
would take every answer ever recorded against it, and the improvement figures with
them.

1. Edit `content/` (lesson prose) or `prisma/content/` (questions, structure, reading).
2. `npm run content:emit`: writes the content migration at the next free number in
   `../save7-os/supabase/migrations/` (pass another path as the first argument), plus a
   copy in `prisma/supabase/`. To emit one part alone, pass `--only=course`,
   `--only=baseline` or `--only=gate` (for example
   `npm run content:emit -- --only=gate`, which is how save7-os `0118` was made).
3. `npm run db:push` in `save7-os`.

When new code and new content ship together, deploy the code first: new code has to
render old content, but old code cannot render new syntax.

The generated migration never touches learner accounts, attempts, progress or
certificates, and it never resets a review decision already recorded, so signing off a
claim survives every future emit. `npm run content:apply` runs a generated file straight
against the database (`SUPABASE_DB_URL`, in one transaction, recorded in the migration
history) for when the `save7-os` checkout is not to hand; it skips `db:push`'s backup.
The old admin reseed endpoint is gone: content is now slower to change and reviewable
in a pull request, which was the trade that was wanted.

### The foundation

The first eight migrations, in order:

| Migration | What it does |
| --- | --- |
| `0091_learn_course_bank` | Learners, course structure, the bank, attempts, RLS |
| `0092_learn_views_and_marking` | The views a browser may read, and the isolation checker |
| `0093_learn_content_shape` | Corrects 0091's content tables |
| `0094_learn_content` | The first course: 3 levels, 13 modules, 97 lessons, 23 resources, 131 questions (the volunteer portal's forty gate questions among them), 512 choices, 123 review items |
| `0095_learner_self_registration` | Who may hold an account, and enrolment |
| `0096_learn_parity` | Progress, events, and the derived-progress functions |
| `0097_learn_quiz_marking` | Marking, which needs the answer key |
| `0098_learn_certificates` | Issuing, public verification, renaming |

Later migrations changed what those built. `0110` replaced the once-only baseline with
up to four Baseline Sittings. `0112` swept 0094's thirteen modules and their questions
to make way for the three-Level, eleven-Stage outline, and `0113` made each Stage Quiz
five questions and gated the Certificate on passing them. Content has arrived since as
generated migrations (`prisma/supabase/` keeps a copy of each), and the Admin's
functions from `0134` on (HANDOVER.md §1).

---

## The Stage 3 film

*The Journey of a Gift* (6:59, 36 MB) opens Beginner Stage 3. The decisions behind it
are wayfinder #23 (hosting) and #58 (placement and captions), #61 built them, and #92
took off the note on where the film and the course differ.

### What a learner sees

At the top of Stage 3's first lesson, above its prose: the player, with its captions
on; the film's length and size, so that 36 MB is a choice on a metered connection
(`preload="none"`, so nothing downloads until play is pressed); and the transcript,
word for word.

The film still contradicts the course in three places, though the page no longer says
so (#92): *over 65* tissue lives (the course says up to fifty), a *state pathologist*
signing off an accidental death (the Forensic Pathology Service authorises it), and *by
law* there is no cost to the family (no cost in practice: neither the National Health
Act nor its regulations says who pays). The first two are Stage Quiz items the film
would answer wrongly.

### How the film gets from a file to a page

1. `content/beginner/how-donation-works/intro.md` has `video: journey-of-a-gift` in its
   front matter.
2. `loadLesson()` accepts only a key that is registered in `src/lib/films.ts`. A URL, a
   path or an unknown name fails the content build, so content cannot name a URL.
3. `emit-supabase-content.ts` writes the key to `learn_lessons.component_key`, the one
   use that column has had since #58 retired the interactive components. Its probe
   asserts that exactly the registered keys are present.
4. `LessonFilm` reads the key from the lesson row and looks it up in the registry. A
   missing or unregistered key renders no film and never fails the Stage.

Everything the page shows lives in the registry, in typed code: the three file paths,
the title, length and size, the captions track, and the transcript.

### The files, and why their names are permanent

```
public/media/journey-of-a-gift.5e5b3bab.mp4       the film, unedited (36,239,535 bytes)
public/media/journey-of-a-gift.91c4e4f6.jpg       the title card at one second, the poster
public/media/journey-of-a-gift.en.9cfe81c6.vtt    the captions (WebVTT)
```

Each name carries the first eight hex characters of the SHA-256 of its bytes. The files
are served with a one-year cache (#23), so a corrected file that kept its name would be
served stale from every cache that held it. `npm run media:check` fails if a name and
its contents disagree, and CI runs it. It also checks that the registry's size and
duration are the file's, that the cues are in order and inside the film, and that the
captions' words are the transcript's words, in order.

To change any file: put the new one in `public/media/` under its new hash, point
`src/lib/films.ts` at it, run `npm run media:check`, and upload it with
`npm run media:upload` before the code that names it is deployed (the app reads the
bucket in production). Never edit a file and keep its name. The old object can stay in
the bucket, because a deployed page may still be pointing at it.

### Where it is served from

`src/lib/media.ts` has two states, and `mediaUrl()` is the only thing that chooses:

| `MEDIA_BASE_URL` | The film is served from |
| --- | --- |
| unset | the app itself, from `public/media`, same origin. Vercel serves it as `video/mp4` and answers range requests |
| set | the Supabase Storage bucket `learn-media`, at `<base>/media/<file>` |

Production is on the bucket (set 2026-10-08). The same-origin copy is what local
development and any deployment without the variable use; nothing about the page
changes between the two. `npm run media:verify` passed against the bucket on
2026-10-18.

### Uploading to the bucket

This needs a Supabase secret key, so it is a command a person runs:

```bash
cd /Users/zubayrparak/Learn.save7.org && npm run media:upload
```

The key goes in `.env.secrets` (git-ignored) as `SUPABASE_SECRET_KEY=sb_secret_...` or
the legacy `SUPABASE_SERVICE_ROLE_KEY=eyJ...`, from the dashboard's Settings → API Keys.
It bypasses row level security entirely: never in `.env`, never in the Vercel project,
never in a commit.

The script:

- refuses to start unless `media:check` passes;
- creates the public bucket `learn-media` if it is missing (50 MB per file, MIME types
  `video/mp4`, `image/jpeg` and `text/vtt`), and leaves the other buckets alone;
- uploads each file with `cacheControl: 31536000` and never overwrites. A name that
  exists must hold the same bytes, or it stops;
- then proves, against the public URL, what the app depends on, and exits non-zero if
  any of it fails (the same proofs as `npm run media:verify`).

If a proof about headers fails on files that were already there,
`npm run media:upload -- --refresh` sends the same bytes again. That is safe because a
name is the hash of its bytes: it changes what a cache is told about a file, never what
the file is.

What it proves, and why each one matters. Each of these fails without a sound:

- `content-type: video/mp4` (and `image/jpeg`, `text/vtt`). A `<video>` on a wrong type
  shows a dead player with no error.
- `206` for a range request. Seeking, and a quick start, both depend on it. A host that
  answers `200` forces a full download first.
- `cache-control: max-age=31536000`. The project's default is one hour, which on a
  36 MB file turns nearly every view into an origin pull and wastes the second 5 GB of
  cached egress (#23). The egress quota is per organisation, shared with Save7 OS's own
  traffic, so there is no headroom to give away.
- `access-control-allow-origin`. The captions are fetched cross-origin when the film is
  on the bucket, and a text track the browser may not read never appears. The player
  sets `crossorigin="anonymous"`, so the video needs the header too.

Pointing the app at it: the script prints the line. In the Vercel project, for
Production and Preview:

```
MEDIA_BASE_URL=https://zbaoziisqroqxfwcnhlb.supabase.co/storage/v1/object/public/learn-media
```

Then redeploy. Set it only after the upload's proofs pass: pointing the app at files
that are not there is the one way to get a dead player where the same-origin copy would
have worked. `npm run media:verify` reads nothing secret and can be run by anyone, any
time the film seems not to play. Pass a base URL to check another host.

### The captions

The words are the transcript in
[T04](wayfinder/research/T04-video-review-findings.md), which the user supplied after
watching the film. No wording was written for the captions. What was built is the
timing, on 7 October 2026:

1. The audio's word times came from macOS 26's on-device `SpeechAnalyzer`, run over the
   film as committed. The transcript and the recognised words agree on 99.0% of tokens
   (1,267 of 1,280). The 12 places that differ are recogniser errors or spelling (`2nd`
   for *second*, `corneous` for *corneas*, and so on), and the user's text was kept
   every time.
2. The transcript was aligned to those words, and cut at sentence and clause breaks into
   132 cues of at most two lines of 42 characters, each held about 17 characters a
   second where the next cue allows. The narrator is fast, so 29 cues are shorter than
   that. Captions are 13px below `sm`, because browsers size them at under 10px in a
   phone-width player.
3. As a consistency check, each cue's own audio window was recognised again on its own.
   It produced the cue's words, apart from words clipped at the edge of a window and the
   occasional recogniser slip.

That makes the timing good to a few tenths of a second. It is not the same as a person
listening, so the captions should be spot-checked against playback by someone who can
hear them. Two spots are worth a listen, where the transcript and the recogniser
disagreed on a real word and nothing could settle it: *"…and I mean everything that's
essential…"* at about 2:15, where the recogniser heard *in* for *and*, and *"…the family
has given consent"* at about 4:48, where it heard *is giving*.

To re-time a new cut: run a recogniser over its audio for word times, align the
transcript to them, regenerate the cues, name the new files for their hashes, and run
`npm run media:check`, which proves the words still match.

The captions are what is said. The film also shows on-screen text, diagrams and a quote
that the narrator points at (*"this image right here"*, *"this quote"*, *"this
chart"*), and none of that is described on the page. WCAG 2.x SC 1.2.2 (captions) is
met. SC 1.2.3 (Level A), an audio description or a full text alternative that includes
what the pictures show, is not: #78 decided one was needed, and on 2026-10-16 Save7
decided to keep the film as it is, with its transcript, and build none (#80).

### What any host has to do

Three requirements, and a host that fails the first one fails silently:

- `content-type: video/mp4`. Not negotiable.
- HTTP range requests.
- CDN caching. The audience is South African and mostly on phones.

`raw.githubusercontent.com` is not a valid host. Measured on 23 August 2026: it serves
`.mp4` as `application/octet-stream` with `x-content-type-options: nosniff`, so the
bytes arrive, range requests work, and nothing plays. Once the repository is private it
also returns 404 to anyone not signed in to GitHub.

Routes that were considered and are not the plan: Cloudflare R2 (needs a payment method
on the Cloudflare account, and the course no longer uses Cloudflare), and GitHub Pages
from an orphan `media` branch (GitHub asks that Pages not be used as a general media
CDN, and its soft limits are thin cover for a film that might be linked from social
media). Cloudflare's 25 MiB per-asset cap is why the film used to be kept out of the
deploy; Vercel has no such cap, which is why the film also ships in `public/media`.

Two things were never measured and are worth watching once the course has learners:
the Supabase project's monthly egress against a 36 MB file, and what Vercel's Hobby
plan allows in transfer if the film is ever served from the app.

---

## DNS

`learn.save7.org` reaches the course on Vercel through two edits at xneelo, made on
7 October 2026. The `save7.org` zone did not move; it is still at xneelo. This section
is also the only complete capture of the whole `save7.org` zone, kept so the zone can be
rebuilt if it is ever lost: xneelo refuses zone transfers, so there is no export to fall
back on. Read it before touching anything at xneelo.

### The zone today

| | |
| --- | --- |
| `save7.org` nameservers | `ns1.host-h.net`, `ns2.host-h.net`, `ns1.dns-h.com`, `ns2.dns-h.com`: xneelo, unchanged |
| Registrar | Tucows, through xneelo |
| Who edits records | Gilbert Liebenberg, who owns DNS and infrastructure, by hand at xneelo |
| `learn.save7.org` | CNAME → `f5d209c593f287f5.vercel-dns-017.com.` (TTL 60 seconds), serving the course on Vercel (checked 2026-10-18) |
| Certificate for `learn.save7.org` | Let's Encrypt, issued and renewed by Vercel |
| `save7.org` CAA records | None, as of 22 September 2026 |

### What changed on 7 October 2026

| Record | Before | After |
| --- | --- | --- |
| CNAME `learn` | `transplant-alchemy.pages.dev`, the old holding page, which answered `503` | `f5d209c593f287f5.vercel-dns-017.com.` |
| TXT `_vercel` | did not exist | `vc-domain-verify=learn.save7.org,98022079fd5a62255618` |

The domain is attached in the Vercel project under Settings → Domains. The TXT record
proves ownership of `learn.save7.org` to Vercel, which needs it because the main site's
Vercel team, a different account, already holds `save7.org`. Vercel says it may be
removed after verification; no decision to remove it has been recorded. Every other
record was left alone.

To undo it, put the `learn` CNAME back to `transplant-alchemy.pages.dev`; the TTL is 60
seconds. That is a DNS rollback, not a take-down and not how to undo a bad deploy (that
is Instant Rollback). It sends `learn.save7.org` back to the old holding page address,
which last answered `503` on 22 September 2026; its source (the `maintenance/`
directory) has been deleted from the repository, and nobody has re-checked whether that
Pages project still answers.

### How the zone was captured

The table below was built by querying the authoritative nameserver (`ns1.host-h.net`)
directly and sweeping the names likely to exist. It was first captured on 19 August
2026 and re-verified on 22 September 2026, when every line was confirmed still live
unless the notes say otherwise. The only change since is the two edits of 7 October
2026.

That method has a limit: a record at a name nobody probed will not be in the table. The
capture has grown twice. `os`, `volunteers` and `learn` were not in the August capture
and were found when the zone was re-swept on 22 September 2026, and the two Resend
records (`send` and `resend._domainkey`) were found on 30 September 2026. Treat the
table as the best capture there is, not as proof of completeness.

### The zone, record by record

All names are relative to `save7.org`. If this zone is ever rebuilt anywhere else, check
every line. An import that silently misses one record is how email breaks, and it
breaks quietly: nobody notices a message that was never delivered.

| Type | Name | Value | Note |
| --- | --- | --- | --- |
| A | `save7.org` (@) | `76.76.21.21` (Vercel) | The main site |
| A | `www` | `76.76.21.21` |  |
| A | `mail` | `197.221.2.216` (xneelo) |  |
| CNAME | `staging` | `cname.vercel-dns.com` |  |
| CNAME | `ftp` | `www.save7.org` |  |
| CNAME | `smtp` | `mail.save7.org` |  |
| CNAME | `imap` | `mail.save7.org` |  |
| CNAME | `pop` | `mail.save7.org` |  |
| CNAME | `os` | `save7-os.pages.dev` | Found 22 September 2026. |
| CNAME | `volunteers` | `save7-volunteers.pages.dev` | Found 22 September 2026. |
| CNAME | `learn` | `f5d209c593f287f5.vercel-dns-017.com.` | Changed 7 October 2026. Was `transplant-alchemy.pages.dev`. Found 22 September 2026. |
| MX | `save7.org` (@) | `SMTP.GOOGLE.COM` priority `1` |  |
| TXT | `save7.org` (@) | `v=spf1 a mx include:spf.host-h.net include:_spf.google.com include:amazonses.com ~all` |  |
| TXT | `save7.org` (@) | `google-site-verification=ZSfcA5WdGbPCdqJSFyOQ4vDmQsOJlnpAZx5a0hgKH1Q` |  |
| TXT | `save7.org` (@) | `google-gws-recovery-domain-verification=53260319` |  |
| TXT | `_dmarc` | `v=DMARC1; p=none;` |  |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` priority `10` | Found 30 September 2026. Resend. |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDgz3HEN338LEViNsI3SrIYEmEAAOufo7AdnCTmHvApgQ4rxhgIOEzVBnQTLNzr0aw0Loh6ZUfyCOK1JJKwogncPS2ifr9rPkUfVxG643sy+t1qE/8OWXAsEeFqqFDPcYqbeYBnp334Rw1jbg2Biin1J/2BHDFBLsN0WNzKGYvakwIDAQAB` | Found 30 September 2026. Resend. |
| TXT | `_vercel` | `vc-domain-verify=learn.save7.org,98022079fd5a62255618` | Added 7 October 2026. Vercel domain verification. |

**Email is Google Workspace.** Incoming mail routes to `SMTP.GOOGLE.COM`, so the MX
record and the SPF TXT record matter more than anything else in the zone.
`mail.save7.org` still points at xneelo and is presumably used by mail clients or
outgoing mail, so keep it.

**DKIM for Google Workspace is unconfirmed.** Gilbert says DKIM is switched on in the
Google Admin console, but no `google._domainkey` record exists on the authoritative
nameservers or on a public resolver, and the only DKIM record found is Resend's. No DKIM
record was found at the common selectors (`google._domainkey`, `selector1`,
`selector2`, `default`, `k1`, `k2`, `mail`), re-swept on 22 September 2026 with the same
result. Either he was looking at a custom selector prefix or he meant the Resend one.
Ask him for the selector shown under Google Admin, Apps, Google Workspace, Gmail,
Authenticate email, and add that record to the table. A missing DKIM record hurts
deliverability quietly rather than visibly, so it is worth closing.

**Resend.** The `send` MX and `resend._domainkey` TXT records are the sending records
for Resend, which sends through Amazon SES, and they are why the apex SPF carries
`include:amazonses.com`. Lose them and mail sent through Resend starts failing DKIM
quietly.

**`os` and `volunteers`** are other Save7 sites on `pages.dev` addresses, reached by
external CNAME from xneelo. They are Cloudflare Pages projects on another Cloudflare
account, not on `admin@save7.org`, which listed no Pages projects (checked 22 and 23
September 2026). Which account owns them has not been confirmed. Anything that touches
them should be agreed with whoever owns them first.

**No CAA records.** `save7.org` publishes none, so nothing restricts which certificate
authority may issue for a hostname. If anyone adds a CAA record later, it has to permit
Let's Encrypt for `learn.save7.org`: a restrictive CAA record is a common silent cause
of a certificate that will not issue or renew.

### Verifying

Add `@ns1.host-h.net` to any of these to ask xneelo directly and skip resolver caches.

```
dig +short NS save7.org                  # still the four xneelo nameservers
dig +short CNAME learn.save7.org         # f5d209c593f287f5.vercel-dns-017.com.
dig +short TXT _vercel.save7.org         # "vc-domain-verify=learn.save7.org,98022079fd5a62255618"
curl -sI https://learn.save7.org         # 200 from server: Vercel
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

Send an email to an address on the domain and confirm it arrives after any edit to this
zone, on the day, not a week later. Whether anyone did that after the 7 October edit is
not recorded; that edit did not touch mail records.

---

## Giving someone else control

Three things are held in three places: the code that deploys (GitHub), the Vercel
project's settings (Vercel), and the DNS records (xneelo).

**Through the repository (recommended).** A collaborator with Write access on GitHub
can push a branch, which builds a preview, and merge to `main`, which deploys to
production, without ever holding a Vercel credential. The change is visible,
reversible, and recorded. They cannot see learner data or touch the database. What this
route cannot do is change the domain or the environment variables: those are in the
Vercel project, and the DNS records are at xneelo. On a Hobby team the commit author
must be the team owner for private repositories, which is one more reason the
private-repository question has to be answered with the Vercel plan in mind.

**Through the Vercel team.** Only if they genuinely need to change environment
variables, redeploy, roll back, or manage the domain. That needs access to the Save7
team on Vercel. How to invite someone, which roles Vercel offers, and what the Hobby
plan allows for team members are not recorded here; grant the narrowest access that
fits.

Learner records (names, email addresses, assessment answers) are in the Supabase
project, not in the Vercel project, which holds only public values. So Vercel access
does not by itself reach personal information, and Supabase access does. Under POPIA
that is personal information: keep the Supabase list short and deliberate, and remember
that the Supabase project also holds the organisation's books.

**DNS** stays with whoever holds the xneelo login, which is Gilbert. A change of
hostname waits on that access however the Vercel side is arranged.

---

## Costs

| | |
| --- | --- |
| Vercel | Hobby is free but non-commercial only (*Open items*). Pro is $20 per developer seat per month |
| Supabase | Shared with the OS and the volunteer portal, so the course adds no new bill |
| Supabase Storage | The film is one 34.6 MiB object in the shared project, plus its poster and captions. Check that project's plan allowance rather than trusting a number here |

For an awareness course, expect this to run at no cost on Hobby, if it counts as
non-commercial, which is unconfirmed. If it does not, or if the repository has to be
private, the fallback is Pro, against a project budget of zero. Nothing in the app is
CPU-heavy: sign-in is a Google credential verified by Supabase, and the server's own
work is a handful of HTTPS calls.

---

## What has been verified, and what has not

| | Status |
| --- | --- |
| Gates | `build.yml` runs on every push to `main` and every pull request, from a clean checkout with no `.env` for the build |
| Answer-key isolation | 2026-10-18, against the live project as `anon`: `verify_learn_isolation()` passes and every table probe matches (HANDOVER.md §4) |
| The learner journey on production | Walked on `learn.save7.org` on 2026-10-17 by zzubyr7x, from registration through Google sign-in, the Baseline, three Stages and their Stage Quizzes, the Certificate and its public verification (map #66). The fail-then-retry of a Stage Quiz was not reported, so treat it as untested there |
| The journey and the Admin, automated | `npm run e2e`, against a local replay of every migration, not production, and not in CI |
| Production smoke test | 2026-10-07, unauthenticated: `/`, `/login`, `/register` and `/privacy` all `200`; `/dashboard` and `/admin` `307` to `/login?next=…`; the Supabase URL and the Google client id both appear in `/login`. `/` answered `200` again on 2026-10-18 |
| The film on the bucket | `npm run media:verify` passed for all three files on 2026-10-18 |
| The question register | 205 registered, all approved on a named source, none by a Save7 reviewer (production, 2026-10-18) |
| The course in production | Three Levels and eleven Stages; 3 Certificates issued (production, 2026-10-18) |

Not verified: the Admin pages on production (a signed-in pass on 2026-10-17 did not
reach them), a private repository deploying on Hobby, and the captions by ear. The
findings of the signed-in production passes that are still open are issue #51.

---

## History

The app was a Next app on Cloudflare Workers with its own SQLite/D1 database and its
own email-and-password sign-in. It moved to Cloudflare Pages (whose adapter,
`@cloudflare/next-on-pages`, capped Next at 15.5.2), then back to Workers on OpenNext,
then to Vercel on 2026-10-07.

Why Vercel and not Cloudflare. The plan before was to move the whole `save7.org` zone
to Cloudflare so a Workers custom domain could attach; a Workers custom domain needs an
active Cloudflare zone and a hostname with no existing CNAME. Every route that would
leave the zone at xneelo turned out to be closed: partial (CNAME) setup needs a Business
or Enterprise plan, delegating only `learn.save7.org` is Enterprise-only, and Cloudflare
for SaaS needed a spare domain already on Cloudflare nameservers, which Save7 did not
have (Cloudflare's documentation checked 22 September 2026). Gilbert asked why the whole
zone had to move for one subdomain, then chose Vercel. Going back to Pages was rejected
because its adapter is archived and capped at 15.5.2, which carries GHSA-2xp9-vwfh-vxw4.
Map tickets #51 (route A) and #64 (the nameserver move) are superseded.

The Cloudflare leftovers in the account `admin@save7.org`, the pending `save7.org` zone
and the Worker `learn`, were deleted by Gilbert, as reported on 2026-10-16 (map #65).
`learn.save7.workers.dev` answered `500` on 2026-10-18. No Certificate existed when it
went, so no verification link pointed at it. The old holding-page project
`transplant-alchemy.pages.dev` was not on `admin@save7.org` when checked in September
2026, and which account owns it was never confirmed.
