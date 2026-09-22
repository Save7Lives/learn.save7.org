# Handover — the Supabase rebuild, and the port back to Workers

**Read this before changing anything.** It records what this app became, the
invariants that are load-bearing, the traps that already cost a debugging cycle,
and what is unfinished. Written for a session that has none of the context.

State at the time of writing:

| | |
| --- | --- |
| This repo | `zzubyr7x/learn.save7.org` (renamed from `transplant-alchemy`), `main` at `245a8b3` |
| Backend repo | `gilbertlieb/save7-os`, `main` at `f387ff3` |
| Supabase project | `zbaoziisqroqxfwcnhlb` — shared with the OS and the volunteer portal |
| Migrations applied | `0091`–`0098` in `save7-os/supabase/migrations/` |
| Worker | `learn`, on the `admin@save7.org` Cloudflare account |
| Branch `supabase-auth` | Identical to `main` — merged, kept only as a marker |

---

## 1. What changed, in one paragraph

This was a Next 16 app on Cloudflare Workers with its own SQLite/D1 database and
its own email-and-password sign-in. It became a Next 15.5.2 app on Cloudflare Pages,
and is now a Next **16.3.6** app back on Cloudflare **Workers** via
`@opennextjs/cloudflare` — reading the **shared Save7 Supabase project**, with
**Google sign-in** via the same flow `volunteers.save7.org` uses. The volunteer portal's forty
hard-coded gate questions were merged into the course's question bank, so there is
one bank rather than two. D1, drizzle, `better-sqlite3`, bcrypt and the local seed
are gone entirely.

Four decisions drove all of it, and all four were the user's, made explicitly:

1. **Pages, not Workers** — even after being shown that the Pages adapter caps
   Next at 15.5.2 and that 15.5.2 carried an unpatched critical advisory.
   **This one has since been reversed** (§6): the app is back on Workers, the
   version cap is gone, and Next is patched.
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
| `learn_start_attempt` | 0097 | The baseline may be taken once; resume must not mint a new attempt |
| `learn_complete_module` | 0096 | Level and course percentages are derived, not claimed |
| `learn_view_lesson` | 0096 | Same row, so the completed-lesson set stays a set |
| `learn_issue_certificate` | 0098 | Two gates must be checked where they cannot be skipped |
| `learn_verify_certificate` | 0098 | A verifier has no account, so RLS cannot serve them |
| `learn_set_name` | 0098 | Renaming touches live certificates, which have no update policy |
| `learn_claim_me` | 0095 | `learners` has no insert policy, on purpose |

If a feature seems to need one of these behaviours in TypeScript, that is the
signal to write SQL, not to add a policy.

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

- **Only `attempt_no = 1` counts toward reported improvement.** Retakes are allowed
  for certificates and must never feed the impact numbers, or the platform's
  central claim becomes unfalsifiable.
- **The baseline is written once.** `learn_submit_attempt` coalesces the baseline
  columns rather than overwriting them. A learner who could re-sit the first paper
  after the course could manufacture their own improvement.
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

**Lesson slugs are unique only within a module.** `intro`, `check`, `complete`,
`study-guide` and `further-reading` each occur once per module — thirteen times
over. 0091 made `slug` the primary key, so 97 lessons upserted into 26 rows and
0094's probe raised `expected 97 lessons, found 26`. The key is now
`(module_slug, slug)`. Anything identifying a lesson needs the module too, which is
why `viewLessonAction` takes both — resolving the module from the lesson is no
longer possible.

**`NEXT_PUBLIC_*` is inlined at build time; Cloudflare vars apply at runtime.** A
client component reading `process.env.NEXT_PUBLIC_SUPABASE_URL` on Cloudflare gets
`undefined` and sign-in dies in the browser with nothing server-side to see. The
config is read on the server in `src/lib/supabase/config.ts` and passed to the two
client components as props. **Do not "simplify" that back to a direct read.**

**The 25 MiB per-file asset cap is the same on Workers as on Pages** — checked
against Cloudflare's limits page during the port rather than assumed to have
improved. `journey-of-a-gift.mp4` is 34.6 MiB and still cannot ship in the bundle.
What *did* change is the mechanism: Pages ignored `public/.assetsignore` and needed
a post-build strip script; **Workers honours it**, verified by serving the built
output and watching `/media/journey-of-a-gift.mp4` 404 while `/favicon.ico` served.
The strip script is gone.

**A version upload publishes a per-version hostname.** `wrangler versions upload`
prints `<version-prefix>-learn.save7.workers.dev`, and that is the URL a person
opens. The Pages equivalent of this was missed once and registration failed with
"Could not reach Save7" — what a blocked preflight looks like from inside the page,
indistinguishable from a dead network. `register-learner`'s CORS allowlist now
matches `([a-z0-9]+-)?learn\.save7\.workers\.dev` and deliberately **not**
`*.workers.dev`. Note the shape: a Workers preview hyphenates onto the same label,
where the Pages one added a subdomain.

**`wrangler.jsonc` used to have two `vars` blocks, and an edit once reached only
one.** Filling the Supabase values hit `env.preview` alone, because the production
block has comment lines between its entries and an exact-string match missed;
previews worked and production would have thrown on `/login`. The Workers config
has a single `vars` block — Workers previews are versions of the same Worker and
inherit it — so the trap is retired rather than merely documented. Do not
reintroduce a second block without a reason.

