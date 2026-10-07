# Handover — the Supabase rebuild, and the move to Vercel

**Read this before changing anything.** It records what this app became, the
invariants that are load-bearing, the traps that already cost a debugging cycle,
and what is unfinished. Written for a session that has none of the context.

State at the time of writing:

| | |
| --- | --- |
| This repo | `Save7Lives/learn.save7.org` (renamed from `transplant-alchemy`; the old `zzubyr7x/...` URLs redirect), `main` |
| Backend repo | `gilbertlieb/save7-os`, `main` |
| Supabase project | `zbaoziisqroqxfwcnhlb` — shared with the OS and the volunteer portal |
| Migrations applied | `0091` onward in `save7-os/supabase/migrations/`. `0091`–`0098` are the schema, and later ones changed it and the content (§2). The sequence is shared with the OS: production's head was `0124` on 2026-10-07 |
| Host | Vercel, Hobby team `Save7`, project `learn-save7-org`; `https://learn.save7.org` since 2026-10-07 |
| Branch `supabase-auth` | Identical to `main` — merged, kept only as a marker |

---

## 1. What changed, and where it runs

This was a Next 16 app on Cloudflare Workers with its own SQLite/D1 database and
its own email-and-password sign-in. It is now a Next **16.3.6** app on **Vercel**,
reading the **shared Save7 Supabase project**, with **Google sign-in** via the same
flow `volunteers.save7.org` uses. The volunteer portal's forty
hard-coded gate questions were merged into the course's question bank, so there is
one bank rather than two. D1, drizzle, `better-sqlite3`, bcrypt and the local seed
are gone entirely.

**Where it runs.** Vercel, on a Hobby team named `Save7`, project `learn-save7-org`.
It answers at `https://learn.save7.org`, and has since 2026-10-07; the project's
default address is `https://learn-save7-org.vercel.app`. Vercel's Git integration
builds every push: `main` publishes to `learn.save7.org` and every other branch gets
a preview URL. There is no deploy command, and GitHub Actions (`build.yml`) runs only
the gates. Vercel's Instant Rollback makes the previous production deployment
available at the custom domain again. The DNS zone stays at xneelo, where Gilbert
Liebenberg edits it himself. Two records changed there on 2026-10-07: the `learn`
CNAME now points at Vercel, and a `_vercel` TXT record proves ownership, which Vercel
needs because the main site's Vercel team (another account) already holds
`save7.org`. To undo the DNS change, put the `learn` CNAME back; its TTL is 60
seconds. DNS-MIGRATION.md holds the only complete capture of the zone, because xneelo
refuses zone transfers.

**Why Vercel.** The app has been on Cloudflare Workers, then Cloudflare Pages, whose
adapter capped Next at 15.5.2 (a version that carries GHSA-2xp9-vwfh-vxw4), then
Workers again. A Workers custom domain needs the whole `save7.org` zone on
Cloudflare; delegating a single subdomain is Enterprise-only there, and Cloudflare
for SaaS needed a spare domain. Gilbert asked why the whole zone had to move, then
chose Vercel. Going back to Pages was rejected because its adapter is archived and
still capped at 15.5.2. Nothing was moved to Cloudflare.

Four decisions drove the rebuild, and all four were the user's, made explicitly:

1. **Pages, not Workers** — even after being shown that the Pages adapter caps
   Next at 15.5.2 and that 15.5.2 carried an unpatched critical advisory. Later
   reversed, and the host has since moved again, as above.
2. **The shared Supabase project, not a second one** — so a volunteer has one
   identity across all three sites and the portal can show course progress.
3. **The public may take the course** — which required widening who may hold an
   account on the database holding the organisation's books (§6).
4. **The volunteer gate keeps its own marking** — `submit-quiz` stays the only
   writer to `volunteer_quiz_attempts`.

---

## 2. Where the rules actually live

**This is the most important section.** The app cannot enforce the things that
matter any more, by design. Anything a client must not be able to assert is a
`security definer` function in Postgres:

