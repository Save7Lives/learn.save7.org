# Transplant Alchemy 101

**Save7 Organ Donation & Transplantation Awareness Course**

A three-level learning platform that takes someone from *"I don't know much about
organ donation"* to *"I understand the issue, I know how the system works, I can
address common misconceptions, and I feel confident starting the conversation."*

The metric the platform exists to produce is **knowledge improvement** — baseline
score → post-course score → change — not page views.

---

## Running it

Node 20.9+ is required. This machine had no Node, so it was installed to
`~/.local/node`; add it to your `PATH` if it isn't already:

```bash
export PATH="$HOME/.local/node/bin:$PATH"
```

Then:

```bash
npm install
cp .env.example .env
npm run db:reset          # create the schema + seed the course
npm run dev
```

No credentials or cloud services are needed. `DATABASE_URL` defaults to a local
SQLite file.

A development admin account is created by the seed:

| | |
| --- | --- |
| Admin | `admin@save7.org` / `save7admin` |

To exercise the admin dashboard with realistic numbers:

```bash
npm run db:seed:demo        # 18 synthetic learners with a realistic funnel
npm run db:seed:demo:clear  # remove them again
```

The demo learners are deliberately **not** part of `db:seed` — fake learners in a
real deployment would corrupt the one metric Save7 cares about.

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build and serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:reset` | Delete the local database, recreate the schema, re-seed |
| `npm run db:push` | Apply the schema to the local database |
| `npm run db:seed` | Re-seed content only (idempotent, never touches learner data) |
| `npm run db:export` | Regenerate the D1 bootstrap SQL from the local database |
| `npm run verify` | Drive a learner through the whole journey and assert 44 behaviours |
| `npm run cf:preview` | Build and run the real Worker against a local D1 |
| `npm run cf:deploy` | Build and deploy to Cloudflare |
| `npm run brand:generate` | Re-embed the Save7 logo used on certificates |

---

## The course

Three levels, each a **complete achievement with its own certificate**. A learner
who stops after Beginner has finished something real — that is a deliberate
design goal, not a consolation.

| Level | Title | Modules | Certificate |
| --- | --- | --- | --- |
| 🟢 Beginner | Start the Conversation | 1–4 | Conversation Starter |
| 🟡 Intermediate | Understand the Journey | 5–8 | Donation Advocate |
| 🔴 Advanced | Become a Transplant Advocate | 9–13 | Transplant Advocate |

**Learner flow:** welcome → introduction → one-time baseline quiz → chosen level's
modules → level assessment → knowledge-impact screen → certificate → continue or
stop.

Every module follows the same seven-part spine: *why this matters → learn → key
takeaways → check your understanding → study guide → further reading → complete*.

---

## Architecture

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Drizzle ORM ·
SQLite locally, Cloudflare D1 in production. Deployed to Cloudflare Workers via
OpenNext — see [DEPLOY.md](DEPLOY.md).

**Why Drizzle and not Prisma.** The project was built on Prisma and moved off it
when Cloudflare became the deployment target: Prisma 7 compiles queries with
WebAssembly, and Workers refuses to instantiate WASM from a buffer
(`Wasm code generation disallowed by embedder`). Drizzle emits SQL directly. The
database schema did not change — `prisma/d1-migrations/0001_init.sql` is still the
SQL that Prisma generated, and `src/db/schema.ts` mirrors it column for column, so
the migration needed no data conversion. The archived Prisma schema is kept in
`docs/schema.prisma.superseded` for reference.

```
src/
  app/
    (site)/          learner-facing pages
    (auth)/          sign in / register
    admin/           Save7 analytics, guarded in the layout
    api/quiz/check   server-side grading for inline checks
    certificate/     public verification, its own bare layout for printing
  components/
    interactive/     the nine lesson components
    lesson/          lesson dispatcher + module runner
    quiz/            assessment runner
    ui/              design system primitives
  lib/
    auth.ts          sessions, password hashing
    authz.ts         requireUser / requireAdmin
    course.ts        structure + progress reads
    progress.ts      progress writes and events
    quiz.ts          the quiz engine
    impact.ts        knowledge-improvement calculations
    certificates.ts  issuance and verification
    analytics.ts     admin reporting
  db/
    schema.ts        the data model
prisma/
  content/           the course, as data
  seed.ts            CLI wrapper: opens local SQLite
  seed-core.ts       the seeding logic, driver-agnostic so it also runs on D1
  d1-migrations/     the schema, applied to both local SQLite and D1
  d1-bootstrap/      generated content import for a brand-new D1