**A verifier caught the course before the course caught itself.** 0092 was refused
on first push by `verify_vol_views()` because the new `vol_*` view did not require
`vetted`. That was correct and the fix was to widen the allowlist with a stated
reason, following 0090's precedent — not to weaken the rule.

---

## 5. How to check things without guessing

There is no local database and no journey suite, so these are the checks that
exist. All of them are safe to run.

```bash
npm run typecheck && npm run lint && npm run cf:build
```

```bash
npm run preview          # the real Worker on workerd, config from wrangler.jsonc
```

The anon key is in `.env` and in `wrangler.jsonc`. These probes confirm the
isolation holds against the live project — the first should return the course row,
and the rest should return nothing:

```bash
curl -s "$URL/rest/v1/learn_course?select=slug" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
```

Expected: `learn_levels` → `[]` (RLS denies rows), `learn_options_pub` →
`permission denied for view`, `learn_questions` → 401, `learners` → `[]`,
`learn_submit_attempt` → 401.

In the database: `select verify_learn_isolation();` and, for anything touching a
`vol_*` view, `select verify_vol_views();`.

---

## 6. Unfinished, and the risks the user has accepted knowingly

**The 53-assertion journey suite is gone.** This is the largest hole. It drove
baseline → modules → assessment → certificate → analytics against the local SQLite
file and checked every assessment-integrity guarantee. It was removed with the
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
justified moving landed later: **GHSA-2xp9-vwfh-vxw4**, an AVIF image-optimization
RCE at CVSS 9.5, published 2026-09-08, affecting everything up to 15.5.23 and
16.0.0–16.3.2. The app is now on **16.3.6**, which carries no open critical or high
advisory, and `@opennextjs/cloudflare` sets a version **floor** rather than a
ceiling, so the next patch can simply be taken.

**0095 widened who may hold an account** on the project holding the organisation's
books, from staff, funders and volunteers to anyone who registers for a public
course. It keeps 0075's rule — every account is still a revocable row written
through a throttled endpoint — but the blast radius of a future RLS mistake on an
OS table is now larger. That reasoning is in the migration header; read it before
touching `auth_enforce_save7_domain()`.

**The gate is in the bank but not rendered here.** The forty questions are rows
with `scope = 'GATE'`, and the volunteer portal still asks them from its own
generated file. Nothing in this app shows them yet. **If it ever does, it must
shuffle options per render** — the correct answer is option `'a'` in all forty, and
this app renders choices by stored order. The portal survives it by shuffling.

**The twenty clinical gate questions are cited, and Save7 has signed them off.** The
claim that they assert figures "no supplied source backs" was audited and did not
hold (learn.save7.org-map#34): nine already carried real citations, five more were
stated verbatim by papers already in `public/resources/`, and there is no HPCSA
question at all. Save7 signed off all twenty in #38, and #42 attached a named primary
source to each in `prisma/content/questions-gate.ts`, so the register rows clear on
the next content emit — which derives `APPROVED` from `verifiedAgainst`.

That does not retire the rule in §7. What cleared these was a recorded human sign-off,
not an agent's reading. Eight had previously been cleared by a `verifiedAgainst` string
naming no document at all ("Reviewed 23 August 2026 against standard published listing
criteria"), and behind that cover two of them (`c12`, `c13`) drifted onto figures from
a document nobody held. **A citation that does not name a document you can open is not
a citation**, and it clears the register just as effectively as a real one.

**The corrected content is authored but not applied.** `prisma/supabase/0102_learn_content.sql`
was emitted in August and never copied into save7-os, whose 0102 slot Gilbert then took
for his own migration. Everything in it — plus #42's citations — is still unapplied, so
the live `learn_questions` GATE rows remain the pre-August text. Re-emit against the
current sequence rather than reusing that file's number.

**Outstanding operational steps**, none of which a session can do alone: the
Supabase Auth redirect allowlist and the Google client's JavaScript origins (both
fail silently — see DEPLOY.md step 6b), hosting the 35 MB video on **Supabase
Storage** (public bucket `learn-media` — the map chose this over R2), connecting
Cloudflare Workers Builds to this repository, and the DNS move that
`learn.save7.org` needs (DNS-MIGRATION.md).

---

## 7. Things not to do

- Do not add a service-role key to this app, or a policy on `learn_choices`.
- Do not reintroduce an ORM, D1, `better-sqlite3`, or a local database.
- Do not drop Next below `@opennextjs/cloudflare`'s floor (`>=15.5.24 <16 ||
  >=16.3.3`) to make something build. That floor is where a CVSS 9.5 RCE is fixed.
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
| `DEPLOY.md` | The setup runbook, including step 6b's silent-failure allowlists |
| `DNS-MIGRATION.md` | The zone as it stands, captured before any move |
| `save7-os/CLAUDE.md` | The OS's conventions — RLS helpers, the advisor baseline, migration traps |
| `save7-os/supabase/migrations/0091`–`0098` | The schema, with the reasoning in the headers |

The migration headers are the primary source for *why* the database is shaped as it
is. They were written to be read in order, and they argue with each other where a
later one corrects an earlier one — 0093 and 0096 both correct 0091, and say so.
