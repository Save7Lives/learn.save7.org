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
git clone git@github.com:zzubyr7x/transplant-alchemy.git
cd transplant-alchemy
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

The schema and the course content are migrations in the `save7-os` repository
(`0091`–`0098`), applied with `supabase db push`.

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

If you cannot verify a claim, mark it `pendingReview: true` with a
`reviewSourceHint` saying where it should be checked. It then renders with a
visible "Pending Save7 review" badge and appears in `/admin/content-review` for
Save7 to sign off. **Never invent a citation, statistic or legal provision**, and
never clear a review item in code — those are Save7's decisions to record.

There are currently **13 launch-blocking review items**, mostly Module 9 (the law)
and the Module 12 FACTS sequence. Clearing them needs a person with authority, not
a code change.

## Where things live

- **Course content** — `prisma/content/level-*.ts`, seeded into the database.
  Components read `Lesson.payloadJson`. Never hardcode course copy into a component.
- **Interactive components** — `src/components/interactive/`, each driven entirely
  by its lesson payload.
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
