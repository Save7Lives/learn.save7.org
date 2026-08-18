# Database

Drizzle ORM over SQLite: a local file in development, Cloudflare D1 in production.
The same schema and the same queries serve both — D1 *is* SQLite, so there is no
dialect gap between what is tested locally and what runs in production.

The schema lives in `src/db/schema.ts`. The SQL that creates it lives in
`d1-migrations/0001_init.sql` and is applied to both targets, so local and
production are built from one file rather than from two generators that could
drift.

> This directory is called `prisma/` for historical reasons — the project was built
> on Prisma and moved to Drizzle when Cloudflare became the deployment target
> (Prisma 7 needs a WebAssembly query compiler, which Workers will not
> instantiate). What remains here is the course content and the seeder. The old
> schema is archived at `../docs/schema.prisma.superseded`.

## Running locally

Nothing to install and no credentials needed. `DATABASE_URL` defaults to a local
SQLite file.

```bash
npm run db:reset   # delete the local database, recreate the schema, seed
npm run db:push    # apply the schema only
npm run db:seed    # re-seed content without dropping anything
npm run verify     # drive a learner through the whole journey and assert behaviour
```

The seed is **idempotent**. Every content row is keyed on a stable authoring
identifier (`authoringKey`, or a `slug` within its parent), so re-running it
updates content in place rather than duplicating it, and never touches learner
progress, attempts or certificates.

One deliberate exception to "update everything": the seed does **not** overwrite
`ContentReviewItem.status`, `reviewedById` or `reviewedAt`. A content edit must
never silently un-approve something Save7 has already signed off.

## Production: Cloudflare D1

`src/lib/db.ts` picks its driver at runtime: the D1 binding when running on
Workers, a local SQLite file otherwise. Nothing else in the codebase knows the
difference. See `../DEPLOY.md` for the setup.

Two production notes worth knowing:

**No interactive transactions.** D1 has none, so `submitAttempt` in
`src/lib/quiz.ts` writes its three statements in a deliberate order — clear the old
answers, insert the new ones, and only then set `submittedAt`. That last write is
the commit marker: if anything earlier fails, the attempt stays unsubmitted and
re-submitting starts cleanly. No partially-graded attempt can be recorded as
submitted.

**Certificate sequence numbers.** These are allocated by counting existing rows for
the level and year, which is adequate at this scale but is not concurrency-safe. The
unique index on `Certificate.publicId` means a genuine collision fails loudly rather
than issuing a duplicate. If Save7 ever issues certificates in bulk, replace the
count with a dedicated counter row updated in the same statement.

### If Save7 ever leaves Cloudflare

The schema is written to be portable, but SQLite cannot express two things that a
Postgres deployment should restore:

**Enums.** SQLite has no enum type, so every enum-like column is a `text` column
constrained by a TypeScript union in `src/lib/constants.ts` — `UserRole`,
`LevelTier`, `LessonKind`, `ResourceType`, `QuizScope`, `QuestionKind`,
`ProgressStatus`, `ReviewStatus`, `ReviewCategory`. These can become real Postgres
enums without changing a single call site, because the application already imports
the unions everywhere a value is read or written.

**Scalar lists.** Selected choice ids on an answer, and completed lesson ids on
module progress, are stored as JSON text (`choiceIdsJson`, `completedLessonsJson`).
On Postgres these can become `text[]` or `jsonb`.

Timestamps are stored as ISO-8601 text with an explicit `+00:00` offset — the format
Prisma used, kept deliberately so existing rows sort and compare correctly. On
Postgres these become `timestamptz`.

### Row-level security

RLS is a Postgres feature, and D1 has no equivalent, so these boundaries are
enforced by the application: `src/lib/authz.ts` guards every protected page and
route handler, and every query is scoped to the session user. Notably, the role is
re-read from the database on each request rather than trusted from the session
token, so a forged `role: ADMIN` claim achieves nothing.

If the database ever moves to Postgres, add policies mirroring those rules so it
enforces them independently:

| Table | Policy |
| --- | --- |
| `User` | A user may read and update only their own row. Only `ADMIN` may list users. |
| `QuizAttempt`, `QuizAnswer` | Readable and writable only by the owning `userId`; `ADMIN` may read all. |
| `ModuleProgress`, `LevelProgress`, `CourseProgress` | Same as above. |
| `Certificate` | Owner may read their own. A **public, unauthenticated** read of `publicId`, `learnerNameSnapshot`, `awardTitleSnapshot`, `issuedAt` and `revokedAt` is required for verification — expose that through a view rather than opening the table. |
| `EventLog` | Insert-only for learners; readable only by `ADMIN`. |
| `Course`, `Level`, `Module`, `Lesson`, `Resource`, `Question`, `Choice` | Public read for published content; write restricted to `ADMIN`. |
| `ContentReviewItem` | `ADMIN` only, read and write. |

Note that `Choice.isCorrect` must never reach the client before an answer is
submitted. `src/lib/quiz.ts` does not even select it for client-bound questions; a
Postgres deployment should also keep it out of any public view.

## Content model

Course content is data, not code:

```
Course → Level → Module → Lesson
                        ↘ Question → Choice
                        ↘ Resource
```

A `Lesson` carries a `componentKey` naming the interactive component that renders
it, and a `payloadJson` blob holding that component's entire content. The payload
shapes are typed in `src/lib/lesson-payloads.ts`. Nothing a learner reads is
hardcoded in React, which is what makes a CMS an additive change rather than a
rewrite: a CMS would edit `payloadJson`.

The seed source lives in `content/`, one file per level plus `questions.ts` and
`resources.ts`. The seeding logic is split in two: `seed-core.ts` holds the logic
and takes a database client, and `seed.ts` is the CLI wrapper that opens the local
SQLite file. That split is what lets the same code run inside the deployed Worker
against D1, via `POST /api/admin/reseed` — which is how content corrections reach
production after launch without a hand-written SQL import.

## Content review register

`ContentReviewItem` rows are **generated** by walking the seeded content for
`pendingReview` flags, stub resources and every assessment item — see
`deriveReviewItems()` in `seed-core.ts`. The register cannot drift from the course,
because it is built from the same objects the course is built from. A claim
cannot be added without appearing in Save7's review queue.

Severity 1 items must be resolved before public launch. As seeded, that is 13 items
concentrated in Module 9 (the law), Module 12 (the FACTS step sequence) and ten
assessment items on brain death and the law. See the checklist in `../DEPLOY.md`.
