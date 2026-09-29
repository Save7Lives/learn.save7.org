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
"Save7" as issuing organisation (org name only — no individual
signatory).

**Layout — bold poster, split panel:**

- **Left panel:** ink (`#111111`) background, holding the full
  "Save7-V7-with-type" lockup **used unmodified, at 200px wide**, and a
  large low-opacity V7-mark watermark. Body copy on this panel is white.
- **Right panel:** white background —
  - "CERTIFICATE OF COMPLETION" eyebrow, `pink` (4.80:1)
  - large ink learner name (Anton)
  - `pink` Level-name pill (Beginner / Intermediate / Advanced), white
    Anton text (4.80:1)
  - footer row: "Issued by / Save7" (left) and date (right) — org-only,
    no individual signatory

Body/UI type is **Lexend**; **Anton** stays display-only (learner name,
Level pill).

**Two pinks, accepted (ticket #28, 2026-09-21).** The brand raster
assets are frozen at the superseded pink — every PNG in `assets/brand/`
measures `#ED0E6A`, and `Save7-logo-horizontal.png` is `#ED186B` +
`#00B9B5`. No CSS reaches those pixels. So the Certificate carries
`#ED0E6A` in the lockup and `#df0e62` in live type, ΔE76 = 4.8 apart.
This is **knowingly accepted** rather than resolved: the two never share
a panel, and the alternative — a derived lockup — is a brand act, not a
styling change. See the wider question in Open Items.

**"WWW.SAVE7.ORG" is solved by scale, not colour.** It is not live text:
it is pink pixels baked into the lockup PNG, 120px of a 1570px-tall
image, so it cannot "become white" without deriving a new asset.
Rendering the lockup at **200px** instead of 150px lifts its cap height
from ~12px to ~16px (≈22px bold equivalent), clearing the 18.66px-bold
AA-Large threshold at 4.38:1. The 200px width is therefore **load-bearing
for accessibility**, not a visual preference — do not shrink it.

**Level pill — checked, no change needed.** White on `#df0e62` is 4.80:1,
clearing AA for normal text outright and AA-Large with room at 20px
Anton. The pill *fill* against the white panel is also 4.80:1, well past
the 3:1 that WCAG 1.4.11 asks of a graphical object.

**Per-Level variation:** only the Level-name text changes — no
per-Level colour-coding, since the brand kit's palette is deliberately
restrained to one hero colour (pink) plus teal reserved for dark
surfaces.

**Prototypes:** both on the `prototype/certificate-layout` branch, not
merged to `main` — this spec doesn't ship the actual Certificate
template/code, which is downstream build work.

- [`certificate-prototype.html`](https://github.com/zzubyr7x/Learn.save7.org/blob/prototype/certificate-layout/wayfinder/prototypes/certificate-prototype.html)
  — the original 3-layout mockup that settled the split panel (#10).
- [`certificate-recut-prototype.html`](https://github.com/zzubyr7x/Learn.save7.org/blob/prototype/certificate-layout/wayfinder/prototypes/certificate-recut-prototype.html)
  — the token re-cut (#28), carrying a live contrast readout and the two
  rejected answers to the frozen-raster problem (a derived white lockup,
  and a derived teal one).

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
