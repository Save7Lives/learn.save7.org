@AGENTS.md

# Transplant Alchemy 101 — working rules

Save7's organ-donation course, replacing their Google Classroom.

> **Read [HANDOVER.md](HANDOVER.md) first if you have not worked on this before.**
> The app moved from Workers + D1 + password sign-in to the shared Save7 Supabase
> project + Google sign-in, and — after a detour through Cloudflare Pages — back to
> Cloudflare Workers. Most of what enforces correctness is now SQL in another
> repository, and HANDOVER.md is the map: the invariants, the traps that already
> cost a cycle, and what is unfinished.

Read README.md for what the course is and DEPLOY.md for how it ships. This file is
the short list of things that are easy to break without noticing.

The audience is South African, mostly on phones, mostly learning this for the first
time. The metric Save7 cares about is **knowledge improvement** (pre-course score →
post-course score), not engagement.

## First run

```
npm install
npm run dev
```

**The backend is the Save7 Supabase project**, so `.env` needs three values —
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`NEXT_PUBLIC_GOOGLE_CLIENT_ID`. All three are public by design; the anon key grants
nothing on its own and row level security is the boundary.

There is no local database and no seed. The schema and the content are migrations in
the `save7-os` repository, applied with `supabase db push`. The `learn_*` schema starts
at `0091`. `npm run content:emit` writes each content migration at the next free
number (`0121` at the time of writing), with a copy in `prisma/supabase/`.

**Local development therefore writes to real data.** There is no seeded admin
account to hide behind, and a learner row you create locally is a row in the same
project as the organisation's books.

## Content integrity — the non-negotiable part

This is a health and legal subject aimed at the public, so **no medical or legal
claim ships as authoritative unless it is sourced.**

- **Never invent a citation, statistic, or legal provision.** Source each claim to
  a document someone else can open, such as a Source Corpus paper, the Act or a
  named report, and give the page or section where it has one.
- **Questions enter the register on every emit.** `scripts/emit-supabase-content.ts`
  writes a `learn_review_items` row for every Stage Quiz, Baseline and clinical gate
  item. Once you have checked the keyed answer *and* the explanation, name the
  document in the item's `verifiedAgainst` (`prisma/content/quiz.ts`, `types.ts`).
  The emitter then writes the row as `APPROVED`, with that source in its notes. An
  item without one stays `NEEDS_VERIFICATION`. A reading-list entry is registered
  only when it is a stub or carries `verifiedAgainst`.
- **`verifiedAgainst` is a citation.** An attestation such as "Reviewed against
  standard criteria" names no document, but it approves the item just the same.
  That is how two gate items drifted onto figures nobody could produce
  (HANDOVER.md §6).
- **Rewording a prompt makes a new register row**, because the claim text is part
  of the upsert key. Re-check the source when you reword. The old row stays behind.
- **Lesson prose has no review mechanism.** No Markdown lesson enters the register,
  nothing marks a claim in one as unverified, and nothing records a sign-off. Name
  each source in the lesson itself or in its Stage's `further-reading.md`, and leave
  out any claim you cannot source.
- **Nothing learner-facing reads the register.** An item left `NEEDS_VERIFICATION`
  still reaches learners, with no badge. (`PendingReview` in
  `src/components/ui/primitives.tsx` has no callers.) The register is Save7's
  record of what is sourced. It does not filter what learners see.
- **Never clear a review item in code.** Save7 records its decisions in
  `/admin/content-review`, which stores who decided and when. An emitter approval
  stores neither. So write `verifiedAgainst` only after the check it records, and
  never set a status from a migration, SQL or an emitter change. The emit promotes
  only `NEEDS_VERIFICATION` rows, so it never reverts a decision. Un-approving is a
  staff action.
- The law and the clinical criteria (determination of death, donor suitability) are
  the highest-risk content. Legal provisions must be checked against the _current
  consolidated_ National Health Act, not an old study guide.
- Avoid simplistic exclusion rules ("you can't donate if you have X"). Suitability
  is individually assessed, and the content says so deliberately.

## Content is data, not code

