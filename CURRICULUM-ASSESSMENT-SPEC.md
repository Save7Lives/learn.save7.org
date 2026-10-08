# learn.save7.org — Curriculum + Assessment Spec

Handoff document for the build team. Covers per-Level module lists and Stage
breakdowns, the Assessment Blueprint (Baseline Assessment + Stage Quizzes),
and the Certificate design for Save7's three-Level organ donation course.

**Out of scope for this spec:** fully drafted lesson content, the actual
question banks, the platform build itself, and CPD/HPCSA accreditation for
Advanced Level (a separate institutional/legal process — see [Open Items](#open-items)).

See [CONTEXT.md](CONTEXT.md) for the glossary of terms used throughout
(Course, Level, Stage, Baseline Assessment, Certificate, Source Note, etc.).

A **Source Note** (📌) marks content in this spec drawn from a
non-South-African-derived source, so lesson drafters don't mistake it for
South African-specific fact.

---

## Course Structure at a Glance

| Level | Audience | Stages | Stage Quizzes |
|---|---|---|---|
| Beginner | General public | 3 | 3 |
| Intermediate | General public + healthcare-adjacent | 4 | 4 |
| Advanced | Healthcare-adjacent (not full clinicians) | 4 | 4 |

11 Stages total across the Course. Each Level ends in a Certificate, gated
by passing every Stage Quiz in that Level (see [Assessment Blueprint](#assessment-blueprint)).

---

## Beginner Level

**Focus:** awareness and myth-busting. **Audience:** general public.

### Stage 1 — Why Donation Matters (The Need)

- Scale of impact: one donor saves 7+ lives via organs, transforms 50 via
  tissue donation. ⚠️ **Corrected 2026-09-22 (#33).** This spec previously
  read "65+"; that figure could not be sourced, and the prior build had
  already removed it in favour of fifty. Do not reinstate "65+" without a
  citation.
- The real people behind the need: end-stage organ failure, advanced lung
  disease, burn victims, corneal blindness
- SA shortage severity: donation rate fell 1.60 → 0.48 per million
  (2017–2021, SATS — verified); 2,586 on the waiting list (end-2021, most
  recent verified figure); 2024 Gauteng DoH figures (~6,500 awaiting, 317
  transplanted) cited with an explicit "reported, not independently
  verified" caveat
- **Sources:** `The_Journey_of_a_Gift.mp4`, SATS 2017–2021 report,
  Channel Africa / allAfrica (caveated)

### Stage 2 — Busting the Myths (12 myths)

1. Registered donors get less effort from doctors — false, teams legally separate
2. Donation disfigures the body — false, appearance preserved, open-casket possible
3. Family gets billed — false in practice: the ODF and the tissue banks do not bill the family. ⚠️ **Corrected 2026-09-22 (#33)** from "no cost by law" — neither the National Health Act nor its regulations allocate donation costs, and the prior build had already removed that exact claim once. Teach this as settled practice, not as statute.
4. Organs are bought/sold — false, voluntary, trading illegal
5. Religion forbids donation — most religions support it (SA faith-specific breakdown deferred — see [Open Items](#open-items))
6. Too old/unhealthy/wears glasses — no strict age limit, case-by-case assessment
7. Registering alone is enough — false, next-of-kin consent always required
8. Family agreeing once guarantees donation — false, can still be overridden at the bedside
9. SA's shortage isn't severe — false, rate collapsed vs. international comparators (Spain 47.05 pmp)
10. Tissue-specific myths — no "perfect body" needed, possible post-death, doesn't preclude funeral rites
11. Past illness/cancer history excludes you — not absolute; case-by-case clinical assessment on patient profile by experienced clinicians
12. Living donation is unsafe for the donor — not absolute; same case-by-case framing as #11

### Stage 3 — How Donation Actually Works (Plain-Language)

- Organ vs. tissue distinction
- Treating team vs. transplant team, legally separate
- Two independent doctors certify brain death — one with 5+ years'
  experience, neither on the transplant team — using a rigorous,
  repeatable set of tests, each doctor testing independently; the
  **Forensic Pathology Service** for unnatural deaths. ⚠️ **Corrected
  2026-09-22 (#33)** from "state pathologist for accidental deaths" — that
  office no longer performs the function.
- DBD vs. DCD, plain-language
- Free, voluntary; registering *and* telling family both required
- **Sources:** `The_Journey_of_a_Gift.mp4`, Transplant Alchemy 101
  Obj. 3–5 (isolated facts only; clinical/legal depth reserved for
  Intermediate Level)

**Video assignment:** `The_Journey_of_a_Gift.mp4` is an explainer (not a
testimonial) and is assigned here, reinforcing all three Stages above
rather than anchoring a standalone "human-story" Stage.
It plays at the top of Stage 3, with captions and a transcript. ⚠️ **The
film predates three corrections above (#58):** it says 65+ for tissue
(this spec: fifty), a "state pathologist" (the Forensic Pathology
Service), and no cost "by law" (in practice). A note beside the player
says so, because two of them are Stage Quiz items.

**Cut:** `7 Lives in 7 Steps.pdf` — it's a clinical ICU/hospital-staff
decision algorithm, not general-public content. Only its "7 lives" tagline
is reused (already covered via the video and the Channel Africa quote).

---

## Intermediate Level

**Focus:** donation process, ethics, South African legal framework.
**Audience:** general public + healthcare-adjacent.

### Stage 1 — How Donation Happens: The Process

- Referral: who refers, when, and why timing matters
- Determining death: brain death and circulatory death, plain language
  (grounded in the peer-reviewed `SAJCC-37-1-466.pdf`, not the corpus's
  draft CCSSA PDF). Taught at **explanatory depth for both**
  determinations — the contrast is the teachable thing, not either test
  alone. Explanatory only: never a procedure a learner could perform.
  - **Before testing can begin** (why the test proves anything): an
    established, irreversible cause of the injury, normal body
    temperature, adequate blood pressure, sedative/CNS-depressant drug
    effect excluded, severe metabolic derangement corrected. This is the
    step that rules out everything that *mimics* brain death — the
    direct answer to "how do you know they aren't just deeply sedated,
    or cold?"
  - **The three-step brain-death test**, and why each step establishes
    irreversibility: (1) coma; (2) absent brainstem reflexes, checked
    one pathway at a time — light into the eyes, the cornea touched,
    pain at the face, ice-water into the ear, gag, cough; (3) the
    apnoea test — the ventilator is disconnected under controlled
    conditions to see whether the body ever tries to breathe on its own.
    No clinical thresholds or values are taught.
  - **Circulatory-death determination:** five minutes of continuously
    absent circulation and breathing, then confirmation of absent
    pupillary and motor response. **Why the wait exists:** a stopped
    heart can, very rarely, restart on its own in the first minutes, so
    the guideline sets five continuous minutes as the period that
    establishes the arrest is irreversible, and restarts the count if
    circulation or breathing returns at any point. Without the reason,
    the five minutes reads as arbitrary — or as a countdown run for the
    transplant team's benefit. (Wording aligned to the guideline's own
    framing in [T48](wayfinder/research/T48-intermediate-sources-findings.md) §2;
    it does not say in terms that a heart never restarts after five
    minutes.)
  - One cross-referencing sentence that in DCD the clock starts only
    after a decision to withdraw treatment made independently, for the
    patient's own reasons — full decoupling is taught in Stages 2 and 4,
    not re-taught here.
- DBD vs. DCD explained
- Tissue vs. organ donation — how the pathways differ
- Brief "who's who" context: ODF, SATS/SATCS, tissue banks/transplant centres
- **Learning objective:** Explain how a potential donation is identified,
  how death is legally and clinically determined, **why those
  determinations establish that the death is irreversible**, and how
  organ vs. tissue donation pathways differ.

**Drafter notes on the determination content:**

- 📌 **Not** a Source Note case. All of it comes from the published,
  peer-reviewed CCSSA/SAJCC guideline — South African-specific, and
  already this Stage's cited anchor. The Source Note convention flags
  the opposite situation.
- **Do not import the atropine test.** `Document H – SATS Red File`
  reproduces a simplified bedside version of these criteria that
  includes an atropine test. It is a SATCS addition, absent from the
  CCSSA guideline and **not required for certification** — a drafter
  working from the Red File could easily present it as a fourth step.
- **Paediatric, ECMO and pregnancy provisions are deliberately not
  taught.** The guideline carries specific provisions for each (e.g.
  brain death cannot be diagnosed below 36 weeks' corrected gestation).
  They are clinical variants with no explanatory payload for this
  audience, and excluding them is a decision, not an oversight.
- **Depth boundary re-affirmed:** this readmits only "basics" depth from
  territory cut with `7 Lives in 7 Steps.pdf`. That PDF stays cut, and
  Advanced's audience boundary (healthcare-adjacent, not full
  clinicians) is unchanged.

### Stage 2 — Consent: Whose Decision and How

- South Africa's opt-in consent model and what ODF registration actually
  does (and doesn't) guarantee
- The legal consent hierarchy (next-of-kin order of preference) under NHA
  Chapter 8
- The family conversation: decoupling, dignity, non-coercion (FACTS
  protocol — 📌 SA-adapted from UK NHSBT guidance, not Australian)
- HPCSA's general informed-consent principles (Booklet 4) applied to donation
- **Learning objective:** Explain who has to consent to a donation, what
  registering with the ODF actually does (and doesn't) guarantee, and how
  the family conversation is meant to happen.

### Stage 3 — The South African Legal Framework

- National Health Act 61/2003, Chapter 8, and its Regulations — what the
  law actually requires
- Certification-of-death legal requirements (two doctors, independence
  from transplant team, HPCSA registration)
- No cost to the donor's family/estate; prohibition on organ trade
- Recent developments: the Ministerial Advisory Committee on Organ
  Transplantation (GN 5360, 4 October 2024), and the draft Regulations
  on Organ Transplantation (GN 7879, 4 September 2026 — published for
  comment, **not in force**). *Corrected by #48:* this bullet previously
  named "regulation amendments, most recently 28 Feb 2025". That was a
  misattribution — Notice 6055 of GG 52388 is a National Treasury PFMA
  notice of 28 March 2025, and the 2025 Health amendment it was confused
  with (GN 6064, 27 March 2025) changed the notifiable-medical-conditions
  regulations. No 2025 amendment concerns donation. See
  [T48](wayfinder/research/T48-intermediate-sources-findings.md) §1.
- **Learning objective:** State what South African law (NHA 61/2003 Ch.8)
  actually requires and prohibits around organ/tissue donation, including
  recent regulatory developments.

### Stage 4 — Ethics of Donation and End-of-Life Care

- Withdrawal-of-treatment ethics as it relates to DCD, sourced from
  **HPCSA Booklet 7** (Withholding/Withdrawing Treatment, rev. Sept 2025),
  not Booklet 17 (Palliative Care) as the course manual itself cites
- Family accommodation, second opinions, and dignity in dying
- The opt-in vs. presumed-consent debate — why South Africa hasn't moved
  to opt-out, and what the evidence actually says would help
- Equity and scarcity: waitlist vs. transplant-rate reality,
  extended-criteria donors
- **Learning objective:** Discuss the ethical tensions in donation and
  end-of-life care — consent-model debate, family dynamics, and
  scarcity/equity — beyond the legal minimum.

**Course manual note:** 📌 the *Excellence in Deceased Donation* course
manual's process framework (OTA/DonateLife/ANZICS "Elements 1–5",
DBD/DCD critical-pathway framing) is Australian-derived and is kept
visibly separated from SA-specific fact wherever it's used above.

**`7 Lives in 7 Steps.pdf`: excluded from the Course entirely.** It's a
hospital-staff ICU clinical/operational algorithm (GCS-based donor
identification, brainstem death testing, a scripted family-counseling
gate, transplant-coordinator hotlines, medico-legal form branching), not
explanatory content fit for either Level's audience. Document H and the
SAJCC guideline already ground Stage 1's process content at the right
depth.

---

## Advanced Level

**Focus:** advocacy and greater depth for healthcare-adjacent learners
(not full clinicians — deep surgical/clinical papers in the Source Corpus
are background/citation material, not direct course content).

### Stage 1 — The Transplant/Donation Coordinator's Role

- TC/SNOD definition; when brought in (before family told, not after)
- End-to-end duties (screening → planning → conversation →
  authorisation/logistics → aftercare → audit)
- SATCS as professional body
- **Objectives:** (1) define role, explain early-engagement timing;
  (2) describe end-to-end duties across the pathway; (3) identify SATCS
  as the coordinators' professional body. ⚠️ **Corrected 2026-09-24
  (#49)** from "governing body". SATCS is a voluntary special interest
  group of SATS, and it registers and disciplines nobody; the statutory
  regulator for nurses is the South African Nursing Council.

### Stage 2 — Having the Donation Conversation

- 5-element/8-step framework (plan → separate death from donation →
  collaborative delivery → debrief). **Decided 2026-09-24 (#49):** the
  eight steps are taught as Wits FACTS's own, cited to the Red File's
  excerpt of the Wits Transplant Procurement Handbook. The prior build had
  removed them as unverifiable because it could not obtain the Red File,
  which is now in the Source Corpus. 📌 The five elements are the
  Australian guideline's.
- Wits FACTS script Do's/Don'ts
- Troubleshooting (machine-switch-off misconception, family disagreement)
- The "donor pause"; patience with slower-deciding families
  (📌 Han et al. 2017 — a Korean single-center study, illustrative, not
  SA data)
- **Objectives:** (1) explain why the death conversation is separated
  from the donation conversation; (2) apply FACTS Do's/Don'ts;
  (3) recognize/respond to common misconceptions and family
  disagreement; (4) describe the "donor pause" practice; (5) explain why
  decision delay doesn't predict lower consent.

### Stage 3 — Consent and End-of-Life Ethics, In Depth

- HPCSA informed-consent framework (capacity, surrogates)
- Advance directives / "best interests" test
- National Health Act Chapter 8 applied to the consent conversation
  (builds on, doesn't repeat, Intermediate Level Stage 3)
- **Objectives:** (1) apply the HPCSA consent framework to next-of-kin
  decisions; (2) explain surrogate decision-making and the "best
  interests" test; (3) connect NHA Ch.8 to the practical consent
  conversation.

### Stage 4 — Public Advocacy: Equity, Media, and Community Trust

- Equity/cultural-sensitivity obligations (no community excluded)
- Donor-family privacy/media protocol
- ODF's ULUNTU campaign as a case study, at framing depth (no campaign
  toolkit exists in the Source Corpus — deeper ODF/SATS outreach is a
  possible future task, not part of this spec)
- **Objectives:** (1) explain equity obligations in who's offered the
  conversation; (2) describe the media/privacy protocol; (3) analyze
  ULUNTU as a culturally-attuned advocacy case study.

**Stage order:** A → B → C → D — procedural on-ramp (role, then
conversation) before ethics depth (C), advocacy (D) last. Kept at 4
Stages rather than merged to 3: A and B have genuinely distinct
objectives despite source overlap.

`The_Journey_of_a_Gift.mp4` was assigned to Beginner Level, not Advanced,
so it contributes nothing here.

---

## Assessment Blueprint

### Baseline Assessment

Cross-Level diagnostic, **not** a Stage Quiz.

- Purely diagnostic — **no pass/fail** at any sitting. Its value is the
  before/after comparison across sittings, and **no score gates
  anything**.
- **Sitting 1 gates Stage content.** A learner reaches the Level and Stage
  pages only once their first sitting is submitted, because a "before"
  taken after reading a Stage is not a before. This gates on *taking* it,
  never on the result. Sittings 2–4 are offered and never required; none
  affects a Certificate.
- **4 fixed sittings** per learner: initial (at signup), post-Beginner,
  post-Intermediate, post-Advanced. A learner may start at any Level, so
  each later sitting is offered after the **next Level completed**, and
  one is owed per Level completed since the last sitting. A sitting
  skipped before another Level is finished is not owed twice (the same
  paper back to back measures nothing), so a learner can end with fewer
  than four.
- **20 questions**, fixed-form, reused verbatim every sitting (not
  randomized) so results stay comparable over time.
- **Topic weighting** across the 11 Stages, deliberately Beginner-heavy
  (every learner reaches it; later Levels aren't guaranteed):
  - **8 Beginner** (3 / 3 / 2 across its 3 Stages)
  - **6 Intermediate** (2 / 2 / 1 / 1 across its 4 Stages)
  - **6 Advanced** (2 / 2 / 1 / 1 across its 4 Stages)
- **Difficulty** scales with source Level (Beginner-sourced easier,
  Advanced-sourced harder) — flagged as adjustable post-launch if learner
  feedback says it's miscalibrated.
- **Intermediate Stage 1's 2 questions may draw on the death-determination
  content, capped at the conceptual tier** — e.g. that South Africa
  recognises two ways of determining death, or that certification is
  independent of the transplant team. Not reflexes, not the apnoea test:
  the Baseline is fixed-form and first sat at signup, so a question at
  that depth scores zero for everyone at sitting 1 and discriminates
  nothing. The weighting is unchanged — Stage 1 keeps exactly 2 of 20.
- **Format:** 4-option single-best-answer MCQ, no "not sure" option.
- **Reporting:** score-by-Level breakdown (3 numbers) + overall score,
  with a trend view across prior sittings once more than one exists.
  **No answer review** after a sitting, unlike a Stage Quiz: the same
  questions come back at every sitting, so showing the key after the
  first would turn the later sittings into a memory test.

### Stage Quiz

One per Stage, **11 total**.

- **Gates that Level's Certificate**: a learner must pass every Stage
  Quiz in a Level before its Certificate is issued. Does **not** gate
  movement between Stages within a Level — Course navigation stays
  low-friction.
- **5 questions per attempt**, drawn randomly from a **15-question bank**
  per Stage.
- Same 4-option single-best-answer MCQ format as the Baseline.
- **Pass threshold:** 4 of 5 (80%).
- **Unlimited retries**, no cooldown. A retry avoids repeating the
  immediately-prior attempt's 5 questions (draws from the remaining 10
  first).
- **One targeted coverage floor** (Intermediate Stage 1 only): its bank
  must include **at least one question on brain-death determination and
  at least one on circulatory-death determination**. A floor, not an
  allocation. Its reason is specific and doesn't generalise: a drafter
  writing 15 questions for "How Donation Happens" will reach for DBD
  because it's the familiar pathway, and could plausibly produce a full
  bank that never touches DCD — the pathway families find hardest to
  follow, and the one the Stage deliberately gives equal treatment. No
  other bank carries a coverage constraint, and this is not a precedent
  that obliges one.

---

## Certificate Design

One Certificate per completed Level (a learner finishing all three Levels
holds three Certificates). Fields: learner name, Level completed, date,
"Save7" as issuing organisation (org name only, no individual
signatory), and the Certificate ID with the address where anyone can
check it (see **Certificate Verification** in [CONTEXT.md](CONTEXT.md)).

**Re-cut 2026-10-09 (ticket #69), in the Editorial Register.** Resolved
with the user: a **type poster** on one white sheet. The split panel, the
ink surface, Anton, the raster lockup and the two-pinks arrangement that
#10 and #28 settled are superseded by the derived design language
(#67, #68; tokens in [`assets/brand/README.md`](assets/brand/README.md)).
The org-only issuer, per-Level behaviour and the client-side pipeline
(#24) are unchanged; the Certificate ID and Verify at line are added
(below).

**Why this one.** Three structures were built as inline SVG and
measured: the navy panel kept (A), a light sheet in the deck's shape
language (B), and a type poster (C). On the default content, mono toner
was 32.9% for A, 3.2% for B and 6.0% for C, so a navy panel costs about
five times the toner of C. A is also the only one that misprints on a
home inkjet: the printer cannot reach the edge, so a full-bleed panel
comes out with an uneven white border and the panel goes near-black in
greyscale. B kept the deck's look but its blobs and card tints are pale
enough to print as almost nothing. C stays a poster through scale and
navy rules, and its content sits inside the printable area.

**Layout** (all measures are in the 1123 by 794 viewBox, which is A4
landscape, so one unit is one CSS pixel at print size):

- White sheet, 72 units of margin left and right. All content sits inside
  15 mm (57 units) clear on the left and right and 6 mm (23 units) top
  and bottom, so a home printer cannot clip it. This holds for all text
  and rules; only the ghost mark bleeds.
- **Ghost V7 mark:** `pink-50` fill with a `pink-line` hairline, 700
  units square at the top right (x 560, y -70), clipped by the sheet.
  Decoration only; text may cross it because `pink-50` may hold text.
- **Wordmark**, top left (baseline y 100): the vector V7 mark in `pink`
  beside SAVE in `teal` and SEVEN in `pink`, Montserrat 800, 30 units.
- **Navy rule**, 3 units, `navy`, across the content width at y 132.
- **Eyebrow** "CERTIFICATE OF COMPLETION": Montserrat 700, 14 units, +1.3
  tracking, `pink`, baseline y 172.
- **Lead-in** "This certifies that": Lexend 400, 20 units, `grey`, y 210.
- **Learner name:** Montserrat 800, `navy`, base 100 units, last line on
  baseline y 410. A name of two or more words is stacked on two lines,
  split at the space that makes the lines most equal, line height 0.98 em;
  one word stays on one line. The size shrinks until the widest line fits
  820 units, to a floor of 44. An SVG does not wrap, so the build measures
  after the fonts load.
- **Body line** "has completed the following Level of Save7 Learn":
  Lexend 400, 20 units, `grey`, y 466.
- **Level pill:** `pink` fill, white Montserrat 800 capitals, 30 units,
  +0.04 em, fully rounded, 68 units high with 30 units of padding each
  side and its width taken from its text, top at y 492. The text is the
  Level name, "Beginner Level", "Intermediate Level" or "Advanced Level".
- **Footer:** a 2-unit `navy` rule at y 640. Labels in Montserrat 700, 13
  units, +1.1 tracking, capitals, `grey`, baseline y 678: ISSUED BY (x
  72), DATE (x 320), CERTIFICATE ID (x 600). Values in Lexend 400, 17
  units, `navy`, baseline y 706: "Save7", the date as "9 October 2026",
  and the public ID (for example `S7-2026-B-000123`). A second row at y
  744: VERIFY AT (x 72) and the address in Lexend 400, 15 units, `navy`
  (x 190), `learn.save7.org/certificate/` plus the ID in the prototype;
  the build supplies the real `verifyUrl`.

**Certificate ID and Verify at line.** The live build prints both and
#10 and #28 never placed them. They are on the artwork (user's call,
2026-10-09), so a printed copy can be checked without anyone knowing
where to look.

**Type:** Montserrat 700 and 800 and Lexend 400, so three font files
embed in the SVG. Nothing on the sheet is under 13 units (about 10 pt on
paper).

**Revoked state.** A full-width band across the middle (y 327 to 467) in
`incorrect` at 93% opacity with REVOKED in white Montserrat 800, 56 units,
+3 tracking, centred. It is unmistakable by design and the text under it
is not meant to be read.

**Per-Level variation:** only the Level-name text changes. No per-Level
colour-coding (#10 stands, and #68 confirmed it).

**Measured.** Every text pair was sampled against the composited pixels
behind it, in all 54 combinations of variant, Level, name length (short,
37 characters, one word) and issued or revoked: 0 failing pairs, and
nothing outside the safe area. Normal text is 4.80:1 or better (`pink` on
white); the pill is white on `pink` at 4.80:1 and clears 3:1 against the
sheet as a graphic. SAVE in `teal` on white is 2.43:1 and stands on the
logotype exception (#39). The audit also caught a real fault in the
prototype, the eyebrow sitting on the ghost mark's outline at 3.7:1,
which is why it sits in the left column.

**Not carried from the current build's sheet:** the pink top rule, teal
corner wedge, sand inner border, the "Level achieved" label, the course
subtitle, and the tagline "One decision can save seven lives." (set in
`teal` on white at 2.43:1). Revisit the tagline only in `teal-ink` or
`navy`.

**Prototypes:** on the `prototype/certificate-layout` branch, not merged
to `main`. This spec does not ship the actual Certificate template or
code, which is build work ([#37](https://github.com/Save7Lives/learn.save7.org-map/issues/37)).

- [`certificate-derived-recut-prototype.html`](https://github.com/Save7Lives/learn.save7.org-map/blob/prototype/certificate-layout/wayfinder/prototypes/certificate-derived-recut-prototype.html)
  the re-cut (#69): three variants as inline SVG, a contrast audit
  measured on rendered pixels, an ink estimate, and a home-inkjet margin
  test. Opens on C. Live once the branch is pushed.
- [`certificate-recut-prototype.html`](https://github.com/Save7Lives/learn.save7.org-map/blob/prototype/certificate-layout/wayfinder/prototypes/certificate-recut-prototype.html)
  the earlier token re-cut (#28), kept as the record of the split panel
  and the two rejected answers to the frozen-raster problem.
- [`certificate-prototype.html`](https://github.com/Save7Lives/learn.save7.org-map/blob/prototype/certificate-layout/wayfinder/prototypes/certificate-prototype.html)
  the original 3-layout mockup (#10).

### Brand Assets

Source of truth: https://save7.org/brand-kit#files. Versioned copy in
this repo at [`assets/brand/`](assets/brand/README.md).

| Token | Hex | Use |
|---|---|---|
| `pink` | `#df0e62` | Hero colour. 4.80:1 on white — clears WCAG AA for normal text. Large text only on ink (3.94:1). |
| `teal-on-ink` | `#16B9B4` | True brand teal. 7.76:1 on ink (AAA). Never on white (2.43:1). |
| `teal-on-white` | `#00807B` | Teal for white surfaces. 4.80:1 — AA for normal text. |
| `white` | `#FFFFFF` | Default background |
| `ink` | `#111111` | Text & dark surfaces |

Typography: **Lexend** (body, UI, captions — `--font-sans`, matching the
live save7.org site) + **Anton** (display only — headlines/numbers,
all-caps, no body copy). Both on Google Fonts, no exceptions.

**Revised 2026-09-21 (ticket #21).** These supersede the `#ED0E69` +
Anton/Inter set this spec originally carried. `#ED0E69` measures 4.31:1
on white and fails AA for normal text; `#df0e62` clears it at 4.80:1 and
is the incumbent `--color-primary` on the live save7.org Astro site.
Inter is dropped in favour of Lexend for the same consistency reason. Two
teals are required because no single colour can clear AA for normal text
on both white and `#111111`. Full reasoning and the Tailwind `@theme`
reset in [`assets/brand/README.md`](assets/brand/README.md).

---

## Open Items

Carried forward for whoever picks this up next — none of these block the
handoff, but they're real gaps worth tracking:

- **The brand rasters are frozen at the superseded pink, site-wide.**
  Surfaced by the Certificate re-cut (#28), which accepted the resulting
  divergence *locally*. The wider question is untouched: every logo PNG
  is `#ED0E6A`, and `Save7-logo-horizontal.png` — the natural site-header
  lockup — is `#ED186B` + `#00B9B5`, a teal that is not either resolved
  teal. A header logo sitting beside a `#df0e62` CTA collides at much
  closer proximity than the Certificate's two panels do. Whether Learn
  ships derived assets, accepts the divergence everywhere, or the brand
  kit is re-issued at the resolved tokens is undecided, and the third
  option is a Save7-wide brand act, not a Learn decision.
- **Multi-language / translation strategy.** South Africa has 11 official
  languages; this spec is English-only.
- **A future build/implementation map** for actually constructing
  learn.save7.org (platform, LMS, code) — starts only after this spec,
  as a separate effort.
- **SA faith/cultural-specific myth breakdown** for Beginner Level's
  Stage 2, myth #5 (currently kept generic).
- ~~**Tissue Bank FAQ direct review**~~ — ✅ **Closed 2026-09-23 (#47).**
  Fetched in full: it does not carry myth #10's three points. They rest on
  the ODF main FAQ, the ODF Cornea FAQ and the SATCS Red File instead, and
  no source uses the phrase "perfect body". See
  [T47 findings §1](wayfinder/research/T47-living-donor-and-eligibility-findings.md).
- **CCSSA/SAJCC determination-of-death guideline is due for review.**
  The guideline sets a 5-year review cycle, making a review due in
  **2026**; no published replacement was found as of the Sept 2026
  research pass. Re-check before Intermediate Stage 1's determination
  content is drafted — that content now rests on it directly rather
  than in a single summary bullet. **Re-checked 2026-09-24 (#48):** a
  web search still found no revised or replacement guideline, and Stage 1
  was drafted against the 2021 text; the CCSSA's own guidelines page
  could not be loaded, so the check is incomplete and the item stays
  open ([T48](wayfinder/research/T48-intermediate-sources-findings.md) §2).
- **Draft Regulations on Organ Transplantation (GN 7879, 4 September
  2026)** close for comment around early December 2026. If promulgated,
  revisit Intermediate Stage 3's "recent developments", Stage 1's
  no-legal-duty-to-refer sentence (draft reg 3(4) would create one), and
  Beginner Stage 2's living-donor wording (T47). See
  [T48](wayfinder/research/T48-intermediate-sources-findings.md) §1.3.
- **Deeper ODF/SATS advocacy-toolkit outreach** for Advanced Level's
  Stage 4, if lesson-content drafting later wants more than the ULUNTU
  case-study framing this spec settled for.
- **CPD/HPCSA accreditation** for Advanced Level healthcare-provider
  content — ruled **out of scope** for this effort (an institutional/
  legal process separate from curriculum design); could return as its
  own future effort.

---

## Source Corpus

Reference material grounding this spec, prioritizing South
African-specific guidance:
`/Users/zubayrparak/Desktop/resources/` (10 PDFs + 1 video
as of 2026-09-03, local to the user's machine, not in this repo). Full
per-Level source mapping and citations: [T01 — Beginner](wayfinder/research/T01-beginner-findings.md),
[T02 — Intermediate](wayfinder/research/T02-intermediate-findings.md),
[T03 — Advanced](wayfinder/research/T03-advanced-findings.md),
[T04 — Video review](wayfinder/research/T04-video-review-findings.md).
