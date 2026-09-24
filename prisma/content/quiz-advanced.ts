/**
 * Advanced Level Stage Quiz banks — 60 questions, 15 per Stage.
 *
 * Written for ticket #49 against the four Stages' Markdown under
 * `content/advanced/`. Nothing here tests a fact the lessons do not teach, and
 * nothing tests a fact the course cannot source.
 *
 * **Depth is deliberate.** Advanced items sit at difficulty 2–3 and lean on
 * scenarios, because the Level's objectives ask learners to apply what they
 * know. The Level's audience boundary still holds: healthcare-adjacent, not
 * clinical, so nothing here tests donor management, brain-death testing
 * technique or any other clinical protocol.
 *
 * **Stage 2 applies FACTS by role.** Learners are tested on the Do's and
 * Don'ts that fall to anyone near a family — referral, timing, the words to
 * avoid — and on understanding the coordinator's steps. No item treats the
 * learner as the person who asks for consent. That boundary was decided with
 * the user on #49, together with teaching FACTS's eight steps as FACTS's own:
 * the old build had removed them as "second-hand from the gated Red File", and
 * the Red File is now in the Source Corpus.
 *
 * **No Baseline item is reused.** The six Advanced Baseline items in
 * `questions-baseline.ts` touch some of the same topics (the coordinator's
 * timing, SATCS, decoupling, the machine misconception, surrogate decisions,
 * equity), so every item here approaches them from a different angle. A
 * question a learner can retry without limit here would measure memory, not
 * learning, when they sit the Baseline again.
 *
 * Correct answers are spread across all four positions in every bank. Keep
 * them spread when editing — `assertBankIsWellFormed` refuses a bank that keys
 * over half its answers to one position.
 */

import type { StageQuizBanks, StageQuizQuestion } from "./quiz";

// Sources, named once and shared by the items they actually back.
const WC_POLICY =
  "Western Cape Department of Health and Wellness, 'Organ and Tissue Donation Policy in the Western Cape', Circular H 84/2025 of 19 June 2025, reproduced in the Excellence in Deceased Donation course manual (2025), PDF pp.4-28: s1 (TC = SNOD, specialist nurse in organ donation); s5 (clinical triggers; the initial discussion with the transplant coordinator should occur prior to raising end-of-life care with the family; reasons: premature discussions, screening out, national priority list for marginal organs, ODF registration; life-sustaining treatment not withdrawn until the donation decision is clarified with a coordinator); s6 (approaching the family); s7 (Forensic Pathology Services authorisation after family consent, before recovery); s8 (medical manager authorisation; missed opportunities to M&M); s9 (only for a consented brain-dead donor may the transplant team legally take over donor management); s12 (tissue donation coordinator on call 24/7); s13 (theatre priority; coordinator present throughout recovery; DCD stand-down, usually 1 hour; viewing after donation); s17 (feedback after every referral; all missed potential solid organ donors audited at M&M); s19/s21 (anonymous thank-you letters, bereavement support)";
const RED_FILE_ROLE =
  "SATCS, 'The Organ and Tissue Donation Reference File' (the Red File): 'Who we are', printed p.2 (SATCS founded 30 June 2017 as a special interest group under SATS; Code of Conduct; aim to educate, develop and support all transplant coordinators; the Red File placed in EDs and ICUs); s2.4, p.17 (three clinical triggers: brain death testing decided; catastrophic brain injury with GCS 4 or less not explained by sedation; withdrawal of organ support with death expected); s3.1, p.18 (no legal requirement to refer); s3.2.3, p.19 (primary treatment team remains responsible for communicating diagnosis and prognosis; consent obtained by the transplant coordinator where possible); s4.3, p.22 (referral is the responsibility of the entire medical team, including nursing and ancillary staff, as an expected part of end-of-life care; document in the notes); s8.2, p.39 (the transplant coordinator discusses tissue donation and refers to a tissue coordinator)";
const PATHWAY =
  "Critical pathway of organ and tissue donation, Figure 1 and Appendix 1 of 'Organ and tissue donation in South Africa - creating a national strategy roadmap', reproduced in the Excellence in Deceased Donation course manual (2025), PDF pp.82-83, adapted from Dominguez-Gil B et al., Transpl Int 2011;24(4):373-378: possible donor (identified and referred by the treating team) -> potential donor (assessed by the transplant team) -> eligible donor (consented after a planned approach by the treating and transplant teams together) -> actual donor (recovery) -> utilised donor (transplantation); the dead donor rule - patients may only become donors after death, and recovery must not cause death";
const OTA_GUIDELINE =
  "📌 Non-South African. Organ and Tissue Authority, 'Best Practice Guideline for Offering Organ and Tissue Donation in Australia' (2021), reproduced in the Excellence in Deceased Donation course manual (2025), PDF pp.59-81: five elements (routine referral, communicating end-of-life, planning the approach, discussing donation, reviewing practice); in 'challenging' conversations consent was 54% with DonateLife Donation Specialist staff, 33% with other trained staff and 28% with untrained staff (citing Radford et al.)";
const FACTS =
  "Wits Transplant FACTS (Family Approach to Consent for Transplant Strategy), from the Wits Transplant Procurement Handbook (September 2019), reproduced in the SATCS Red File s8.1 (printed p.38; FACTS excerpt pp.10-24): an adaptation of the NHSBT strategy 'Approaching the Families of Potential Organ Donors', modified for the South African setting; an 8-step process - planning, breaking bad news, time-out break, assessing understanding and acceptance of loss, the consent conversation, time-out break, final family discussion, family follow-up, feedback and support";
const FACTS_DOS =
  "Wits Transplant FACTS, 'Key Do's and Don'ts', Red File FACTS excerpt p.22, with the step detail at pp.12-21: refer early and involve the coordinator from planning; don't withdraw ventilation or stop treatment until donation potential is assessed; introduce the coordinator by name only as part of the treating team; the doctor breaks the news that brain death is death; don't say 'organ donation' or 'life support'; don't discuss brain-stem death and donation in the same meeting; no negative, apologetic, manipulative or coercive language; don't expect an immediate response; explore initial refusals; obtain written consent; send thank-you letters and follow up";
const FACTS_TROUBLESHOOTING =
  "Wits Transplant FACTS troubleshooting, Red File FACTS excerpt p.23: Scenario 1 - the family is not to decide to switch off the machines; their loved one is already dead, the machines will be switched off, and they have been left on only to allow goodbyes and a decision on donation; Scenario 2 - a family in dispute is helped to reach a decision about what the loved one would have wanted";
const DONOR_PAUSE =
  "Wits Transplant FACTS, 'The Donor Pause', Red File FACTS excerpt p.24: a silent prayer or contemplation often used in South Africa, to respect and thank the donor and family and acknowledge the donor's life; usually two, in ICU (family invited, at a time that suits them) and in theatre before retrieval; may be silence, a song or a short reading";
const NHA_CONSENT =
  "National Health Act 61 of 2003 (Government Gazette 26595, 23 July 2004; ss 7 and 62 unamended by Act 12 of 2013 or Act 20 of 2023, checked 2026-09-24): s 7(1)(a)-(b) - consent for a user unable to consent by a person mandated in writing, or authorised by law or court order, or else by the spouse or partner, or in their absence a parent, grandparent, adult child or brother or sister, in the specific order as listed; s 8(2)(a) - such a person must if possible consult the user; s 62(1)(a) - a person competent to make a will may donate by will, by a document signed by them and at least two competent witnesses, or by an oral statement before at least two competent witnesses; s 62(2) - in the absence of such a donation or of a contrary direction given whilst alive, the spouse, partner, major child, parent, guardian, major brother or major sister, in the specific order mentioned, may donate; s 62(3) - the Director-General may donate specific tissue if none can be located after the prescribed steps; s 65 - a donor may revoke before transplantation in the same way the donation was made, or by intentionally destroying the will or document. Age for making a will (16) per the Wills Act 7 of 1953, as cited in McQuoid-Mason, SAMJ 2012;102(9):733-735";
const HPCSA_CONSENT =
  "HPCSA, 'Seeking Patients' Informed Consent: The Ethical Considerations', Booklet 4 (revised December 2021, current as at 2026-09-24), reproduced in the Excellence in Deceased Donation course manual (2025), PDF pp.86-102: 3.3.2 material risk; 3.4.1 consent is a continuing dialogue with the patient or next of kin; 3.4.2.2 interpreters; 3.4.2.6 information in manageable amounts, time to reflect; 3.4.2.10 consent is not informed under duress, coercion, manipulation, misrepresentation or mental impairment (e.g. alcohol or drugs); 6.1 no pressure; 6.2 declare conflicts of interest; 8.1.1-8.1.2 presumption of capacity, an irrational choice is not in itself evidence of incapacity; 8.4.2-8.4.3 find out about a written mandate or advance statement; respect a competent refusal that clearly applies and has not been changed; 9.1 best-interests factors, including 9.1.4 third parties' views of the patient's preferences and 9.1.5 the least restrictive option; 10.1 consult colleagues and seek a court ruling where disputes cannot be resolved; 15.1 a signed consent form is not sufficient evidence of informed consent";
