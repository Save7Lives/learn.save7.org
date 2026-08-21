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
npm run dev
```

**The backend is the Save7 Supabase project**, so unlike the previous SQLite
build, running this needs three values in `.env`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<the volunteer portal's Google client id>
```

All three are safe in client code — the anon key grants nothing on its own, and
row level security is what protects the data. Copy the first two from Supabase
(Project Settings → API); the third is optional, and without it sign-in falls
back to the shared Google redirect flow and still works.

There is **no local database and no seed**. The schema, the course content and
the question bank live in the `save7-os` repository as migrations, and are applied
with `supabase db push` — `save7-os/supabase/migrations/0091` through `0098`. That
is deliberate: one bank, one set of policies, and content changes that arrive as
reviewable SQL rather than as whatever a seed script happened to write.

**Sign-in is a Google account**, verified by Supabase, on the same project the OS
and the volunteer portal use — so a volunteer taking the course is one identity
across all three sites. There is no password and no development admin account:
admin access is held by Save7 staff, who are `people` rows with an `app_role`, and
`app_is_staff()` is what the app asks.

Registration comes first and sign-in second, because a database trigger refuses
an account for an address that is not already on a list. Register at `/register`,
which posts to the `register-learner` Edge Function.

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build and serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run content:emit` | Regenerate the Supabase migration that loads the course |
| `npm run pages:build` | Build for Cloudflare Pages (`.vercel/output/static`) |
| `npm run pages:dev` | Build and serve the real Pages worker locally |
| `npm run pages:deploy` | Build and deploy to Cloudflare Pages |
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

Next.js 15.5.2 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Supabase (Postgres) · deployed to Cloudflare Pages via
`@cloudflare/next-on-pages` — see [DEPLOY.md](DEPLOY.md).

**Why Supabase and not its own database.** The course was built on its own
SQLite/D1 database with its own password login, and the volunteer portal held a
second, hard-coded copy of forty of its questions. Two stores meant two answers to
"has this person passed", and a question corrected in one place stayed wrong in the
other. The backend is now the Save7 Supabase project — the same one the OS and the
volunteer portal use — so a volunteer has one identity across all three sites and
their course progress shows up in the portal.

**What that means for how this app reads data.** There is no ORM. The app talks to
Supabase over HTTPS with the **anon key and the learner's own JWT**, so every read
is subject to the same row level security a browser would face; `authz.ts` is the
second layer rather than the only one. A service-role client would have made every
query trivially allowed and turned an app-level mistake into a data leak.

**Where the rules live.** Anything a client must not be able to assert is a
security-definer function in the database, not code here:

| Function | Why it is not in this repo |
| --- | --- |
| `learn_submit_attempt` | Grading needs the answer key, which has no read path |
| `learn_grade_check` | Same, for the inline checks |
| `learn_complete_module` | Level and course percentages are derived, not claimed |
| `learn_issue_certificate` | Both gates must be checked where they cannot be skipped |
| `learn_verify_certificate` | A verifier has no account, so RLS cannot serve them |
| `learn_claim_me` | `learners` has no insert policy, on purpose |

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
    auth.ts          Google sign-in via Supabase, sessions
    authz.ts         requireUser / requireAdmin
    course.ts        structure + progress reads
    progress.ts      progress writes and events
    quiz.ts          the quiz engine
    impact.ts        knowledge-improvement calculations
    certificates.ts  issuance and verification
    analytics.ts     admin reporting
    supabase/        server + browser clients, one project config
  db/
    rows.ts          the shape of every row this app reads
prisma/
  content/           the course, as data — the authoring source of truth
    review.ts        the content-review register, derived from that content
scripts/
  emit-supabase-content.ts   writes the course into a Supabase migration
```

The `prisma/` directory name is historical — it holds the course content and
nothing else. The schema and the content live as migrations in the `save7-os`
repository, because they belong to the project that serves them.

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

**[DEPLOY.md](DEPLOY.md) is the guide.** It covers the setup end to end: applying
the Supabase migrations, deploying the `register-learner` function, putting the
the video, setting the Pages variables, attaching the domain, and how to push
content corrections after launch without touching learner data.

Two things are worth knowing before the first deploy:

**Content corrections are a migration now, not a button.** The old build had an
admin route that re-seeded the course from the running app. Content is now applied
by `supabase db push`, so a correction is `npm run content:emit` followed by a
push — slower, and reviewable, which is the trade that was wanted.

**The end-to-end journey suite is gone and needs rewriting.** It drove a learner
through baseline → modules → assessment → certificate → analytics and asserted 53
behaviours against the local SQLite file. Nothing equivalent runs against Supabase
yet, and that is the largest gap in this repo's verification. It needs a
service-role key and a disposable learner; until then the marking rules are
covered only by the probes inside the migrations.

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