```

The `prisma/` directory name is now historical — it holds the course content and
the seeder, not an ORM.

### Content is data, not code

A lesson is a database row naming a component (`componentKey`) and carrying that
component's entire content as JSON (`payloadJson`), typed in
`src/lib/lesson-payloads.ts`. Nothing a learner reads is hardcoded in React, so a
CMS is an additive change rather than a rewrite — a CMS would edit `payloadJson`.

The nine interactive components:

| Component | Used by | What it does |
| --- | --- | --- |
| `OrganExplorer` | M1 | What can be donated, and who needs it |
| `PathwayJourney` | M2, M5, M6, M9, M11 | The donor pathway, with **loss points** |
| `MythFlip` | M2 | Myth / fact / *why people believe it* |
| `ScenarioDialogue` | M4, M12 | Conversation practice with real objections |
| `ComparePanel` | M3, M6, M8, M10 | Side-by-side comparison (brain death vs coma) |
| `TeamRoster` | M7 | Meet the transplant team |
| `EligibilityMatrix` | M8, M10 | "Does this rule me out?" |
| `ChapterVideo` | M5 | *The Journey of a Gift*, with chapters |
| `QuizBlock` | every module | Inline check your understanding |

### Assessment integrity

- **Answer keys never reach the browser.** `toClientQuestion` in `src/lib/quiz.ts`
  is the only path from a question row to the client, and it strips `isCorrect`.
  All grading — including the formative inline checks — happens on the server.
- **The baseline can only be taken once.** A retake could manufacture an
  improvement.
- **Only `attemptNo === 1` counts toward reported improvement.** If retakes
  counted, Save7's headline learning gain would drift upward forever and the
  platform's central claim would be unfalsifiable.
- **Multi-select requires an exact set match.** Partial credit would teach
  learners to select everything.
- **Improvement is reported two ways.** A headline figure comparing the two papers,
  and a `pairKey`-matched like-for-like comparison that is the honest primary
  number. The pair count is always shown, so a thin comparison looks thin.

### Content governance

Every medical, legal or statistical claim is registered in `ContentReviewItem` —
**generated by walking the seeded content**, so the register cannot drift from the
course — and anything unapproved carries a visible *"Pending Save7 review"* badge
in the learner UI until signed off at `/admin/content-review`.

Re-running the seed never un-approves something Save7 has already approved, and it
prunes content that has been retired rather than leaving orphaned rows behind.

**Current state: 102 registered claims open, 13 blocking launch** — down from 293
and 74 before Save7's source material arrived. What remains is concentrated in
Module 9 (legal provisions needing verification against the current consolidated
Act), Module 10 (clinical selection criteria), Module 12 (the FACTS step sequence)
and the assessment items. Note that 90 of the 102 are assessment questions, which
need one bulk sign-off rather than 90 investigations — the 12 substantive claims are
listed at the top of `/admin/content-review` by severity.

Citations are real. No author, year, journal or identifier has been invented
anywhere in this course. Two entries remain stubs because they need Save7: the
current SATCS URL, and a link to the consolidated National Health Act text.

### Where the content comes from

All lesson content is drawn from the material Save7 supplied, which is served from
`/public/resources` so learners can open the reading rather than hit a paywall.

| Source | Used for |
| --- | --- |
| Save7, *Transplant Alchemy 101 — Study Guide* | The spine of the course. Its five objectives map to modules 1, 2, 7, 9 and 8 |
| Save7, *7 Lives in 7 Steps* | Referral triggers, documentation, and the decoupling principle |
| Save7, *The Journey of a Gift* (6m59s) | Module 5 |
| Thomson et al. (2021), *SA Guidelines on the Determination of Death* | Module 6, closely followed rather than paraphrased |
| SATCS *Red File* | Donation routes, team roles, national figures |
| *Excellence in Deceased Donation* manual (2025) | Donor management, family support, HPCSA consent and palliative guidance |
| Han et al. (2017) | That families who take longer to decide consent *more*, not less |
| Mancini & Lietz (2010), Weill et al. (2015), Porrett et al. (2009) | Modules 10 and 11 |

**Statistics are decade totals for 2010–2019** (Organ Donor Foundation, via the Red
File) and are date-stamped everywhere they appear. Save7 should refresh them — an
undated statistic quietly becomes a wrong one.

### FACTS — partially verified, deliberately framed

Module 12 now teaches **FACTS**, the Family Approach to Consent for Transplant
Strategy. What is verified and what is not:

| Claim | Status |
|---|---|
| The acronym expands to "Family Approach to Consent for Transplant Strategy" | **Verified** — de Jager et al., *SAMJ* 2019;109(9) |
| Developed at Wits Transplant, adapted from the UK NHSBT model | **Verified** — same source |
| Intended for transplant procurement coordinators | **Verified** — same source |
| It is a stepwise process | **Verified** — same source |
| The eight steps, and their names | **Not verified.** Supplied by Save7 from the Organ and Tissue Donation Reference File, which is gated and could not be read. Flagged as launch-blocking. |

**The framing is a safety decision, not an editorial one.** FACTS is a clinical
procurement strategy. The module teaches learners to understand *why* the
professional conversation is structured as it is; it states plainly, in the lesson,
the study guide and a check question, that completing the course does not qualify
anyone to approach a family or request consent. A course completion must never read
as authorisation to do a transplant coordinator's job.

**The video has no captions or transcript.** Save7 has decided these are not needed.
Noting it here because they are the one accessibility gap in an otherwise
WCAG-conformant build: a learner who cannot use audio currently cannot access
Module 5's primary content. Chapter timecodes were also not measured, so the chapter
list beside the player labels rather than seeks.

---

## Deploying

**[DEPLOY.md](DEPLOY.md) is the guide.** It covers the Cloudflare setup end to end:
creating the D1 database, loading the course content, putting the video in R2,
setting secrets, attaching the domain, and how to push content corrections after
launch without touching learner data.

The whole journey has been verified running on `workerd` against D1 — the real
runtime, not an emulator. What is left needs a Cloudflare login, which is yours.

---

## What Save7 still needs to supply

The platform and the course content are both complete. What remains is review and
a handful of details.

| | |
| --- | --- |
| **Legal review** | Module 9, against the National Health Act as currently in force |
| **Clinical review** | Module 10's selection criteria |
| **Assessment sign-off** | 91 questions registered for review at `/admin/content-review` |
| **Refreshed statistics** | Current figures to replace the 2010–2019 decade totals |
| **Three citation links** | The current SATCS URL, the consolidated National Health Act text, and the Organ and Tissue Donation Reference File |
| **FACTS eight steps** | Confirm the sequence and step names against the Organ and Tissue Donation Reference File, and supply the file so its citation can be completed |
| **Certificate wording** | Sign-off on the current text |
| **Privacy notice details** | Information officer, hosting location, retention period |
| **Deployment credentials** | Postgres, hosting |
| **Optional** | Captions and a transcript for the video, and chapter timecodes |

---

## Deferred, by design

Documented rather than half-built:

- **"Explore Further" AI assistant** — retrieval-augmented over Save7-approved
  sources only, with citations and a medical disclaimer. Never an open medical
  chatbot. The resource metadata needed to build it is already in the schema.
- **Full CMS authoring UI** — the data model already supports it; see *Content is
  data, not code* above.
- **Video engagement analytics** — needs the video asset first. The hooks are in
  `ChapterVideo`.

---

## Verification performed

- Full learner journey driven in a browser: register → baseline → modules (every
  interactive component exercised) → assessment → impact screen → certificate →
  dashboard.
- All 13 module pages render without error.
- **Security:** admin routes return 404 to learners; a validly-signed token
  claiming `role: ADMIN` is still rejected because the role is re-read from the
  database; forged cookies rejected; the inline-check API requires auth; answer
  keys confirmed absent from page payloads; the certificate page leaks no email,
  score or answers.
- **Gating:** modules require the baseline; assessments require completed modules;
  certificates require both completed modules and the pass mark.
- **Accessibility:** 0 contrast failures across the app after darkening the
  neutral scale and the pink used behind small white text — brand pink measured
  4.31:1 against white, just under the 4.5:1 minimum, so buttons use a marginally
  deeper shade. Single `h1` per page, no skipped heading levels, all controls
  named, all inputs labelled, visible focus ring, 44px tap targets, `lang="en-ZA"`.
- **Responsive:** no horizontal scroll at 375 / 768 / 1280; the comparison tables
  collapse to a tabbed view below `md`.
- `npm run build`, `typecheck` and `lint` all clean.

---

*One decision can save seven lives.*