const HPCSA_PALLIATIVE =
  "HPCSA, 'Ethical Guidelines on Palliative Care', Booklet 17 (2019; the course manual copy's cover misprints 'Booklet 1'), reproduced in the Excellence in Deceased Donation course manual (2025), PDF pp.104-119: 7.3.2-7.3.9 advance directives (encourage, contents, give effect where applicable and current); 7.3.10-7.3.11 with no directive and no surrogate, the practitioner in consultation with the family determines the patient's best interests, weighing clinical options, previous requests, background, third parties' knowledge of the patient's values, and the least restrictive option; 8.2.3 treatment may lawfully be withdrawn if refused, futile or no longer in the patient's best interests. With HPCSA, 'Guidelines for the Withholding and Withdrawing of Treatment', Booklet 7 (revised September 2025): 3.3 patients encouraged to put directives in writing, an appropriately drafted living will may be used, directives may be revised; 3.4 with no directive or information about the patient's wishes, close family must be consulted and the decision taken in the patient's best interests; 3.7 significant disagreement goes to an independent clinical or ethical review, then legal advice";
const ADVANCE_DIRECTIVE_LAW =
  "No statute gives a living will binding force (checked 2026-09-24): SA Law Commission, 'Euthanasia and the Artificial Preservation of Life', Project 86 report (November 1998) - draft 'End of Life Decisions Act 1999' never enacted; National Health Amendment Bill [B8-2019] (living wills and durable power of attorney), introduced 27 February 2019, lapsed 7 May 2019 (pmg.org.za/bill/875); the Act's s 7(1)(a)(i) recognises only a written mandate. Clarke v Hurst NO 1992 (4) SA 630 (D), as described in the Project 86 report paras 5.127-5.132: withdrawal of artificial feeding not unlawful by the boni mores; the order was not founded on the living will";
const DCD_INDEPENDENCE =
  "Western Cape donation policy (Circular H 84/2025), s2 (families as surrogate decision makers exploring whether the patient would have wished to donate), s11 (DCD considered only after an independent decision by the treating team to palliate, in alignment with palliative care principles), s13(c) (no action is taken to hasten the dying process; palliative care continues if death does not occur within the stand-down period); dead donor rule per the national critical-pathway appendix, course manual PDF p.83";
const TISSUE_CONSENT_CONTENT =
  "SATCS Red File s3.1, printed p.18: comprehensive tissue consent includes permission to recover specified tissue and agreement that tissue not fit for transplantation and implantation may be used for ethical research purposes; s3.3, p.19: the donor's medical aid, estate and next of kin bear no costs of donation. Wits Transplant FACTS Steps 5 and 7 (Red File FACTS excerpt pp.18-20): explain the process and possible interventions between consent and retrieval; respect family limits on which organs and tissue are donated; explain that donation may not take place even after consent";
const WC_EQUITY =
  "Western Cape donation policy (Circular H 84/2025), s18 'Equality and diversity', course manual PDF pp.18-19: no community is excluded from being offered the option to donate; long-term outcomes improve with a large pool; donation is possible from all communities and cultures; discussing donation assists families independent of their decision; ethical need not to end conversations prematurely; the transplant coordinator can spend as much time as a family needs; potential donors from all ethnic backgrounds are referred; never assume from ethnic, cultural or spiritual background that referral should not be made; a faith representative or chaplain may support the family. Wits Transplant FACTS Step 1 (Red File FACTS excerpt p.12): apparent socio-cultural or religious issues should not put the coordinator off; exploring them has changed families' decisions";
const REG_24 =
  "Regulation 24 ('Prohibition of publication of certain facts') of GN R180, Government Gazette 35099 of 2 March 2012, read verbatim 2026-09-24: (1) no person shall publish or make known any fact whereby the identity of a deceased donor, the donor, a living person from whom tissue was removed, or the person who consented to that removal, may possibly be established, unless consent was granted; (2) no person shall publish any fact whereby a recipient's identity may possibly be established unless a living recipient consented in writing, or a deceased recipient consented in writing before death, or did not object and a listed relative consents in writing";
const WC_MEDIA =
  "Western Cape donation policy (Circular H 84/2025), s19 and s21 'Media', course manual PDF pp.19-20: public relations officers promote awareness and registration; proactive work with broadcast and print media; the donor family's and recipients' privacy is always protected and paramount; the coordinator coordinates anonymous thank-you letters; donor details are not actively publicised, although the family may wish to do so themselves; time should pass before public relations engagements, so publicity is remote from an acutely grieving family and possible adverse transplant outcomes. Wits Transplant FACTS Step 8 (Red File FACTS excerpt p.21): share enough about recipients to satisfy the family, not enough to identify them; social media makes recipients easy to trace";
const ULUNTU =
  "SATCS Red File, 'Organ Donor Foundation of South Africa' (printed pp.8-11; newest references 2021): the Uluntu Project - 'Uluntu, which means Community'; reaches communities with a fear-based understanding from never receiving factual information, who may automatically say no; the donor pool is not representative of the South African population; carried out by culturally similar and culturally sensitive messengers in under-resourced and vulnerable communities (townships, informal settlements, rural areas when funding allows), visiting state hospitals, clinics and schools. Organ Donor Foundation, odf.org.za/projects/ (read 2026-09-24): ULUNTU Awareness Campaign - isiXhosa 'uluntu' meaning 'humanity' and 'community'; 'in the process of rolling out' in vulnerable communities to break through cultural barriers and increase donor consents; begins with information gathering with transplant coordinators from feeder hospitals and community baseline surveys. No evaluation located; 2026 status unverified. ODF slogans per odf.org.za/public-identity/ (read 2026-09-24): 'SAVE SEVEN LIVES', 'TELL YOUR FAMILY TODAY'";
const HAN_2017 =
  "📌 Non-South African. Han SY, Kim JI, Lee EW, et al., 'Factors associated with a family's delay of decision for organ donation after brain death', Ann Transplant 2017;22:17-23: 107 brain-dead potential donors at one Korean centre; 15 families (14%) took 48 hours or more; consent 73% (11/15) vs 55% (51/92), p=0.263 - not inferior; donation failure despite consent 27% vs 16%, p=0.464; the authors recommend continuing to maintain organ viability and extended, repetitive counselling";

// ---------------------------------------------------------------------------
// STAGE 1 — The Transplant/Donation Coordinator's Role
// ---------------------------------------------------------------------------