| Function | Migration | Why it is not in this repo |
| --- | --- | --- |
| `learn_submit_attempt` | 0097 | Grading needs the answer key, which has no read path |
| `learn_grade_check` | 0097 | Same, for the inline checks |
| `learn_start_attempt` | 0097 | Resume must not mint a new attempt; refuses the Baseline since 0110, and the Level-wide quiz since 0113 |
| `learn_start_stage_quiz` | 0113 | The draw of five questions from a Stage's fifteen, so a refresh cannot re-roll for easier ones |
| `learn_submit_baseline_sitting` | 0110 | Marks a Baseline Sitting from the bank, never the payload; written once, capped at four |
| `learn_complete_module` | 0096, 0113 | Records that a Stage was read and nothing more: since 0113 passing the Stage Quiz is what completes a Stage. Level and course percentages are derived (`learn_refresh_progress`), not claimed |
| `learn_view_lesson` | 0096 | Same row, so the completed-lesson set stays a set |
| `learn_issue_certificate` | 0098, 0113 | The gate, every Stage Quiz in the Level passed, must be checked where it cannot be skipped |
| `learn_verify_certificate` | 0098 | A verifier has no account, so RLS cannot serve them |
| `learn_set_name` | 0098 | Renaming touches live certificates, which have no update policy |
| `learn_claim_me` | 0095 | `learners` has no insert policy, on purpose; since 0119 Google's name seeds a new row only, never an existing one |
| `learn_record_popia_consent` | 0111 | Consent is written once and never moved; the column has no client grant |
| `learn_record_date_of_birth` | 0117 | An under-18 date deletes the row and is never stored; an adult date never moves |

