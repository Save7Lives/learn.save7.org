@AGENTS.md

# Transplant Alchemy 101 — working rules

Save7's organ-donation course, replacing their Google Classroom. Read README.md for
what it is and DEPLOY.md for how it ships. This file is the short list of things
that are easy to break without noticing.

The audience is South African, mostly on phones, mostly learning this for the first
time. The metric Save7 cares about is **knowledge improvement** (pre-course score →
post-course score), not engagement.

## First run

```
npm install
cp .env.example .env
npm run db:seed
npm run dev
```

That is the whole setup — the database is a local SQLite file, no services needed.
`npm run db:seed:demo` adds 18 synthetic learners if you want the admin dashboards
to show something.

## Content integrity — the non-negotiable part

This is a health and legal subject aimed at the public, so **no medical or legal
claim ships as authoritative unless it is sourced.**

- **Never invent a citation, statistic, or legal provision.** If a claim cannot be
  verified, mark it `pendingReview: true` with a `reviewSourceHint` naming where it
  should be checked. It then renders with a visible "Pending Save7 review" badge and
  appears in `/admin/content-review`.
- **Do not clear a review item in code.** Those are Save7's sign-offs to make, in
  the admin UI. `deriveReviewItems()` generates the register from the content, and
  the reseed path deliberately never resets a recorded decision.
- Module 9 (the law) and Module 10 (clinical criteria) are the highest-risk content.
  Legal provisions must be checked against the _current consolidated_ National
  Health Act, not an old study guide.
- Avoid simplistic exclusion rules ("you can't donate if you have X"). Suitability
  is individually assessed, and the content says so deliberately.

## Content is data, not code

Lesson text lives in `prisma/content/level-*.ts` and is seeded into the database.
Components read `Lesson.payloadJson`. Never hardcode course copy into a component —
it breaks the seeding path and puts content outside the review register.

Changing content: edit `prisma/content/`, `npm run db:seed`, check locally. In
production it goes through `/api/admin/reseed`, which upserts on authoring keys and
never touches learner data. **Never re-run `prisma/d1-bootstrap/*.sql` against
production once anyone is enrolled** — it clears content tables, and clearing
questions cascades to learner answers.

## Assessment integrity

- **The answer key must never reach the browser.** `src/lib/quiz.ts` selects
  client-bound questions through `CLIENT_QUESTION_QUERY`, which omits `isCorrect`
  and `explanation`. Grading happens server-side only. `npm run verify` and
  `scripts/verify-no-answer-leak.ts` both check this — run them after touching quiz
  code.
- The baseline (`PRE`) is taken **once**; it cannot be retaken, or the improvement
  measure is worthless.
- `attemptNo === 1` is the recorded measure for analytics. Retakes are allowed for
  certificates but must never feed the impact numbers.
- `pairKey` links each post-assessment item to its baseline counterpart. Keep pairs
  intact when editing questions, or the matched-pair comparison silently degrades.

## Platform gotchas

- **Drizzle, not Prisma.** Prisma 7 compiles queries with WebAssembly and Workers
  refuses to instantiate it (`Wasm code generation disallowed by embedder`). The old
  files are in `docs/*.superseded` for reference only — do not revive them.
- **D1 has no interactive transactions.** Multi-statement writes are ordered so the
  last write is the commit marker (see grading in `src/lib/quiz.ts`).
- **No `src/proxy.ts` / middleware.** Next 16's proxy is Node-runtime-only and
  OpenNext cannot build it. Every protected page does its own session check and
  passes its own `returnTo`. Don't reintroduce middleware.
- **Timestamps** go through a Drizzle `customType` that writes ISO-8601 with an
  explicit `+00:00`. SQLite's `DEFAULT CURRENT_TIMESTAMP` must never fire — it
  renders without `T` or milliseconds and will not round-trip.
- **`/media/*` is excluded from the Workers deploy** (`public/.assetsignore`): the
  35 MB video exceeds the 25 MiB per-file asset limit. `src/lib/media.ts` handles
  three states, including "on Workers with no bucket configured", where it drops the
  path so the player shows its placeholder instead of a dead `<video>`.
- **`SITE_URL`, not `NEXT_PUBLIC_SITE_URL`.** Next inlines public variables at build
  time; Cloudflare applies vars at deploy time. Certificate links are built from it.
- **No default admin in production.** `createDevAdmin` is opt-in for local seeding
  only — a published password in a public repo is an open door. Promote a real
  account with SQL instead.
- **Analytics store no IP and no user agent.** `EventLog` is deliberately thin; the
  privacy notice promises this.

## Changing the schema

The single source of truth is `prisma/d1-migrations/`, applied to local SQLite by
`npm run db:push` and to D1 by `wrangler d1 migrations apply`. Two rules, both
learned the hard way:

- **End every migration file with a semicolon.** Wrangler appends its own
  `INSERT INTO d1_migrations` to the file's contents, so an unterminated last
  statement runs into it and D1 rejects the whole file with
  `near "INSERT": syntax error`.
- **Apply the migration to production _before_ deploying code that reads the new
  columns.** Deploying first means every query selecting them fails until the
  migration lands.

`ALTER TABLE ADD COLUMN` is not idempotent the way `CREATE TABLE IF NOT EXISTS` is,
which `scripts/apply-schema.ts` accounts for by treating `duplicate column name` as
"already applied".

## Before you say it works

```
npm run verify
```

Drives a real learner through the whole journey against the database and asserts 53
behaviours, including every assessment-integrity guarantee. `npm run cf:preview`
runs the actual Worker against a local D1 — slower than `npm run dev`, and the only
thing that catches Workers-specific breakage.

## Design

Brand kit is authoritative: **Anton** for display only (all-caps, never body copy),
**Inter** for everything else. Pink `#ED0E69` sparingly; **teal `#16B9B4` is not
legible on white** — dark surfaces only. Tap targets ≥44px, keyboard-traversable
interactives, no horizontal scroll at 375px.
