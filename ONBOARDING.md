# Transplant Alchemy 101 — start here

Save7's organ-donation course, replacing their Google Classroom.

Next.js 16.3.6 · React 19 · Tailwind v4 · Supabase (Postgres) · deployed as a
Cloudflare Worker (`learn`, serving at `https://learn.save7.workers.dev`) via
`@opennextjs/cloudflare`.

It spent a period on Cloudflare Pages and has been ported back to Workers. Old
notes, branches and commit messages mention `@cloudflare/next-on-pages`,
`.vercel/output/static` and `npm run pages:*` — all of those are gone.
HANDOVER.md §1 and §6 record why the detour happened and why it was reversed.

## Get it running

```bash
git clone git@github.com:zzubyr7x/learn.save7.org.git
cd learn.save7.org
npm install
npm run dev
```

**You need credentials for this one**, unlike the old SQLite build. `.env` wants
three values:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<the volunteer portal's Google client id>
```

All three are safe in client code — the anon key grants nothing on its own, and row
level security is what protects the data. Ask whoever owns the Supabase project for
the first two.

**There is no local database.** The backend is the shared Save7 Supabase project —
the same one `os.save7.org` and `volunteers.save7.org` use. Two consequences worth
knowing on day one:

- **Local development writes to real data.** There is no seeded admin account and
  no demo learners; what you see is what is in the project.
- **Sign-in is a Google account, and registration comes first.** A database trigger
  refuses an account for an address that is not already on a list, so register at
  `/register` before your first sign-in. Admin dashboards need staff standing
  (`app_is_staff()`), not a flag you can set locally.

The schema and the course content are migrations in the `save7-os` repository,
from `0091` (the schema) onward, applied with `supabase db push`. `npm run
content:emit` writes each content migration at the next free number.

## Read these three files

|             |                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md` | The working rules. Read this before writing code — it lists the things that are easy to break without noticing. |
| `README.md` | What the course is, how it is structured, where the content came from.                                          |
| `DEPLOY.md` | How it ships, and what Save7 still has to do.                                                                   |

If you are using Claude Code, it reads `CLAUDE.md` automatically.

## The one rule that matters most

This is health and legal content aimed at the general public in South Africa.
**No medical or legal claim ships as authoritative unless it is sourced.**

Source every claim to a document someone else can open, and **never invent a
citation, statistic or legal provision.** Where the source gets recorded depends
on where the claim lives:

- **A quiz item** (Stage Quiz, Baseline, clinical gate) names its source in
  `verifiedAgainst`. The content emitter turns that into an approved row in the
  review register at `/admin/content-review`. An item without one is listed there
  as needing verification.
- **Lesson prose** has no review mechanism. Nothing registers it or records a
  sign-off, so the source goes in the lesson itself. A claim you cannot source
  stays out.

The register is staff-only. Learners see an unverified item like any other, with
no badge. **Never clear a review item in code.** Approving and rejecting are
Save7's decisions, recorded with a name and a date in `/admin/content-review`.
CLAUDE.md has the details.

## Where things live

- **Course content**: lesson prose is Markdown in `content/<level>/<stage>/*.md`,
  and `content/README.md` says what that Markdown may contain. Questions and the
  reading list are TypeScript in `prisma/content/`, and `structure.ts` there fixes
  the Levels and Stages. `scripts/emit-supabase-content.ts` turns all of it into a
  migration for `save7-os`. `src/components/lesson/Markdown.tsx` renders the prose.
  There are no per-lesson components any more. Course copy goes in `content/` or
  `prisma/content/`, never hardcoded into a component.
- **Data layer** — `src/db/rows.ts` (the shape of every row this app reads) and
  `src/lib/` (one file per concern: `quiz.ts`, `course.ts`, `progress.ts`,
  `certificates.ts`, `auth.ts`). There is no ORM and no schema file here: the
  schema lives in `save7-os` as migrations, and the app talks to Supabase over
  HTTPS carrying the learner's own JWT.
- **Scripts** — `scripts/`, including content emit/apply and the media upload.

## Before you say it works

```bash
npm run typecheck && npm run lint && npm run cf:build
```

That is the gate. There is **no test suite.** The 53-assertion journey suite drove
a learner through baseline → modules → assessment → certificate → analytics, and it
was deleted with the local SQLite database it asserted against. Nothing equivalent
runs against Supabase yet, so anything you change in `src/lib/` or in a `learn_*`
function is unverified until you walk it by hand. HANDOVER.md §6 is blunt about
this being the largest hole in the repo.

```bash
npm run preview
```

Builds and runs the **real Worker** on workerd against Supabase. Slower than
`npm run dev`, which runs on Node, and the only thing that catches
runtime-specific breakage before a deploy does.

## How changes ship

Open a pull request against `main`. Deploys to Cloudflare happen from `main` — you
do not need Cloudflare credentials, and production learner data stays with Save7.

## Please keep the repository private

`public/resources/` holds ten third-party academic PDFs that Save7 was given for
this course, and Module 9's legal content has not been reviewed yet. A public repo
would republish the first and publish the second as a claim.
