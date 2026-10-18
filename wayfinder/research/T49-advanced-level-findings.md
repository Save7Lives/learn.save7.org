---
ticket: T49
title: "Findings: sources for Advanced Level's four Stages (coordinator role, FACTS, consent at depth, public advocacy)"
status: research complete
date: 2026-09-24
---

# T49 Advanced Level — Research Findings

Source material for [Write Advanced Level content (#49)](https://github.com/zzubyr7x/learn.save7.org-map/issues/49). Per CONTEXT.md this is material for lesson drafters, not lesson copy. The lessons themselves are in the code repo at `content/advanced/**` (commit `bedb493`), and every Stage Quiz item's `verifiedAgainst` string names the source it was checked against.

## Method notes

- **Labels.** **[SA]** marks a South African primary source. **📌 [non-SA]** is the spec's Source Note.
- **The Source Corpus was read directly** with `pdftotext`, page by page: the *Excellence in Deceased Donation* course manual (2025, 122 pp.), the SATCS Red File (80 pp.), Han et al. 2017, and the old build's `level-advanced.ts` / `level-intermediate.ts` for salvage. Page numbers below are the manual's PDF pages and the Red File's own printed pages, as T47 used them.
- **External primary sources** were fetched on 2026-09-24 by sub-agents with `curl`, and their text extracted locally, so quotes are verbatim: the National Health Act as gazetted, Act 12 of 2013, the NHI Act 20 of 2023, GN R180, the SA Law Commission's Project 86 report, PMG bill records, odf.org.za, sats.org.za, the Nursing Act 33 of 2005, de Jager et al. 2019, the Wits Transplant Procurement Handbook, and HPCSA Booklets 4, 7 and 17.
- **Blocked:** saflii.org, lawlibrary.org.za and sanc.co.za (Cloudflare challenges). Nothing below rests on them.

---

## 1. The corpus is richer than the #33 salvage notes suggested

#33's salvage notes read the **old build's content files**, not the PDFs. Three of their "absent from the corpus" gaps are in fact covered by the corpus itself:

- **"SNOD never appears in the corpus."** It does. [SA] Western Cape Circular H 84/2025, s1 (manual PDF p.8): "TC – Transplant coordinator (who is a SNOD – Specialist nurse in organ donation)".
- **"Neither 'media' nor 'privacy' occurs."** [SA] The same policy's s19 and s21 *Media* (PDF pp.19–20, the section is printed twice in the source) set out the media protocol: privacy of donor families and recipients "always protected and paramount", anonymous thank-you letters, donor details not actively publicised although the family may choose to, and time before any public relations work "to ensure publicity is remote to an acutely grieving family and possible adverse transplant outcomes".
- **"ULUNTU appears nowhere."** [SA] The Red File's section on the Organ Donor Foundation (printed pp.8–11) describes the *Uluntu Project* in detail. See §6.
- **Capacity, surrogates, advance directives and the best-interests test** are all in the manual's reprints of HPCSA Booklet 4 (PDF pp.86–102) and the palliative care guidelines (PDF pp.104–119). They were missing from the old build's prose, not from the corpus.

## 2. Wits FACTS: the eight steps are verifiable, and the old build's reason for removing them no longer holds

- The old build (`level-advanced.ts` header) removed a numbered eight-step list on 23 August 2026 because it was "taken second-hand from the gated Organ and Tissue Donation Reference File" and "could not be checked".
- **[SA] That file is now `satcs-red-file.pdf` in the Source Corpus.** Its §8.1 (printed p.38) introduces the FACTS excerpt from the *Wits Transplant Procurement Handbook* (excerpt pp.10–24) and gives a mini-index of all eight steps. Excerpt p.10: "Wits FACTS is an 8-step process". The steps: planning; breaking bad news; time-out break; assessing understanding and acceptance of loss; the consent conversation; time-out break; final family discussion; family follow-up, feedback and support. They are exactly the eight the old build had.
- **[SA] The handbook itself confirms it.** 1st edition, September 2019, by Carla Wilmans and Marlize de Jager (editors Etheredge and Fabian). The original URL (`dgmc.co.za/docs/Wits-Transplant-Procurement-Handbook.pdf`) now returns 404. The Internet Archive copy (captured 2019-09-18 to 2024-04-05, one content digest throughout) matches: p.10 "FACTS is an 8-step process"; step headings pp.12–21; Key Do's and Don'ts p.22; both troubleshooting scenarios p.23; donor pause p.24.
- **Decision (with the user, 2026-09-24):** teach the eight steps as FACTS's own, cited to the Red File's excerpt.
- **Key Do's and Don'ts** (excerpt p.22), step by step, and both troubleshooting scenarios (p.23): the family is not to decide to switch off the machines; a family in dispute is helped to reach a decision about what the person would have wanted.
- **The donor pause** (p.24): silent prayer or contemplation, usually twice (ICU with the family invited; theatre before retrieval). The excerpt reproduces an adapted poem. It was **not** reproduced in the lesson, which only says that a short reading may be used.

### de Jager et al., S Afr Med J 2019;109(9):626–631 [SA]

- FACTS began in January 2018 as one transplant procurement coordinator's quality-improvement intervention at Wits Donald Gordon Medical Centre. The authors call it a "proof of concept".
- "Our consent rate increased from 25% (n=6) to 73% (n=35)." The body text makes clear this is **the PI's own conversion rate**; Table 1 gives 35/48 families she approached. The pre-intervention denominator is never stated.
- **Do not quote "referrals increased by 54% (from 31 to 57)".** 31 to 57 is an 84% rise. The paper's percentage and its raw numbers disagree.
- The paper cites NHSBT *Approaching the families of potential organ donors* **(2015)** as FACTS's basis. The Western Cape policy's Appendix 3 cites the **2013** edition. Both were stated as such in the lesson.
- It names the donor pause, and does not number the steps. Its figure shows unnumbered stages.

## 3. The coordinator's role, end to end [SA]

All from Western Cape Circular H 84/2025 (19 June 2025), manual PDF pp.4–28, unless noted:

- **Triggers** (s5; Red File §2.4, p.17): brain death testing decided; catastrophic brain injury with GCS 3–4 (Red File: 4 or less) not explained by sedation; intention to discuss withdrawal with death expected.
- **Timing** (s5): the initial discussion with the coordinator "should occur prior to raising the subject of end-of-life care with the patient's family". Reasons: preventing premature discussions, screening out, checking the national priority list for patients who would accept marginal organs, and checking ODF registration. Treatment is not withdrawn until the donation decision has been clarified by, or with, a coordinator.
- **Authorisations:** Forensic Pathology Services after family consent and before recovery (s7); the medical manager (s8). The Act's term, which Intermediate uses, is the medical practitioner in charge of clinical services.
- **Donor management** (s9): only for a consented brain-dead donor may the transplant team legally take over.
- **Theatre** (s13): organ recovery is an emergency case with priority over elective work; the coordinator is present throughout; DCD stand-down after a pre-specified period, usually one hour.
- **Aftercare** (s13a, s19; FACTS Step 8): viewing after donation, updates on the organs used, anonymous letters, bereavement support, support for families who declined.
- **Audit** (s8, s17): feedback after every referral; every missed potential solid organ donor audited at morbidity and mortality meetings; a debrief after every DCD (s11).
- **Donor pathway** (manual PDF pp.82–83, adapted from Domínguez-Gil et al., Transpl Int 2011): possible → potential → eligible → actual → utilised, with the dead donor rule.
- 📌 **[non-SA]** The Australian OTA guideline (manual PDF pp.64–65) reports consent of 54% with Donation Specialist staff, 33% with other trained staff and 28% with untrained staff, **in "challenging" conversations only** (patient not registered, staff raising donation). Quote it with that qualifier.

### SATCS and the regulator

- **[SA]** SATCS: founded 30 June 2017; a special interest group under the auspices of SATS (Red File p.2; sats.org.za; Code of Conduct PDF, 2019). The Code binds members to "the various codes of conduct expected by The Nursing Act, HPCSA, Declaration of Istanbul". Membership is voluntary. **It is not a statutory regulator.** The spec's Stage 1 objective called it a "governing body", and was corrected in the spec (see §8).
- **[SA]** The South African Nursing Council continues under s2 of the Nursing Act 33 of 2005, and s31 makes registration a prerequisite to practise.
- **Coordinators are nurses: partly verified.** No primary source states it as a rule. The WC policy defines a TC as a SNOD, the SATCS Code requires "the nursing process", and SATS bios show nursing backgrounds. The lesson says "usually experienced nurses, often from intensive care".
- The SATCS committee list on sats.org.za is out of date (the chair has changed). Don't name a chair.

## 4. Consent at depth: the Act, the HPCSA and advance directives [SA]

### National Health Act 61 of 2003 (Gazette 26595, 23 July 2004)

- **ss 7 and 62 are unamended.** gov.za lists two amending Acts, Act 12 of 2013 and the NHI Act 20 of 2023. Both were read in full, and neither touches s 7 or s 62.
- **s 7(1)(a)–(b)**, verbatim: consent by "a person— (i) mandated by the user in writing to grant consent on his or her behalf; or (ii) authorised to give such consent in terms of any law or court order"; else "the spouse or partner of the user or, in the absence of such spouse or partner, a parent, grandparent, an adult child or a brother or a sister of the user, in the specific order as listed".
- **s 8(2)(a):** a person consenting for the user must, if possible, consult the user first.
- **s 62(2):** "the spouse, partner, major child, parent, guardian, major brother or major sister of that person, in the specific order mentioned".
- **The four differences** the lesson teaches, all read off the text: (1) the written mandate has no place in s 62; (2) s 7 puts parent before adult child, s 62 major child before parent; (3) s 7 ranks "spouse or partner" together, s 62 ranks spouse first; (4) grandparent only in s 7, guardian only in s 62.
- **s 65:** a donor may revoke before transplantation, in the same way the donation was made, or by intentionally destroying the will or document. McQuoid-Mason (SAMJ 2012;102(9):733–735, in the manual) *submits* that relatives who consented may also revoke, within good medical practice. That is a commentator's reading, and the lesson presents it as one.

### Advance directives: no statute

- **No Act gives a living will binding force.** The NHA recognises only the s 7 written mandate, a proxy. Parliament's own memorandum on Bill B8-2019 says a living will "is not expressly recognised".
- **SA Law Commission, Project 86, *Euthanasia and the Artificial Preservation of Life*** (November 1998), submitted to the **Minister of Justice** (not Health, as some secondary sources say). Its draft "End of Life Decisions Act 1999" was never enacted. Whether it was ever introduced is unverified.
- **National Health Amendment Bill [B8-2019]** (Ms D Carter, COPE): living wills and a durable power of attorney. Introduced 27 February 2019, lapsed 7 May 2019 (PMG). No later bill appears on PMG's 2024–2026 lists.
- ***Clarke v Hurst NO* 1992 (4) SA 630 (D)**, citation confirmed from the Project 86 report (SAFLII blocked). Withdrawing artificial feeding from a PVS patient was held not unlawful by the community's *boni mores*. The Commission records that "the court's order was, however, not founded on Dr Clarke's directive as expressed in the Living Will".

### HPCSA booklets (hpcsa.co.za/ethics, 2026-09-24)

- **Booklet 4**, *Seeking Patients' Informed Consent*, revised **December 2021**, is still current. Relevant sections: 3.3.2 material risk; 3.4.2.10 duress, coercion, manipulation or impairment invalidates consent; 6 voluntariness and conflicts; 8.1 presumption of capacity; 8.4 mandates and advance statements; 9 best interests; 10 court; 15 a signed form is not sufficient.
- **Booklet 7**, *Guidelines for the Withholding and Withdrawing of Treatment*, revised **September 2025**. Sections: 3.3 directives in writing, "an appropriately drafted 'living will' may be used"; 3.4 close family consulted, best interests; 3.7 independent clinical or ethical review, then legal advice. This is the most current statement on directives and best interests, flagged by the #48 session.
- **The palliative care guidelines are Booklet 17 (2019), not Booklet 1.** The manual's copy has a misprinted cover. The HPCSA-hosted cover and the booklet lists inside Booklets 4 and 7 all say 17. Relevant sections: 7.3 advance directives; 7.3.10–7.3.11 best interests.
- **No HPCSA booklet mentions donation.** Applying Booklet 4 to a family's decision is an application of its principles, and both Intermediate and Advanced say so.

## 5. Privacy: Regulation 24 [SA]

GN R180 of 2 March 2012 (Gazette 35099, pp.93–94), **Regulation 24, "Prohibition of publication of certain facts"**, verbatim, checked against the page images:

> 24. (1) No person shall publish or make known any fact whereby the identity of— (a) a deceased person whose body or any specific tissue thereof has been donated; (b) the donor of the body of a deceased person or any specific tissue thereof; (c) a living person from whose body any tissue, blood or gamete has been removed or withdrawn for any purpose; or (d) the person who has given her or his consent to the removal of any tissue, blood or gametes from a living person for such purpose; may possibly be established, unless consent thereto was granted.

Reg 24(2) protects recipients: a living recipient's written consent, or for a deceased recipient their prior written consent, or (absent objection) a listed relative's written consent. The relatives are listed but not in "specific order" wording. The Gazette misprints reg 24(2) as "may possibly established" [sic]. Reg 25's listed offences do not expressly name reg 24. Amendments to R180 since 2012 were not checked.

## 6. ULUNTU [SA]

- **Red File** (undated; newest reference 2021), printed pp.8–11: "Uluntu, which means Community"; people with "a fear-based understanding due to never receiving factual information", who "may automatically say 'No'"; "the current donor pool is not representative of the South African population"; delivered by "culturally similar and culturally sensitive messengers" in townships, informal settlements and, when funding allows, rural areas, and in state hospitals, clinics and schools.
- **odf.org.za/projects/** (read 2026-09-24): "ULUNTU AWARENESS CAMPAIGN", isiXhosa "Uluntu" meaning "humanity" and "community"; the ODF is "in the process of rolling out" the campaign in vulnerable communities to break through cultural barriers and increase donor consents. The method begins with information gathering with transplant coordinators from feeder hospitals, then community baseline surveys.
- **Status in 2026: unverified.** The site has no dated posts, and every page carries one bulk-rebuild date (2026-08-04) with a ©2022 footer. **No evaluation was found anywhere.**
- **"Proud 2B" is gone** from odf.org.za. Current identity: "SAVE SEVEN LIVES" / "TELL YOUR FAMILY TODAY".

## 7. Han et al. 2017 📌 [non-SA]

Ann Transplant 2017;22:17–23, a single Korean centre, 107 brain-dead potential donors.

- 15 families (14%) decided in 48 hours or more.
- Consent 73% (11/15) against 55% (51/92), p=0.263: "not inferior". This does not show that delay improves consent.
- **The caveat the old build omitted:** "donation failure despite the family's consent was relatively higher in the delayed decision group (27% vs. 16%, p=0.464)". The denominators are whole groups (4/15, 15/92). Across all 19 consented-but-failed donations, the commonest cause was clinical deterioration (10), and consent came too late in 2.
- The lesson reconciles this with FACTS's "decide before you leave the hospital" and Intermediate's accommodation rule (brief, finite, ordinarily no more than a day): time with support, not pressure and not open-ended waiting.

## 8. Spec corrections made

- **Advanced Stage 1, objective (3):** "identify SATCS as governing body" → **professional body**. SATCS is a voluntary special interest group of SATS; the statutory regulator for nurses is SANC.
- **Advanced Stage 2:** the note that FACTS is taught as its own eight steps, citing the Red File's excerpt.

## Gaps

- Whether ULUNTU is running in 2026, and any evaluation of it.
- A primary source stating as a rule that SA transplant coordinators are registered nurses.
- de Jager's pre-intervention denominator.
- Whether GN R180 has been amended since 2012.
- A consolidated NHA from SAFLII, which was blocked; "unamended" rests on gov.za's list and a full reading of both amending Acts.