const coordinatorRole: StageQuizQuestion[] = [
  {
    key: "sq-a1-01",
    stage: "coordinator-role",
    topicTag: "who-the-coordinator-is",
    difficulty: 2,
    prompt: "How does the Western Cape's donation policy define a transplant coordinator?",
    explanation:
      "A transplant coordinator is a SNOD, a specialist nurse in organ donation. They lead the donor side of the process from referral to aftercare.",
    verifiedAgainst: WC_POLICY,
    choices: [
      { text: "A specialist nurse in organ donation", isCorrect: true },
      { text: "A surgeon who leads the organ recovery", feedback: "The recovery surgeons are a separate team. The coordinator is present throughout the recovery but does not perform it." },
      { text: "A doctor who certifies the patient's death", feedback: "The doctors who certify death must be independent of transplantation. The coordinator has no part in determining death." },
      { text: "A hospital manager who authorises recovery", feedback: "Authorising recovery is for the medical practitioner in charge of clinical services. The coordinator obtains that authorisation, but does not give it." },
    ],
  },
  {
    key: "sq-a1-02",
    stage: "coordinator-role",
    topicTag: "timing",
    difficulty: 2,
    scenario:
      "An ICU consultant plans to meet a patient's family this afternoon to discuss withdrawing ventilation, after which death is expected. Nobody has contacted the transplant coordinator yet.",
    prompt: "When should the coordinator be contacted?",
    explanation:
      "Intending to discuss withdrawal of life-sustaining treatment is one of the three triggers, and the first discussion with the coordinator should happen before end-of-life care is raised with the family. So the call is made now, before the meeting.",
    verifiedAgainst: WC_POLICY,
    choices: [
      { text: "After the family has accepted that death is coming", feedback: "By then the end-of-life conversation has happened without the screening and planning that should come first." },
      { text: "Only if the family asks about organ donation", feedback: "Few families raise it themselves. Waiting for them means most potential donors are never assessed." },
      { text: "Now, before the family meeting takes place", isCorrect: true },
      { text: "Once death has been certified after the withdrawal", feedback: "Too late for the coordinator to screen, check the register or plan the approach with the team." },
    ],
  },
  {
    key: "sq-a1-03",
    stage: "coordinator-role",
    topicTag: "timing",
    difficulty: 3,
    prompt:
      "The Western Cape policy gives several reasons for talking to the coordinator before end-of-life care is raised with the family. Which is one of them?",
    explanation:
      "Screening comes first, so donation is never raised with a family where it turns out not to be feasible. The coordinator can also check the national priority list and the donor register before anyone speaks to the family.",
    verifiedAgainst: WC_POLICY,
    choices: [
      { text: "It lets the coordinator persuade the family before the news", feedback: "Nothing about the timing is meant to persuade. The family hears the news from the treating team first, and donation comes later." },
      { text: "It avoids raising donation where screening rules it out", isCorrect: true },
      { text: "The law requires consent before a prognosis is shared", feedback: "No such law exists. The order is a matter of good practice, set out in provincial policy." },
      { text: "It lets the treating team hand over all family contact", feedback: "The treating team keeps its own role: it gives the family the diagnosis and prognosis." },
    ],
  },
  {
    key: "sq-a1-04",
    stage: "coordinator-role",
    topicTag: "referral-triggers",
    difficulty: 2,
    prompt: "Which of these is one of the three clinical triggers for calling the transplant coordinator about a ventilated patient?",
    explanation:
      "The three triggers are a decision to perform brain death tests, a catastrophic brain injury with a Glasgow Coma Scale of 4 or less not explained by sedation, and an intention to discuss withdrawing life-sustaining treatment with death expected.",
    verifiedAgainst: RED_FILE_ROLE,
    choices: [
      { text: "The patient turns out to be on the donor register", feedback: "Registration is something the coordinator checks after referral. It is not what prompts the call." },
      { text: "The patient has been in ICU for more than three days", feedback: "Length of stay is not a trigger. The triggers are about the patient's condition and the plan for their care." },
      { text: "The family asks how long the patient will be ventilated", feedback: "A family's question is not a trigger, and it is not a cue to mention donation." },
      { text: "The team decides to perform brain death tests", isCorrect: true },
    ],
  },
  {
    key: "sq-a1-05",
    stage: "coordinator-role",
    topicTag: "referral-duty",
    difficulty: 2,
    prompt: "According to the Red File, whose responsibility is it to refer a potential donor to the transplant coordinator?",
    explanation:
      "Referral is the responsibility of the entire team treating the patient, as an expected part of end-of-life care. It includes nursing staff and ancillary healthcare workers, not only the treating doctor. It is a professional duty rather than a legal one.",
    verifiedAgainst: RED_FILE_ROLE,
    choices: [
      { text: "The whole treating team, nurses and ancillary staff included", isCorrect: true },
      { text: "The treating consultant alone, because the Act makes it their legal duty", feedback: "The Red File says there is no legal requirement to refer, and that the responsibility is not the treating physician's alone." },
      { text: "The family, once they have agreed to donation", feedback: "Families are never asked to refer. Referral happens before the family hears anything about donation." },
      { text: "The Organ Donor Foundation, using the donor register", feedback: "The ODF runs awareness and the register. It does not refer patients from hospital wards." },
    ],
  },
  {
    key: "sq-a1-06",
    stage: "coordinator-role",
    topicTag: "referral-duty",
    difficulty: 3,
    scenario:
      "You are a nurse in ICU. The team plans to withdraw ventilation from a patient with a catastrophic brain injury this evening. The transplant coordinator has not yet been told about the patient.",
    prompt: "What does the Wits Transplant guidance say about this?",
    explanation:
      "The Do's and Don'ts are explicit: don't withdraw ventilation or stop treatment until the patient's donation potential has been assessed. The Western Cape policy says the same. Refer now, so the assessment happens first.",
    verifiedAgainst: FACTS_DOS,
    choices: [
      { text: "Withdraw as planned; donation can be assessed afterwards", feedback: "After withdrawal, donation after brain death is no longer possible, and there has been no planning for donation after circulatory death." },
      { text: "Tell the family donation may be possible, so they can ask for a delay", feedback: "Nobody mentions donation to a family before the planned approach. That is the one thing a referring team is asked not to do." },
      { text: "Don't withdraw until donation potential has been assessed", isCorrect: true },
      { text: "Withdraw, but take blood for tissue typing beforehand", feedback: "This is not a step the guidance describes, and it does not replace referral and assessment." },
    ],
  },
  {
    key: "sq-a1-07",
    stage: "coordinator-role",
    topicTag: "referral-duty",
    difficulty: 2,
    prompt: "When a coordinator accepts a referral by phone, what does the Wits Transplant handbook say they should ask the referring team not to do?",
    explanation:
      "Neither the referring team nor anyone else should say the words \"organ donation\" to the family. Donation is raised later, in a planned approach, after the family has accepted the death.",
    verifiedAgainst: FACTS,
    choices: [
      { text: "Tell the family how serious the patient's condition is", feedback: "Honest communication about the prognosis is the treating team's job, and it continues." },
      { text: "Mention organ donation to the family", isCorrect: true },
      { text: "Record the referral in the patient's notes", feedback: "Referrals and their outcomes should be documented. That is required, not discouraged." },
      { text: "Continue treating the patient while they wait", feedback: "Treatment continues. It is withdrawing it before assessment that the guidance warns against." },
    ],
  },
  {
    key: "sq-a1-08",
    stage: "coordinator-role",
    topicTag: "donor-pathway",
    difficulty: 3,
    prompt: "On the donor pathway, what turns a potential donor into an eligible donor?",
    explanation:
      "A potential donor has been identified and referred. They become an eligible donor when the transplant team's formal assessment finds they meet the medical criteria. Consent after a planned approach is the next step, from eligible to actual donor.",
    verifiedAgainst: PATHWAY,
    choices: [
      { text: "The family's consent after a planned approach", feedback: "Consent is the step after this one: it moves an eligible donor towards becoming an actual donor." },
      { text: "Being identified and referred by the treating team", feedback: "That step turns a possible donor into a potential donor." },
      { text: "A transplant team assessment that finds the criteria are met", isCorrect: true },
      { text: "At least one organ being transplanted", feedback: "That is the final step, which makes an actual donor a utilised donor." },
    ],
  },
  {
    key: "sq-a1-09",
    stage: "coordinator-role",
    topicTag: "donor-pathway",
    difficulty: 2,
    prompt: "What does the dead donor rule require?",
    explanation:
      "A patient may become a donor only after death, and the recovery of organs must never be what causes the death. It sits beneath the whole donor pathway.",
    verifiedAgainst: PATHWAY,
    choices: [
      { text: "Only registered donors may donate after death", feedback: "Registration is not required. Families can consent to donation whether or not their relative registered." },
      { text: "Organs must be recovered within an hour of death", feedback: "Timing varies with the type of donation. The rule is about death itself, not a deadline." },
      { text: "Donation happens only after death, and recovery never causes it", isCorrect: true },
      { text: "Two doctors from the transplant team must certify death before recovery", feedback: "Death is certified by doctors who are independent of the transplant team. And that is a separate rule, set in regulation." },
    ],
  },
  {
    key: "sq-a1-10",
    stage: "coordinator-role",
    topicTag: "authorisation",
    difficulty: 3,
    scenario:
      "A young man has died after a car crash. His family has consented to organ donation after a planned approach.",
    prompt: "What must the coordinator still obtain before recovery can begin?",
    explanation:
      "Family consent is necessary but not sufficient. Because the death was unnatural, the Forensic Pathology Service must authorise the donation first. The hospital must also authorise recovery, through the medical practitioner in charge of clinical services (the Western Cape policy's medical manager).",
    verifiedAgainst: WC_POLICY,
    choices: [
      { text: "Nothing more, because family consent is enough", feedback: "Family consent is not enough on its own. Two authorisations follow it." },
      { text: "Only the hospital's authorisation", feedback: "The hospital's authorisation is needed, but so is forensic authorisation, because this death was unnatural." },
      { text: "A court order confirming the family's consent", feedback: "No court order is needed. The authorisations come from forensic pathology and the hospital." },
      { text: "Forensic Pathology Service and hospital authorisations", isCorrect: true },
    ],
  },
  {
    key: "sq-a1-11",
    stage: "coordinator-role",
    topicTag: "logistics",
    difficulty: 3,
    prompt: "Under the Western Cape policy, when may the transplant team legally take over management of a donor from the treating team?",
    explanation:
      "Only in the case of a consented brain-dead donor. Otherwise the treating team continues to manage the patient, and in donation after circulatory death it continues palliative care until death.",
    verifiedAgainst: WC_POLICY,
    choices: [
      { text: "Only for a consented donor after brain death", isCorrect: true },
      { text: "From the moment the referral is accepted", feedback: "Referral starts the coordinator's work. It does not transfer the patient's care." },
      { text: "As soon as the family is approached", feedback: "The family may not yet have decided, and the patient remains the treating team's responsibility." },
      { text: "For any donor once treatment is withdrawn", feedback: "In donation after circulatory death the treating team keeps the patient and continues palliative care. Nobody hands the patient over before death." },
    ],
  },
  {
    key: "sq-a1-12",
    stage: "coordinator-role",
    topicTag: "aftercare",
    difficulty: 2,
    prompt: "Which of these is part of the coordinator's aftercare for a donor family?",
    explanation:
      "The coordinator keeps the family informed, tells them which organs were used, arranges anonymous thank-you letters and offers bereavement support. Families who declined are supported too.",
    verifiedAgainst: WC_POLICY,
    choices: [
      { text: "Giving the family the recipients' names so they can meet", feedback: "Recipients are never identified to the family. The coordinator shares enough to answer questions, but not enough to identify anyone." },
      { text: "Updates on which organs were used, and anonymous thank-you letters", isCorrect: true },
      { text: "Nothing further once the recovery operation is finished", feedback: "The coordinator's duties continue after theatre: viewing, updates, letters, bereavement support." },
      { text: "Support for families who consented, but not for those who declined", feedback: "Support does not depend on the answer. Families who declined are supported as well." },
    ],
  },
  {
    key: "sq-a1-13",
    stage: "coordinator-role",
    topicTag: "audit",
    difficulty: 2,
    prompt: "What happens when a potential organ donor was missed?",
    explanation:
      "Every missed potential solid organ donor is audited and discussed by the transplant coordinators and medical staff at the unit's morbidity and mortality meeting, and the unit is given feedback and further training.",
    verifiedAgainst: WC_POLICY,
    choices: [
      { text: "Nothing, unless the family later complains", feedback: "Review happens routinely. It doesn't wait for a complaint." },
      { text: "The case is reported to the police for investigation", feedback: "A missed referral is a quality issue, reviewed by the hospital. It is not a criminal matter." },
      { text: "The coordinator responsible is disciplined", feedback: "The review is about learning, and it often concerns a referral that never reached the coordinator at all." },
      { text: "It is audited at a morbidity and mortality meeting", isCorrect: true },
    ],
  },
  {
    key: "sq-a1-14",
    stage: "coordinator-role",
    topicTag: "satcs",
    difficulty: 2,
    prompt: "What kind of body is the South African Transplant Coordinators Society (SATCS)?",
    explanation:
      "SATCS is a professional society. It was founded in 2017 as a special interest group of the Southern African Transplantation Society, works to a Code of Conduct, and produced the Red File. It does not license or register anyone.",
    verifiedAgainst: RED_FILE_ROLE,
    choices: [
      { text: "The statutory regulator that registers coordinators", feedback: "SATCS sets standards for its members. It is not a statutory regulator and does not license anyone." },
      { text: "A professional society for coordinators, under SATS", isCorrect: true },
      { text: "The body that keeps the national donor register", feedback: "The donor register is run by the Organ Donor Foundation." },
      { text: "The government office that allocates donated organs", feedback: "SATCS is a professional society. It does not allocate organs." },
    ],
  },
  {
    key: "sq-a1-15",
    stage: "coordinator-role",
    topicTag: "roles",
    difficulty: 2,
    prompt: "Who is responsible for telling the family the patient's diagnosis and prognosis?",
    explanation:
      "The primary treatment team remains responsible for communicating the diagnosis and prognosis. The coordinator raises donation later, and wherever possible obtains consent.",
    verifiedAgainst: RED_FILE_ROLE,
    choices: [
      { text: "The transplant coordinator", feedback: "The coordinator raises donation. The diagnosis and prognosis come from the team that has been treating the patient." },
      { text: "The primary treatment team", isCorrect: true },
      { text: "The forensic pathologist", feedback: "The forensic pathologist authorises donation where a post-mortem is required. They do not speak to the family about the prognosis." },
      { text: "The hospital's medical manager", feedback: "The medical manager authorises recovery. Talking to the family is the treating team's job." },
    ],
  },
];

