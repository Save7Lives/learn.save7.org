---
ticket: T48
title: "Findings: sources for Intermediate Level — legal developments 2024-2026, death determination, HPCSA Booklets 4 and 7, and the opt-in/opt-out evidence"
status: research complete
date: 2026-09-24
---

# T48 Intermediate Level — Research Findings

Source grounding for [Write Intermediate Level content (#48)](https://github.com/zzubyr7x/learn.save7.org-map/issues/48). Per CONTEXT.md this is source material for lesson drafters, not lesson copy. The lessons themselves are in the code repo under `content/intermediate/`, and the Stage Quiz bank's `verifiedAgainst` strings (`prisma/content/quiz-intermediate.ts`) cite the same sources.

## Method notes

- **Labels.** **[SA]** marks a South African primary source (statute, Gazette, Department of Health, provincial policy, HPCSA, SATS/SATCS/ODF, peer-reviewed SA literature). **📌 [non-SA]** is the spec's Source Note.
- **Three research sub-agents were launched and all three stalled** (stream watchdog, no progress for 600s) before writing anything. They had already downloaded most sources into the session scratchpad. Everything below was then read **directly by the parent session** from those downloads and from the Source Corpus. No finding here rests on a sub-agent's summary.
- **Gazette notices** (GN 5360/2024, GN 6055 and GN 6064/2025, GN 7879/2026) are scans with no text layer. Their pages were rendered to images and read visually; the quotes below were checked against those images.
- **Statute and regulations** were read from the gazetted National Health Act (gov.za `a61-03.pdf`, Gazette 26595) and GN R180 (Gazette 35099), via `pdftotext`.
- **SAJCC guideline, Red File, course manual (incl. Western Cape circular H84/2025) and SATS roadmap** were read via `pdftotext -layout` from the Source Corpus and sats.org.za.
- **HPCSA Booklets 4 and 7** were downloaded from hpcsa.co.za and read in full as text.
- **Opt-out evidence** was read from PubMed Central full texts (Rithalia 2009, Shepherd 2014, Noyes 2019, Madden 2020, Rees 2024, McLaughlin 2025) and PubMed abstracts (Arshad 2019, Matesanz & Domínguez-Gil 2019, Matesanz 1994).
- **Not done:** a search for unpublished ministerial directives; a full read of the SAJBL 2024 DCD-legality article (see Gaps).

---

## 1. Legal developments, 2024-2026 [SA]

### 1.1 The "28 February 2025 amendment" in the spec is a misattribution

The spec's Stage 3 bullet named "regulation amendments, most recently 28 Feb 2025", from T02, which took it from the acts.co.za tracker without reading the Gazette. Read directly:

- **Notice 6055, Government Gazette 52388** is dated **28 March 2025**, not 28 February, and it is a **National Treasury** notice under the Public Finance Management Act: "Listing, delisting and change of names of public entities listed in Schedule 3". It has nothing to do with health.
- **GN 1434 of 2017**, whose "Tables 1-4" T02 said were amended, is the *Regulations relating to the Surveillance and the Control of Notifiable Medical Conditions* (15 December 2017, GG 41330). Its Annexure A Tables 1-4 list categories of notifiable conditions.
- The 2025 Health amendment that does exist is **Department of Health Notice 6064, Government Gazette 52391, 27 March 2025**, "Regulations relating to the surveillance and the control of notifiable medical conditions: Amendment", made under s 68(1)(b) read with s 90(4)(c).

**No 2025 amendment concerns organ or tissue donation.** The lesson teaches the correction; the spec is amended (§7).

### 1.2 The Ministerial Advisory Committee on Organ Transplantation (GN 5360, GG 51352, 4 October 2024)

- Established by the Minister "in terms of section 91(1) of the National Health Act … read with sections 91(2)", after consulting the National Health Council.
- §2.1/§3: "The Committee must advise the Minister on all matters related to organ transplantation in line with Section 91(1)".
- §2.2: "The Committee will ensure that problems related to organ trafficking and abuse of potential donors by health practitioners/participants are avoided. It will also ensure that approval to perform organ transplantation which includes foreign nationals is granted by the Minister as a control measure."
- §4.1 composition: one representative of the National Department of Health, one bioethicist, seven nephrologists. §4.2: race, gender and disability representation must be considered. §5.3: five-year terms, renewable once.
- §9 functions: determine the need for transplant facilities; advise on transplants involving unrelated donors and recipients and non-South African citizens; recommend on related living-donor applications where genetic tests fail to confirm the relationship; propose granting authority to units to perform transplantation; monitor unethical behaviour; work with the public and private systems on the cost of transplantation; determine future requirements; appraise transplant units' annual reports; recommend on living transplants between donors and recipients from other countries; recommend on requests to place non-citizens on the waiting list.

### 1.3 Draft Regulations on Organ Transplantation (GN 7879, GG 55299, 4 September 2026) — DRAFT, NOT IN FORCE

T47 §3.3 covered regs 10-11 (unrelated living donors) and the cover page (comments within three months). Read here for everything bearing on deceased donation:

- **reg 1**: "deceased donor" means an organ donor "diagnosed with brain death or circulatory death".
- **reg 3(4)**: health establishments performing donor referrals, donation, removal and transplantation must designate appropriately qualified professionals who must "(a) identify and refer potential donors". **This would create the referral duty that does not exist today** (Red File §3.1: "There is no legal requirement for the referral of a potential donor").
- **reg 4(1)**: typing, organ function, infectious-disease and malignancy screening on all donors, "with risk communicated to any recipients as part of informed consent".
- **reg 6**: a register of every referral, donation and transplant. **reg 8(e)**: facilities report to the national department every 30 days. **reg 15(5)**: monthly returns.
- **reg 9**: licensing of transplant units; the Director-General to publish licensing criteria within 12 months of promulgation.
- **reg 13**: non-citizen living donors or recipients need the Minister's written approval.
- **reg 14**: "The health care provider that removes organs from a deceased donor is responsible for the physical reconstruction of the appearance of the deceased donor after the removal procedure."
- **reg 15(1)**: allocation of deceased-donor organs "may not take into account the race, religious beliefs and political affiliation, culture, language, gender, sex, sexual orientation, disability, ethnic, social origin, birth, conscience or any other aspect of the deceased person's life that has no bearing on the physical state or quality of the organ in question."
- **reg 16**: authorisation to allocate organs (public establishments exempt but must notify); **reg 16(5)**: contravention punishable by fine or imprisonment up to ten years.
- **reg 19**: no one may offer a donor or other party a reward except as s 60 provides.
- **reg 20**: donor and recipient identities may not be published without written consent.

Nothing in the draft changes the consent model, the s 62 order, or Regulation 9.

### 1.4 The statute and the 2012 regulations, verbatim where the lessons rely on them

- **NHA s 1**: "'death' means brain death"; "tissue" includes an organ.
- **NHA s 62(1)(a)**: a person competent to make a will may donate "(i) in the will; (ii) in a document signed by him or her and at least two competent witnesses; or (iii) in an oral statement made in the presence of at least two competent witnesses". **s 62(2)**: "In the absence of a donation under subsection (1)(a) or of a contrary direction given by a person whilst alive, the spouse, partner, major child, parent, guardian, major brother or major sister of that person, in the specific order mentioned, may … donate". **s 62(3)**: the Director-General may donate specific tissue if none of those persons can be located, and only after all prescribed steps to locate them. **s 65**: revocation in the same way, or by destroying the will or document.
- **NHA s 7(1)(b)** (consent to *treatment* for a user who cannot consent): "the spouse or partner of the user or, in the absence of such spouse or partner, a parent, grandparent, an adult child or a brother or a sister … in the specific order as listed". **This differs from the s 62(2) donation order**, and the lesson teaches the difference.
- **NHA s 60(4)-(5)**, **s 61(1)-(3)**, **s 66(1)-(2)** read and quoted in the lesson and study guide.
- **GN R180 reg 9** quoted verbatim in the lesson; eye-tissue proviso confirmed; **no rule about interns** anywhere in R180.
- **GN R180 reg 14(3)**: "If a person who has died has in her or his will or in a document donated tissue of her or his body, a medical practitioner **may** act upon that will or document if on the face of it appears to be legally valid." Permissive, not mandatory.

### 1.5 Registration and the law-practice gap

- **Red File p.11 [SA]**: "Registering as a donor does not mean that the donor's organs will automatically be donated at the time of death … Consent from the next of kin is always a requirement before a donation can take place."
- **SATS roadmap §2.4 [SA]**: "The Organ Donor Foundation Registry only represents an expression by an individual of their intent to donate and these registries are not available to consent requestors, as families are always approached for consent in all cases where there is a potential donor."
- ODF registration is an online form, a follow-up call and a mailed donor card (Red File p.11). **Whether a registration by itself amounts to a s 62(1) donation was not settled by any source read here.** The lesson does not claim either way; it teaches the statute and the practice side by side.

---

## 2. Death determination: the SAJCC guideline checked against the spec [SA]

Thomson D, et al., *South African guidelines on the determination of death*, S Afr J Crit Care 2021;37(1b):41-54 (Source Corpus `SAJCC-37-1-466.pdf`).

- **Preconditions (§3.1)**: established aetiology compatible with complete and irreversible loss of all brain function; minimum temperature; blood pressure targets; exclusion of CNS-depressant drug effect; correction of severe metabolic, acid-base and endocrine derangements. Matches the spec. Values are not taught.
- **Clinical testing (Table 2)**: coma (no grimacing, facial movement or non-spinal motor response); brain-stem reflexes "comprises examination of the cranial nerves": pupillary light (II, III), corneal, pain in the trigeminal distribution (supra-orbital pressure), vestibulo-ocular (cold caloric), gag, cough; apnoea test "only proceed … if all above reflexes are absent". Matches the spec. The lesson's "each reflex tests a different set of nerves running through the brainstem" rests on the cranial-nerve framing.
- "There is no documented case of a person who fulfils the preconditions and criteria for brain death ever subsequently developing any return of brain function." "Death determination is a clinical diagnosis which can be made with complete certainty provided that all preconditions are met."
- **Circulatory death (§4)**:
  - preconditions: CPR inappropriate, CPR failed, or life-sustaining treatment withdrawn; treatment may be withdrawn because non-beneficial and not in the patient's best interest, or per an advance directive, or per the legal surrogate;
  - "observed … for a minimum period of five minutes to establish that irreversible circulatory arrest has occurred";
  - "Any spontaneous return of circulatory or respiratory activity during the five-minute observation period should prompt a reset of the observation period from this point", and is "not an indication to begin resuscitation" where that was judged inappropriate;
  - then "the absence of pupillary responses to light and of any motor response to supra-orbital pressure should be confirmed. The time of death is recorded as the time at which these criteria are fulfilled";
  - "It is inappropriate to initiate any intervention that has the potential to restore cerebral perfusion after death has been confirmed";
  - "In cases where organ donation after circulatory death takes place, a second doctor is required to certify the death." Fig. 4: one with more than five years' experience, neither involved with the transplant team.
- **The "why the wait" reason.** The guideline does not state in words that "past five continuous minutes a heart does not restart". It sets five minutes as the period that establishes irreversibility and resets the count on any spontaneous return, citing the autoresuscitation literature (refs 58-59: Sheth et al.; Hornby et al., systematic review). **The lesson follows the guideline's framing** and teaches the reset rule. The spec's phrasing is amended to match (§7). No 📌 note is needed, because the lesson imports no non-SA figure.
- **Referral timing (§5)**: assess donation potential with the transplant co-ordinator "when the treating team makes a decision to perform brain-death testing or to initiate discussions with the family to withdraw life-sustaining treatment", allowing clarification "prior to end-of-life discussions"; exploring donation wishes is "a standard of care".
- **Accommodation and second opinion (§3.7)**: accommodation reasonable for a finite, brief period, timeframe given in advance, "ordinarily … not … greater than 24 hours"; ending somatic support is "ethically and legally appropriate" once the family has been counselled and donation explored; "An additional clinician in the hospital can provide the family with a second opinion regarding determination of brain death"; support discontinued if the bed is needed for a living patient and no other is available.
- **Red File bedside summary**: "An EEG is not required"; its criteria add an atropine test and say the second doctor "may not be an intern". Neither is in the guideline or in Regulation 9.

**Guideline currency (spec Open Item).** A web search on 2026-09-24 found no revised or replacement guideline; the 2021 publication remains the current one ([PubMed 37214191](https://pubmed.ncbi.nlm.nih.gov/37214191/), [SciELO](https://scielo.org.za/scielo.php?script=sci_arttext&pid=S1562-82642021000100001)). The CCSSA's own guidelines page timed out, so the check is incomplete.

## 3. DCD in South African practice [SA]

Western Cape Government Health circular H84/2025 (course manual, 2025), §11 and the DCD procedure section:

- "After an independent decision by the treating team to palliate a patient on mechanical ventilatory support with compassionate extubation and in alignment with principles of palliative care, it is appropriate to consider organ donation".
- If the family consents, supportive care continues while retrieval is prepared; withdrawal with two doctors immediately available; declaration "by two doctors independent of the transplant team (and one with more than 5 years' experience)".
- "The palliative care process happens independently and no action is taken to hasten the dying process."
- Theatre teams "stand down and DCD organ recovery will be deemed not possible if after a prespecified period of time … it is felt the donor will not arrest. Palliative care will then continue … by the treating team … and the family informed".
- The family may be present at withdrawal. "Given donation after circulatory death is relatively unfamiliar at present, a focus on training, advocacy and debriefing is facilitated by the transplant coordinator for every case."

## 4. HPCSA Booklets [SA]

- **Booklet 4**, *Seeking Patients' Informed Consent: The Ethical Considerations*, "REVISED: DECEMBER 2021". **No mention of donation, organs or the dead.**
  - §3.1.1: the amount of information varies with the condition, the treatment's complexity and risk.
  - §3.1.3: information "in a language that the patient understands". §3.4.2.2: "independent interpreters".
  - §6.1: "they must not put pressure on patient to accept their advice". §6.2: declare conflicts of interest.
  - §8.3.2.2: the s 7 order of surrogates.
  - §11: practitioners "must check how well the patients have understood … and not simply rely on the form in which their consent has been expressed or recorded".
- **Booklet 7**, *Guidelines for the Withholding and Withdrawing of Treatment*, "REVISED: SEPTEMBER 2025". **No mention of donation** (its one "transplantation" hit is in an annexure).
  - §2.2: the aim that patients "can die with dignity"; an intervention whose "primary intention is to end the patient's life is both contrary to the ethics of health care and unlawful".
  - §2.3: withholding does not exempt the duty to relieve the terminal phase.
  - §2.5: no prejudice on "age, disability, race, colour, culture, beliefs, sexuality, gender, lifestyle, social or economic status".
  - §3.3: discussions "calm, honest, respectful, and compassionate". §3.4: close family consulted, patient's best interests.
  - §3.5: "never act in haste". §3.6: futile-treatment requests and transfer. §3.7: independent clinical or ethical review, then legal advice.
  - §4.1: the senior practitioner decides. §4.2: "It is not the health practitioner's duty to prolong life at all costs". §4.3: explain the death to family. §4.4: respect cultural practices.
  - §5.2: "Patient and family members also have the right to seek a second opinion".
- **No HPCSA booklet is dedicated to donation.** All booklets in the downloaded set were grepped: Booklet 4 has 0 hits; Booklet 17 has 0 hits.

## 5. Opt-in versus opt-out: the international evidence 📌 [non-SA]

- **Rithalia A, et al., BMJ 2009;338:a3162** (systematic review): "Presumed consent alone is unlikely to explain the variation in organ donation rates between countries. Legislation, availability of donors, organisation and infrastructure of the transplantation service, wealth and investment in health care, and public attitudes … may all play a part".
- **Shepherd L, et al., BMC Med 2014** (panel study, 48 countries): deceased donors higher under opt-out (14.24 vs 9.98 pmp) but living donors lower (5.49 vs 9.36); total kidneys and livers transplanted higher under opt-out.
- **Arshad A, et al., Kidney Int 2019;95:1453** (35 OECD countries, 2016): no significant difference in deceased donors or transplant rates; opt-out "independently predictive of fewer living donors".
- **Noyes J, et al., BMJ Open 2019** (Wales, soft opt-out from 1 December 2015): "has not resulted in a step change in organ donation behaviour"; "Concerns about a potential backlash and mass opting out were not realised".
- **Madden S, et al., Anaesthesia 2020**: Welsh family consent rose relative to England, reaching significance after 33 months (68% vs 65% overall; adjusted OR 2.1).
- **McLaughlin L, et al., Transplantation 2025** (evaluation of England's 2019 Act, implemented May 2020): "the ambitions of a 'soft' opt-out have yet to be realized in either Wales or England. Consent rates have not yet increased".
- **Matesanz R, Domínguez-Gil B, Kidney Int 2019** (ONT): "there are no clear examples of countries with a real sustained increase in organ donation after modifying the law". **Matesanz R, et al., Clin Transplant 1994**: "In each potential donor hospital there is a transplant coordination team". **Rees K, et al., Transpl Int 2024**: Spain "the world's leading country with an opt-out system".
- The **year of Spain's opt-out law (1979)** was not verified in these sources, so the lesson does not give it.

## 6. South Africa: consent model, access and equity [SA]

- **SATS roadmap**, core assumptions of the national workshop (p.101-102):
  - "In the current context of sustained low deceased donor consent rates and low levels of public awareness and understanding of organ donation, no evidence exists to support an assumption of majority presumed consent."
  - "The act of organ donation should be financially neutral … Payment of funeral costs of donor family are therefore not an ethical solution".
  - All families "should be given the opportunity to consider the option of donation as part of optimal end-of-life bereavement care".
  - About the document: the report of the SATS/ISODP multidisciplinary workshop, 4-5 September 2019, compiled by Thomson, Reyneke, Muranda, Peters and Hardy. The PDF's metadata dates it 2021-2023. **The lessons cite it without a year**, correcting the "2024" in the first draft.
- **Etheredge HR, Risk Manag Healthc Policy 2021;14:1985-1998** (Wits Donald Gordon; already cited by the Baseline): little difference between the systems in isolation.
- **Access (roadmap §2.1)**: "Organ transplantation is more easily available to people in urban centres and those with the means to access private health care"; "Transplantation services in South Africa are confined to large urban areas in wealthier provinces". There are 21 transplant centres "including three cornea and eye banks, one heart valve bank and one multi-tissue (bone, skin and cornea) bank", and 14 kidney, 6 heart, 4 lung, 4 liver and 1 pancreas programme.
- **Consent rates (roadmap §2.4)**: Western Cape 1 May 2017 - 1 May 2018, 23% (n = 74) in the state sector against 55% (n = 9) in the private sector. The private sample is tiny; the lesson says only "far below".
- **Coordinators (roadmap §2.2)**: "the key point of contact between the bereaved family, the clinical team and the transplant team"; the role is not formally defined and there is no accredited national training.
- **Western Cape circular H84/2025 §18**: no community excluded; background never a reason to skip the conversation (already cited by the Baseline as `WC_EQUALITY`).
- **Extended criteria**: Red File p.20, as verified in T47 §4.2.

## 7. Drafting decisions and spec corrections

1. **Stage 3's "recent developments"** teaches MACOT (2024) and the draft regulations (2026, not law), plus the correction of the phantom 2025 amendment. The spec bullet is amended.
2. **Stage 1's "why the wait"** follows the guideline: five minutes establishes irreversibility, and any return resets the count. The spec's "past five continuous minutes it does not" is amended to the guideline's framing, under the factual-accuracy exception.
3. **Stage 1 adds the DCD second-doctor rule** and the no-intervention-after-death rule. Both are in the guideline, and they close the fear the spec's reasoning targets.
4. **Stage 2 teaches the s 7 / s 62 contrast** and s 62(3), and states plainly that no HPCSA guideline addresses donation.
5. **Stage 4's second-opinion and accommodation content** comes from the SAJCC guideline §3.7 as well as Booklet 7.
6. **The Red File's legal summary is not used for legal claims.** It still uses "state pathologist or district surgeon", "medical superintendent", a four-relative next-of-kin list and a "no interns" rule, all superseded or unsupported. It is cited only for practice.

## 8. Flagged gaps

- **G48a.** The SAJBL 2024 article on the legality of DCD was cited by title only. The lesson says it "argues" DCD is lawful and consistent with Chapter 8; its reasoning was not read.
- **G48b.** Whether an ODF registration is itself a valid s 62(1) donation is unresolved in the sources read. Slabbert & Venter (De Jure 2019) was not re-read here.
- **G48c.** The CCSSA guidelines page could not be loaded; a revision in progress can't be ruled out.
- **G48d.** The draft Regulations on Organ Transplantation close for comment around early December 2026. **Re-check before Advanced Stage 3 is drafted, and revisit Intermediate Stage 3 and Stage 1's referral sentence if they are promulgated.**
- **G48e.** No source was found for the year of Spain's opt-out law, so the lesson omits it.

## Sources consulted

- National Health Act 61 of 2003, Government Gazette 26595, 23 July 2004: https://www.gov.za/sites/default/files/gcis_document/201409/a61-03.pdf
- GN R180, Government Gazette 35099, 2 March 2012 (via SATS/Sabinet reproduction)
- Department of Health Notice 5360, Government Gazette 51352, 4 October 2024 (MACOT)
- National Treasury Notice 6055, Government Gazette 52388, 28 March 2025; Department of Health Notice 6064, Government Gazette 52391, 27 March 2025; GN 1434 of 2017 (acts.co.za listing)
- Department of Health Notice 7879, Government Gazette 55299, 4 September 2026: https://www.gov.za/sites/default/files/gcis_document/202609/55299gon7879.pdf
- Thomson D, et al., SAJCC 2021;37(1b):41-54: https://pmc.ncbi.nlm.nih.gov/articles/PMC10193841/
- SATCS, *Organ and Tissue Donation Reference File* (Red File), Source Corpus Document H
- *Excellence in Deceased Donation – Course Manual (Updated 2025)*, incl. Western Cape circular H84/2025, Source Corpus
- SATS, *Organ and Tissue Donation in South Africa: Creating a National Strategy Roadmap* (sats.org.za)
- HPCSA Booklet 4 (rev. December 2021) and Booklet 7 (rev. September 2025): https://www.hpcsa.co.za/
- Rithalia 2009: https://pmc.ncbi.nlm.nih.gov/articles/PMC2628300/ · Shepherd 2014: https://pmc.ncbi.nlm.nih.gov/articles/PMC4175622/ · Noyes 2019: https://pmc.ncbi.nlm.nih.gov/articles/PMC6500329/ · Madden 2020: https://pmc.ncbi.nlm.nih.gov/articles/PMC7496553/ · Rees 2024: https://pmc.ncbi.nlm.nih.gov/articles/PMC11256218/ · McLaughlin 2025: https://pmc.ncbi.nlm.nih.gov/articles/PMC11927441/
- Arshad A, et al., Kidney Int 2019;95(6):1453-1460 (PMID 31010718); Matesanz R, Domínguez-Gil B, Kidney Int 2019;95(6):1301-1303 (PMID 31122708); Matesanz R, et al., Clin Transplant 1994;8(3 Pt 1):281-286
- Etheredge HR, Risk Manag Healthc Policy 2021;14:1985-1998, DOI 10.2147/RMHP.S270234 (as cited in `questions-baseline.ts`)
