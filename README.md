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
row level security is what protects the data. That is why `.env.example` is
committed with the real values: copy it to `.env`. The third value is optional, and
without it sign-in falls back to the shared Google redirect flow and still works.
`.env.example` also carries `NEXT_PUBLIC_SITE_URL`, which certificate links use. In
production the same variables are set in the Vercel project, along with `SITE_URL`.

There is **no local database and no seed**. The schema, the course content and
the question bank live in the `save7-os` repository as migrations, and are applied
with `supabase db push` — `save7-os/supabase/migrations/`, from `0091` (the schema)
onward, with each content migration written by `npm run content:emit`. That
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
| `npm run typecheck` | `next typegen && tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run content:emit` | Regenerate the Supabase migration that loads the course |
| `npm run content:apply` | Apply that migration to the Supabase project |
| `npm run media:check` | Check the film's files: names carry their content hash, the captions are the transcript's words, the registry matches the file. Runs in CI |
| `npm run media:upload` | Publish the Stage 3 film, its poster and captions to Supabase Storage, and prove how they are served (see [MEDIA-HOSTING.md](MEDIA-HOSTING.md)) |
| `npm run media:verify` | Check that a host serves the film as the app needs: content type, range requests, one-year cache, CORS. Reads nothing secret |
| `npm run brand:generate` | Re-embed the Save7 logo used on certificates |

