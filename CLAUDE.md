@AGENTS.md

# Transplant Alchemy 101 — working rules

Save7's organ-donation course, replacing their Google Classroom.

> **Read [HANDOVER.md](HANDOVER.md) first if you have not worked on this before.**
> The app moved from Workers + D1 + password sign-in to Cloudflare Pages + the shared
> Save7 Supabase project + Google sign-in. Most of what enforces correctness is now
> SQL in another repository, and HANDOVER.md is the map: the invariants, the traps
> that already cost a cycle, and what is unfinished.

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
the `save7-os` repository (`0091`–`0098`), applied with `supabase db push`.

**Local development therefore writes to real data.** There is no seeded admin
account to hide behind, and a learner row you create locally is a row in the same
project as the organisation's books.

## Content integrity — the non-negotiable part

This is a health and legal subject aimed at the public, so **no medical or legal
claim ships as authoritative unless it is sourced.**

- **Never invent a citation, statistic, or legal provision.** If a claim cannot be
  verified, mark it `pendingReview: true` with a `reviewSourceHint` naming where it
  should be checked. It then renders with a visible "Pending Save7 review" badge and
  appears in `/admin/content-review`.
- **Do not clear a review item in code.** Those are Save7's sign-offs to make, in
  the admin UI. `deriveReviewItems()` in `prisma/content/review.ts` generates the
  register from the content, and the generated migration upserts, so re-applying
  content never resets a recorded decision.
- Module 9 (the law) and Module 10 (clinical criteria) are the highest-risk content.
  Legal provisions must be checked against the _current consolidated_ National
  Health Act, not an old study guide.
- Avoid simplistic exclusion rules ("you can't donate if you have X"). Suitability
  is individually assessed, and the content says so deliberately.

## Content is data, not code

Lesson text lives in `prisma/content/level-*.ts`. Components read the lesson's
payload. Never hardcode course copy into a component — it puts content outside the
review register.

Changing content: edit `prisma/content/`, then `npm run content:emit`, then
`cd ../save7-os && supabase db push`. The generated migration **upserts on the
authoring key**, which is the important part: a question row deleted and reinserted
would take every answer ever recorded against it, and the improvement figures with
them. There is no reseed endpoint any more — content arrives as reviewable SQL.

## Assessment integrity

- **The answer key is unreadable, not merely unselected.** `learn_choices.is_correct`
  has **no policy for any role**, so RLS denies it outright; the app reads
  `learn_options_pub`, which does not carry the column. Grading happens in
  `learn_submit_attempt()` and `learn_grade_check()`, security-definer functions
  holding the only read path. **This app cannot grade even if it tried** — do not
  add a code path that attempts it.
- `select verify_learn_isolation();` asserts all of that: RLS on, no policy on
  `learn_choices`, no view naming `is_correct`, no direct read for `anon`. Run it
  after any migration touching `learn_*`.
- The baseline (`PRE`) is taken **once**; it cannot be retaken, or the improvement
  measure is worthless.
- `attemptNo === 1` is the recorded measure for analytics. Retakes are allowed for
  certificates but must never feed the impact numbers.
- `pairKey` links each post-assessment item to its baseline counterpart. Keep pairs
  intact when editing questions, or the matched-pair comparison silently degrades.

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
- **Next is pinned to exactly 15.5.2.** `@cloudflare/next-on-pages` peers at
  `<=15.5.2`; 15.5.23 exists and the adapter refuses it. `PageProps<"/route">` is a
  Next 16 global, shimmed in `src/types/next-15-page-props.d.ts` — delete that file
  when the app returns to 16.
- **Every rendering route needs `export const runtime = "edge"`.** The adapter
  refuses a route that renders on the Node runtime.
- **A lesson slug is unique only within its module.** `intro`, `check` and
  `complete` each occur once per module, thirteen times over. Anything identifying a
  lesson needs the module too — that is why `viewLessonAction` takes both.
- **No `src/proxy.ts` / middleware.** Every protected page does its own session
  check and passes its own `returnTo`. Don't reintroduce middleware.
- **`/media/*` is excluded from the deploy** (`public/.assetsignore`): the
  35 MB video exceeds the 25 MiB per-file asset limit. `src/lib/media.ts` handles
  three states, including "deployed with no bucket configured", where it drops the
  path so the player shows its placeholder instead of a dead `<video>`.
- **`SITE_URL`, not `NEXT_PUBLIC_SITE_URL`.** Next inlines public variables at build
  time; Cloudflare applies vars at deploy time. Certificate links are built from it.
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
npm run typecheck && npm run lint && npm run pages:build
```

**The end-to-end journey suite is gone.** It drove a learner through the whole
course against the local SQLite file and asserted 53 behaviours, including every
assessment-integrity guarantee, and it was removed with the database it depended on.
Nothing equivalent runs against Supabase yet — so the rules above are enforced by
the migrations and checked by nothing that runs on every change.

**Treat that as the standing risk when touching `src/lib/` or any `learn_*`
function.** Walk the journey manually: register, baseline, a module, the level
assessment, the certificate, the admin dashboards. `npm run pages:dev` runs the real
Pages worker, which is the only thing that catches runtime-specific breakage.

## Design

Brand kit is authoritative: **Anton** for display only (all-caps, never body copy),
**Inter** for everything else. Pink `#ED0E69` sparingly; **teal `#16B9B4` is not
legible on white** — dark surfaces only. Tap targets ≥44px, keyboard-traversable
interactives, no horizontal scroll at 375px.
