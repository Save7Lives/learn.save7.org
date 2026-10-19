# Handover: where the rules live, and what breaks silently

Read this before changing anything. It records the invariants that are load-bearing,
the traps that already cost a debugging cycle, the checks that exist, and the risks
accepted knowingly. Written for a session that has none of the context. README.md says
what the app is; OPERATIONS.md says how it is hosted and deployed.

| | |
| --- | --- |
| This repo | `Save7Lives/learn.save7.org` (renamed from `transplant-alchemy`; the old `zzubyr7x/...` URLs redirect), `main` |
| Backend repo | `gilbertlieb/save7-os`, `main` |
| Supabase project | `zbaoziisqroqxfwcnhlb`, shared with the OS and the volunteer portal |
| Migrations | `0091` onward in `save7-os/supabase/migrations/`. `0091` to `0098` are the schema, and later ones changed it and the content. The sequence is shared with the OS: production's head was `0139` on 2026-10-18 |
| Host | Vercel, Hobby team `Save7`, project `learn-save7-org`; `https://learn.save7.org` since 2026-10-07 |

The app reads the shared Save7 Supabase project with Google sign-in, via the same flow
`volunteers.save7.org` uses. The volunteer portal's forty hard-coded gate questions were
merged into the course's question bank, so there is one bank rather than two. Two
decisions behind that were the user's, made explicitly: the shared Supabase project, not
a second one, so a volunteer has one identity across all three sites; and the public
may take the course, which widened who may hold an account on the database holding the
organisation's books (§5).

---

## 1. Where the rules actually live

This is the most important section. The app cannot enforce the things that matter, by
design. Anything a client must not be able to assert is a `security definer` function
in Postgres:

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

The Admin has its own functions, from 0134 on: the Learn Admin role and its Owner
(`learn_admin_role`, `learn_grant_admin`, `learn_revoke_admin`, 0134), sign-offs
recorded against the Admin's sign-in (`learn_actor_names`, 0135), the Eligibility
Rule's evaluator (`learn_evaluate_eligibility`, 0136, with a default rule in 0137), the
Progress Record read (`learn_progress_record`, 0138, see
`docs/adr/0001-sql-owns-the-progress-record-read.md`) and deleting a Student
(`learn_delete_student`, 0139).

