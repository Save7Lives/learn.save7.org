# Context: learn.save7.org Course Spec

Glossary for the wayfinder map behind Save7's organ donation education platform, learn.save7.org. The spec is complete; the map now carries the build as well, so terms here cover the curriculum, assessment, accounts and dashboards alike.

## Terms

### Curriculum & Assessment

**Course**
The whole learn.save7.org program, all three Levels combined, named **Save7 Learn**. The site and the Course share that one name. Singular, capital-C when referring to the whole thing.
_Avoid_: Transplant Alchemy 101 (the prior build's name; it survives only as the title of Save7's Study Guide in the Source Corpus)

**Level**
One of the three depth-based tiers of the Course: Beginner, Intermediate, Advanced (see below). Not "course" — "course" is reserved for the whole program to avoid the ambiguity in early discussion ("one of the courses" meant one Level).

- **Beginner Level**: awareness and myth-busting. Primary audience: general public.
- **Intermediate Level**: donation process, ethics, South African legal framework. Audience: general public + healthcare-adjacent.
- **Advanced Level**: advocacy and greater depth for healthcare-adjacent learners (not full clinicians — deep surgical/clinical papers in the source corpus are background/citation material, not direct course content).

**Stage**
A module/unit within a Level. A Level is composed of one or more Stages.

**Source Corpus**
The reference material set grounding course content: the files in `Desktop/resources/` (10 PDFs + 1 video as of 2026-09-03), prioritizing South African–specific guidance. May grow; new sources get folded in without changing this definition.

**Baseline Assessment**
A single fixed-form MCQ test, cross-Level in scope (samples Beginner + Intermediate + Advanced content at reasonable/moderate difficulty), reused verbatim (not randomized) across all sittings so results are comparable over time. Purely diagnostic — no pass/fail; its value is the before/after comparison across sittings, and no score gates anything. Taking the first sitting does gate Stage content (see Baseline Sitting). No answers are shown after a sitting, because the same questions come back at the next one.

**Baseline Sitting**
One instance of a learner taking the Baseline Assessment, stored as its per-Level scores and total, never its answers. Every learner has up to 4 sittings on a fixed schedule: initial (at signup, before any Level) → after completing Beginner Level → after completing Intermediate Level → after completing Advanced Level. Stage content opens only once the initial sitting is submitted, since a "before" taken after reading is not a before. The later sittings are offered, never required. Because a learner may start at any Level, each later sitting follows the next Level they complete. One is owed per Level completed since the last sitting and is not owed twice, so a learner who finishes two Levels between sittings sits once and can end with fewer than 4.

**Certificate**
A per-Level completion artifact: learner's name + Save7 branding, downloadable, issued on completing each Level (so a learner who finishes all three Levels holds three Certificates, not one). Not a stored file but a view rendered on demand: the Student's name and award title are fixed at issuance, so a later rename cannot rewrite a Certificate already shown to an employer, while the artwork is always the current design — a re-download years later may therefore look different from the original, deliberately.

**Certificate Verification**
The check anyone holding a Certificate's public ID can perform without an account: it confirms the name on it, which Level it is for, the issue date, and whether it is still valid — and nothing else, never the Student's email, Baseline scores, or answers. Deliberately open, because a Certificate nobody else can check is worth much less; disclosed to Students as a recipient category when they sign up.

**Curriculum Spec**
The destination of this map: module list + learning objectives + source-to-content mapping per Level/Stage, plus the Assessment Blueprint. Does not include fully drafted lesson content or the actual Baseline question bank — those are downstream, ticketed separately.

**Assessment Blueprint**
The design of the Baseline Assessment and the per-Stage Quizzes: topic coverage, difficulty calibration, question count and structure. Not the question banks themselves.

**Stage Quiz**
A short comprehension-check quiz for one Stage, separate from the Baseline Assessment. Doesn't gate movement between Stages within a Level, but passing every Stage Quiz in a Level is required before that Level's Certificate is issued; each Level's Stages (3-5 per Level) each get one.

