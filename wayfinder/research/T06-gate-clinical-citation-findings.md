---
ticket: T06
title: "Findings: cite-or-cut audit of the 20 clinical gate questions"
status: research complete
date: 2026-09-22
issue: 34
---

# Clinical Gate Question Citation Audit — Findings

Audits the twenty `scope = 'GATE'`, `gate = 'clinical'` questions (`c1`–`c20`) that sit in
`learn_review_items` at severity 3, uncleared, against the Source Corpus and the citations
they already carry. Feeds the Save7 sign-off that
[#34](https://github.com/zzubyr7x/Learn.save7.org/issues/34) requires.

**No review item was cleared and no question was edited.** `transplant-alchemy/HANDOVER.md` §7
forbids clearing a content-review item in code; this pass only establishes what each question
is actually worth, so Save7 can sign off or cut with the evidence in front of them.

**Update, 2026-09-22:** the five questions the first pass left open (`c10`, `c11`, `c14`, `c15`,
`c16`) have now been read against their own named primary sources — ISHLT/Mehra 2016, AHA/Canter
2007, NEJM/Mazzaferro 1996, Am J Transplant/Merion 2005, and KDIGO 2020 — plus South African
practitioner sources for the two SA-relevance questions (`c14`, `c16`). See the updated buckets
D–F below and the summary table. All twenty questions now carry a resolved recommendation.

## Headline: the premise was wrong

HANDOVER.md §6 and `prisma/content/questions-gate.ts`'s file comment both say the twenty items
"assert MELD thresholds, peak-VO2 figures, Milan criteria and HPCSA registration rules that
**no supplied source backs**." Read against the data and the corpus, that is inaccurate in
four ways:

1. **Nine of the twenty already carry specific, checkable citations** (`c1`–`c5`, `c17`–`c20`)
   — the National Health Act 61/2003 with Regulation 9 of GN R180, Thomson *et al.* SAJCC 2021,
   and de Jager *et al.* SAMJ 2019. Only **eight** (`c9`–`c16`) carry the non-citation
   `"Reviewed 23 August 2026 against standard published listing criteria for this organ"`,
   which names no source at all. Three more (`c6`–`c8`) name an organisation but no document.
2. **Several of the supposedly unsourced thresholds are backed verbatim by papers already in
   the corpus** — `weill-2015-lung-candidate-selection.pdf` states `c12`'s and `c13`'s figures
   exactly, and `satcs-red-file.pdf` states `c7`'s and `c8`'s exactly. The citations were never
   attached; the sources were there all along.
3. **There is no HPCSA question.** `c1`'s five-years-since-registration rule is a **National
   Health Act Regulation 9** requirement, not an HPCSA registration rule, and it is cited. The
   map has already independently verified this exact rule in
   [#27](https://github.com/zzubyr7x/Learn.save7.org/issues/27), including the correction that
   the five years attaches to *one* of the two doctors.
4. **MELD and Milan are the real gap** — and a narrower one than "twenty questions". The string
   `MELD` appears **zero** times across the entire corpus. `Milan` appears three times, all of
   them the surname "Milano C" in author lists, never the Milan criteria.

## Method

- All twenty questions pulled from `learn_questions` joined to the keyed `learn_choices` row on
  the shared Supabase project (`zbaoziisqroqxfwcnhlb`), read-only.
- `verifiedAgainst` strings cross-checked against `prisma/content/questions-gate.ts` in
  `transplant-alchemy` — the two agree.
- Corpus read directly: the ten PDFs in `transplant-alchemy/public/resources/`. Note that
  CONTEXT.md's Source Corpus path (`Desktop/Save7 Course/resources/`) **does not exist** on this
  machine; the live corpus is at `transplant-alchemy/public/resources/`, with
  `Desktop/Save7 Course/source-material/` holding the unprocessed originals. Flagged separately.
- Where a source is named but not held locally, that is stated as such. **No threshold below is
  asserted from model knowledge**; claims I could not check against a document in hand are
  marked "needs direct read" rather than confirmed.

## Where the questions actually came from

`transplant-alchemy-101-study-guide.pdf` is the proximate source for the organ-indication
questions, and its own reference list names the primary sources the gate questions never cite:

| Named in the study guide's references | Backs | In corpus? |
| --- | --- | --- |
| Mehra *et al.* 2016, ISHLT listing criteria for heart transplantation, *JHLT* 35(1):1–23 | `c9`, `c10` | No |
| Canter *et al.* 2007, *Circulation* 115(5):658–676 (AHA paediatric statement) | `c11` | No |
| Mancini & Lietz 2010, *Circulation* 122(2):173–183 | `c9`, `c10` | **Yes** |
| Weill *et al.* 2015, *JHLT* 34(1):1–15 (ISHLT lung consensus) | `c12`, `c13` | **Yes** |
| SATCS *Organ and Tissue Donation Reference File* (Red File) | `c6`, `c7`, `c8`, `c17` | **Yes** |
| AMBOSS *Transplantation*, accessed 10 Feb 2026 | `c14`, `c15` (only trace) | n/a — tertiary |

The study guide itself is a **tertiary** document. Under the primary-source standard this map
holds ([#2](https://github.com/zzubyr7x/Learn.save7.org/issues/2)/[#3](https://github.com/zzubyr7x/Learn.save7.org/issues/3)/[#4](https://github.com/zzubyr7x/Learn.save7.org/issues/4)/[#6](https://github.com/zzubyr7x/Learn.save7.org/issues/6)),
"the study guide says so" is not a citation — but its reference list is a map straight to the
sources that are.

---

## Per-question verdicts

### A. Already cited — recommend sign-off as-is (8)

`c1`, `c2`, `c3`, `c4`, `c5`, `c18`, `c19`, `c20`

- `c2`–`c5` (brain-death prerequisites, apnoea test, confounders, brainstem reflexes) cite
  Thomson *et al.* SAJCC 2021, which **is** in the corpus
  (`sa-guidelines-determination-of-death-sajcc.pdf`).
- `c1`, `c18`, `c20` cite the National Health Act directly. `c1` is further corroborated by
  #27's independent read.
- `c19` (maintain haemodynamic stability post-certification) cites de Jager *et al.* SAMJ 2019,
  not held locally, but the claim is a generic donor-management statement carrying little risk.

### B. Backed by a supplied source — attach the citation, then sign off (5)

| Q | Claim | Supplied source that states it |
| --- | --- | --- |
| `c7` | Cornea exclusions: HIV/TB, leukaemia/lymphoma, prior laser surgery; cataracts do **not** disqualify | Red File p.41 — **verbatim match** |
| `c12` | COPD: BODE ≥7 or FEV1 <15–20% predicted | Weill 2015, "Timing of listing" — **verbatim match** |
| `c13` | IPF: FVC decline ≥10% or DLCO decline ≥15% over 6 months | Weill 2015, "Timing of listing" — **verbatim match** |
| `c17` | GCS ≤4 mandates referral | Red File §2.4 — **verbatim match** |
| `c9` | NYHA IV with EF <20% | Mancini & Lietz 2010 (LVEF ≤20%, NYHA IV) + study guide |

Two small precision gaps worth fixing while the citation is attached:

- **`c17`** — the Red File says GCS ≤4 *"in a patient with a catastrophic brain injury"* and
  *"not explained by sedation"*. The keyed answer drops both qualifiers. As written it implies
  any GCS ≤4 triggers referral, including a sedated patient.
- **`c9`** — source says LVEF **≤**20%; the question says **<**20%.

### C. Backed by a supplied source, but the answer is *weaker* than the source (2)

- **`c6`** (extended/marginal criteria: donor age, comorbidity, organ-specific ischaemic time) —
  the Red File and study guide both cover extended-criteria donors with hypertension, diabetes
  and HIV. The substance holds; the citation should move off "Centre for Tissue Engineering"
  onto the Red File.
- **`c8`** (heart valve donation) — the exclusion half (cause of death unknown, direct cardiac
  trauma) matches the Red File exactly. But the age half hedges — *"age limits are set by the
  tissue bank"* — and the explanation tells the reader to *"quote the bank's own criteria rather
  than a remembered range"*, when the Red File states the SA range plainly: **6 months up to and
  including 55 years**. A previous reviewer softened this away from a figure the corpus actually
  supports. Recommend restoring the range and citing the Red File.

### D. Primary source now read — sign off with citation (2)

The five items formerly left open (issue #34's reopening comment, 2026-09-21T20:06:55Z) have now
been resolved against the actual primary sources rather than the study guide's tertiary echo of
them. Two clear the bar outright:

- **`c15` — Milan criteria.** Primary source: Mazzaferro V, Regalia E, Doci R, *et al.* "Liver
  Transplantation for the Treatment of Small Hepatocellular Carcinomas in Patients with
  Cirrhosis." *N Engl J Med.* 1996;334(11):693–700 (full text read at nejm.org; **note the page
  range correction** — it is 693–**700**, not 693–699 as bucket E previously had it). The
  methods section states the eligibility criteria verbatim: *"the tumor could not exceed 5 cm in
  diameter"* for a single HCC, and for multiple tumors *"there could be no more than three
  tumors, none exceeding 3 cm in diameter."* Exclusion: *"Patients in whom tumor invasion of
  blood vessels or lymph nodes was evident or suspected preoperatively were excluded."*
  The course's stated criteria (single ≤5 cm, or up to three each ≤3 cm, no macrovascular
  invasion) are **accurate as far as they go**, but the source excludes on **nodal** invasion
  too, not just macrovascular — a precision gap worth fixing while the citation is attached, in
  the same vein as `c9`/`c17` in bucket B. **Verdict: cite Mazzaferro 1996 (693–700), add the
  nodal-exclusion clause, sign off.**

- **`c16` — kidney transplant candidacy (CKD5/ESRD).** Primary source: Chadban SJ, Ahn C,
  Axelrod DA, *et al.* "KDIGO Clinical Practice Guideline on the Evaluation and Management of
  Candidates for Kidney Transplantation." *Transplantation.* 2020;104(4S1):S11–S103 (full text
  read at journals.lww.com). Recommendation 1.1: candidates with **CKD G4–G5 (GFR <30
  mL/min/1.73 m²)** expected to progress to ESKD should be "informed of, educated about, and
  considered for" transplantation — i.e., the guideline's real referral trigger is CKD **4–5**,
  not CKD5/ESRD alone. Rec 1.1.1 says refer 6–12 months *before* anticipated dialysis; Rec 1.4.1
  goes further and **recommends pre-emptive transplantation** (before dialysis) once eGFR <10
  mL/min/1.73 m² in adults, "or earlier with symptoms." So the actual guideline is broader and
  earlier than "CKD5/ESRD" implies — it explicitly prefers transplanting *before* a patient
  reaches dialysis-dependent ESRD, not after. **South Africa check**: the SA Renal Society's
  public guideline list (sa-renalsociety.org/guidelines/) has guidelines for chronic dialysis
  care, paediatric dialysis, AKI, and renal palliative care, plus the Declaration of Istanbul on
  organ trafficking — **no SA-specific transplant-candidacy guideline was found**. KDIGO states
  it is "intended to assist health care professionals worldwide," and nothing found contradicts
  it for SA. **Verdict: cite KDIGO 2020 (Rec 1.1/1.1.1/1.4.1), sign off** — no Source Note
  needed (no SA divergence surfaced) — but consider tightening "CKD5/ESRD" toward KDIGO's actual
  GFR-staged referral/pre-emptive-listing language if a precision fix is wanted.

### E. Primary source now read — needs a Source Note, not a cut (1)

- **`c14` — MELD ≥15.** Primary source: Merion RM, Schaubel DE, Dykstra DM, Freeman RB, Port FK,
  Wolfe RA. "The Survival Benefit of Liver Transplantation." *Am J Transplant.* 2005;5(2):307–
  313 (confirmed via publisher abstract/results at onlinelibrary.wiley.com and amjtransplant.org
  — full text paywalled, results confirmed from the published abstract only). Finding: mortality
  in candidates with MELD <15 was *higher* after transplant than for comparable candidates left
  on the waiting list — i.e., transplant is net-harmful below MELD 15. This is the evidence base
  the OPTN used to adopt the **"Share 15" policy in 2005**: MELD/PELD ≥15 candidates get offered
  livers regionally before lower-scored local candidates. That policy is a US **geographic
  organ-sharing administrative rule** (built on OPTN's multi-region donation-service-area
  structure), not a universal clinical indication threshold — this is confirmed from the OPTN's
  own liver-allocation timeline and secondary summaries of the policy's adoption.
  **South Africa check — this reverses the earlier assumption.** Two SA practitioner-level
  primary sources confirm South Africa *does* run MELD-based liver allocation: Dempster M,
  Bouter C, Maher H, *et al.* "Adult liver transplant for hepatocellular carcinoma at Wits
  Donald Gordon Medical Centre in Johannesburg, South Africa." *South African Journal of
  Surgery.* 2019;57(3):Article 3067 — *"all eligible patients are on the same waiting list
  irrespective of payer status and deceased donor organs are allocated on a 'sickest first'
  basis according to the MELD score"* (the article also notes a MELD exception score of 22
  points applied at listing for HCC candidates, mirroring US MELD-exception practice); and
  Loveland J (Head of Transplant Surgery, Wits Donald Gordon Medical Centre; Academic Head of
  Transplantation, University of the Witwatersrand), "From split livers to machine perfusion:
  the 20-year evolution of liver transplants in South Africa," *The Conversation*, 2026 —
  confirms a single combined public/private national-ish waiting list, sickest-first. So **MELD
  itself is not foreign to this audience** — the earlier open-bucket framing that "SA doesn't run
  MELD-based allocation" does not hold up against SA sources. What was *not* found in any SA
  source is the specific **≥15 regional-sharing cutoff** — SA's single combined list doesn't
  appear to have the US's multi-region geography that "Share 15" exists to solve, so that exact
  numeric threshold is still US-policy-specific even though MELD as a concept is SA practice.
  **Verdict: cite Merion 2005 for the survival-benefit finding, and attach a Source Note per
  CONTEXT.md's convention flagging the specific "≥15" figure as drawn from the US OPTN "Share 15"
  allocation policy rather than a clinical threshold or confirmed SA rule** — sign off with that
  note, not a cut, since MELD itself is demonstrably SA-relevant.

### F. Primary source now read — confirmed accuracy defect, cut or rewrite (2) ⚠️

- **`c10` — peak VO2 (adult heart transplant).** Primary source: Mehra MR, Canter CE, Hannan MM,
  *et al.* "The 2016 International Society for Heart Lung Transplantation listing criteria for
  heart transplantation: A 10-year update." *J Heart Lung Transplant.* 2016;35(1):1–23
  (confirmed via the publisher's guideline text and corroborating secondary summaries; full PDF
  behind a 403). The actual criteria are **not** a 10–12 band: *"In the presence of a β-blocker,
  a cutoff for peak VO2 of ≤12 mL/kg/min should be used to guide listing"* (Class I); *"in
  patients intolerant of a β-blocker, a cutoff for peak oxygen consumption of ≤14 mL/kg/min
  should be used to guide listing"* (Class I). A third element exists that the keyed answer
  garbles: *"the percentage of predicted (≤50%) peak VO2 should be used **in conjunction with**
  [not instead of] peak VO2 for young (<50 years) and female patients"* — i.e., it supplements
  the raw cutoff for a specific subgroup, it is not a general "or" alternative for everyone. This
  confirms and sharpens what bucket F previously found via the secondary Mancini & Lietz 2010
  echo: the keyed answer *"Peak VO2 <10–12 mL/kg/min (or <50% of predicted value)"* is wrong on
  three counts — no 10 mL/kg/min lower bound exists in the source; the beta-blocker conditional
  (≤14 off / ≤12 on) that determines which number applies is missing entirely; and the
  50%-predicted clause is mis-stated as a blanket alternative when it is restricted to
  young/female patients and used alongside, not in place of, the raw cutoff. **Verdict: cut or
  rewrite, not sign-off** — confirmed against the primary source, not just its secondary echo.

- **`c11` — paediatric heart transplant indications.** Primary source: Canter CE, Shaddy RE,
  Bernstein D, *et al.* "Indications for Heart Transplantation in Pediatric Heart Disease: A
  Scientific Statement From the American Heart Association..." *Circulation.* 2007;115(5):658–
  676 (full text read at ahajournals.org). The keyed answer names three diagnoses — hypoplastic
  left heart syndrome, severe Ebstein's anomaly, restrictive cardiomyopathy — and none of the
  three survives an unqualified reading:
  - **Restrictive cardiomyopathy** is a genuine Class I indication, but only *"associated with
    reactive pulmonary hypertension"* (Level of Evidence C) — the course drops that qualifier,
    implying RCM alone is sufficient.
  - **Hypoplastic left heart syndrome** is not named as a Class I or IIA indication anywhere in
    the recommendations. The statement's own narrative says the opposite of what the course
    implies: *"these phenomena have led to a **decreased** use of heart transplantation as
    primary therapy for hypoplastic left heart syndrome"* as staged Norwood palliation outcomes
    improved. The closest formal recommendation (Class IIA) covers infants with a **functional
    single ventricle** generally — not HLHS by name — and only when combined with specific
    anatomic red flags (severe coronary artery stenosis/atresia, moderate-to-severe AV or
    semilunar valve disease, or severe ventricular dysfunction). Presenting bare HLHS as *the*
    indication overstates a conditional, narrowing recommendation.
  - **"Severe Ebstein's anomaly"** does not appear anywhere in this statement — a full-text
    search of the article returns zero matches for "Ebstein." This appears to be invented or
    imported from elsewhere, not something this source supports at all.
  One diagnosis is accurate-but-incomplete, one is a significant overstatement of a declining,
  conditional recommendation, and one is unsupported by the named source at all. **Verdict: cut
  or rewrite, not sign-off** — this is the same class of problem as `c10`: a substantive content
  defect, not a missing citation.

---

## Summary for sign-off

| Bucket | Questions | Count | Recommendation |
| --- | --- | --- | --- |
| A — already cited | c1–c5, c18, c19, c20 | 8 | Sign off as-is |
| B — corpus-backed, attach citation | c7, c9, c12, c13, c17 | 5 | Attach source, fix 2 precision gaps, sign off |
| C — corpus-backed, answer too weak | c6, c8 | 2 | Restore the SA figures, cite Red File, sign off |
| D — primary source read, sign off | c15, c16 | 2 | Attach Mazzaferro 1996 / KDIGO 2020, fix 1 precision gap, sign off |
| E — primary source read, needs Source Note | c14 | 1 | Attach Merion 2005, add Source Note on the US-specific "≥15" figure, sign off |
| F — primary source read, accuracy defect | c10, c11 | 2 | **Cut or rewrite** |

**All twenty are now resolved to a recommendation.** Eighteen of twenty are defensible as-is or
become so by attaching a citation (with three firm precision-wording fixes — `c9`, `c17` in
bucket B, `c15` in bucket D — one optional tightening on `c16`, and one Source Note on `c14`).
Two — `c10` and `c11` — are confirmed content defects against their own named primary sources
and should be cut or rewritten, not signed off.

## Carried forward

- **All forty gate questions key to option `'a'`.** HANDOVER §6 flags this; the portal survives
  it by shuffling at render. Out of scope here, and moot for Learn, which does not render GATE
  questions ([#33](https://github.com/zzubyr7x/Learn.save7.org/issues/33)) — but it must not be
  lost if anything ever renders them from stored order.
- **CONTEXT.md's Source Corpus path is wrong.** It reads `Desktop/Save7 Course/resources/`,
  which does not exist. The corpus is at `transplant-alchemy/public/resources/` (10 PDFs, as the
  definition says), with originals under `Desktop/Save7 Course/source-material/`. Two commits
  (`3f4f800`, `a22ff9e`) attempted this correction and it is still wrong.