// ---------------------------------------------------------------------------
// STAGE 2 — Having the Donation Conversation
// ---------------------------------------------------------------------------

const donationConversation: StageQuizQuestion[] = [
  {
    key: "sq-a2-01",
    stage: "donation-conversation",
    topicTag: "facts-origin",
    difficulty: 2,
    prompt: "Where does Wits Transplant FACTS come from?",
    explanation:
      "FACTS was developed at Wits Transplant as an adaptation of the UK's NHS Blood and Transplant strategy for approaching families, modified for South African hospitals. SATCS reproduces it in the Red File.",
    verifiedAgainst: `${FACTS}. ${OTA_GUIDELINE}`,
    choices: [
      { text: "Australia's national guideline, adopted unchanged", feedback: "📌 The Australian guideline follows a similar arc, but FACTS is a South African adaptation of the UK guidance." },
      { text: "The regulations under the National Health Act", feedback: "FACTS is professional guidance, not law. The Act and its regulations do not set out how the conversation is conducted." },
      { text: "Wits Transplant, adapting UK NHS Blood and Transplant guidance", isCorrect: true },
      { text: "The Organ Donor Foundation's training course for its public volunteers", feedback: "The ODF trains volunteers in public awareness. FACTS is a strategy for transplant procurement coordinators." },
    ],
  },
  {
    key: "sq-a2-02",
    stage: "donation-conversation",
    topicTag: "facts-steps",
    difficulty: 2,
    prompt: "In FACTS, which step comes immediately after the consent conversation?",
    explanation:
      "Step 6 is a second time-out break. The coordinator leaves the family to discuss donation in private, then returns for the final family discussion in Step 7.",
    verifiedAgainst: FACTS,
    choices: [
      { text: "A time-out break, so the family can talk it over alone", isCorrect: true },
      { text: "The final family discussion, where the decision is given", feedback: "That is Step 7. A time-out break comes between the consent conversation and the final discussion." },
      { text: "Assessing the family's understanding and acceptance", feedback: "That is Step 4, which comes before donation is raised at all." },
      { text: "Follow-up, feedback and support", feedback: "That is the last step, Step 8, after the decision." },
    ],
  },
  {
    key: "sq-a2-03",
    stage: "donation-conversation",
    topicTag: "planning",
    difficulty: 3,
    scenario:
      "While planning the approach, the team learns that the family's first language is isiZulu. Nobody on the approaching team speaks it well.",
    prompt: "What does the Wits Transplant handbook advise?",
    explanation:
      "Engage an interpreter, chosen carefully: ideally someone compassionate with a medical background who is supportive of donation, and involved from the start of planning with a clearly defined role. The family cannot make an informed decision in a language they don't fully understand.",
    verifiedAgainst: FACTS,
    choices: [
      { text: "Go ahead in English, speaking slowly and simply", feedback: "Plain language helps, but it does not overcome a language barrier. An interpreter is part of good planning." },
      { text: "Bring in a well-chosen interpreter from the start of planning", isCorrect: true },
      { text: "Postpone until a relative who speaks English arrives", feedback: "Waiting on a relative puts a family member in the middle of the conversation and delays the approach. The handbook's answer is a planned interpreter." },
      { text: "Give the family written information to read alone", feedback: "Written material can support a conversation. It cannot replace one." },
    ],
  },
  {
    key: "sq-a2-04",
    stage: "donation-conversation",
    topicTag: "breaking-bad-news",
    difficulty: 2,
    prompt: "In the breaking-bad-news meeting, how is the coordinator introduced to the family?",
    explanation:
      "By name only, as part of the team that helps support families. The title \"transplant coordinator\" is avoided at this stage because the family is not yet ready to think about donation.",
    verifiedAgainst: FACTS_DOS,
    choices: [
      { text: "As the transplant coordinator, so the family knows why they are there", feedback: "The title signals donation before the family has accepted the death. FACTS deliberately avoids it at this stage." },
      { text: "Not at all; they wait outside until donation is raised", feedback: "The coordinator is present and introduced, which lets them build rapport before Step 5." },
      { text: "As the family's organ donation adviser", feedback: "Any mention of donation is kept out of this meeting." },
      { text: "By name, as part of the team that supports families", isCorrect: true },
    ],
  },
  {
    key: "sq-a2-05",
    stage: "donation-conversation",
    topicTag: "language",
    difficulty: 3,
    scenario:
      "Brain death has been confirmed and explained to a family. Later, at the bedside, the patient's sister says to you: \"Thank you for keeping him on life support until we're ready.\"",
    prompt: "What is the best response?",
    explanation:
      "Talk of \"life support\" shows the family has not yet understood that brain death is final. Correct it gently and at once: the machine is supplying oxygen to his organs, and he has already died. Never raise donation while the family still thinks this way.",
    verifiedAgainst: FACTS_DOS,
    choices: [
      { text: "Let it pass, so as not to upset her further", feedback: "Leaving the misunderstanding in place makes everything that follows harder. FACTS treats it as a cue to correct gently." },
      { text: "Gently explain that the machine supplies his organs, and he has died", isCorrect: true },
      { text: "Take the opening to mention that donation might be possible", feedback: "A family that still speaks of life support has not accepted the death. Donation cannot be raised yet, and raising it isn't your role." },
      { text: "Agree, and reassure her the machine will stay on until she is ready", feedback: "Agreeing confirms the belief that the machine is keeping him alive." },
    ],
  },
  {
    key: "sq-a2-06",
    stage: "donation-conversation",
    topicTag: "assessing-acceptance",
    difficulty: 2,
    prompt: "In Step 4, which remark from a family member suggests they have accepted the death?",
    explanation:
      "Remarks like this show the person understands that their relative has died. The other three are signs that acceptance has not yet come, and donation should not be raised.",
    verifiedAgainst: FACTS,
    choices: [
      { text: "\"She can hear you. Only positive words in here, please.\"", feedback: "This suggests the relative still believes the patient is alive and aware." },
      { text: "\"I believe in miracles. She will wake up.\"", feedback: "Hope for recovery is a clear sign the death has not been accepted." },
      { text: "\"It's just her body in that bed now. She's gone.\"", isCorrect: true },
      { text: "\"I won't give anyone permission to switch off the machines.\"", feedback: "This relative still sees the decision as ending a life, which means the death has not been accepted." },
    ],
  },
  {
    key: "sq-a2-07",
    stage: "donation-conversation",
    topicTag: "assessing-acceptance",
    difficulty: 2,
    prompt: "In Step 4, the coordinator finds that one key family member has not accepted the death. What does FACTS advise?",
    explanation:
      "Keep supporting them, and repeat breaking the bad news and the time-out break if necessary. Donation is not raised until all key family members have accepted the reality of the situation.",
    verifiedAgainst: FACTS,
    choices: [
      { text: "Raise donation with the family members who have accepted it", feedback: "FACTS waits for all the key family members. Splitting the family at this point invites conflict." },
      { text: "Keep supporting them, repeating Steps 2 and 3 if needed", isCorrect: true },
      { text: "Ask the most senior relative to decide for the family", feedback: "The issue is acceptance of the death, not who decides. That has to come first." },
      { text: "Explain the legal definition of death in more detail", feedback: "More technical detail rarely helps. Time and support are what the steps provide." },
    ],
  },
  {
    key: "sq-a2-08",
    stage: "donation-conversation",
    topicTag: "consent-conversation",
    difficulty: 2,
    prompt: "Which of these is on the FACTS checklist for the consent conversation?",
    explanation:
      "The coordinator assures the family that there is no wrong answer, describes donation positively and accurately, and uses no negative, apologetic, manipulative or coercive language.",
    verifiedAgainst: FACTS_DOS,
    choices: [
      { text: "Explain that hospital policy requires you to ask", feedback: "The handbook gives this as an example of apologetic language to avoid." },
      { text: "Wait in the room until the family reaches a decision", feedback: "FACTS gives the family a time-out break to discuss donation alone." },
      { text: "Remind them their relative would have wanted to help", feedback: "This puts words in the patient's mouth. The coordinator asks what the family thinks the person would have wanted, rather than telling them." },
      { text: "Tell the family there is no wrong answer", isCorrect: true },
    ],
  },
  {
    key: "sq-a2-09",
    stage: "donation-conversation",
    topicTag: "consent-conversation",
    difficulty: 3,
    prompt: "Which remark breaks the FACTS rule against coercive language?",
    explanation:
      "Telling a family that donation is \"the right thing to do\" puts moral pressure on them, and the handbook lists it among the things never to say. The other three remarks are all things the checklist asks for.",
    verifiedAgainst: FACTS_DOS,
    choices: [
      { text: "\"You know that organ donation is the right thing to do.\"", isCorrect: true },
      { text: "\"Whatever you decide, there is no wrong answer.\"", feedback: "This is on the checklist. It takes pressure off the family." },
      { text: "\"Someone will be with him until the recovery is complete.\"", feedback: "This is on the checklist: an assurance about the care and dignity of their relative." },
      { text: "\"Can I explain what donation would involve?\"", feedback: "Explaining the process before expecting a response is exactly what FACTS asks for." },
    ],
  },
  {
    key: "sq-a2-10",
    stage: "donation-conversation",
    topicTag: "time-out",
    difficulty: 2,
    prompt: "Why does the coordinator leave the room after raising donation?",
    explanation:
      "The second time-out break lets the family discuss donation in private and reach a decision they all agree with, without being hurried. A decision made in front of the person who asked is not a free one.",
    verifiedAgainst: FACTS,
    choices: [
      { text: "To fetch the consent forms", feedback: "The break is for the family, not for paperwork." },
      { text: "So the family can discuss it privately, without being hurried", isCorrect: true },
      { text: "So the treating doctor can talk the family round", feedback: "Nobody is meant to persuade the family during the break. It is time for them alone." },
      { text: "Because a coordinator is not allowed to be present when the family decides", feedback: "The coordinator returns for the final discussion and hears the decision." },
    ],
  },
  {
    key: "sq-a2-11",
    stage: "donation-conversation",
    topicTag: "refusal",
    difficulty: 3,
    scenario:
      "In the final family discussion, a family says no. They explain that their mother told them clearly, more than once, that she did not want to be a donor.",
    prompt: "What does FACTS say to do?",
    explanation:
      "A first refusal may be explored when it rests on misunderstanding or missing information. But where the person seriously and deliberately decided against donation, that decision is respected. Support for the family continues.",
    verifiedAgainst: FACTS,
    choices: [
      { text: "Respect the decision, and keep supporting the family", isCorrect: true },
      { text: "Explore the refusal until the family reconsiders", feedback: "Exploring a refusal means checking it is informed. It does not mean wearing down a considered decision." },
      { text: "Ask another relative whether they would consent instead", feedback: "Going around the family, and around the mother's own stated wish, is exactly what must not happen." },
      { text: "Explain how many lives her organs could save", feedback: "Pressing the benefits after a clear refusal becomes coercion." },
    ],
  },
  {
    key: "sq-a2-12",
    stage: "donation-conversation",
    topicTag: "troubleshooting",
    difficulty: 3,
    prompt: "According to FACTS's troubleshooting advice, why is a brain-dead patient's ventilator still switched on while the family decides?",
    explanation:
      "The patient has already died, and the machines will be switched off because of that. They have been left on only to give the family time to say goodbye and to consider donation. The family is not being asked to decide to switch them off.",
    verifiedAgainst: FACTS_TROUBLESHOOTING,
    choices: [
      { text: "Because the family must consent before the ventilator is switched off", feedback: "This is the misconception FACTS corrects. It is neither the family's role nor fair to ask them to make that decision." },
      { text: "Because the patient may still recover with more time", feedback: "Brain death is death. There is no recovery to wait for." },
      { text: "Only to give the family time for goodbyes and the donation decision", isCorrect: true },
      { text: "Because the law requires a fixed waiting period after death", feedback: "No fixed waiting period applies here. The time is for the family." },
    ],
  },
  {
    key: "sq-a2-13",
    stage: "donation-conversation",
    topicTag: "troubleshooting",
    difficulty: 3,
    prompt: "A large family is divided over whether to consent. What does FACTS advise the coordinator to do?",
    explanation:
      "Help the family reach a decision rather than leaving them to argue it out. Explore any misunderstanding sensitively, and bring the focus back to what their relative would have wanted. The coordinator does not take sides.",
    verifiedAgainst: FACTS_TROUBLESHOOTING,
    choices: [
      { text: "Leave the hospital and give them several days to settle it among themselves", feedback: "The handbook calls leaving the family to it unproductive. It advises helping them reach a decision." },
      { text: "Side with the relatives who support donation", feedback: "Taking sides inside a grieving family damages the conversation and the family." },
      { text: "Help them decide, focused on what their relative would have wanted", isCorrect: true },
      { text: "Tell them the law settles it, so there is nothing to discuss", feedback: "Using the law to shut down a family's discussion does nothing about the disagreement or its causes." },
    ],
  },
  {
    key: "sq-a2-14",
    stage: "donation-conversation",
    topicTag: "donor-pause",
    difficulty: 2,
    prompt: "What is the donor pause?",
    explanation:
      "A silent prayer or contemplation, often used in South Africa, that honours and thanks the donor and their family. There are usually two: one in ICU, with the family invited, and one in theatre before recovery begins.",
    verifiedAgainst: DONOR_PAUSE,
    choices: [
      { text: "A required waiting period between death and recovery", feedback: "The donor pause is a gesture of respect, not a legal or clinical waiting time." },
      { text: "The time-out break after the bad news is given", feedback: "That is FACTS Step 3. The donor pause comes after consent." },
      { text: "A cooling-off period after consent, during which the family may withdraw it", feedback: "The donor pause is not about consent at all. It honours the donor." },
      { text: "A moment of silent prayer or contemplation honouring the donor", isCorrect: true },
    ],
  },
  {
    key: "sq-a2-15",
    stage: "donation-conversation",
    topicTag: "decision-time",
    difficulty: 3,
    prompt: "📌 What did Han and colleagues (2017) find about families who took 48 hours or more to decide about donation?",
    explanation:
      "The slower families consented 73% of the time (11 of 15), against 55% for faster families. The difference was not significant, so the authors concluded that a delayed decision was not inferior. The study doesn't show that delay improves consent. It is a single Korean centre, not South African data.",
    verifiedAgainst: HAN_2017,
    choices: [
      { text: "Delay significantly increased the chance of consent", feedback: "The difference was not statistically significant. The finding is that delay was not inferior, not that it helps." },
      { text: "They consented at least as often; delay was not inferior", isCorrect: true },
      { text: "Taking longer made a refusal much more likely", feedback: "The opposite. The slower families consented at least as often as the faster ones." },
      { text: "Most families in the study took longer than 48 hours", feedback: "Only 15 of 107 families (14%) took that long. That small group is one reason to read the result cautiously." },
    ],
  },
];