**Source Note**
An inline flag in the Curriculum Spec marking content drawn from a non-South-African-derived source (e.g. the Excellence in Deceased Donation course manual's Australian OTA/DonateLife-derived process framework), so lesson drafters never mistake it for South African-specific fact. Applies wherever such content appears in any Level, not just where first identified.

### Accounts, Login & Dashboard

**Student**
The only account type on learn.save7.org; anyone taking the Course. "Volunteer" describes a Student's intent, not a distinct account type — there is no separate volunteer account. Always 18 or older, however they arrive: someone who already signs in to Save7 as staff, a volunteer or a stakeholder becomes a Student on the same terms as a member of the public, and there is no under-18 path.
_Avoid_: Volunteer, Learner, User

**Admin**
A Save7 staff / program-coordinator account with oversight-only visibility into Students' progress. No content-management capability — content stays a separate, hand-edited concern outside this account type's scope. A single flat role, not tiered: every Admin sees the same global pool view (its Growth Indicators) and can drill into any Student's complete Progress Record unrestricted, and can edit the Eligibility Rule's required-flags list.
_Avoid_: Coordinator, Staff account

**Growth Indicator**
One of the aggregate, cohort-wide metrics Admin's pool view shows, derived at read time across every Student's Progress Record: cohort size, per-Level completion rate, per-Stage Quiz pass rate, average per-Level Baseline improvement, and cohort-wide Baseline trend. Scoped only to what the Progress Record already stores — distinct from the richer engagement metrics (time-on-task, login frequency, quiz-attempt history, etc.) still left as fog.

**Progress Record**
The stored state tracking one Student's advancement through the Course: their Baseline Sittings (up to 4, one per fixed slot, each holding score-by-Level sub-scores + a total, never raw answers), the pass/fail state and score of their latest attempt on each Stage Quiz (every attempt is kept in storage; the Record shows only the latest), and timestamped completion flags for Stage, Level, and Certificate issuance. A Stage is complete when its Stage Quiz is first passed, and a later attempt never clears that. A Level is complete when every Stage Quiz in it is passed. Having read a Stage is tracked so a Student can resume, but it is not a completion flag. Feeds both the student-facing progress dashboard and admin oversight views.

**Improvement**
The before/after comparison a Student's Progress Record supports: the delta between their initial Baseline Sitting's per-Level sub-score and the Sitting taken after completing that Level, plus the full 4-point trend across all Sittings. Always computed from the Progress Record at read time — never a value stored in its own right.

**Nerve Center**
A separate, future Save7 platform for Save7 volunteers, mapped and built independently of learn.save7.org. This Course only produces the completion signal Nerve Center will eventually consume for its own account-eligibility decisions — it does not design Nerve Center's intake, validation, or accounts.
_Avoid_: Save7 OS (informal name for the same future platform)

**Eligibility Rule**
The admin-configurable, versioned condition that determines Nerve Center eligibility: a list of completion flags from a Student's Progress Record (e.g. which of Beginner/Intermediate/Advanced Level-complete) that must all be true. Editing the rule creates a new version; it never keys off Baseline Sitting scores or engagement data. The exact default set of required flags is not yet settled.

**Nerve Center Eligibility Signal**
The per-Student record produced by evaluating a Student's Progress Record against an Eligibility Rule: an eligible flag, the timestamp it was evaluated, and a reference to the Eligibility Rule version that produced it. This is what would eventually be exported to Nerve Center — never raw Baseline scores or completion history.

### Design

**KEPSA Deck**
Save7's "Presentation Mastertemplate", the slides used for the KEPSA presentation on 3 October 2026 (kept locally at `Desktop/Presentation Mastertemplate.pdf`, not in this repo). The visual reference Learn derives its look from: navy headings over a pink or teal eyebrow, tinted rounded cards, numbered pills, steppers, soft corner blobs. A reference, not a spec: Learn takes its shapes and its navy, and corrects its colours where they fail contrast on the web.

**Register**
One of two visual modes that share the same tokens: the **Editorial Register** (landing, sign-in, lessons, Certificate), expressive and deck-like, and the **Portal Register** (a Student's My Progress, and Admin), dense and app-like, after the KEPSA portal's screens in the deck. A Register is not a dark/light switch; Learn stays light.
_Avoid_: Theme (implies a user-selectable switch Learn does not have)