There is no deploy script: Vercel builds every push (see [Deploying](#deploying)).
Nothing runs the host locally either. A preview deployment from a branch push is the
closest thing to a check of the real host. The gate before claiming something works
is:

```bash
npm run typecheck && npm run lint && npm run build
```

---

## The course

Three levels, each a **complete achievement with its own certificate**. A learner
who stops after Beginner has finished something real — that is a deliberate
design goal, not a consolation.

Eleven **Stages** in all, from `prisma/content/structure.ts`:

| Level | Stages | Certificate |
| --- | --- | --- |
| 🟢 Beginner | 3: Why Donation Matters · Busting the Myths · How Donation Actually Works | Beginner |
| 🟡 Intermediate | 4: How Donation Happens: The Process · Consent: Whose Decision and How · The South African Legal Framework · Ethics of Donation and End-of-Life Care | Intermediate |
| 🔴 Advanced | 4: The Transplant/Donation Coordinator's Role · Having the Donation Conversation · Consent and End-of-Life Ethics, In Depth · Public Advocacy: Equity, Media, and Community Trust | Advanced |

Stage numbering restarts in each Level, because the Certificate is per Level. A
Certificate's title is the Level's name and nothing more. **In the database and in
code a Stage is still a `module`** (`learn_modules`, `learn_complete_module`, the
`/levels/[level]/modules/[module]` route): no stored key was renamed (#26), so the
content files say Stage and the schema says `module`.

**Learner flow:** welcome → introduction → first Baseline Sitting → Stage content,
each Stage ending in its Stage Quiz → Certificate, once every Stage Quiz in the Level
is passed → later Baseline Sittings, offered after each Level and never required.
Stage content waits for the first Sitting. A Stage Quiz is five questions drawn from
a bank of fifteen, and four right passes it. Passing it is what completes the Stage,
and retaking it is unlimited. There is no Level-wide assessment.

Every Stage follows the same seven-part spine: *why this matters → learn → key
takeaways → check your understanding → study guide → further reading → complete*.

---

## Architecture

Next.js 16.3.6 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Supabase (Postgres) · hosted on **Vercel** — see [DEPLOY.md](DEPLOY.md).

The app is the Vercel project `learn-save7-org`, on a Hobby team named `Save7`. It
answers at `https://learn.save7.org`, and has since 2026-10-07. It is a plain
`next build` with no adapter, and every route is dynamic (server-rendered on
demand). It ran on Cloudflare Workers and Cloudflare Pages before this; why it left
is recorded in [HANDOVER.md](HANDOVER.md) §1. **Next is not pinned.** Nothing caps it
on Vercel, so security patches can be taken as they land, but never go below 16.3.3:
that release (and 15.5.24) is where the AVIF image-optimization RCE
(GHSA-2xp9-vwfh-vxw4, CVSS 9.5, published 2026-09-08) was fixed. 16.3.6 carries no
open critical or high advisory.

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
| `learn_start_stage_quiz` | The draw of five questions from fifteen, so a refresh cannot re-roll for easier ones |
| `learn_complete_module` | Records that a Stage was read, nothing more. Passing the Stage Quiz is what completes a Stage, and Level and course percentages are derived, not claimed |
| `learn_submit_baseline_sitting` | A Sitting is marked from the bank, never from the payload, and written once |
| `learn_issue_certificate` | The gate, every Stage Quiz in the Level passed, must be checked where it cannot be skipped |
| `learn_verify_certificate` | A verifier has no account, so RLS cannot serve them |
| `learn_claim_me` | `learners` has no insert policy, on purpose |
| `learn_record_date_of_birth` | An under-18 date deletes the row it would be written to, and is never stored |
| `learn_record_popia_consent` | Consent is written once, and never moved |

```
src/
  app/
    (site)/          learner-facing pages
    (auth)/          sign in / register
    admin/           Save7 analytics, guarded in the layout
    api/quiz/check   server-side grading for inline checks
    certificate/     public verification, its own bare layout for printing
  components/
    lesson/          lesson body, Markdown renderer, Stage runner (`ModuleRunner`)
    quiz/            Stage Quiz and Baseline runners
    ui/              design system primitives
  lib/
    auth.ts          Google sign-in via Supabase, sessions
    authz.ts         requireUser / requireAdmin
    course.ts        structure + progress reads
    progress.ts      progress writes and events
    quiz.ts          the quiz engine
    baseline.ts      Baseline Sittings, when one is due, and Improvement read off them
    certificates.ts  issuance and verification
    analytics.ts     admin reporting
    supabase/        server + browser clients, one project config
  db/
    rows.ts          the shape of every row this app reads
prisma/
  content/           the course, as data — the authoring source of truth
    structure.ts     the Levels and Stages, and the lessons in each
    quiz-*.ts        the Stage Quiz banks, one file per Level
    questions-*.ts   the Baseline and the clinical gate banks
scripts/
  emit-supabase-content.ts   writes the course into a Supabase migration
```

The `prisma/` directory name is historical — it holds the course content and
nothing else. The schema and the content live as migrations in the `save7-os`
repository, because they belong to the project that serves them.

### Content is data, not code

A lesson's prose is Markdown in `content/<level>/<stage>/`.
`scripts/emit-supabase-content.ts` writes it into `learn_lessons.body_markdown`,
and `src/components/lesson/Markdown.tsx` renders it. Nothing a learner reads is
hardcoded in React. The renderer is small and escape-first, because it is an XSS
boundary. `content/README.md` lists what it accepts, tables included.

The prior build's interactive components (`OrganExplorer`, `MythFlip`,
`ChapterVideo` and eight more), each fed by a JSON payload on its lesson row, were
deleted in wayfinder #60. No lesson had used one since the prose moved to
Markdown, and git keeps them.

### Assessment integrity

- **Answer keys never reach the browser.** `toClientQuestion` in `src/lib/quiz.ts`
  is the only path from a question row to the client, and it strips `isCorrect`.
  All grading — including the formative inline checks — happens on the server.
- **The Baseline is capped at four Sittings, and each is frozen.** A Sitting is the
  same twenty questions, marked in one call and stored as its scores, never its
  answers. A database CHECK and UNIQUE stop a fifth, and a client cannot write a
  Sitting at all. A learner can therefore not keep sitting the paper until the
  score looks good.
- **Only the Baseline feeds reported improvement.** Stage Quiz retakes are
  unlimited, because passing every Stage Quiz in a Level earns its Certificate. If
  they counted, Save7's headline learning gain would drift upward forever and the
  platform's central claim would be unfalsifiable. (A few admin Stage Quiz columns
  still read `attempt_no = 1`. They are not the improvement figure.)
- **Multi-select requires an exact set match.** Partial credit would teach
  learners to select everything.
- **Improvement compares a learner's first Sitting with a later one.** Every
  Sitting is the same paper, so the comparison is like for like without matching
  individual questions, and there is no `pairKey`. It is reported overall and per
  Level, and the count of learners behind each figure is always shown, so a thin
  comparison looks thin.

### Content governance

Every Stage Quiz, Baseline and clinical gate question is registered in
`learn_review_items` by the content generator (`scripts/emit-supabase-content.ts`),
so **no question joins the course without joining the register**. A question whose
`verifiedAgainst` names the document it was checked against is emitted as
approved. One without stays in the register as needing verification until Save7
decides at `/admin/content-review`, which records who decided and when.

Re-running the generator never overrides an approval or a rejection, and it never
deletes. A reworded question gets a new register row, and the old one stays behind.

**Two things the register does not cover.** Lesson prose is not registered: it
names its sources in the text and in each Stage's further reading, and nothing in
the app records a sign-off on it. And nothing learner-facing reads the register, so
a question still needing verification reaches learners with no badge.

**As of 7 October 2026**, read from production, all 205 registered questions are
approved on a named source, and none yet carries a Save7 reviewer's name.

Citations are real. No author, year, journal or identifier has been invented
anywhere in this course.

### Where the content comes from

The base is the Source Corpus: the ten PDFs Save7 supplied, served from
`/public/resources` so learners can open the reading rather than hit a paywall, and
one film. The Stages also cite public law and professional guidance that is not in the
corpus (below the table). **A Stage's own source list is its `further-reading.md`,
and each Stage Quiz item names the document it was checked against in
`verifiedAgainst`.** The table says where each corpus source is used, by Stage.

| Source | Used for |
| --- | --- |
| Save7, *Transplant Alchemy 101 — Study Guide* | Beginner Stages 2 and 3, for the family's role in consent (its Objective 2), cited beside de Jager et al. (2019). A tertiary document, so the primary sources lead |
| Save7, *7 Lives in 7 Steps* | Not used as content: it is an ICU referral algorithm for hospital staff, and the Curriculum Spec excludes it. Beginner Stage 3 and Intermediate Stage 1 name it in Further Reading only to say what not to reach for |
| Save7, *The Journey of a Gift* (6m59s) | Beginner Stage 3's film, shown at the top of the Stage with captions, a transcript and a note on the three places it contradicts the course (#61). Further Reading in all three Beginner Stages points to it too |
| Thomson et al. (2021), *SA Guidelines on the Determination of Death* | Intermediate Stage 1: the tests in *Determining death* come from it, and most of that Stage Quiz is checked against it |
| SATCS *Red File* | Referral, consent and family-approach practice, donation routes, team roles and tissue donation. Every Stage cites it, most heavily Advanced Stages 2 and 4 |
| *Excellence in Deceased Donation* manual (2025) | The reprints inside it that the course cites, among them the Western Cape circular H 84/2025, HPCSA Booklets 4 and 17, and the Australian best-practice guideline, which the Stage Quizzes mark as non-South African. Cited in Intermediate Stages 1 and 4 and Advanced Stages 1 to 3 |
| Han et al. (2017) | Advanced Stage 2: a slow decision is not a refusal. Families who took 48 hours or more consented no less often than the faster ones (73% against 55%, a difference that was not statistically significant), at one centre in South Korea |
| Mancini & Lietz (2010) | Beginner Stage 1: the heart-transplant survival figure, and the clinical gate bank |
| Weill et al. (2015) | The clinical gate bank only. No Stage cites it |
| Porrett et al. (2009) | In the corpus, but no Stage or question cites it |

**Public law and guidance that is not in the corpus**, each named in the Stage that
uses it: the National Health Act 61 of 2003 (Chapter 8) and its 2012 regulations, GN
R180, which Stages in all three Levels cite; the HPCSA booklets, for Intermediate
Stages 2 and 4 and Advanced Stage 3; and the SATS/SATCS five-year report, for Beginner
Stages 1 and 2 (below).

**The newest verified national figures are for 2021.** Beginner Stage 1 leads with
the SATS/SATCS five-year report, 2017–2021 (published 2024). Its study guide keeps
the Organ Donor Foundation's 2010–2019 decade totals only as dated background, and
marks figures reported for 2024 as not independently verified. Every statistic
carries its year, since an undated one quietly becomes a wrong one.

### FACTS — taught as FACTS's own, deliberately framed

Advanced Stage 2, *Having the Donation Conversation*
(`content/advanced/donation-conversation/`), teaches **FACTS**, the Family Approach to
Consent for Transplant Strategy, and its eight steps as FACTS's own: planning,
breaking bad news, a time-out break, assessing understanding and acceptance, the
consent conversation, a second time-out break, the final family discussion, and
follow-up, feedback and support.

**Where each claim comes from.** The steps, the Do's and Don'ts, the two hard cases and
the donor pause are from the *Wits Transplant Procurement Handbook* (Wilmans and de
Jager, 2019). The handbook's download link no longer works, and its FACTS section is
reproduced in the SATCS Red File, which is now in the Source Corpus
(`public/resources/satcs-red-file.pdf`, section 8.1). That is the file the previous
build could not read, which is why it had to flag the steps as unverified. The
acronym, the Wits origin, the adaptation of the UK NHS Blood and Transplant guidance
and the intended audience of procurement coordinators are from de Jager et al.,
*SAMJ* 2019;109(9). The consent-rate figure in that paper (25% to 73%, 35 of 48
families) is one coordinator at one centre, compared before and after, and the lesson
says so. Wayfinder #49 decided to teach the steps as FACTS's own, citing the Red File.

**The framing is a safety decision, not an editorial one.** FACTS is a clinical
procurement strategy. The Stage teaches learners to understand *why* the professional
conversation is structured as it is, and to apply the parts that fall to anyone near a
family: refer early, keep donation out of the conversation until the family accepts
the death, avoid the words that mislead. Its introduction says plainly that asking for
consent belongs to the transplant coordinator working with the treating team, and that
completing the course qualifies nobody to do it, and its key takeaways repeat that
asking is the coordinator's job. The Stage Quiz is written so that no item treats the
learner as the person who asks. A course completion must never read as authorisation
to do a transplant coordinator's job.

**The film is shown at the top of Beginner Stage 3, with its captions on.** *The
Journey of a Gift* plays inside the Stage, with its transcript beside it and a note on
the three places where it contradicts the course: over 65 tissue lives against up to
fifty, a state pathologist against the Forensic Pathology Service, and a legal
guarantee of no cost against no cost in practice. Wayfinder #58 decided that, because
WCAG 2.x SC 1.2.2 requires captions on prerecorded video and a transcript alone does
not meet it, and #61 built it. The captions are what is **said**. What the pictures
show is not described, which SC 1.2.3 asks for, and nothing has decided that is not
needed. Their timing came from speech recognition and has not yet been checked by
someone listening. [MEDIA-HOSTING.md](MEDIA-HOSTING.md) says where to listen.

---

## Deploying

**[DEPLOY.md](DEPLOY.md) is the guide** to the Vercel setup and the Supabase and
Google settings that have to know the site's address.

Five things are worth knowing before the first deploy:

**There is no deploy command.** Vercel's Git integration builds every push: `main`
is the production branch and publishes to `learn.save7.org`, and every other branch
gets a preview URL. GitHub Actions (`build.yml`) only runs the gates: typecheck,
lint and build. Vercel's Instant Rollback makes the previous production deployment
available at the custom domain again. Configuration is environment variables in the
Vercel project, set for Production and Preview, and **a changed variable takes effect
only after a redeploy**. Two steps are still to do: `SITE_URL` and
`NEXT_PUBLIC_SITE_URL` hold a placeholder (`https://learn-save7-org.vercel.app`) and
must become `https://learn.save7.org`, and that address must also be added to
Supabase's redirect URLs (the Google OAuth client's authorised origins were reported
done by Gilbert but cannot be checked from outside Google). See
[HANDOVER.md](HANDOVER.md) §6.