// ---------------------------------------------------------------------------
// STAGE 3 — Consent and End-of-Life Ethics, In Depth
// ---------------------------------------------------------------------------

const consentEthicsInDepth: StageQuizQuestion[] = [
  {
    key: "sq-a3-01",
    stage: "consent-ethics-in-depth",
    topicTag: "two-decisions",
    difficulty: 2,
    scenario:
      "On Monday a family agrees, with the treating team, that their father's life-sustaining treatment should be withdrawn. On Wednesday, after his death, they are asked about donation.",
    prompt: "Which parts of the National Health Act govern each decision?",
    explanation:
      "The withdrawal decision is consent to treatment for a living patient who cannot decide, under section 7. The donation decision is made after death, under section 62. They are different decisions, with different lists of who may decide.",
    verifiedAgainst: NHA_CONSENT,
    choices: [
      { text: "Section 7 for the withdrawal; section 62 for donation", isCorrect: true },
      { text: "Section 62 for both decisions", feedback: "Section 62 applies only after death. Treatment decisions for a living patient fall under section 7." },
      { text: "Section 7 for both decisions", feedback: "Section 7 is about health services for a living patient. It stops applying at death." },
      { text: "Section 65 for the withdrawal; section 7 for donation", feedback: "Section 65 is about revoking a donation. Donation after death is governed by section 62." },
    ],
  },
  {
    key: "sq-a3-02",
    stage: "consent-ethics-in-depth",
    topicTag: "section-7",
    difficulty: 2,
    prompt:
      "A patient in ICU cannot consent. They never appointed anyone in writing, and no court has appointed anyone. Under section 7 of the National Health Act, who is first entitled to consent to their treatment?",
    explanation:
      "The spouse or partner. Only in their absence does the order move on to a parent, grandparent, adult child, or brother or sister.",
    verifiedAgainst: NHA_CONSENT,
    choices: [
      { text: "An adult child", feedback: "Under section 7 an adult child comes after a parent and a grandparent, and after a spouse or partner." },
      { text: "A parent", feedback: "A parent comes first only if there is no spouse or partner." },
      { text: "The spouse or partner", isCorrect: true },
      { text: "The treating consultant", feedback: "Doctors advise and treat. They do not consent in the patient's place, except in narrow emergencies." },
    ],
  },
  {
    key: "sq-a3-03",
    stage: "consent-ethics-in-depth",
    topicTag: "two-lists",
    difficulty: 3,
    scenario:
      "A widowed patient never appointed anyone to decide for her. Her mother and her adult son are both at the bedside.",
    prompt: "Under the Act, who is first in line to consent to her treatment while she is alive, and who is first in line to consent to donation after her death?",
    explanation:
      "Section 7 puts a parent before an adult child, so her mother comes first for treatment. Section 62 puts a major child before a parent, so her son comes first for donation. The lists really are different.",
    verifiedAgainst: NHA_CONSENT,
    choices: [
      { text: "Her son for both decisions", feedback: "Under section 7, for treatment, a parent ranks ahead of an adult child." },
      { text: "Her mother for both decisions", feedback: "Under section 62, for donation, a major child ranks ahead of a parent." },
      { text: "Her son for treatment, her mother for donation", feedback: "This reverses both lists." },
      { text: "Her mother for treatment, her son for donation", isCorrect: true },
    ],
  },
  {
    key: "sq-a3-04",
    stage: "consent-ethics-in-depth",
    topicTag: "two-lists",
    difficulty: 3,
    scenario:
      "While he was well, a man appointed his closest friend in writing to make health decisions for him if he could not. He has now died, and donation is being considered. His wife is present.",
    prompt: "What standing does the friend have over donation?",
    explanation:
      "A written mandate is recognised in section 7, for treatment decisions while the person is alive. Section 62 does not mention it. After death, the section 62 order applies, and his wife comes first.",
    verifiedAgainst: NHA_CONSENT,
    choices: [
      { text: "None as such; section 62's order applies, so his wife comes first", isCorrect: true },
      { text: "The friend decides, because a written mandate outranks every member of the family", feedback: "The mandate outranks the family for treatment under section 7. Section 62, which governs donation, doesn't mention it." },
      { text: "The friend and the wife must both sign the consent", feedback: "The Act sets no joint-consent rule. Section 62 has its own order." },
      { text: "The friend may veto whatever the wife decides", feedback: "Section 62 gives the mandated friend no role, let alone a veto." },
    ],
  },
  {
    key: "sq-a3-05",
    stage: "consent-ethics-in-depth",
    topicTag: "advance-directives",
    difficulty: 3,
    prompt: "What is the legal position of a living will in South Africa?",
    explanation:
      "No statute gives a living will binding force: the Law Commission's 1998 draft bill was never enacted and a 2019 private member's bill lapsed. But HPCSA guidance requires practitioners to respect a competent, applicable refusal of treatment, and the Act recognises a written mandate appointing a proxy.",
    verifiedAgainst: ADVANCE_DIRECTIVE_LAW,
    choices: [
      { text: "It has been binding under the National Health Act since 2004", feedback: "The Act recognises a written mandate (a proxy), not a living will. No Act gives a living will binding force." },
      { text: "It becomes binding once registered with the Organ Donor Foundation", feedback: "The ODF keeps a donor register. It has nothing to do with living wills." },
      { text: "No statute makes it binding, but HPCSA guidance gives it real weight", isCorrect: true },
      { text: "It has no status at all and should be ignored", feedback: "HPCSA guidance requires an applicable refusal to be respected, and a directive is strong evidence of a person's wishes." },
    ],
  },
  {
    key: "sq-a3-06",
    stage: "consent-ethics-in-depth",
    topicTag: "advance-directives",
    difficulty: 3,
    prompt: "Under HPCSA guidance, when must a practitioner respect a refusal of treatment recorded in a patient's advance statement?",
    explanation:
      "When the patient made it while competent, it clearly applies to the present situation, and there is no reason to believe they have changed their mind. Where there is no applicable statement, the patient's known wishes are still taken into account.",
    verifiedAgainst: HPCSA_CONSENT,
    choices: [
      { text: "Only if it was signed in front of a commissioner of oaths or a magistrate", feedback: "The HPCSA's test is about competence, applicability and whether the patient's view has changed, not about who witnessed it." },
      { text: "When made competently, clearly applicable, and not since changed", isCorrect: true },
      { text: "Only if every family member agrees with it", feedback: "The family's agreement is not the test. The patient's own competent decision is." },
      { text: "Always, even if circumstances have changed completely", feedback: "The refusal must clearly apply to the present situation. One made for different circumstances does not bind in the same way." },
    ],
  },
  {
    key: "sq-a3-07",
    stage: "consent-ethics-in-depth",
    topicTag: "best-interests",
    difficulty: 2,
    prompt: "In a best-interests decision for a patient who cannot decide, what is the family's role according to the HPCSA?",
    explanation:
      "The family tells the team about the patient: their values, beliefs and preferences. The test is the patient's best interests, not what the family would choose for themselves, and the practitioner, in consultation with the family, is responsible for the decision.",
    verifiedAgainst: HPCSA_PALLIATIVE,
    choices: [
      { text: "To say what they would choose if they were the patient", feedback: "The decision-maker's own preference is not the test. The patient's interests and values are." },
      { text: "To have the final say, whatever the clinical options", feedback: "Only clinically appropriate options are weighed, and the practitioner holds responsibility for a best-interests decision." },
      { text: "No role; the decision is purely clinical", feedback: "The HPCSA lists what people who know the patient say about the patient's values among the factors to weigh." },
      { text: "To tell the team about the patient's values and wishes", isCorrect: true },
    ],
  },
  {
    key: "sq-a3-08",
    stage: "consent-ethics-in-depth",
    topicTag: "best-interests",
    difficulty: 2,
    prompt: "Where more than one option is reasonably in an incapacitated patient's best interests, which does HPCSA guidance favour?",
    explanation:
      "The option that least restricts the patient's future choices. It sits alongside the clinical options, the patient's previously expressed wishes, their background and what others know of their values.",
    verifiedAgainst: HPCSA_CONSENT,
    choices: [
      { text: "The option that least restricts the patient's future choices", isCorrect: true },
      { text: "The option the family says they prefer", feedback: "The family's knowledge of the patient matters. Their own preference is not the tiebreaker." },
      { text: "The option that uses the least of the health system's scarce resources", feedback: "Resource use is not on the HPCSA's list of best-interests factors." },
      { text: "The option that ends treatment soonest", feedback: "Nothing in the test favours ending treatment. It favours keeping the patient's future choices open." },
    ],
  },
  {
    key: "sq-a3-09",
    stage: "consent-ethics-in-depth",
    topicTag: "end-of-life-and-donation",
    difficulty: 3,
    prompt: "In donation after circulatory death, what must come first under the Western Cape policy?",
    explanation:
      "An independent decision by the treating team to withdraw treatment, on palliative-care grounds. Only then is donation considered. Nothing is done to hasten death, and the dead donor rule applies.",
    verifiedAgainst: DCD_INDEPENDENCE,
    choices: [
      { text: "The family's consent to donation", feedback: "Consent to donation cannot be what drives the decision to withdraw treatment. That decision comes first, and separately." },
      { text: "The treating team's independent decision to withdraw treatment", isCorrect: true },
      { text: "The transplant team's assessment of which organs are usable", feedback: "Assessment for donation follows the withdrawal decision; it must never shape it." },
      { text: "The coordinator's recommendation to withdraw", feedback: "The coordinator has no say over treatment. Withdrawal is the treating team's decision alone." },
    ],
  },
  {
    key: "sq-a3-10",
    stage: "consent-ethics-in-depth",
    topicTag: "section-62",
    difficulty: 3,
    scenario:
      "During the donation conversation, a man's wife says he told her and their GP, clearly and more than once, that he did not want to be a donor. Their adult daughter still wants to donate.",
    prompt: "What does section 62 mean for the conversation?",
    explanation:
      "The family may donate only in the absence of the person's own donation or of a contrary direction he gave while alive. His clear refusal ends the donation question, so the coordinator respects it and keeps supporting the family.",
    verifiedAgainst: NHA_CONSENT,
    choices: [
      { text: "The daughter may consent, because a major child ranks above a parent", feedback: "The order only matters where the person made no decision of his own. Here he did." },
      { text: "The wife decides, because she ranks first under section 62", feedback: "Nobody on the list can donate where the person gave a contrary direction. His own refusal comes first." },
      { text: "His refusal ends the question, so it is respected", isCorrect: true },
      { text: "The refusal counts only if it was written down and witnessed", feedback: "Section 62 sets formalities for a person's own donation. It sets none for a contrary direction." },
    ],
  },
  {
    key: "sq-a3-11",
    stage: "consent-ethics-in-depth",
    topicTag: "capacity",
    difficulty: 3,
    scenario:
      "The relative who ranks first under section 62 arrives at the hospital clearly intoxicated, and struggles to follow what the coordinator is saying.",
    prompt: "What does HPCSA consent guidance suggest?",
    explanation:
      "Consent given while someone's judgement is impaired, for example by alcohol, is not informed consent. Distress alone would not be a reason to wait, but impairment is. The team supports the family and returns to the decision when that relative can take part.",
    verifiedAgainst: HPCSA_CONSENT,
    choices: [
      { text: "Wait until they can understand, supporting the family meanwhile", isCorrect: true },
      { text: "Take their consent now, while they are present", feedback: "Consent given under impairment is not informed, however convenient the timing." },
      { text: "Pass the decision permanently to the next relative on the list", feedback: "Impairment from alcohol is usually temporary. It is a reason to wait, not to remove them for good." },
      { text: "Ask the treating doctor to decide in their place", feedback: "Doctors do not consent to donation on a family's behalf. Section 62 gives the decision to the family." },
    ],
  },
  {
    key: "sq-a3-12",
    stage: "consent-ethics-in-depth",
    topicTag: "capacity",
    difficulty: 3,
    scenario:
      "A patient's husband is weeping and says he cannot think straight. He is following the conversation, answering questions sensibly and asking about the process.",
    prompt: "How should the team approach his capacity to decide?",
    explanation:
      "He is presumed capable. Distress is not incapacity. The HPCSA's remedy for someone who is struggling is time, information in manageable amounts and repetition, which is what the FACTS time-out breaks provide.",
    verifiedAgainst: HPCSA_CONSENT,
    choices: [
      { text: "Treat him as lacking capacity and move to the next relative", feedback: "Grief is not incapacity. Nothing here shows he cannot understand information given clearly." },
      { text: "Ask for a formal psychiatric assessment before going on", feedback: "Capacity is presumed. There is no sign here that would call for a formal assessment." },
      { text: "Take his consent quickly, before he becomes more upset", feedback: "Hurrying a distressed person undermines the voluntariness and understanding that make consent valid." },
      { text: "Presume he is capable, and give him time and information", isCorrect: true },
    ],
  },
  {
    key: "sq-a3-13",
    stage: "consent-ethics-in-depth",
    topicTag: "information",
    difficulty: 3,
    prompt: "Which of these is material information a family should be given before consenting to tissue donation?",
    explanation:
      "The Red File's tissue consent includes agreement that tissue unfit for transplantation may be used for ethical research. That is something a reasonable family would attach significance to, which is the test for material information.",
    verifiedAgainst: TISSUE_CONSENT_CONTENT,
    choices: [
      { text: "The names of the people who are likely to receive the donated tissue", feedback: "Recipients are never identified to a donor family. Regulation 24 forbids publishing anything that could identify them." },
      { text: "That tissue unfit for transplant may be used for ethical research", isCorrect: true },
      { text: "The coordinator's personal consent rate", feedback: "That is not information about the decision the family is being asked to make." },
      { text: "The hospital's budget for donation services", feedback: "The family bears no cost of donation, which they should be told. The hospital's budget is not material to them." },
    ],
  },
  {
    key: "sq-a3-14",
    stage: "consent-ethics-in-depth",
    topicTag: "end-of-life-and-donation",
    difficulty: 3,
    prompt: "While a patient is still alive, how does the Western Cape policy describe the family's role in exploring donation?",
    explanation:
      "As surrogate decision-makers, exploring whether the patient would have wished to donate. That fits the HPCSA's best-interests factors, which include the patient's previously expressed wishes. It never lets donation drive the treatment decision.",
    verifiedAgainst: DCD_INDEPENDENCE,
    choices: [
      { text: "As the people who must decide whether to switch off the ventilator", feedback: "The policy's framing is about exploring the patient's wishes on donation. Treatment decisions are taken in the patient's best interests by the treating team, in consultation with the family." },
      { text: "As donors in their own right, deciding what they would want", feedback: "The question is what the patient would have wanted, not the family's own preference." },
      { text: "As observers, with no role until the patient has died", feedback: "The policy involves the family before death, as the people who can say what the patient would have wanted." },
      { text: "As surrogate decision-makers, exploring the patient's wishes", isCorrect: true },
    ],
  },
  {
    key: "sq-a3-15",
    stage: "consent-ethics-in-depth",
    topicTag: "consent-process",
    difficulty: 2,
    prompt: "What does HPCSA guidance say about a signed consent form?",
    explanation:
      "A signed form is not sufficient evidence that informed consent was given or still stands. Consent is a continuing dialogue, and understanding matters more than the form it is recorded in.",
    verifiedAgainst: HPCSA_CONSENT,
    choices: [
      { text: "It is conclusive proof that consent was informed", feedback: "The HPCSA says the opposite: a signature on its own does not prove informed consent." },
      { text: "It is not enough on its own to show informed consent", isCorrect: true },
      { text: "It makes the decision impossible to change", feedback: "Consent can be reviewed and changed. A signature doesn't lock it in." },
      { text: "It is required only when the family is not English-speaking", feedback: "Language matters for understanding, which is why interpreters are used. It has nothing to do with when a form is signed." },
    ],
  },
];