In the schema a Stage is still called a `module` (`learn_modules`,
`learn_complete_module`, `module_slug`): no stored key was renamed when the course
became 3 Levels and 11 Stages (#26), so the domain says Stage and the database says
`module`.

If a feature seems to need one of these behaviours in TypeScript, that is the signal to
write SQL, not to add a policy.

Every progress writer refuses a learner whose row lacks an adult date of birth or a
consent (`app_learner_of_age()`, `app_learner_consented()`; 0111, 0117).
`learn_claim_me()` enrols staff, volunteers and stakeholders without asking either, so
`requireUser()` sends such a learner to `/enrol` first. An under-18 answer there ends
the session on `/enrol/refused` rather than asking again, because `learn_claim_me()`
would re-enrol them on the next load.

### The answer key

`learn_choices.is_correct` has no policy for any role. RLS is enabled and the policy set
is empty, which denies everyone who is not the table owner. The app reads
`learn_options_pub`, a view that does not carry the column.

This is not "stripped on the way out": it is unreadable. Do not add a policy, do not
select the column, and do not add a service-role client to make a query work.
`select verify_learn_isolation();` asserts all of it and should end any migration
touching `learn_*`.

### What a signed-out visitor can read

The landing page and the course introduction are public, so they read the Levels and
Stages as `anon`. Since save7-os 0131, `anon` may select every row of `learn_levels` and
`learn_modules`, and only the columns `levelShape` and `moduleShape` in
`src/lib/course.ts` list. Before it, 0091 allowed any signed-in user and nobody else,
and both pages rendered an empty section for a visitor. Nothing else opens to `anon`:
not the lessons, the Stage prose in `learn_modules.intro_markdown`, the questions, the
answer key, any attempt or any learner's progress. `verify_learn_isolation()` asserts
that list as well. A new column on either table is private until a migration grants it,
and selecting it before then fails for a signed-out visitor with "permission denied".

### Why the app holds only the anon key

`src/lib/supabase/server.ts` builds a client with the anon key and the learner's own
JWT, so every read the app makes is subject to the same row level security a browser
faces. `authz.ts` is the second layer, not the only one. A service-role client would
make every query trivially allowed and turn any app-level mistake into a data leak.
Never introduce one here.

---

## 2. Invariants that will silently corrupt data if broken

- **Improvement is the Baseline's, and nothing else feeds it** (#54). It is Sitting 1
  against a later Sitting of the same twenty questions. Stage Quiz retakes are unlimited
  for certificates and must never feed the impact numbers, or the platform's central
  claim becomes unfalsifiable. The Admin reads Improvement from Baseline Sittings only
  (`src/lib/admin/model.ts`). That is app code, not a database rule.
- **A Sitting is written once, and the bank is frozen once anyone has sat it.**
  `learn_baseline_sittings` has no insert or update policy, and a CHECK plus a UNIQUE
  cap it at four. Editing a Baseline question's prompt or options after a first Sitting
  exists makes every later Sitting a different paper, silently. save7-os 0116 refuses
  to replace the bank once a Sitting exists; any later change to
  `questions-baseline.ts` needs the same care. The first production Sitting was taken
  on 2026-10-16, so the bank is frozen now.
- **Content upserts on the authoring key.** A question row deleted and reinserted takes
  every answer ever recorded against it, and the improvement figures with them. The
  generated migration never deletes.
- **Gate option keys are historical data.** The forty gate questions carry the portal's
  own `'a'` to `'d'` keys because `volunteer_quiz_attempts.answers` has recorded
  submissions against them since 0088. Renaming one orphans every attempt ever taken.
- **Certificate snapshots are snapshots.** `issued_name` and `award_title` are copied at
  issue. A rename updates live certificates (deliberately: a corrected spelling should
  reach them) but never revoked ones.
- **Unanswered is incorrect**, not dropped from the denominator, and a multi-select is
  an exact set match. Both are in SQL.
- **`verify_vol_views()` requires `vol_my_course_learning` to exist.** 0092 widened that
  verifier's allowlist from three views to four. If the course is ever removed, that
  function must be edited or every future OS migration touching a `vol_*` view fails.

---

## 3. Traps that already cost a cycle

Each of these was a real failure, not a hypothetical.

**Lesson slugs are unique only within a Stage.** `intro`, `check`, `complete`,
`study-guide` and `further-reading` each occur once per Stage, eleven times over. 0091
made `slug` the primary key, so the first load, the previous build's 97 lessons,
upserted into 26 rows and 0094's probe raised `expected 97 lessons, found 26`. The key
is now `(module_slug, slug)`. Anything identifying a lesson needs the Stage too, which is
why `viewLessonAction` takes both; resolving the Stage from the lesson is no longer
possible.

**`NEXT_PUBLIC_*` is inlined at build time, and a build does not always have the
values.** The app first ran on Cloudflare, where config arrived at deploy time, so a
client component reading `process.env.NEXT_PUBLIC_SUPABASE_URL` got `undefined` and
sign-in died in the browser with nothing server-side to see. Vercel makes the project's
environment variables available at build time, so a direct read would happen to work
there, but the CI build (`build.yml`) carries no Supabase values by design, and a direct
read would bake `undefined` into any build made without them. The config is read on the
server in `src/lib/supabase/config.ts` and passed to the two client components as
props, which works unchanged on any host. Do not "simplify" that back to a direct read.
`SITE_URL` and `MEDIA_BASE_URL` are read on the server for the same reason.

**Every rendering route needs `export const dynamic = "force-dynamic"`.** Do not remove
it because "it reads cookies anyway, so it is dynamic already". The configuration read
happens before the first cookie read, so Next tries to prerender and the build dies on
a missing Supabase URL, which is how this was found (prerendering `/login`). `npm run
build` catches it and `next dev` does not.

**A preview deployment is a new hostname, and registration checks it.**
`register-learner`, the Edge Function behind `/register`, answers cross-origin requests
only from the hostnames in its allow-list in `save7-os`, and a refused request looks,
from inside the page, like "Could not reach Save7": what a blocked preflight looks like,
indistinguishable from a dead network. That was missed once, for a Cloudflare Pages
preview hostname, and registration failed exactly that way. The allow-list has no
`vercel.app` entry, so registering from a preview URL, or from
`learn-save7-org.vercel.app`, is expected to fail. When one is added, restrict it to
this project's own hostnames and never use a bare `*.vercel.app`, which would admit
every site hosted on Vercel. Sign-in has the same property: the Supabase redirect URLs
and the Google client's authorised origins each list the hostnames that may use them
(OPERATIONS.md, *Sign-in and registration allow-lists*).

**A verifier caught the course before the course caught itself.** 0092 was refused on
first push by `verify_vol_views()` because the new `vol_*` view did not require
`vetted`. That was correct, and the fix was to widen the allowlist with a stated reason,
following 0090's precedent, not to weaken the rule.

---

## 4. How to check things without guessing

The gate before claiming something works:

```bash
npm run typecheck && npm run lint && npm run build
```

Then `npm test` for the unit tests and `npm run e2e` for the browser suite, which
replays every save7-os migration into a private local Postgres and walks the learner
and Admin journeys against the real functions and policies (README.md, *End-to-end
tests*). Anything only the real host shows (Google sign-in, Vercel) is a by-hand pass:
a preview deployment from a branch push is the closest thing to a check of the real
host, with the sign-in limits in §3.

The anon key is in `.env` (copied from the committed `.env.example`) and in the Vercel
project, and it is public by design, so every probe below is safe to run from anywhere.
They confirm the isolation holds against the live project. Set `URL` and `KEY` from
`.env` first.

`verify_learn_isolation()` does not need database credentials. It is reachable over
PostgREST as the anon role, which matters because `SUPABASE_DB_URL` is empty in most
checkouts:

```bash
curl -s -X POST "$URL/rest/v1/rpc/verify_learn_isolation" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" -d '{}'
```

Passing looks like: `"learn_* RLS on, learn_choices has no policy, no view names
is_correct, anon has no direct read of the bank, and reads only the Level and Stage
catalogue"`. Anything else is a failure, not a variation.

Then the table probes:

```bash
curl -s "$URL/rest/v1/learn_course?select=*" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
```

Expected, with `select=*`: `learn_course` → the course row; `learn_lessons`,
`learners`, `learn_certificates`, `learn_events` and `people` → `[]` (RLS denies the
rows); `learn_levels` and `learn_modules` → 401 `42501`, because `anon` holds only the
catalogue columns (with `select=slug,title` they return the Levels and Stages);
`learn_options_pub` → `permission denied for view`; `learn_questions` and
`learn_choices` → 401 `42501`; `rpc/learn_submit_attempt` called with `{}` → 404
`PGRST202`.

Two things that look like findings and are not:

- **Probe denied tables with `select=*`, not `select=id`.** PostgREST resolves column
  names before it checks privileges, so `?select=id` on a denied table answers
  `column ... does not exist` (400) and hides the actual denial.
- **`learn_submit_attempt` answers 404 `PGRST202`, not 401.** The probe calls it with no
  arguments and no such overload exists, so PostgREST rejects it on signature before
  reaching permissions. The denial is real either way; the status code is an artefact
  of the probe's shape.

Last run green: 2026-10-18, all of the above matching.

For anything touching a `vol_*` view, `select verify_vol_views();` in the database as
well; that one has no RPC route.

---

## 5. Risks accepted knowingly

**0095 widened who may hold an account** on the project holding the organisation's
books, from staff, funders and volunteers to anyone who registers for a public course.
It keeps 0075's rule (every account is still a revocable row written through a
throttled endpoint), but the blast radius of a future RLS mistake on an OS table is now
larger. That reasoning is in the migration header; read it before touching
`auth_enforce_save7_domain()`.