Lesson prose is Markdown in `content/<level>/<stage>/*.md`, and Stage Quiz banks
are `prisma/content/quiz-*.ts`. `src/components/lesson/Markdown.tsx` renders the
prose, and `content/README.md` lists the Markdown it accepts, tables included.
There are no per-lesson components or payloads any more (#60). Never hardcode
course copy into a component — it puts content outside the review register.

Changing content: edit `content/` or `prisma/content/`, then `npm run content:emit`, then
`cd ../save7-os && supabase db push`. The generated migration **upserts on the
authoring key**, which is the important part: a question row deleted and reinserted
would take every answer ever recorded against it, and the improvement figures with
them. There is no reseed endpoint any more — content arrives as reviewable SQL.

## Assessment integrity

- **The answer key is unreadable, not merely unselected.** `learn_choices.is_correct`
  has **no policy for any role**, so RLS denies it outright; the app reads
  `learn_options_pub`, which does not carry the column. Grading happens in
  `learn_submit_attempt()`, `learn_grade_check()` and
  `learn_submit_baseline_sitting()`, security-definer functions holding the only
  read path. **This app cannot grade even if it tried** — do not
  add a code path that attempts it.
- `select verify_learn_isolation();` asserts all of that: RLS on, no policy on
  `learn_choices`, no view naming `is_correct`, no direct read for `anon`. Run it
  after any migration touching `learn_*`.
- The Baseline (`PRE`) is up to **four Sittings**, not one attempt.
  `learn_submit_baseline_sitting()` marks the same twenty questions and freezes the
  result as a row in `learn_baseline_sittings`: a score per Level and a total, never
  the answers. A CHECK (`sitting_no between 1 and 4`) and a UNIQUE
  `(learner_id, sitting_no)` are the whole cap, and there is no insert or update
  policy, so a client can neither write, edit nor half-sit a Sitting. Sitting 1 is
  owed at signup and Stage content waits for it; later Sittings are offered after a
  Level is completed and never required (`dueSitting()` in `src/lib/baseline.ts`).
- **Improvement is Sitting 1 against a later Sitting of the same paper.** It is
  derived at read time (`levelImprovement()` in `src/lib/baseline.ts`, read by
  `src/lib/analytics.ts`) and never stored. Stage Quiz retakes are unlimited, because
  passing every Stage Quiz in a Level is what earns its Certificate, so they must
  never feed the impact numbers.
  `analytics.ts` and the admin learners page still read POST `attempt_no = 1` for a
  few Stage Quiz figures; the map's admin-indicator audit owns them, and they are
  not Improvement.
- **Do not edit a Baseline question's prompt or options once anyone has sat it.**
  The same twenty questions come back at every Sitting, so a changed one makes
  later Sittings a different paper without saying so (save7-os `0116` refuses to
  replace the bank once a Sitting exists).
- **There is no `pairKey`.** Wayfinder #26/#41 replaced pairing each post-assessment
  item with its baseline counterpart by sitting-over-sitting comparison. The emitter
  writes `learn_questions.pair_key` as `NULL`, and no code uses it. The column
  (`0091`) and the legacy `pairKey` field on `QuestionSeed` remain but do no work.

## Platform gotchas

- **No ORM.** The app talks to Supabase over HTTPS carrying the learner's own JWT,
  so every read is subject to the same row level security a browser faces.
  `authz.ts` is the second layer, not the only one. **Never introduce a
  service-role client here** — it would make every query trivially allowed and turn
  an app-level mistake into a data leak.
- **Anything a client must not assert lives in SQL.** Derived progress
  (`learn_complete_module`), marking (`learn_submit_attempt`), certificate issuance
  (`learn_issue_certificate`), enrolment (`learn_claim_me`). `learn_level_progress`
  and `learn_course_progress` have no write policy for anybody, deliberately: a
  client that can write its own percentage makes the dashboard fiction.
- **Next is no longer pinned.** `@opennextjs/cloudflare` peers at
  `>=15.5.24 <16 || >=16.3.3`, which is a floor rather than a ceiling, so security
  patches can be taken as they land. The floor is not arbitrary: it is where the
  September 2026 AVIF image-optimization RCE (GHSA-2xp9-vwfh-vxw4, CVSS 9.5) was
  fixed. **Do not drop below it.**
- **Every rendering route needs `export const dynamic = "force-dynamic"`**, and the
  reason is not the adapter. On the Node runtime Next will happily prerender these
  routes at build time and bake in whatever configuration the build machine had —
  which is exactly the `NEXT_PUBLIC_*` trap below, arriving by a different door.
  The edge runtime used to prevent this as a side effect; now it is stated.
- **`typecheck` runs `next typegen` first, and that is not padding.** `PageProps<>`
  and `LayoutProps<>` are *generated* from the route tree into `.next/types`, so on
  a fresh clone — or any CI checkout — `tsc --noEmit` alone fails with "Cannot find
  name 'PageProps'" on ten call sites. It passes locally only when a previous build
  happened to leave `.next` behind, which is how this reached CI unnoticed. Do not
  reduce the script back to bare `tsc`.
- **A lesson slug is unique only within its module.** `intro`, `check` and
  `complete` each occur once per module, thirteen times over. Anything identifying a
  lesson needs the module too — that is why `viewLessonAction` takes both.
- **No `src/proxy.ts` / middleware.** Every protected page does its own session
  check and passes its own `returnTo`. Don't reintroduce middleware.
- **`/media/*` is excluded from the deploy** (`public/.assetsignore`): the
  35 MB video exceeds the 25 MiB per-file asset limit, which is the same on Workers
  as it was on Pages — re-checked, not assumed. Workers **honours** that file, which
  Pages did not, so the post-build strip script Pages needed is gone.
  `src/lib/media.ts` handles three states, including "deployed with no bucket
  configured", where it drops the path so the player shows its placeholder instead
  of a dead `<video>`.
- **`SITE_URL`, not `NEXT_PUBLIC_SITE_URL`.** Next inlines public variables at build
  time; Cloudflare applies vars at deploy time. Certificate links are built from it.
  One `vars` block in `wrangler.jsonc` now, not two — Pages needed a separate
  `env.preview`, and an edit reaching only one of them was a real trap.
- **There is no admin account to create.** Admin is `app_is_staff()` — a `people`
  row with an `app_role` on the Supabase project. A revoked staff member loses the
  dashboards immediately rather than when a token expires.
- **Analytics store no IP and no user agent.** `learn_events` is deliberately thin;
  the privacy notice promises this. Only staff may read it.

## Changing the schema

The single source of truth is `save7-os/supabase/migrations/`, applied with
`supabase db push`. Three rules, all learned the hard way here:

- **Apply the migration before deploying code that reads the new columns.**
  Deploying first means every query selecting them fails until the migration lands.
- **Put a probe at the end.** There is no local Postgres, so a migration is verified
  by what it asserts about itself. 0094 asserts six content counts and the
  one-correct-answer invariant, which is how "97 lessons upserted into 26 rows" was
  caught and rolled back rather than shipped.
- **End anything touching `learn_*` with `select verify_learn_isolation();`** and
  anything touching a `vol_*` view with `select verify_vol_views();`. The second is
  that repository's standing rule, and the course owns a view in that family
  (`vol_my_course_learning`).

## Before you say it works

```
npm run typecheck && npm run lint && npm run cf:build
```

**The end-to-end journey suite is gone.** It drove a learner through the whole
course against the local SQLite file and asserted 53 behaviours, including every
assessment-integrity guarantee, and it was removed with the database it depended on.
Nothing equivalent runs against Supabase yet — so the rules above are enforced by
the migrations and checked by nothing that runs on every change.

**Treat that as the standing risk when touching `src/lib/` or any `learn_*`
function.** Walk the journey manually: register, baseline, a module, the level
assessment, the certificate, the admin dashboards. `npm run preview` runs the real
Worker on workerd, which is the only thing that catches runtime-specific breakage.

## Design

Brand kit is authoritative: **Anton** for display only (all-caps, never body copy),
**Inter** for everything else. Pink `#ED0E69` sparingly; **teal `#16B9B4` is not
legible on white** — dark surfaces only. Tap targets ≥44px, keyboard-traversable
interactives, no horizontal scroll at 375px.