**The film ships with the app.** The film, its poster and its captions are committed
at `public/media/` under names that carry their content hash, and Vercel serves them
from the same origin, the film as `video/mp4` with range requests. Supabase Storage
remains the long-term home (#23). `npm run media:upload` puts the files there and
proves how they are served, and the app moves over when `MEDIA_BASE_URL` is set in the
Vercel project and the site is redeployed. [MEDIA-HOSTING.md](MEDIA-HOSTING.md) has
the detail.

**Hobby is for non-commercial use only, and the repository is public on purpose.**
Nobody has confirmed that the course meets Hobby's condition. The repository is
public because Hobby cannot deploy a private repository owned by a GitHub
organization, and this one is owned by `Save7Lives`. It holds the quiz answer keys,
so it has to be made private before launch, which needs Vercel Pro or moving the
repository to a personal GitHub account. See [HANDOVER.md](HANDOVER.md) §6.

**Content corrections are a migration now, not a button.** The old build had an
admin route that re-seeded the course from the running app. Content is now applied
by `supabase db push`, so a correction is `npm run content:emit` followed by a
push — slower, and reviewable, which is the trade that was wanted.

**The end-to-end journey suite is gone and needs rewriting.** It drove a learner
through the previous build's journey, baseline → modules → level assessment →
certificate → analytics, and asserted 53 behaviours against the local SQLite file.
Nothing equivalent runs against Supabase yet, and that is the largest gap in this
repo's verification. It needs a service-role key and a disposable learner; until
then the marking rules are covered only by the probes inside the migrations.

---

## What Save7 still needs to supply

The Levels and Stages are written and in production: three Levels and eleven Stages.
What remains for Save7 to supply or decide is below, and
[DEPLOY.md](DEPLOY.md) (*Outstanding right now* and *Before you launch*) is the longer
account. Build work is tracked on the wayfinder map, not here.

| | |
| --- | --- |
| **Legal review** | Intermediate Stage 3 (*The South African Legal Framework*) and Advanced Stage 3 (*Consent and End-of-Life Ethics, In Depth*), against the National Health Act as currently in force. Nothing records that a lawyer has read them |
| **Lesson prose sign-off** | No Stage's prose has one. Nothing registers prose or records who read it, so a sign-off has to happen outside the app. The law and the clinical criteria are the highest-risk prose: the determination of death in Intermediate Stage 1 and donor eligibility in Beginner Stage 2 |
| **Question sign-off** | All 205 registered questions are approved on a named source by the content generator, and none by a person at Save7. Approving or rejecting an item at `/admin/content-review` is what puts a name against it |
| **Refreshed statistics** | National figures newer than 2021, when SATS or the ODF publish them |
| **Certificate wording** | Sign-off on the current text |
| **Privacy notice details** | The responsible party's registered name and address, the information officer, an address for access and deletion requests, where the data is hosted, how long records are kept, and a legal review against POPIA. `/privacy` lists them |
| **Live hostname settings** | `SITE_URL` and `NEXT_PUBLIC_SITE_URL` still hold a placeholder, and the Supabase redirect URL had not been added as of 7 October. The Google origin was reported done and cannot be checked from outside Google |
| **Hosting plan** | Confirm the course meets Vercel Hobby's non-commercial condition, or fund Pro ($20 per developer seat per month). The repository must go private before launch, which needs Pro or a move to a personal GitHub account |
| **A way to take the site down** | None exists on Vercel. The old holding page went with Cloudflare |

---

## Deferred, by design

Documented rather than half-built:

- **"Explore Further" AI assistant** — retrieval-augmented over Save7-approved
  sources only, with citations and a medical disclaimer. Never an open medical
  chatbot. The resource metadata needed to build it is already in the schema.
- **Full CMS authoring UI** — the data model already supports it; see *Content is
  data, not code* above.
- **Video engagement analytics** — the film now plays inside Stage 3 (wayfinder #61),
  but nothing records that it was watched.

---

## Verification

The dated record is [DEPLOY.md](DEPLOY.md), *What has been verified, and what has not*;
this is its summary, as of 7 October 2026.

- **Gates.** `npm ci`, typecheck, lint and build run from a clean checkout on every
  push to `main` and every pull request (`build.yml`), and the Build workflow passed
  on `fc18150`, the last code commit.
- **Answer keys.** `verify_learn_isolation()` passed against the live project on
  2026-09-23, and `learn_choices` and `learn_questions` both denied a direct read.
- **Production, unauthenticated.** `/`, `/login`, `/register` and `/privacy` answer
  `200`, `/dashboard` and `/admin` redirect to sign-in, and the film serves as
  `video/mp4` with range requests.
- **The question register.** All 205 registered questions are approved on a named
  source, none by a Save7 reviewer (read from production on 7 October 2026).
- **The course in production.** Three Levels and eleven Stages (read from production
  on 7 October 2026).

**Not verified:** anything behind sign-in on the live site, Google sign-in on
`learn.save7.org`, marking against real data, and the end-to-end journey, which no
suite covers any more.

An earlier version of this section recorded a browser walkthrough of the previous
build, its interactive components, and a contrast and responsive audit. It described
an app that no longer exists, so it was replaced rather than kept as current, and git
history keeps it.

---

*One decision can save seven lives.*