**The gate is in the bank but nothing asks it.** The forty questions are rows with
`scope = 'GATE'`. The deployed volunteer portal no longer asks them: it gates on
finished Levels, and nothing calls `volunteer_mark_gate()` (save7-os `0103`), the
function that marks them. Nothing in this app shows them either. If anything ever does,
it must shuffle options per render. The correct answer is option `'a'` in all forty, and
this app renders choices by stored order. The old portal quiz survived that by
shuffling.

**The twenty clinical gate questions are cited, and Save7 has signed them off.** The
claim that they assert figures "no supplied source backs" was audited and did not hold
(learn.save7.org-map#34). Save7 signed off all twenty in #38, and #42 attached a named
primary source to each in `prisma/content/questions-gate.ts`, applied as save7-os
`0118_learn_gate_content.sql` and `0120_learn_gate_content.sql` (map #45, #46). The emit
replaces their `source_hint` and `notes` with the named sources, but it never demotes a
recorded status, so changing an item's source cannot un-approve it. Demoting an item is
a staff action in the register, not an emit. `c9` stays as it is: its source prints LVEF
`<`20%, not the `≤` that #38 asked for.

What cleared those items was a recorded human sign-off, not an agent's reading. Eight
had previously been cleared by a `verifiedAgainst` string naming no document at all
("Reviewed 23 August 2026 against standard published listing criteria"), and behind that
cover two of them (`c12`, `c13`) drifted onto figures from a document nobody held. A
citation that does not name a document you can open is not a citation, and it clears the
register just as effectively as a real one.

---

## 6. Things not to do

- Do not add a service-role key to this app or to the Vercel project, or a policy on
  `learn_choices`.
- Do not reintroduce an ORM, D1, `better-sqlite3`, or a local database for the app.
- Do not drop Next below 16.3.3 to make something build. That is where a CVSS 9.5 RCE
  (GHSA-2xp9-vwfh-vxw4) is fixed.
- Do not change an environment variable in the Vercel project and assume the site has
  it. It takes effect only after a redeploy.
- Do not make the repository private without settling the host first. Hobby cannot
  deploy a private repository owned by a GitHub organization (OPERATIONS.md, *Open
  items*).
- Do not write a migration without a probe. A migration that raises rolls itself back,
  which is the safety net on production; the end-to-end replay only shows it applies
  to a copy.
- Do not deploy code that reads new columns before the migration is applied.
- Do not clear a content-review item in code.
- Do not add a second writer to `volunteer_quiz_attempts`. `learn_mark()` was deleted in
  0097 partly for this reason; `learn_submit_attempt` refuses `GATE`.
- Do not assume this repository is the only session editing it. Other sessions work in
  nearby checkouts; check `git status` before assuming the working tree is yours, and
  stage files by name.

---

## 7. Where to read next

| File | What it holds |
| --- | --- |
| `CLAUDE.md` | The short list of things easy to break, with the platform gotchas |
| `README.md` | What the course is, running it, the architecture, the tests |
| `OPERATIONS.md` | Hosting, environment variables, the allow-lists that fail silently, migrations, the film, DNS |
| `save7-os/CLAUDE.md` | The OS's conventions: RLS helpers, the advisor baseline, migration traps, `npm run db:push` |
| `save7-os/supabase/migrations/0091` to `0098` | The schema, with the reasoning in the headers |

The migration headers are the primary source for *why* the database is shaped as it is.
They were written to be read in order, and they argue with each other where a later one
corrects an earlier one: 0093 and 0096 both correct 0091, and say so.