// ---------------------------------------------------------------------------
// STAGE 4 — Public Advocacy: Equity, Media, and Community Trust
// ---------------------------------------------------------------------------

const publicAdvocacy: StageQuizQuestion[] = [
  {
    key: "sq-a4-01",
    stage: "public-advocacy",
    topicTag: "equity",
    difficulty: 2,
    prompt: "What is the Western Cape donation policy's first rule on equality and diversity?",
    explanation:
      "No community is excluded from being offered the option to donate. Donation is possible from all communities and cultures in South Africa.",
    verifiedAgainst: WC_EQUITY,
    choices: [
      { text: "Donation is offered first to families who registered", feedback: "Registration is not a condition for being offered donation. Every family is offered it." },
      { text: "No community is excluded from being offered donation", isCorrect: true },
      { text: "Families are asked only if a faith leader agrees", feedback: "A faith representative may support a family, at the family's wish. They are not a gatekeeper." },
      { text: "Donation is raised only when the family raises it first", feedback: "Few families raise it themselves. Waiting for them excludes most families." },
    ],
  },
  {
    key: "sq-a4-02",
    stage: "public-advocacy",
    topicTag: "equity",
    difficulty: 3,
    scenario:
      "A registrar meets the referral triggers for a patient but says: \"Let's not call the coordinator. His family are very traditional, and it will only upset them.\"",
    prompt: "What does the Western Cape policy say?",
    explanation:
      "Potential donors from every background are to be referred, and it should never be assumed from a family's ethnic, cultural or spiritual background that referral should not be made. The consultant and coordinator may bring in a faith representative or chaplain to support the family.",
    verifiedAgainst: WC_EQUITY,
    choices: [
      { text: "The registrar is right to spare the family distress", feedback: "This decides for the family, on an assumption about people like them. That is the inequity the policy exists to prevent." },
      { text: "Refer only if the family raises donation themselves", feedback: "Waiting for the family excludes them as surely as not referring." },
      { text: "Refer him; background is never a reason not to refer", isCorrect: true },
      { text: "Refer him, but tell the coordinator not to approach the family", feedback: "Referring in name only still takes the family's choice away. Whether and how to approach is planned with the coordinator, not ruled out in advance." },
    ],
  },
  {
    key: "sq-a4-03",
    stage: "public-advocacy",
    topicTag: "equity",
    difficulty: 2,
    prompt: "Which reason does the Western Cape policy give for offering the donation conversation to every family?",
    explanation:
      "Discussing donation as part of end-of-life care helps families regardless of what they decide. Withholding the conversation withholds that too.",
    verifiedAgainst: WC_EQUITY,
    choices: [
      { text: "The conversation helps families whatever they decide", isCorrect: true },
      { text: "The National Health Act requires every family to be asked", feedback: "No law requires it. Even referral is a professional duty, not a legal one." },
      { text: "It guarantees a higher consent rate", feedback: "Nothing guarantees consent, and the aim is an informed decision, not a yes." },
      { text: "It improves the hospital's public reputation", feedback: "That is not the reason the policy gives. Its reasons are about families and fairness." },
    ],
  },
  {
    key: "sq-a4-04",
    stage: "public-advocacy",
    topicTag: "equity",
    difficulty: 2,
    prompt: "Why does the Western Cape policy want a transplant coordinator to lead donation conversations, as part of its equity principle?",
    explanation:
      "Every family is owed a fully informed decision, and conversations should not end before adequate information has been given. The coordinator is able to spend as much time as a family needs.",
    verifiedAgainst: WC_EQUITY,
    choices: [
      { text: "Coordinators are legally required to be present at every death", feedback: "No such requirement exists. The reason is time and expertise." },
      { text: "Coordinators decide which families should be asked", feedback: "The equity principle is that every family is offered the conversation. Nobody screens families out on background." },
      { text: "Coordinators are paid for each consent they obtain", feedback: "Nothing in the sources suggests this, and payment by result would be a serious conflict of interest." },
      { text: "A coordinator can give a family all the time it needs", isCorrect: true },
    ],
  },
  {
    key: "sq-a4-05",
    stage: "public-advocacy",
    topicTag: "privacy-law",
    difficulty: 2,
    prompt: "Who is bound by Regulation 24's rule against publishing facts that could identify a donor or recipient?",
    explanation:
      "Any person. The regulation begins \"No person shall publish or make known\", so it binds volunteers, advocates and anyone posting on social media, not just hospital staff or journalists.",
    verifiedAgainst: REG_24,
    choices: [
      { text: "Only the hospital staff who were involved in the donation itself", feedback: "The regulation says \"no person\". It is not limited to staff." },
      { text: "Anyone, including volunteers posting on social media", isCorrect: true },
      { text: "Only journalists and news organisations", feedback: "It applies to everyone, including private individuals and advocates." },
      { text: "Only the transplant coordinator", feedback: "The coordinator is bound, but so is everyone else." },
    ],
  },
  {
    key: "sq-a4-06",
    stage: "public-advocacy",
    topicTag: "privacy-law",
    difficulty: 3,
    scenario:
      "An advocate posts: \"Amazing news. A 19-year-old from our township who died in Saturday's taxi crash has given the gift of life at our local hospital.\" No names are given, and no one has consented.",
    prompt: "Is this a problem?",
    explanation:
      "Very likely. Regulation 24 forbids making known any fact through which a donor's identity may possibly be established. Age, place, date and cause of death can identify a donor to everyone who knows the family, without a single name.",
    verifiedAgainst: REG_24,
    choices: [
      { text: "No, because no names are given", feedback: "The test is whether identity could possibly be established, and details can identify as surely as names." },
      { text: "No, because the post celebrates donation", feedback: "The tone doesn't matter. The regulation is about identifying facts." },
      { text: "No, provided it is deleted within a day", feedback: "Deleting it later doesn't undo publishing it, and screenshots last." },
      { text: "Yes, because the details could identify the donor", isCorrect: true },
    ],
  },
  {
    key: "sq-a4-07",
    stage: "public-advocacy",
    topicTag: "privacy-law",
    difficulty: 2,
    prompt: "A transplant recipient is alive and well. What does Regulation 24 require before anything that could identify them is published?",
    explanation:
      "The recipient's own consent, in writing. A donor family's willingness to tell their story does not cover the recipient.",
    verifiedAgainst: REG_24,
    choices: [
      { text: "The donor family's consent", feedback: "The donor family can consent for their own side of the story. Only the recipient can consent to being identified." },
      { text: "The hospital's permission", feedback: "The regulation requires the recipient's own written consent." },
      { text: "The recipient's written consent", isCorrect: true },
      { text: "The recipient's verbal agreement", feedback: "For a living recipient, the regulation requires consent in writing." },
    ],
  },
  {
    key: "sq-a4-08",
    stage: "public-advocacy",
    topicTag: "media-protocol",
    difficulty: 2,
    prompt: "A donor family wants to tell their story to a local newspaper. What does the Western Cape policy say?",
    explanation:
      "Hospitals do not actively publicise donor details, but the family may choose to do so themselves. Supporting their choice still means protecting the recipient's privacy.",
    verifiedAgainst: WC_MEDIA,
    choices: [
      { text: "The hospital doesn't publicise donors, but the family may choose to", isCorrect: true },
      { text: "The family is legally forbidden from speaking to the media about it", feedback: "The policy expressly allows a donor family to go public if it chooses to." },
      { text: "The family must wait five years before speaking publicly", feedback: "The policy asks for time to pass before hospital public relations work. It sets no fixed period for families." },
      { text: "The hospital must write and approve the story", feedback: "It is the family's story to tell. The policy does not require hospital approval." },
    ],
  },
  {
    key: "sq-a4-09",
    stage: "public-advocacy",
    topicTag: "media-protocol",
    difficulty: 2,
    prompt: "Why does the Western Cape policy want time to pass before any public relations work about a donation?",
    explanation:
      "To keep publicity away from a family in acute grief, and away from a transplant that may still have a poor outcome.",
    verifiedAgainst: WC_MEDIA,
    choices: [
      { text: "To allow time for any legal challenge to the donation to be settled first", feedback: "The reason is the family's grief and the recipient's outcome, not litigation." },
      { text: "To protect grieving families and allow for poor transplant outcomes", isCorrect: true },
      { text: "Because the regulations set a fixed twelve-month embargo", feedback: "No fixed embargo exists. The policy asks for time to pass, for human reasons." },
      { text: "So the recipient can decide whether to thank the family", feedback: "Recipients may write anonymous thank-you letters, but that isn't why publicity waits." },
    ],
  },
  {
    key: "sq-a4-10",
    stage: "public-advocacy",
    topicTag: "media-protocol",
    difficulty: 3,
    prompt: "A donor family asks the coordinator about the people who received their relative's organs. What does the Wits Transplant handbook advise?",
    explanation:
      "Share enough to meet the family's need to know, but never enough to identify a recipient. On social media a recipient can be traced very easily.",
    verifiedAgainst: WC_MEDIA,
    choices: [
      { text: "Tell them everything, since it was their relative's gift", feedback: "Recipients' privacy is protected by law. The family can know a lot, but not who." },
      { text: "Tell them nothing, to be safe", feedback: "The handbook stresses how much it helps a grieving family to know, in general terms, where the gift went." },
      { text: "Give names if the family promises not to post them", feedback: "A promise doesn't meet Regulation 24. Identifying a recipient needs the recipient's written consent." },
      { text: "Enough to answer them, never enough to identify anyone", isCorrect: true },
    ],
  },
  {
    key: "sq-a4-11",
    stage: "public-advocacy",
    topicTag: "uluntu",
    difficulty: 2,
    prompt: "According to the Organ Donor Foundation's website, what does the isiXhosa word \"uluntu\" mean?",
    explanation:
      "The ODF glosses it as \"humanity\" and \"community\". The older Red File description says simply \"community\".",
    verifiedAgainst: ULUNTU,
    choices: [
      { text: "Gift of life", feedback: "That is a common phrase in donation campaigns, not the meaning of uluntu." },
      { text: "Humanity and community", isCorrect: true },
      { text: "Tell your family", feedback: "\"Tell your family today\" is an ODF slogan, not the meaning of uluntu." },
      { text: "Save seven lives", feedback: "That is the ODF's slogan, and the figure Save7 is named after." },
    ],
  },
  {
    key: "sq-a4-12",
    stage: "public-advocacy",
    topicTag: "uluntu",
    difficulty: 3,
    prompt: "In the Red File's account, why do many people in the communities ULUNTU targets say no when asked about donation?",
    explanation:
      "Because of a fear-based understanding that comes from never having received factual information, which can lead to an automatic no. That is why ULUNTU treats refusal as a problem of information and trust.",
    verifiedAgainst: ULUNTU,
    choices: [
      { text: "Because their religions forbid donation", feedback: "The Red File frames the barrier as fear and missing information, not religious prohibition." },
      { text: "Because families are charged for donation", feedback: "Families bear no cost of donation. Cost is not the barrier the Red File describes." },
      { text: "A fear-based understanding, from never having the facts", isCorrect: true },
      { text: "Because nobody at the hospital ever actually asked their families", feedback: "The Red File describes people who are asked, and say no automatically out of fear." },
    ],
  },
  {
    key: "sq-a4-13",
    stage: "public-advocacy",
    topicTag: "uluntu",
    difficulty: 2,
    prompt: "According to the Red File, who delivers the Uluntu Project's education?",
    explanation:
      "Culturally similar and culturally sensitive messengers, working in under-resourced and vulnerable communities, including in hospitals, clinics and schools. The messenger matters as much as the message.",
    verifiedAgainst: ULUNTU,
    choices: [
      { text: "Culturally similar and culturally sensitive messengers", isCorrect: true },
      { text: "Transplant surgeons and coordinators from the major transplant centres", feedback: "The model depends on messengers the community will trust, not on specialists from outside it." },
      { text: "Well-known celebrities in national media", feedback: "Mass media is part of the ODF's awareness work. The Uluntu Project is grassroots." },
      { text: "Hospital public relations officers", feedback: "PR officers promote awareness from hospitals. The Uluntu Project works in communities." },
    ],
  },
  {
    key: "sq-a4-14",
    stage: "public-advocacy",
    topicTag: "uluntu",
    difficulty: 3,
    prompt: "What most clearly sets ULUNTU apart from the Organ Donor Foundation's mass awareness campaigns?",
    explanation:
      "Mass campaigns mainly ask people to register. ULUNTU aims at the cultural barriers behind families' refusals, the point where donation is most often lost, and its method begins by working with transplant coordinators from feeder hospitals.",
    verifiedAgainst: ULUNTU,
    choices: [
      { text: "It is run by the national Department of Health", feedback: "ULUNTU is an Organ Donor Foundation campaign." },
      { text: "It works only through social media", feedback: "The opposite: its descriptions stress grassroots, community-participative outreach." },
      { text: "It pays community members to register as donors", feedback: "Nothing in the sources suggests payment, and paying people to register would undermine a free decision." },
      { text: "It targets cultural barriers to families' consent", isCorrect: true },
    ],
  },
  {
    key: "sq-a4-15",
    stage: "public-advocacy",
    topicTag: "uluntu",
    difficulty: 3,
    prompt: "What can honestly be said about ULUNTU's results?",
    explanation:
      "No evaluation is available in the sources, and its status in 2026 could not be confirmed. The ODF's own site describes it as being rolled out. An advocate can describe the approach, but should not claim results for it.",
    verifiedAgainst: ULUNTU,
    choices: [
      { text: "It has doubled family consent rates in the communities it has reached", feedback: "No such figure appears in any source. Don't claim results that haven't been published." },
      { text: "No evaluation is available, and its current status is unconfirmed", isCorrect: true },
      { text: "It was shut down after failing its targets", feedback: "Nothing in the sources says so. Its status simply isn't confirmed." },
      { text: "It is now a legal requirement for every hospital", feedback: "ULUNTU is an NGO campaign, not a legal requirement." },
    ],
  },
];

export const advancedStageQuizBanks: StageQuizBanks = {
  "coordinator-role": coordinatorRole,
  "donation-conversation": donationConversation,
  "consent-ethics-in-depth": consentEthicsInDepth,
  "public-advocacy": publicAdvocacy,
};