In the schema a Stage is still called a `module` (`learn_modules`, `learn_complete_module`,
`module_slug`): no stored key was renamed when the course became 3 Levels and 11 Stages
(#26), so the domain says Stage and the database says `module`.

If a feature seems to need one of these behaviours in TypeScript, that is the
signal to write SQL, not to add a policy.

**Every progress writer refuses a learner whose row lacks an adult date of birth
or a consent** (`app_learner_of_age()`, `app_learner_consented()`; 0111, 0117).
`learn_claim_me()` enrols staff, volunteers and stakeholders without asking
either, so `requireUser()` sends such a learner to `/enrol` first. An under-18
answer there ends the session on `/enrol/refused` rather than asking again,
because `learn_claim_me()` would re-enrol them on the next load.

### The answer key

`learn_choices.is_correct` has **no policy for any role**. RLS is enabled and the
policy set is empty, which denies everyone who is not the table owner. The app
reads `learn_options_pub`, a view that does not carry the column.

This is not "stripped on the way out" — it is unreadable. Do not add a policy, do
not select the column, and do not add a service-role client to make a query work.
`select verify_learn_isolation();` asserts all of it and should end any migration
touching `learn_*`.

### Why the app holds only the anon key

`src/lib/supabase/server.ts` builds a client with the anon key and **the learner's
own JWT**, so every read the app makes is subject to the same row level security a
browser faces. `authz.ts` is the second layer, not the only one. A service-role
client would make every query trivially allowed and turn any app-level mistake
into a data leak. **Never introduce one here.**

---

## 3. Invariants that will silently corrupt data if broken

- **Improvement is the Baseline's, and nothing else feeds it** (#54). It is Sitting
  1 against a later Sitting of the same twenty questions. Stage Quiz retakes are
  unlimited for certificates and must never feed the impact numbers, or the
  platform's central claim becomes unfalsifiable. Some admin Stage Quiz columns
  still read POST `attempt_no = 1` as a Level score; see `analytics.ts`.
- **A Sitting is written once, and the bank is frozen once anyone has sat it.**
  `learn_baseline_sittings` has no insert or update policy, and a CHECK plus a
  UNIQUE cap it at four. Editing a Baseline question's prompt or options after a
  first Sitting exists makes every later Sitting a different paper, silently.
  save7-os 0116 refuses to replace the bank once a Sitting exists; any later
  change to `questions-baseline.ts` needs the same care.
- **Content upserts on the authoring key.** A question row deleted and reinserted
  takes every answer ever recorded against it, and the improvement figures with
  them. The generated migration never deletes.
- **Gate option keys are historical data.** The forty gate questions carry the
  portal's own `'a'`–`'d'` keys because `volunteer_quiz_attempts.answers` has
  recorded submissions against them since 0088. Renaming one orphans every attempt
  ever taken.
- **Certificate snapshots are snapshots.** `issued_name` and `award_title` are
  copied at issue. A rename updates live certificates (deliberately — a corrected
  spelling should reach them) but never revoked ones.
- **Unanswered is incorrect**, not dropped from the denominator, and a multi-select
  is an exact set match. Both are in SQL now.
- **`verify_vol_views()` requires `vol_my_course_learning` to exist.** 0092 widened
  that verifier's allowlist from three views to four. If the course is ever removed,
  that function must be edited or every future OS migration touching a `vol_*` view
  fails.

---

## 4. Traps that already cost a cycle

Each of these was a real failure, not a hypothetical.

**Lesson slugs are unique only within a Stage.** `intro`, `check`, `complete`,
`study-guide` and `further-reading` each occur once per Stage — eleven times over.
0091 made `slug` the primary key, so the first load, the previous build's 97 lessons,
upserted into 26 rows and 0094's probe raised `expected 97 lessons, found 26`. The key
is now `(module_slug, slug)`. Anything identifying a lesson needs the Stage too, which
is why `viewLessonAction` takes both — resolving the Stage from the lesson is no
longer possible.

**`NEXT_PUBLIC_*` is inlined at build time, and a build does not always have the
values.** The app first ran on Cloudflare, where config arrived at deploy time, so a
client component reading `process.env.NEXT_PUBLIC_SUPABASE_URL` got `undefined` and
sign-in died in the browser with nothing server-side to see. Vercel makes the
project's environment variables available at build time, so a direct read would now
happen to work there, but the CI build (`build.yml`) carries no Supabase values by
design, and a direct read would bake `undefined` into any build made without them.
The config is read on the server in `src/lib/supabase/config.ts` and passed to the
two client components as props, which works unchanged on any host. **Do not
"simplify" that back to a direct read.**

**A preview deployment is a new hostname, and registration checks it.** Every branch
other than `main` gets its own preview URL on Vercel. `register-learner`, the Edge
Function behind `/register`, answers cross-origin requests only from the hostnames in
its allow-list in `save7-os`, and a refused request looks, from inside the page, like
"Could not reach Save7" — what a blocked preflight looks like, indistinguishable from
a dead network. That was missed once, for a Cloudflare Pages preview hostname, and
registration failed exactly that way. The allow-list names `https://learn.save7.org`,
the old `learn.save7.workers.dev` hostnames and localhost. It has no `vercel.app`
entry, so registering from a preview URL, or from `learn-save7-org.vercel.app`, is
expected to fail until it does. When one is added, restrict it to this project's own
hostnames and never use a bare `*.vercel.app`, which would admit every site hosted on
Vercel (the Workers entry was deliberately not `*.workers.dev` for the same reason).
Sign-in has the same property: the Supabase redirect URLs and the Google client's
authorised origins each list the hostnames that may use them (§6).

**A verifier caught the course before the course caught itself.** 0092 was refused
on first push by `verify_vol_views()` because the new `vol_*` view did not require
`vetted`. That was correct and the fix was to widen the allowlist with a stated
reason, following 0090's precedent — not to weaken the rule.

---

## 5. How to check things without guessing

There is no local database and no journey suite, so these are the checks that
exist. All of them are safe to run.

```bash
npm run typecheck && npm run lint && npm run build
```

Nothing runs the host locally any more: `npm run preview`, which ran the Worker on
workerd, is gone. A preview deployment from a branch push is the closest thing to a
check of the real host.

The anon key is in `.env` (copied from the committed `.env.example`) and in the
Vercel project, and it is public by design, so every probe below is safe to run from
anywhere. They confirm the isolation holds against the live project.

**`verify_learn_isolation()` does not need database credentials.** It is reachable
over PostgREST as the anon role, which matters because `SUPABASE_DB_URL` is empty
in most checkouts and this was previously treated as a blocker:

```bash
curl -s -X POST "$URL/rest/v1/rpc/verify_learn_isolation" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" -d '{}'
```

Passing looks like: `"learn_* RLS on, learn_choices has no policy, no view names
is_correct, anon has no direct read"`. Anything else is a failure, not a variation.

Then the table probes — the first returns the course row, the rest must not return
data:

```bash
curl -s "$URL/rest/v1/learn_course?select=slug" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
```

Expected: `learn_course` → the course row; `learn_levels`, `learn_modules`,
`learn_lessons`, `learners`, `learn_certificates`, `learn_events` and `people` →
`[]` (RLS denies the rows); `learn_options_pub` → `permission denied for view`;
`learn_questions` and `learn_choices` → 401 `42501`; `learn_submit_attempt` → 404
`PGRST202`.

Two things that look like findings and are not:

- **Probe with `select=*`, not `select=id`.** PostgREST resolves column names
  before it checks privileges, so `?select=id` on a denied table answers
  `column ... does not exist` (400) and hides the actual denial.
- **`learn_submit_attempt` answers 404 `PGRST202`, not 401.** The probe calls it
  with no arguments and no such overload exists, so PostgREST rejects it on
  signature before reaching permissions. The denial is real either way; the status
  code is an artefact of the probe's shape.

Last confirmed green: **2026-09-23**, all of the above matching. The probes go
straight to Supabase, so the move to Vercel does not change them, but they have not
been re-run since.

For anything touching a `vol_*` view, `select verify_vol_views();` in the database
as well — that one has no RPC route.

---

## 6. Unfinished, and the risks the user has accepted knowingly

**The 53-assertion journey suite is gone.** This is the largest hole. It drove the
previous build's journey, baseline → modules → level assessment → certificate →
analytics, against the local SQLite file and checked every assessment-integrity
guarantee. It was removed with the
database it depended on. The rules it protected are now in migrations 0097 and 0098
and enforced there, but the probes are structural, not behavioural — nothing
exercises the rules end to end. Rewriting it needs a service-role key and a
disposable learner. **Treat any change to `src/lib/` or a `learn_*` function as
unverified until walked by hand.**

**The Next version problem is resolved, and the old account of it was wrong.**
This section used to say the flight-protocol RCE and the Server Actions exposure
were "fixed only in 16.3.0". Checked against the advisory records during the port:
the flight-protocol RCE (GHSA-9qr9-h5gf-34mp, CVSS 10.0) was fixed in **15.5.7**,
and the Server Actions exposure (GHSA-w37m-7fhw-fmv9) is **Moderate**, fixed in
15.5.8 — both were patch bumps, not a major upgrade. The advisory that actually
justified leaving Pages landed later: **GHSA-2xp9-vwfh-vxw4**, an AVIF
image-optimization RCE at CVSS 9.5, published 2026-09-08, affecting everything up to
15.5.23 and 16.0.0–16.3.2. It is fixed in 15.5.24 and 16.3.3; **never go below
16.3.3.** The app is now on **16.3.6**, which carries no open critical or high
advisory, and nothing caps Next on Vercel, so the next patch can simply be taken.

**Re-confirmed on 2026-09-23**, rather than carried over from this
file: 16.3.6 is what npm serves as `latest`, so there is nothing newer to take.
Both criticals affecting the 16 line — GHSA-2xp9-vwfh-vxw4 (CVSS 9.5) and
GHSA-p293-qw3h-jr36 (CVSS 9.0, Windows-hosted servers) — are fixed in 16.3.3, and
the only High touching 16.x, GHSA-6gpp-xcg3-4w24 (Middleware/Proxy bypass), in
16.2.11; this app has no middleware in any case. `npm audit --omit=dev` reports
zero. Re-run that check rather than trusting this paragraph — it is a snapshot.

**0095 widened who may hold an account** on the project holding the organisation's
books, from staff, funders and volunteers to anyone who registers for a public
course. It keeps 0075's rule — every account is still a revocable row written
through a throttled endpoint — but the blast radius of a future RLS mistake on an
OS table is now larger. That reasoning is in the migration header; read it before
touching `auth_enforce_save7_domain()`.

**The gate is in the bank but nothing asks it.** The forty questions are rows with
`scope = 'GATE'`. The deployed volunteer portal no longer asks them: it gates on
finished Levels, and nothing calls `volunteer_mark_gate()` (save7-os `0103`), the
function that marks them. Nothing in this app shows them either. **If anything ever
does, it must shuffle options per render.** The correct answer is option `'a'` in
all forty, and this app renders choices by stored order. The old portal quiz
survived that by shuffling.

**The twenty clinical gate questions are cited, and Save7 has signed them off.** The
claim that they assert figures "no supplied source backs" was audited and did not
hold (learn.save7.org-map#34): nine already carried real citations, five more were
stated verbatim by papers already in `public/resources/`, and there is no HPCSA
question at all. Save7 signed off all twenty in #38, and #42 attached a named primary
source to each in `prisma/content/questions-gate.ts`. The live register rows were
already `APPROVED` before that, because `0101` promoted them on the August
non-citations described below. The emit replaces their `source_hint` and `notes`
with the named sources, but it **never demotes a recorded status**. So changing an
item's source can't un-approve it. Demoting an item is a staff action in the
register, not an emit.

That does not retire the rule in §7. What cleared these was a recorded human sign-off,
not an agent's reading. Eight had previously been cleared by a `verifiedAgainst` string
naming no document at all ("Reviewed 23 August 2026 against standard published listing
criteria"), and behind that cover two of them (`c12`, `c13`) drifted onto figures from
a document nobody held. **A citation that does not name a document you can open is not
a citation**, and it clears the register just as effectively as a real one.

**The corrected content is applied as save7-os `0118_learn_gate_content.sql`**
(learn.save7.org-map#45). It is the generator's `--only=gate` output, and it touches
the forty GATE rows and the twenty clinical register rows and nothing else. It
supersedes `prisma/supabase/0102_learn_content.sql`, which was emitted in August and
never copied into save7-os. Save7-os's 0102 slot went to Gilbert's own migration, so
that file could never apply, and it is deleted.

**`0120_learn_gate_content.sql` follows it** (learn.save7.org-map#46), in the same
gate-only shape, with three corrections Save7 decided. `c7`'s distractor `d` was
"Previous laser eye surgery", which the Red File lists as a cornea exclusion, so it is
now a condition that does not exclude. `b11` no longer calls witnessed phone consent a
legal requirement: it is practice, as `b2` already said. `b20` gains the Weill 2015
citation it lacked, and its answer no longer joins two separate listing criteria with
"and". The `basics` citations now name the Red File page they were checked against.
`c9` is unchanged: its source prints LVEF `<`20%, not the `≤` that #38 asked for.

**Outstanding operational steps, and open questions about the new host.** None of
them is something a session can do alone. Status as of 2026-10-07; the first three
are still to do.

- **`SITE_URL` and `NEXT_PUBLIC_SITE_URL` still hold a placeholder**,
  `https://learn-save7-org.vercel.app`, in the Vercel project (Settings →
  Environment Variables, set for Production and Preview). Certificate verification
  links are built from `SITE_URL`, so they carry that address until both variables are
  changed to `https://learn.save7.org` and the project is redeployed. A changed
  environment variable takes effect only after a redeploy (Deployments → the
  deployment's menu → Redeploy).
- **Supabase redirect URL.** Add `https://learn.save7.org/**` under Authentication →
  URL Configuration → Redirect URLs. Leave Site URL alone: the project is shared with
  the OS and the volunteer portal, and whether changing it is safe has not been
  verified.
- **Google origin.** `https://learn.save7.org` must be among the Authorised JavaScript
  origins on the volunteer portal's Google OAuth client. Gilbert reported it already
  set up on 30 September 2026, which cannot be checked from outside Google. If you
  add it, append only: `volunteers.save7.org` uses the same client. This one and the
  redirect URL both fail silently, and in the browser a missing entry reads as "Could not reach Save7"
  (see DEPLOY.md). `register-learner` already allows `learn.save7.org` in code;
  redeploying it matters only for preview URLs.
- **Hobby is for non-commercial use only.** Vercel's fair-use guidelines count a site
  as commercial if anyone is paid for its production, including a paid employee or
  consultant writing code; donations are fine. Nobody has confirmed that the course
  meets that condition. Pro is the fallback, at $20 per developer seat per month, and
  the map's budget is zero.
- **The repository is public on purpose, until launch.** Hobby cannot deploy a
  private repository owned by a GitHub organization, and this one is owned by
  `Save7Lives`. It contains the quiz answer keys (`isCorrect` in
  `prisma/content/*.ts` and in the generated SQL), so it must be made private before
  launch. Doing that needs either Vercel Pro or moving the repository to a personal
  GitHub account (the `Save7-NPO` account is an owner of the organization).
- **Pushes by `zzubyr7x` deploy while the repository is public.** Checked on 7 October
  2026: commit `fc18150` reached production. On a Hobby team the commit author must be
  the team owner for a private repository, so that case is untested and matters once
  the repository goes private.
- **There is no maintenance or take-down procedure.** The old `maintenance/` holding
  page was a Cloudflare Pages worker, and it was deleted with the rest of the
  Cloudflare tooling. Nothing replaces it yet.
- **The Google Workspace DKIM selector was never confirmed.** The zone has no
  `google._domainkey` record. It is an open note, not a blocker.
- **Leftovers in the Cloudflare account `admin@save7.org`**: the pending `save7.org`
  zone (nothing was ever switched over to it) and the Worker `learn`, which still
  answers at `learn.save7.workers.dev`. Delete both once Vercel is proven.
- **Moving the film to Supabase Storage is a hand-over step, not a build step.** The
  film, its poster and its captions ship with the app and play from the same origin
  until `npm run media:upload` has put them in the public bucket `learn-media` (map
  #23) and `MEDIA_BASE_URL` is set in the Vercel project. The upload needs a secret key
  and so is the user's to run. See MEDIA-HOSTING.md.

---

## 7. Things not to do

- Do not add a service-role key to this app, to the Vercel project, or a policy on
  `learn_choices`.
- Do not reintroduce an ORM, D1, `better-sqlite3`, or a local database.
- Do not drop Next below 16.3.3 to make something build. That is where a CVSS 9.5 RCE
  (GHSA-2xp9-vwfh-vxw4) is fixed.
- Do not change an environment variable in the Vercel project and assume the site has
  it. It takes effect only after a redeploy.
- Do not make the repository private without settling the host first. Hobby cannot
  deploy a private repository owned by a GitHub organization (§6).
- Do not write a migration without a probe. There is no local Postgres; a migration
  that raises rolls itself back, which is the only safety net.
- Do not deploy code that reads new columns before the migration is applied.
- Do not clear a content-review item in code.
- Do not add a second writer to `volunteer_quiz_attempts`. `learn_mark()` was
  deleted in 0097 partly for this reason; `learn_submit_attempt` refuses `GATE`.
- Do not assume this repository is the only session editing it. Part of the Pages
  conversion in `main` was authored by a different session working concurrently in
  the same tree; check `git status` before assuming the working tree is yours.
- Do not remove `export const dynamic = "force-dynamic"` from a route because "it
  reads cookies anyway, so it is dynamic already". The configuration read happens
  *before* the first cookie read, so Next tries to prerender and the build dies on
  a missing Supabase URL — which is how this was found.

---

## 8. Where to read next

| File | What it holds |
| --- | --- |
| `CLAUDE.md` | The short list of things easy to break, with the platform gotchas |
| `README.md` | What the course is, the architecture, the function table |
| `DEPLOY.md` | The setup runbook, including the allowlists that fail silently |
| `DNS-MIGRATION.md` | The `save7.org` zone's records as captured at xneelo, the only complete capture; keep it as a recovery record |
| `save7-os/CLAUDE.md` | The OS's conventions — RLS helpers, the advisor baseline, migration traps |
| `save7-os/supabase/migrations/0091`–`0098` | The schema, with the reasoning in the headers |

The migration headers are the primary source for *why* the database is shaped as it
is. They were written to be read in order, and they argue with each other where a
later one corrects an earlier one — 0093 and 0096 both correct 0091, and say so.
