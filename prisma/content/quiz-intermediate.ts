/**
 * Intermediate Level Stage Quiz banks — 60 questions, 15 per Stage.
 *
 * Written for ticket #48 against the four Stages' Markdown under
 * `content/intermediate/`. Nothing here tests a fact the lessons do not teach,
 * and nothing tests a fact the course cannot source. Items sit at difficulty
 * 2–3; the Beginner-depth facts (two independent doctors, organs versus tissue
 * in outline) are only re-tested where Intermediate adds something to them.
 *
 * **Stage 1 carries the Blueprint's one coverage floor**: at least one
 * brain-death and at least one circulatory-death determination question. It has
 * five and four respectively (sq-i1-01…05, sq-i1-06…08 and sq-i1-12). That is a
 * floor met, not an allocation, and it binds no other bank.
 *
 * No clinical threshold or value is tested anywhere, because none is taught.
 * The only number in the determination items is the five-minute observation
 * period, which the spec teaches by name.
 *
 * Baseline items (`questions-baseline.ts`) are kept out verbatim. Where a
 * Stage covers the same ground as a Baseline item — why a heart can beat after
 * brain death, what registration does, interpreters, section 60, opt-out
 * evidence — the Stage Quiz asks a different question about it.
 *
 * Items marked `recycledFrom` began life in the prior build's `questions.ts`
 * and were rewritten as four-option single-best-answer items.
 *
 * Correct answers are spread across the four positions (4/4/4/3 per bank),
 * because options display in authoring order. Keep them spread when editing —
 * `assertBankIsWellFormed` refuses a bank that keys over half its answers to
 * one position.
 */

import type { StageQuizBanks, StageQuizQuestion } from "./quiz";

// Sources, named once and shared by the items they actually back.
const SAJCC_BRAIN =
  "Thomson D, et al. South African guidelines on the determination of death. S Afr J Crit Care 2021;37(1b):41-54 (also S Afr Med J 2021;111(4b):367-380), §3.1 and Table 2: preconditions (an established aetiology compatible with complete and irreversible loss of all brain function; minimum temperature; adequate blood pressure; sedative and CNS-depressant drug effect excluded; severe metabolic, acid-base and endocrine derangements corrected); clinical testing of coma, the brain-stem reflexes as examination of the cranial nerves (pupillary light, corneal, pain in the trigeminal distribution, vestibulo-ocular, gag, cough) and the apnoea test; 'there is no documented case of a person who fulfils the preconditions and criteria for brain death ever subsequently developing any return of brain function'. Read directly from the Source Corpus PDF for ticket #48";
const SAJCC_CIRCULATORY =
  "Thomson D, et al. South African guidelines on the determination of death. S Afr J Crit Care 2021;37(1b):41-54, §4: death on circulatory grounds requires that CPR is inappropriate, has failed, or that life-sustaining treatment has been withdrawn; observation for a minimum of five minutes 'to establish that irreversible circulatory arrest has occurred'; any spontaneous return of circulatory or respiratory activity during the five minutes resets the observation period, and is not an indication to begin resuscitation where that has been judged inappropriate; afterwards, absent pupillary responses to light and absent motor response to supra-orbital pressure are confirmed, and the time of death recorded; no intervention with the potential to restore cerebral perfusion may be initiated after death is confirmed; where DCD takes place a second doctor certifies death, one with more than five years' experience and neither involved with the transplant team (Fig. 4)";
const SAJCC_REFERRAL =
  "Thomson D, et al. South African guidelines on the determination of death. S Afr J Crit Care 2021;37(1b):41-54, §5: the recommended time for clinical assessment of organ donation potential, with the transplant co-ordinator, is when the treating team decides to perform brain-death testing or to initiate discussions with the family to withdraw life-sustaining treatment, which allows the potential for donation to be clarified before end-of-life discussions";
const SAJCC_ACCOMMODATION =
  "Thomson D, et al. South African guidelines on the determination of death. S Afr J Crit Care 2021;37(1b):41-54, §3.7: accommodation is reasonable for a finite, brief period that resources allow, with the family told the timeframe in advance, and ordinarily not for more than 24 hours; ending somatic support is ethically and legally appropriate once the family has been counselled and donation explored; another clinician in the hospital can give the family a second opinion on the determination of brain death; support should be discontinued if the bed is needed for a living patient and none other is available";
const RED_FILE_BEDSIDE =
  "SATCS, 'The Organ and Tissue Donation Reference File' (the Red File, Source Corpus Document H), §3.2.1: 'The certification of brain death is a clinical diagnosis. An EEG is not required.' Its bedside summary adds an atropine test, which the SAJCC guideline does not require (spec, Intermediate Stage 1 drafter notes)";
const WC_DCD =
  "Western Cape Government Health circular H84/2025, policy on deceased organ and tissue donation (reproduced in the Excellence in Deceased Donation course manual, 2025), §11 and the DCD section: donation is considered after an independent decision by the treating team to palliate, in line with palliative care; if the family consents, support continues while retrieval is prepared; death is declared by two doctors independent of the transplant team, one with more than five years' experience; no action is taken to hasten the dying process; retrieval must begin as soon as possible because ischaemic injury is rapid; theatre teams stand down if the donor does not arrest within a prespecified period, and palliative care continues with the treating team; the family may be present at withdrawal";
const NO_REFERRAL_DUTY =
  "SATCS Red File (Document H), §3.1: 'There is no legal requirement for the referral of a potential donor. However, organ and tissue donation is closely regulated.' Draft Regulations on Organ Transplantation, GN 7879, Government Gazette 55299, 4 September 2026, draft reg 3(4)(a) (not in force): designated staff at establishments performing donation must identify and refer potential donors";
const TISSUE =
  "SATCS Red File (Document H), §3.2.3 and the tissue donation section: tissue recovery usually follows the post-mortem and can be done in hospital, a funeral home, a mortuary or a forensic pathology facility. Western Cape circular H84/2025: tissue donation can be considered for patients who die without a ventilator, and tissue can be recovered for some time after death. Organ Donor Foundation FAQ: tissue retrieval can take place several hours and even days after death";
const WHO_IS_WHO =
  "SATCS Red File (Document H): the Organ Donor Foundation, established in 1988, is the national umbrella body for promoting donation and records registered donors on a database (p.10); SATCS was founded on 30 June 2017 as a special-interest group of the Southern African Transplantation Society to educate, develop and support transplant coordinators, and publishes the Red File (p.2). SATS, 'Organ and Tissue Donation in South Africa: Creating a National Strategy Roadmap', §2.2: transplant coordinators are the key point of contact between the bereaved family, the clinical team and the transplant team";
const PATHWAY =
  "Donation pathway per de Jager et al., SAMJ 2019;109(9):626-631, and the SATCS Red File (Document H): donor management follows consent and precedes recovery; allocation is a matching process. Western Cape circular H84/2025 on the organ retrieval sequence";
const NHA_S62 =
  "National Health Act 61 of 2003, s 62, read from the gazetted text (Government Gazette 26595, 23 July 2004): s 62(1)(a) a person competent to make a will may donate their body or specified tissue in a will, in a document signed by them and at least two competent witnesses, or in an oral statement made in the presence of at least two competent witnesses; s 62(2) in the absence of such a donation or of a contrary direction given while alive, the spouse, partner, major child, parent, guardian, major brother or major sister, in the specific order mentioned, may donate; s 62(3) if none of them can be located, the Director-General may donate specific tissue once all the prescribed steps to locate them have been taken; s 65 revocation";
const NHA_S7 =
  "National Health Act 61 of 2003, s 7(1)(b): where a user cannot give informed consent to a health service and nobody is mandated or authorised, consent may be given by the spouse or partner or, in their absence, a parent, grandparent, an adult child or a brother or sister, in the order listed. Reproduced in HPCSA Booklet 4 (rev. December 2021) §8.3.2";
const REGISTRATION =
  "SATCS Red File (Document H), p.11: registering as a donor 'does not mean that the donor's organs will automatically be donated at the time of death', and consent from the next of kin is always required. SATS national strategy roadmap, §2.4: the ODF registry 'only represents an expression by an individual of their intent to donate', and families are always approached for consent where there is a potential donor. The law-practice gap is analysed in Slabbert & Venter, 'Autonomy in organ donations v family consent: A South African legislative context', De Jure, 2019";
const FACTS =
  "📌 SA-adapted from UK NHSBT guidance. Wits Transplant FACTS (Family Approach to Consent for Transplant Strategy), reproduced in the SATCS Red File (Document H) §8.1: 'an adaptation of The National Health Service Blood and Transplant Group (NHSBT) strategy for Approaching the Families of Potential Organ Donors', modified for South African healthcare; eight steps — planning, breaking bad news, a time-out break, assessing understanding and acceptance of loss, the consent conversation, a second time-out break, the final family discussion, and follow-up, feedback and support";
const HPCSA_B4 =
  "HPCSA, Booklet 4, 'Seeking Patients' Informed Consent: The Ethical Considerations', revised December 2021 (read directly for ticket #48; it does not mention donation): information presented in a language the patient understands (§3.1.3) with arrangements for interpreters (§3.4.2.2); practitioners must not put pressure on patients to accept their advice and must declare conflicts of interest (§6); practitioners must check how well consent was understood and not simply rely on the form in which it was recorded (§11)";
const NHA_ACT_AND_REGS =
  "National Health Act 61 of 2003, Chapter 8 (ss 53-68), which repealed the Human Tissue Act 65 of 1983; s 1: 'death' means brain death, and 'tissue' includes an organ. GN R180, Government Gazette 35099, 2 March 2012, Regulations regarding the general control of human bodies, tissue, blood, blood products and gametes. McQuoid-Mason, SAMJ 2012;102(9)";
const REG_9 =
  "Regulation 9 ('Establishment of death') of GN R180, Government Gazette 35099 of 2 March 2012, read verbatim for ticket #48: death shall be established by at least two medical practitioners, one of whom shall have been practising for at least five years after registration, and none of whom shall transplant tissue removed from that person or take part in such transplantation; where the tissue is eye tissue, death is deemed established by the issuing of a certificate of death by a medical practitioner. The regulation contains no rule about interns";
const AUTHORISATIONS =
  "SATCS Red File (Document H), §3.2.3: permission for the recovery of organs must be obtained from the medical practitioner in charge of clinical services at the hospital, or another medical practitioner authorised by him or her. National Health Act s 66(1)(c) with s 3 of the Inquests Act 58 of 1959: an unnatural death must be referred for a medico-legal post-mortem, and recovery needs the forensic pathologist's authorisation; the Forensic Pathology Service performs that function. 'Medical superintendent' is language from the repealed Human Tissue Act";
const NHA_S60_S61 =
  "National Health Act 61 of 2003, read from the gazetted text: s 1 defines 'tissue' to include an organ; s 60(4) it is an offence for a donor to receive any financial or other reward except reimbursement of reasonable costs, and to sell or trade in tissue except as Chapter 8 provides; s 60(5) a fine or imprisonment of up to five years or both; s 61(3) an organ may not be transplanted into a person who is not a South African citizen or permanent resident without the Minister's written authorisation";
const COSTS =
  "SATCS Red File (Document H), §3.3: the donor's medical aid, estate and next of kin are not responsible for medical costs incurred after the donor has been declared brain dead and consent obtained, nor for tissue donation costs. Checked to conclusion against the National Health Act 61 of 2003 and GN R180 of 2012: neither allocates the costs of donation, so the bill-free position is practice, not statute";
const MACOT =
  "Department of Health, Notice 5360, Government Gazette 51352, 4 October 2024, 'Establishment of the Ministerial Advisory Committee on Organ Transplantation', read visually from the gazette for ticket #48: established under s 91(1) of the National Health Act; must advise the Minister on all matters related to organ transplantation; functions (§9) include the need for transplant facilities, advice on transplants involving unrelated donors and non-citizens, proposing authority for units to perform transplantation, and monitoring unethical behaviour; members (§4.1) one Department of Health representative, one bioethicist and seven nephrologists, for five-year terms";
const DRAFT_REGS =
  "Department of Health, draft Regulations on Organ Transplantation, Notice 7879, Government Gazette 55299, 4 September 2026, published for comment within three months and not in force; read visually for ticket #48 (regs 3, 6, 8, 9, 13-16, 19) and in T47 (regs 10-11)";
const SATS_5YR =
  "SATS/SATCS, '5-Year National Organ Transplant Activity, South Africa 2017-2021', the joint report to the WHO-ONT Global Observatory on Donation and Transplantation: 2,586 on the waiting list at 31 December 2021; 229 solid organ transplants and 189 waiting-list deaths in 2021";
const SATS_ACCESS =
  "SATS, 'Organ and Tissue Donation in South Africa: Creating a National Strategy Roadmap', §2.1: access to transplantation is limited, more easily available in urban centres and to those with the means to access private health care; transplant services are confined to large urban areas in wealthier provinces; 21 transplant centres. §2.4: Western Cape consent rates 2017-2018 of 23% in the state sector against 55% in the private sector";
const WC_EQUALITY =
  "Western Cape Government Health circular H84/2025, §18 'Equality and diversity': no community is excluded from being offered donation, and assumptions about a family's ethnic, cultural or spiritual background must never be used to skip the conversation";
const RED_FILE_ECD =
  "SATCS Red File (Document H), p.20: 'To address donor scarcity, extended selection criteria are sometimes applied and patients with certain comorbidities are considered as donors. Extended criteria donors have shown excellent outcomes and offer a significant survival benefit over no transplant. Individual organs are assessed for their transplantability in a potential donor with comorbidities such as hypertension, diabetes, and HIV.' Checked in T47 research findings §4.2";
const HPCSA_B7 =
  "HPCSA, Booklet 7, 'Guidelines for the Withholding and Withdrawing of Treatment', revised September 2025, read directly for ticket #48 (it does not mention donation): an intervention whose primary intention is to end the patient's life is unethical and unlawful (§2.2); withholding treatment does not remove the duty to relieve suffering (§2.3); where the patient cannot decide and there is no advance directive, close family must be consulted and a decision taken in the patient's best interests (§3.4); never act in haste (§3.5); significant disagreement goes to a clinical or ethical review independent of the team, then legal advice (§3.7); ideally decided by the senior practitioner after consultation (§4.1); it is not the practitioner's duty to prolong life at all costs (§4.2); patients and families have the right to seek a second opinion (§5.2)";
const OPT_OUT_INTL =
  "📌 Non-South African evidence: Rithalia A, et al., BMJ 2009;338:a3162 (systematic review: presumed consent alone is unlikely to explain the variation in donation rates between countries); Noyes J, et al., BMJ Open 2019;9:e025159 (Wales, soft opt-out from December 2015: no step change in donation behaviour; feared mass opting out did not happen); Madden S, et al., Anaesthesia 2020;75:1146-1152 (a modest rise in Welsh consent reaching significance after 33 months); Matesanz R, Domínguez-Gil B, Kidney Int 2019;95:1301-1303 (no clear example of a sustained increase after a change of law; focus on actual barriers); Matesanz R, et al., Clin Transplant 1994;8:281-286 (a transplant coordination team in each potential donor hospital)";
const OPT_OUT_SA =
  "SATS, 'Organ and Tissue Donation in South Africa: Creating a National Strategy Roadmap', core assumptions of the national workshop (p.101): 'In the current context of sustained low deceased donor consent rates and low levels of public awareness and understanding of organ donation, no evidence exists to support an assumption of majority presumed consent.' Etheredge HR, Risk Manag Healthc Policy 2021;14:1985-1998: little difference between the systems when used in isolation";

// ---------------------------------------------------------------------------
// STAGE 1 — How Donation Happens: The Process
// ---------------------------------------------------------------------------

const howDonationHappens: StageQuizQuestion[] = [
  {
    key: "sq-i1-01",
    stage: "how-donation-happens",
    topicTag: "determination-of-death",
    difficulty: 2,
    prompt:
      "Before any test for brain death begins, the effects of sedatives, a low body temperature and low blood pressure must all be ruled out. Why?",
    explanation:
      "Each of them can make a living brain look, temporarily, as if it has stopped working. Ruling them out first means that if the brain still shows no function, the only explanation left is the injury itself.",
    verifiedAgainst: SAJCC_BRAIN,
    choices: [
      { text: "They would make the organs unsuitable for transplantation", feedback: "The preconditions protect the accuracy of the diagnosis, not the organs." },
      { text: "Each can make a living brain appear to have stopped working", isCorrect: true },
      { text: "The law requires a waiting period for each before testing", feedback: "No clinical values or waiting periods are taught here. The reason is that these conditions can mimic brain death." },
      { text: "They would make the apnoea test uncomfortable for the patient", feedback: "The concern is a false diagnosis, not comfort. These conditions can mimic brain death." },
    ],
  },
  {
    key: "sq-i1-02",
    stage: "how-donation-happens",
    topicTag: "determination-of-death",
    difficulty: 2,
    prompt: "Which of these is one of the three steps of the brain-death test in the South African guidelines?",
    explanation:
      "The three steps are coma, absent brainstem reflexes, and the apnoea test, which checks directly whether the body ever tries to breathe when disconnected from the ventilator. Brain death is a clinical diagnosis: an EEG is not required, and the atropine test in the Red File's bedside summary is not a step the guideline requires.",
    verifiedAgainst: `${SAJCC_BRAIN}. ${RED_FILE_BEDSIDE}`,
    choices: [
      { text: "An atropine injection, to see whether the heart rate changes", feedback: "The Red File's bedside summary includes it, but the guideline does not require it. It is not a fourth step." },
      { text: "An EEG recording to show the absence of brain waves", feedback: "Brain death is a clinical diagnosis. An EEG is not required." },
      { text: "A period in which the family confirms they accept the diagnosis", feedback: "The family's acceptance matters a great deal, but it is not part of determining death." },
      { text: "The apnoea test, checking whether the body ever tries to breathe", isCorrect: true },
    ],
  },
  {
    key: "sq-i1-03",
    stage: "how-donation-happens",
    topicTag: "determination-of-death",
    difficulty: 3,
    prompt: "Why are the brainstem reflexes checked one at a time, rather than relying on one or two of them?",
    explanation:
      "Each reflex tests a different set of nerves running through the brainstem. Checking them one by one tests the brainstem as a whole, not just one spot, and every one of them must be absent.",
    verifiedAgainst: SAJCC_BRAIN,
    choices: [
      { text: "Each tests different nerves, so together they test the whole brainstem", isCorrect: true },
      { text: "One absent reflex is enough, so testing stops at the first one", feedback: "The opposite: every reflex must be absent. A single one present means the brainstem is still working." },
      { text: "The law lists the reflexes in a fixed order that must be followed", feedback: "The reason is clinical, not a legal sequence: each reflex tests a different pathway." },
      { text: "It spaces the test out over the day, so that the family has time to arrive and be present", feedback: "Families matter, but the reason is that each reflex checks a different part of the brainstem." },
    ],
  },
  {
    key: "sq-i1-04",
    stage: "how-donation-happens",
    topicTag: "determination-of-death",
    difficulty: 2,
    scenario:
      "During testing for brain death, the doctor shines a bright light into the patient's eyes and the pupils react.",
    prompt: "What follows?",
    explanation:
      "A pupil reacting to light is a brainstem reflex. If even one brainstem reflex is present, the brainstem is still working and the patient is not brain dead.",
    verifiedAgainst: SAJCC_BRAIN,
    choices: [
      { text: "Testing continues, because one reflex on its own does not count", feedback: "Every reflex must be absent. One present rules out brain death." },
      { text: "The apnoea test is done next, and its result decides", feedback: "The apnoea test only proceeds once every brainstem reflex is absent." },
      { text: "The patient is not brain dead: a brainstem reflex is present", isCorrect: true },
      { text: "The family is asked whether testing should continue", feedback: "Determining death is a clinical process against defined criteria, not a family decision." },
    ],
  },
  {
    key: "sq-i1-05",
    stage: "how-donation-happens",
    topicTag: "determination-of-death",
    difficulty: 2,
    recycledFrom: "post-i-02",
    prompt: "What is the essential difference between a coma and brain death?",
    explanation:
      "In a coma the brain is injured but has not lost all its function: the brainstem still works and recovery is possible. Brain death is the complete and irreversible loss of all brain function, including the brainstem. There is no documented case of anyone who met the criteria for brain death regaining brain function.",
    verifiedAgainst: SAJCC_BRAIN,
    choices: [
      { text: "A coma lasts days, brain death weeks; both can sometimes recover", feedback: "It is not a matter of duration. Brain death is irreversible; a coma is not." },
      { text: "In a coma the brainstem still works; in brain death all function is lost for good", isCorrect: true },
      { text: "Brain death is simply the deepest kind of coma, the kind in which a patient needs a ventilator to breathe", feedback: "Many patients in a coma need a ventilator. Brain death is the total, irreversible loss of brain function." },
      { text: "There is no real difference; the terms are used interchangeably", feedback: "Confusing the two is the most damaging misunderstanding in donation. They are different things." },
    ],
  },
  {
    key: "sq-i1-06",
    stage: "how-donation-happens",
    topicTag: "determination-of-death",
    difficulty: 2,
    prompt:
      "In determining circulatory death, why must circulation and breathing be absent for five continuous minutes?",
    explanation:
      "A heart that has stopped can, very rarely, start again on its own in the first minutes. The guideline sets five continuous minutes as the period that establishes the arrest is irreversible. The wait exists to make certain, not to suit the transplant team.",
    verifiedAgainst: SAJCC_CIRCULATORY,
    choices: [
      { text: "A stopped heart can, very rarely, restart on its own in the first minutes", isCorrect: true },
      { text: "It gives the transplant team time to get the operating theatre ready", feedback: "This is exactly the misreading the reason exists to prevent. The five minutes establish that the arrest is irreversible." },
      { text: "It is the time the family is given to say goodbye", feedback: "Families are supported throughout, but the five minutes have a clinical purpose: making sure the heart will not restart." },
      { text: "The law sets five minutes as the deadline for recovering tissue", feedback: "Tissue can be recovered hours or days later. The five minutes establish that circulation has stopped for good." },
    ],
  },
  {
    key: "sq-i1-07",
    stage: "how-donation-happens",
    topicTag: "determination-of-death",
    difficulty: 3,
    scenario:
      "After life-sustaining treatment is withdrawn, a patient's heart stops. Two minutes into the observation period, the heart briefly starts again on its own.",
    prompt: "What does the guideline require?",
    explanation:
      "Any spontaneous return of circulation or breathing during the five minutes resets the observation period from that point. It is not a reason to begin resuscitation where that has already been judged inappropriate.",
    verifiedAgainst: SAJCC_CIRCULATORY,
    choices: [
      { text: "Resuscitation must now be attempted", feedback: "The guideline says a spontaneous return is not an indication to begin resuscitation where that has been judged inappropriate." },
      { text: "Death is declared five minutes after the heart first stopped", feedback: "The five minutes must be continuous. The count restarts from the moment circulation returned." },
      { text: "Death can be declared at once, since the heart is clearly failing", feedback: "No. The full five continuous minutes must pass without circulation or breathing." },
      { text: "The five-minute observation starts again from that point", isCorrect: true },
    ],
  },
  {
    key: "sq-i1-08",
    stage: "how-donation-happens",
    topicTag: "determination-of-death",
    difficulty: 3,
    prompt:
      "After five continuous minutes without circulation or breathing, what does the doctor confirm before determining circulatory death?",
    explanation:
      "The doctor confirms that the pupils do not react to light and that there is no movement in response to pressure above the eye. The time of death is when those criteria are met.",
    verifiedAgainst: SAJCC_CIRCULATORY,
    choices: [
      { text: "That the family has signed the consent form for donation", feedback: "Consent is a separate matter. Determining death is clinical." },
      { text: "No pupil response to light, and no movement to pressure above the eye", isCorrect: true },
      { text: "That an apnoea test shows no attempt to breathe", feedback: "The apnoea test belongs to brain death, not circulatory death." },
      { text: "That a brain scan shows no blood flow to the brain", feedback: "No scan is part of the circulatory-death determination taught here." },
    ],
  },
  {
    key: "sq-i1-09",
    stage: "how-donation-happens",
    topicTag: "dcd",
    difficulty: 2,
    prompt: "In donation after circulatory death, what has to come first?",
    explanation:
      "An independent decision by the treating team to withdraw life-sustaining treatment, made for the patient's own reasons and in line with palliative care. Donation is considered only after that decision stands on its own.",
    verifiedAgainst: WC_DCD,
    choices: [
      { text: "The treating team's own decision to withdraw treatment", isCorrect: true },
      { text: "The family's consent to donation, which then allows withdrawal", feedback: "The order is the other way round. Consent to donation follows an independent decision to withdraw." },
      { text: "An assessment of the organs by the transplant surgeons", feedback: "The transplant team plays no part in the decision to withdraw treatment." },
      { text: "A court order approving the withdrawal of treatment", feedback: "Withdrawal is a clinical decision made in the patient's best interests. It does not ordinarily need a court." },
    ],
  },
  {
    key: "sq-i1-10",
    stage: "how-donation-happens",
    topicTag: "dcd",
    difficulty: 2,
    scenario:
      "In a planned donation after circulatory death, treatment has been withdrawn, but the patient's heart does not stop within the time the organs can tolerate.",
    prompt: "What happens?",
    explanation:
      "The retrieval team stands down, the patient's palliative care continues with the treating team, and the family is told donation was not possible. Nothing is ever done to hasten the dying.",
    verifiedAgainst: WC_DCD,
    choices: [
      { text: "Treatment is restarted so that donation can be attempted another day", feedback: "Treatment was withdrawn because it could no longer help. It is not restarted for the sake of donation." },
      { text: "Medication is given to bring on death more quickly", feedback: "Never. Nothing is done to hasten the dying process." },
      { text: "The retrieval team stands down and palliative care simply continues", isCorrect: true },
      { text: "The patient is moved to intensive care for brain-death testing", feedback: "No. The patient's end-of-life care continues exactly as planned." },
    ],
  },
  {
    key: "sq-i1-11",
    stage: "how-donation-happens",
    topicTag: "referral",
    difficulty: 2,
    prompt:
      "According to the South African guidelines, when should a patient's donation potential first be assessed with a transplant coordinator?",
    explanation:
      "When the treating team decides to test for brain death, or to begin discussing withdrawal of treatment with the family. That means before end-of-life matters are raised with the family, so it is known whether donation is possible at all.",
    verifiedAgainst: SAJCC_REFERRAL,
    choices: [
      { text: "After the family has been told of the death and has agreed to donation", feedback: "Too late. The guidelines place the assessment before end-of-life discussions with the family." },
      { text: "When the team decides to test for brain death or to discuss withdrawal", isCorrect: true },
      { text: "Only once the family raises the subject of donation themselves", feedback: "Waiting for the family to raise it would lose most donations. The team should assess potential early." },
      { text: "After the heart has stopped, so that the timing is certain", feedback: "By then it is usually too late. Assessment should come before end-of-life discussions." },
    ],
  },
  {
    key: "sq-i1-12",
    stage: "how-donation-happens",
    topicTag: "determination-of-death",
    difficulty: 3,
    prompt: "Where organs are to be donated after circulatory death, who must certify the death?",
    explanation:
      "A second doctor is required where DCD takes place. As with brain death, at least one of the two must have more than five years' experience, and neither may be involved with the transplant team.",
    verifiedAgainst: `${SAJCC_CIRCULATORY}. ${WC_DCD}`,
    choices: [
      { text: "One doctor, as for any death that is not followed by donation", feedback: "A second doctor is required where donation after circulatory death takes place." },
      { text: "Two doctors, one of whom must come from the transplant team so that the organs can be assessed at once", feedback: "Neither doctor may be involved with the transplant team." },
      { text: "The transplant coordinator, with one doctor as witness", feedback: "Death is certified by doctors, and neither may be involved with the transplant." },
      { text: "Two doctors, one with over five years' experience, neither on the transplant team", isCorrect: true },
    ],
  },
  {
    key: "sq-i1-13",
    stage: "how-donation-happens",
    topicTag: "dcd",
    difficulty: 2,
    prompt:
      "Why does donation after circulatory death run under much greater time pressure than donation after brain death?",
    explanation:
      "After brain death, the ventilator keeps the heart beating and the organs keep receiving blood. In DCD, the organs have been without blood since the heart stopped, so recovery has to begin as soon as possible after death is determined.",
    verifiedAgainst: WC_DCD,
    choices: [
      { text: "The law gives families less time to consent in DCD", feedback: "Time pressure comes from the organs, not from any legal limit on consent." },
      { text: "Recovery in DCD must begin before death has been determined", feedback: "Never. Recovery follows the determination of death, always." },
      { text: "The organs have had no blood supply since the heart stopped", isCorrect: true },
      { text: "DCD can only happen at night, when theatres are free", feedback: "There is no such rule. The pressure comes from the organs being without blood." },
    ],
  },
  {
    key: "sq-i1-14",
    stage: "how-donation-happens",
    topicTag: "organ-vs-tissue",
    difficulty: 2,
    prompt: "Why can far more people donate tissue than can donate organs?",
    explanation:
      "Tissue does not need a ventilator or a beating heart, can be donated irrespective of the manner of death, and can be recovered hours or even days after death, including after the body has been moved to a mortuary. Organs can only come from a DBD or DCD donor in hospital.",
    verifiedAgainst: TISSUE,
    choices: [
      { text: "Tissue needs no ventilator and can be recovered hours or days after death", isCorrect: true },
      { text: "Tissue donation needs no consent from the family", feedback: "Next-of-kin consent is required for tissue donation too." },
      { text: "Tissue banks accept donors of any age and with any medical history, so nobody is ever turned away", feedback: "Tissue has its own criteria. The difference is timing and setting, not an absence of criteria." },
      { text: "Tissue can only be donated after brain death", feedback: "The reverse: tissue does not depend on brain death, or on a ventilator at all." },
    ],
  },
  {
    key: "sq-i1-15",
    stage: "how-donation-happens",
    topicTag: "who-is-involved",
    difficulty: 2,
    recycledFrom: "chk-m7-03",
    prompt:
      "Which organisation is the professional body for South Africa's transplant coordinators, and publishes the Red File?",
    explanation:
      "The South African Transplant Coordinators Society (SATCS), founded in 2017 as a special-interest group of SATS. The Organ Donor Foundation runs awareness and the donor register; SATS is the wider professional society for transplantation.",
    verifiedAgainst: WHO_IS_WHO,
    choices: [
      { text: "The Organ Donor Foundation (ODF)", feedback: "The ODF runs awareness campaigns and the donor register. It is not the coordinators' professional body." },
      { text: "The Forensic Pathology Service", feedback: "The Forensic Pathology Service authorises recovery after an unnatural death. It does not represent coordinators." },
      { text: "The Health Professions Council of South Africa", feedback: "The HPCSA regulates health professionals generally. The coordinators' own society is SATCS." },
      { text: "The South African Transplant Coordinators Society (SATCS)", isCorrect: true },
    ],
  },
];

// ---------------------------------------------------------------------------
// STAGE 2 — Consent: Whose Decision and How
// ---------------------------------------------------------------------------

const consentWhoseDecision: StageQuizQuestion[] = [
  {
    key: "sq-i2-01",
    stage: "consent-whose-decision",
    topicTag: "consent",
    difficulty: 2,
    prompt:
      "A person wants to make their own donation under section 62 of the National Health Act. Which of these does the Act recognise?",
    explanation:
      "Section 62(1) recognises a donation in a will, in a document signed by the person and at least two competent witnesses, or in an oral statement made in the presence of at least two competent witnesses.",
    verifiedAgainst: NHA_S62,
    choices: [
      { text: "A private note that nobody else has seen or signed", feedback: "A document needs the person's signature and at least two competent witnesses." },
      { text: "A statement made in front of one friend", feedback: "An oral statement needs at least two competent witnesses." },
      { text: "An oral statement made in front of two competent witnesses", isCorrect: true },
      { text: "A post on social media saying they want to donate", feedback: "That is not one of the three forms the Act recognises, though it may tell a family what the person wanted." },
    ],
  },
  {
    key: "sq-i2-02",
    stage: "consent-whose-decision",
    topicTag: "consent",
    difficulty: 2,
    scenario:
      "A woman dies in circumstances where donation is possible. She made no donation and no refusal while alive. Her husband, her adult son and her mother are all at the hospital.",
    prompt: "Under section 62(2), who ranks first to consent?",
    explanation:
      "The order is spouse, partner, major child, parent, guardian, major brother, major sister. Her husband, as spouse, ranks first. The Act sets a priority; it does not require the family to decide jointly.",
    verifiedAgainst: NHA_S62,
    choices: [
      { text: "Her husband", isCorrect: true },
      { text: "Her adult son", feedback: "A major child ranks third, after a spouse and a partner." },
      { text: "Her mother", feedback: "A parent ranks fourth, after spouse, partner and major child." },
      { text: "All three, who must agree jointly", feedback: "The Act sets a specific order. It is not a committee." },
    ],
  },
  {
    key: "sq-i2-03",
    stage: "consent-whose-decision",
    topicTag: "consent",
    difficulty: 2,
    prompt: "Where does a partner rank in the section 62(2) order of who may consent?",
    explanation:
      "Second: after a spouse, and above every relative. Partners are included in the Act, which older material often misses.",
    verifiedAgainst: NHA_S62,
    choices: [
      { text: "Not included, because only relatives by blood or marriage may consent", feedback: "A partner is expressly included in section 62(2)." },
      { text: "Last, after brothers and sisters", feedback: "A partner ranks second, above every relative except a spouse." },
      { text: "Equal with a spouse, so either may decide", feedback: "The Act lists spouse and then partner, in that order." },
      { text: "Second, above every relative except a spouse", isCorrect: true },
    ],
  },
  {
    key: "sq-i2-04",
    stage: "consent-whose-decision",
    topicTag: "consent",
    difficulty: 3,
    scenario: "While he was alive, a man clearly told his family that he did not want to be a donor.",
    prompt: "After his death, may his family donate his organs?",
    explanation:
      "No. Section 62(2) gives relatives the power to donate only in the absence of the person's own donation or of a contrary direction given while alive. His refusal is that contrary direction.",
    verifiedAgainst: NHA_S62,
    choices: [
      { text: "Yes, because his spouse's consent overrides what he said", feedback: "A contrary direction given while alive removes the family's power to donate." },
      { text: "No, because a refusal given while alive removes the family's power", isCorrect: true },
      { text: "Yes, provided the hospital's medical practitioner in charge also agrees to it", feedback: "Hospital authorisation cannot replace consent the law does not allow." },
      { text: "Only tissue, not organs", feedback: "The Act does not split it this way. His refusal applies." },
    ],
  },
  {
    key: "sq-i2-05",
    stage: "consent-whose-decision",
    topicTag: "consent",
    difficulty: 2,
    prompt: "In 'major child' and 'major brother or sister', what does 'major' mean?",
    explanation: "Adult. A child or sibling under 18 cannot give consent under section 62(2).",
    verifiedAgainst: NHA_S62,
    choices: [
      { text: "The eldest of them", feedback: "It is about age of majority, not birth order." },
      { text: "Adult: 18 or older", isCorrect: true },
      { text: "The one closest to the person who died", feedback: "Closeness is not the test. 'Major' means adult." },
      { text: "The one who lived with the person who died", feedback: "Where they lived is not the test. 'Major' means adult." },
    ],
  },
  {
    key: "sq-i2-06",
    stage: "consent-whose-decision",
    topicTag: "consent",
    difficulty: 3,
    prompt:
      "Section 7 of the National Health Act also sets an order of relatives who may consent. Why should it not be used to explain donation?",
    explanation:
      "Section 7 governs consent to treatment for a living patient who cannot consent: spouse or partner, then parent, grandparent, adult child, brother or sister. Donation after death follows the different order in section 62.",
    verifiedAgainst: `${NHA_S7}. ${NHA_S62}`,
    choices: [
      { text: "Section 7 was repealed when the 2012 regulations came in", feedback: "Section 7 is in force. It simply covers something else: treatment of a living patient." },
      { text: "Section 7 applies only to children", feedback: "It applies to any patient who cannot give informed consent to treatment." },
      { text: "The two lists are identical, so either may be used to explain who decides after a death", feedback: "They differ: section 7 puts parents and grandparents before adult children, section 62 puts a major child before a parent." },
      { text: "It covers treating a living patient; donation after death uses section 62", isCorrect: true },
    ],
  },
  {
    key: "sq-i2-07",
    stage: "consent-whose-decision",
    topicTag: "what-registration-does",
    difficulty: 2,
    prompt: "What does registering with the Organ Donor Foundation actually do?",
    explanation:
      "It records a person's intention to donate. It does not mean organs will automatically be donated: the family is approached in every case. Its real value is that it tells the family what the person wanted.",
    verifiedAgainst: REGISTRATION,
    choices: [
      { text: "Records your intention to donate, which your family can then act on", isCorrect: true },
      { text: "Legally obliges the hospital to recover your organs after death", feedback: "Registration does not mean organs will automatically be donated." },
      { text: "Removes the need for anyone to speak to your family", feedback: "Families are approached for consent in every case." },
      { text: "Puts you on the waiting list to receive an organ if you need one", feedback: "The donor register and the transplant waiting list are entirely separate." },
    ],
  },
  {
    key: "sq-i2-08",
    stage: "consent-whose-decision",
    topicTag: "what-registration-does",
    difficulty: 3,
    prompt: "Someone asks whether their family can override their decision to donate. Which answer is most accurate?",
    explanation:
      "Both halves together. In law, the person's own donation comes first and relatives act only in its absence. In practice, hospitals approach the family in every case and respect a refusal. So register, and then tell your family.",
    verifiedAgainst: `${NHA_S62}. ${REGISTRATION}`,
    choices: [
      { text: "No: registration is legally binding, so the family is never consulted", feedback: "Wrong about practice. Families are approached in every case, and a refusal is respected." },
      { text: "Yes: the family always decides, so registering changes nothing at all", feedback: "Wrong about the law, and it throws away what registration does best: telling your family your wishes." },
      { text: "In law you come first, but in practice families are asked, so tell them", isCorrect: true },
      { text: "It depends entirely on which province the hospital is in", feedback: "The National Health Act applies nationally. The honest answer has a legal half and a practice half." },
    ],
  },
  {
    key: "sq-i2-09",
    stage: "consent-whose-decision",
    topicTag: "family-conversation",
    difficulty: 2,
    prompt: "What is decoupling?",
    explanation:
      "Keeping the news of a death separate from the request to donate. The family understands and accepts the death first; donation is raised later, usually by the coordinator. It means the news of a death is never heard as a request.",
    verifiedAgainst: FACTS,
    choices: [
      { text: "Separating the organ recovery team from the tissue recovery team", feedback: "That separation exists, but decoupling is about the family conversation." },
      { text: "Disconnecting the ventilator after brain death has been determined", feedback: "Decoupling is about conversations, not equipment." },
      { text: "Keeping the conversation about donation separate from the conversation about consent forms", feedback: "The separation is between the news of the death and the donation request." },
      { text: "Keeping the news of the death separate from the request to donate", isCorrect: true },
    ],
  },
  {
    key: "sq-i2-10",
    stage: "consent-whose-decision",
    topicTag: "family-conversation",
    difficulty: 2,
    prompt: "FACTS, the approach South African coordinators use with families, is adapted from which source?",
    explanation:
      "FACTS was developed by Wits Transplant as an adaptation of the UK's NHS Blood and Transplant strategy for approaching the families of potential organ donors, modified for South African hospitals. It is not taken from the Australian framework found in some training manuals.",
    verifiedAgainst: FACTS,
    choices: [
      { text: "The Australian framework found in some donation training manuals", feedback: "That framework appears in some manuals, but FACTS is adapted from UK guidance, not Australian." },
      { text: "The UK's NHS Blood and Transplant strategy for approaching families", isCorrect: true },
      { text: "The regulations made under the National Health Act in 2012", feedback: "FACTS is a professional strategy, not a legal instrument." },
      { text: "The HPCSA's Booklet 4 on informed consent", feedback: "Booklet 4's principles apply, but FACTS itself is adapted from NHS Blood and Transplant guidance." },
    ],
  },
  {
    key: "sq-i2-11",
    stage: "consent-whose-decision",
    topicTag: "family-conversation",
    difficulty: 2,
    prompt: "Why does FACTS build time-out breaks into the family conversation?",
    explanation:
      "So the family can take in the news and talk among themselves, without a professional standing there waiting for an answer. A decision made in front of the person asking for it is not a free one.",
    verifiedAgainst: FACTS,
    choices: [
      { text: "So the family can talk among themselves without anyone waiting for an answer", isCorrect: true },
      { text: "So the coordinator can step out and check whether the organs are suitable for transplant", feedback: "Suitability is screened before the family is approached. The breaks are for the family." },
      { text: "Because the law requires a waiting period before consent is valid", feedback: "No law sets such a period. The breaks come from the strategy's respect for the family." },
      { text: "So the treating doctor can hand the case over to the next shift", feedback: "The breaks are designed for the family, not for staffing." },
    ],
  },
  {
    key: "sq-i2-12",
    stage: "consent-whose-decision",
    topicTag: "informed-consent",
    difficulty: 2,
    prompt: "Which HPCSA guidance applies when a family is asked to consent to donation?",
    explanation:
      "The HPCSA has no guideline written specifically for donation. Its general informed-consent guidance, Booklet 4, applies by extension: sufficient information, in a language understood, understanding checked, and no pressure.",
    verifiedAgainst: HPCSA_B4,
    choices: [
      { text: "A dedicated HPCSA booklet on organ donation", feedback: "No such booklet exists. Donation ethics is drawn from the general guidance." },
      { text: "None, because HPCSA guidance does not apply to families", feedback: "The practitioners asking are bound by it, and its consent principles transfer to the family's decision." },
      { text: "Its general informed-consent guidance, Booklet 4, applied to donation", isCorrect: true },
      { text: "Booklet 17, on palliative care, which sets the order in which relatives must be asked", feedback: "The order of relatives comes from section 62 of the Act. Booklet 4 is the consent guidance." },
    ],
  },
  {
    key: "sq-i2-13",
    stage: "consent-whose-decision",
    topicTag: "informed-consent",
    difficulty: 3,
    scenario:
      "A grieving father signs the donation consent form quickly. Talking with him afterwards, the coordinator realises he still believes his son might recover.",
    prompt: "What do the principles of informed consent require?",
    explanation:
      "Booklet 4 says practitioners must check how well consent has been understood, not simply rely on the form in which it was recorded. He has not yet understood that his son has died, so the consent is not yet informed.",
    verifiedAgainst: HPCSA_B4,
    choices: [
      { text: "Proceed, because the signed form is what the law requires", feedback: "A signature is not understanding. Consent that is not understood is not informed consent." },
      { text: "Ask another relative who does understand to sign instead, so the process can continue", feedback: "Swapping signatories avoids the problem. The father has not understood the death." },
      { text: "Proceed, but record his confusion in the file", feedback: "Recording the problem does not solve it. The consent is not informed." },
      { text: "Treat consent as not yet informed, and help him understand the death first", isCorrect: true },
    ],
  },
  {
    key: "sq-i2-14",
    stage: "consent-whose-decision",
    topicTag: "family-conversation",
    difficulty: 2,
    prompt: "A family declines donation. Which response fits the principles of the family conversation?",
    explanation:
      "The family's decision is accepted, and support continues whatever they decided. A family that felt respected while declining is a better outcome than one that felt worked on.",
    verifiedAgainst: `${FACTS}. ${HPCSA_B4}`,
    choices: [
      { text: "Accept the decision and continue to support them", isCorrect: true },
      { text: "Remind them that their relative was registered, and ask again", feedback: "Pressing a grieving family after a refusal is coercion, not advocacy." },
      { text: "Tell them how many lives could have been saved", feedback: "That turns their grief into guilt. The decision should be accepted." },
      { text: "Ask a senior doctor to try to change their minds", feedback: "Practitioners must not put pressure on anyone to accept their advice." },
    ],
  },
  {
    key: "sq-i2-15",
    stage: "consent-whose-decision",
    topicTag: "consent",
    difficulty: 3,
    prompt: "If none of the relatives listed in section 62(2) can be located, what does the National Health Act allow?",
    explanation:
      "Section 62(3) lets the Director-General of Health donate specific tissue, but only once all the prescribed steps to locate the listed relatives have been taken.",
    verifiedAgainst: NHA_S62,
    choices: [
      { text: "The treating doctor may decide on the family's behalf", feedback: "The Act gives this power to the Director-General, not the treating doctor." },
      { text: "The Director-General may donate specific tissue, after every prescribed search", isCorrect: true },
      { text: "Donation goes ahead automatically, as long as the person was registered with the ODF", feedback: "Registration does not authorise donation on its own. Section 62(3) is a separate, limited power." },
      { text: "Nothing: donation is never possible without a relative", feedback: "Section 62(3) makes a limited exception, for specific tissue, after all prescribed steps." },
    ],
  },
];

// ---------------------------------------------------------------------------
// STAGE 3 — The South African Legal Framework
// ---------------------------------------------------------------------------

const saLegalFramework: StageQuizQuestion[] = [
  {
    key: "sq-i3-01",
    stage: "sa-legal-framework",
    topicTag: "law",
    difficulty: 2,
    recycledFrom: "post-a-01",
    prompt: "Which law is the primary legal framework for organ and tissue donation in South Africa?",
    explanation:
      "Chapter 8 of the National Health Act 61 of 2003. It replaced the Human Tissue Act of 1983, which was repealed, and much of its operational detail sits in the 2012 regulations made under it.",
    verifiedAgainst: NHA_ACT_AND_REGS,
    choices: [
      { text: "Chapter 8 of the National Health Act 61 of 2003", isCorrect: true },
      { text: "The Human Tissue Act 65 of 1983", feedback: "It was repealed by the National Health Act. Some donation material still quotes it." },
      { text: "The Consumer Protection Act", feedback: "Donation is not a consumer transaction. The governing law is the National Health Act." },
      { text: "No statute; donation is governed by hospital policy alone", feedback: "Donation is closely regulated by statute: Chapter 8 of the National Health Act." },
    ],
  },
  {
    key: "sq-i3-02",
    stage: "sa-legal-framework",
    topicTag: "law",
    difficulty: 2,
    prompt: "Where is the rule that at least two doctors must establish death actually found?",
    explanation:
      "In Regulation 9 of the 2012 regulations made under the National Health Act, not in Chapter 8 itself. Citing 'Chapter 8' for a rule that lives in the regulations is a common error.",
    verifiedAgainst: REG_9,
    choices: [
      { text: "In section 62 of the National Health Act", feedback: "Section 62 is about consent. The two-doctor rule is in Regulation 9." },
      { text: "In the HPCSA's Booklet 4 on informed consent", feedback: "Booklet 4 is ethical guidance on consent. The rule is a regulation under the Act." },
      { text: "In Regulation 9 of the 2012 regulations under the Act", isCorrect: true },
      { text: "In the Organ Donor Foundation's registration terms", feedback: "The ODF runs the register. The rule is in the regulations under the Act." },
    ],
  },
  {
    key: "sq-i3-03",
    stage: "sa-legal-framework",
    topicTag: "determination-of-death",
    difficulty: 2,
    prompt: "What does Regulation 9 require of the doctors who establish death?",
    explanation:
      "At least two doctors, one of whom has practised for at least five years since registration, and none of whom may transplant the tissue or take part in the transplant.",
    verifiedAgainst: REG_9,
    choices: [
      { text: "Exactly two specialists, neither of whom may be an intern", feedback: "It is at least two, specialism is not required, and nothing in the regulation mentions interns." },
      { text: "At least two, one with five years since registration, none in the transplant", isCorrect: true },
      { text: "One doctor, with the transplant coordinator as a second witness", feedback: "At least two medical practitioners are required." },
      { text: "Two doctors, one of whom must be the surgeon who will go on to carry out the transplant", feedback: "The opposite: none of them may take part in the transplant." },
    ],
  },
  {
    key: "sq-i3-04",
    stage: "sa-legal-framework",
    topicTag: "determination-of-death",
    difficulty: 3,
    prompt:
      "For which kind of donation is death deemed established by an ordinary death certificate, without the two-doctor procedure?",
    explanation:
      "Eye tissue. Regulation 9 provides that where the tissue is eye tissue, death is deemed established by a doctor issuing a death certificate. That is part of why corneal donation is simpler to arrange.",
    verifiedAgainst: REG_9,
    choices: [
      { text: "Kidneys", feedback: "Organ donation needs the full two-practitioner procedure." },
      { text: "Heart valves", feedback: "The exception in Regulation 9 is for eye tissue only." },
      { text: "Any tissue, but never organs", feedback: "The exception is narrower: eye tissue only." },
      { text: "Eye tissue, such as corneas", isCorrect: true },
    ],
  },
  {
    key: "sq-i3-05",
    stage: "sa-legal-framework",
    topicTag: "law",
    difficulty: 3,
    prompt: "Someone says: 'The law says neither doctor who certifies death may be an intern.' What is accurate?",
    explanation:
      "Regulation 9 says no such thing. What it does require is that one doctor has practised for at least five years since registration and that none of them takes part in the transplant.",
    verifiedAgainst: REG_9,
    choices: [
      { text: "Correct: Regulation 9 says exactly that", feedback: "Regulation 9 contains no rule about interns." },
      { text: "Correct, but only for brain death", feedback: "Regulation 9 contains no rule about interns for either route." },
      { text: "The regulation says no such thing about interns", isCorrect: true },
      { text: "It is a clinical guideline that has the force of law", feedback: "Guidance and law are different kinds of statement, and the regulation itself has no intern rule." },
    ],
  },
  {
    key: "sq-i3-06",
    stage: "sa-legal-framework",
    topicTag: "law",
    difficulty: 2,
    recycledFrom: "post-a-02",
    prompt: "'The two doctors should ideally test together.' What kind of statement is this?",
    explanation:
      "Clinical guidance, from the determination-of-death guidelines. The legal requirement is that at least two doctors establish death and that none take part in the transplant. Say which kind of statement you are giving.",
    verifiedAgainst: `${REG_9}. ${SAJCC_BRAIN}`,
    choices: [
      { text: "Clinical guidance", isCorrect: true },
      { text: "A legal requirement in Regulation 9", feedback: "Regulation 9 requires at least two doctors. Testing together is a recommendation of the guidelines." },
      { text: "A requirement of the National Health Act itself", feedback: "The Act does not say this. It is clinical guidance." },
      { text: "A myth with no source", feedback: "It has a source: the determination-of-death guidelines. It is guidance, not law." },
    ],
  },
  {
    key: "sq-i3-07",
    stage: "sa-legal-framework",
    topicTag: "law",
    difficulty: 2,
    recycledFrom: "post-a-03",
    scenario: "A young man dies after a road accident. His family consents to donation.",
    prompt: "What else is needed before organs can be recovered?",
    explanation:
      "An unnatural death must go for a medico-legal post-mortem, so the Forensic Pathology Service must authorise what may be recovered without compromising that examination. The hospital's own written authorisation is also needed. Family consent alone is not enough.",
    verifiedAgainst: AUTHORISATIONS,
    choices: [
      { text: "Permission from the district surgeon", feedback: "That office no longer performs this function. It is now the Forensic Pathology Service." },
      { text: "A court order", feedback: "No court order is needed. The Forensic Pathology Service authorises what may be recovered." },
      { text: "Nothing more: the family's consent is enough", feedback: "After an unnatural death, family consent alone is not enough." },
      { text: "Authorisation from the Forensic Pathology Service", isCorrect: true },
    ],
  },
  {
    key: "sq-i3-08",
    stage: "sa-legal-framework",
    topicTag: "law",
    difficulty: 2,
    prompt: "Who gives the hospital's written authorisation for organs to be recovered?",
    explanation:
      "The medical practitioner in charge of clinical services at the hospital, or a doctor they authorise. 'Medical superintendent' is language from the repealed Human Tissue Act.",
    verifiedAgainst: AUTHORISATIONS,
    choices: [
      { text: "The medical superintendent of the hospital where recovery happens", feedback: "That term comes from the repealed Human Tissue Act and is out of date." },
      { text: "The practitioner in charge of clinical services", isCorrect: true },
      { text: "The surgeon who will perform the transplant", feedback: "The authorising doctor is the one in charge of clinical services, not a member of the transplant team." },
      { text: "The hospital's chief financial officer", feedback: "Authorisation is a clinical role: the medical practitioner in charge of clinical services." },
    ],
  },
  {
    key: "sq-i3-09",
    stage: "sa-legal-framework",
    topicTag: "no-trade",
    difficulty: 2,
    prompt:
      "Section 60 makes it an offence to sell or trade in 'tissue'. Does that cover organs such as kidneys and livers?",
    explanation:
      "Yes. Section 1 of the Act defines tissue to include an organ, so the prohibition on trade covers organs. The penalty is a fine, up to five years' imprisonment, or both.",
    verifiedAgainst: NHA_S60_S61,
    choices: [
      { text: "No, organs are covered by a separate Act", feedback: "There is no separate Act. The National Health Act's definition of tissue includes organs." },
      { text: "Only for organs from people who have died", feedback: "It applies to living donors too." },
      { text: "Yes, because the Act defines tissue to include an organ", isCorrect: true },
      { text: "Only when the sale crosses a national border", feedback: "Any sale or trade is an offence, except as Chapter 8 provides." },
    ],
  },
  {
    key: "sq-i3-10",
    stage: "sa-legal-framework",
    topicTag: "law",
    difficulty: 2,
    prompt:
      "A patient who is neither a South African citizen nor a permanent resident wants an organ transplant here. What does the Act require?",
    explanation:
      "Section 61(3): an organ may not be transplanted into such a person without the Minister's written authorisation. It answers the suspicion that South African organs simply go to foreigners who can pay.",
    verifiedAgainst: NHA_S60_S61,
    choices: [
      { text: "The Minister's written authorisation", isCorrect: true },
      { text: "Nothing, provided they pay the hospital in full", feedback: "Payment cannot buy access. Section 61(3) requires the Minister's written authorisation." },
      { text: "A South African citizen to act as their sponsor", feedback: "No sponsor rule exists. The Minister must authorise it in writing." },
      { text: "Approval from the Organ Donor Foundation", feedback: "The ODF runs awareness and the register. It has no role in authorising transplants." },
    ],
  },
  {
    key: "sq-i3-11",
    stage: "sa-legal-framework",
    topicTag: "costs",
    difficulty: 3,
    prompt: "What is the accurate way to say that donation costs the family nothing?",
    explanation:
      "As practice. The Red File, the Organ Donor Foundation and the tissue banks state that the family does not pay for the donation, but neither the Act nor the regulations allocate donation costs. The family still pays for care before death.",
    verifiedAgainst: COSTS,
    choices: [
      { text: "As law: the Act says the family's medical aid cannot be charged", feedback: "No such provision exists in the Act or the regulations." },
      { text: "It is not true: families pay the costs of recovering organs", feedback: "It is true in practice. The family does not pay for the donation." },
      { text: "As law: section 62 of the National Health Act makes every donation free of charge", feedback: "Section 62 is about consent. It says nothing about costs." },
      { text: "As practice: the family is not billed, though no law allocates the costs", isCorrect: true },
    ],
  },
  {
    key: "sq-i3-12",
    stage: "sa-legal-framework",
    topicTag: "referral",
    difficulty: 3,
    prompt: "Is there currently a legal duty to refer a potential donor to a transplant coordinator?",
    explanation:
      "No. The Red File states that there is no legal requirement to refer. Draft regulations published for comment in September 2026 would require hospitals that perform donation to designate staff to identify and refer potential donors, but they are not yet law.",
    verifiedAgainst: `${NO_REFERRAL_DUTY}. ${DRAFT_REGS}`,
    choices: [
      { text: "Yes, under section 62 of the National Health Act", feedback: "Section 62 is about consent. No provision in force requires referral." },
      { text: "No, though September 2026 draft regulations would create one", isCorrect: true },
      { text: "Yes, under Regulation 9 of the 2012 regulations made under the Act", feedback: "Regulation 9 is about establishing death, not referral." },
      { text: "No, and no one has proposed changing that", feedback: "Draft regulations published in September 2026 propose exactly that, though they are not law." },
    ],
  },
  {
    key: "sq-i3-13",
    stage: "sa-legal-framework",
    topicTag: "law",
    difficulty: 2,
    prompt: "What is the Ministerial Advisory Committee on Organ Transplantation, established in October 2024?",
    explanation:
      "A committee that must advise the Minister of Health on all matters related to organ transplantation. Its functions include advising on transplants involving unrelated donors and non-citizens, and monitoring unethical behaviour.",
    verifiedAgainst: MACOT,
    choices: [
      { text: "A committee that advises the Minister on all matters of organ transplantation", isCorrect: true },
      { text: "A court that settles disputes between families and hospitals", feedback: "It is an advisory committee to the Minister, not a court." },
      { text: "The body that now runs the national donor register", feedback: "The Organ Donor Foundation runs the register. The committee advises the Minister." },
      { text: "A committee that decides personally who receives every donated organ in the country", feedback: "It advises the Minister. Allocation is a separate matching process." },
    ],
  },
  {
    key: "sq-i3-14",
    stage: "sa-legal-framework",
    topicTag: "law",
    difficulty: 2,
    prompt:
      "How should an advocate describe the Regulations on Organ Transplantation published on 4 September 2026?",
    explanation:
      "As draft regulations published for public comment. They are not yet law. Say 'draft regulations published for comment in September 2026', and check whether they have been finalised before relying on them.",
    verifiedAgainst: DRAFT_REGS,
    choices: [
      { text: "As the law now in force", feedback: "They were published for comment. They are a draft, not law." },
      { text: "As guidance that can never have legal effect", feedback: "They are draft regulations. If finalised, they would have legal effect." },
      { text: "As draft regulations published for comment, not yet law", isCorrect: true },
      { text: "As regulations that replace the National Health Act", feedback: "Regulations are made under an Act. They cannot replace it." },
    ],
  },
  {
    key: "sq-i3-15",
    stage: "sa-legal-framework",
    topicTag: "law",
    difficulty: 3,
    prompt: "How does section 1 of the National Health Act define 'death'?",
    explanation:
      "'Death' means brain death. Donation after circulatory death is nonetheless practised under provincial policy and the national determination-of-death guidelines, and South African legal scholarship has argued it is consistent with Chapter 8.",
    verifiedAgainst: NHA_ACT_AND_REGS,
    choices: [
      { text: "As the heart stopping for five continuous minutes", feedback: "That is the circulatory-death criterion in the clinical guidelines, not the Act's definition." },
      { text: "It does not define death at all", feedback: "Section 1 does define it: 'death' means brain death." },
      { text: "As the issuing of a death certificate by a doctor", feedback: "A certificate records a death. The Act's definition is that death means brain death." },
      { text: "'Death' means brain death", isCorrect: true },
    ],
  },
];

// ---------------------------------------------------------------------------
// STAGE 4 — Ethics of Donation and End-of-Life Care
// ---------------------------------------------------------------------------

const ethicsAndEndOfLife: StageQuizQuestion[] = [
  {
    key: "sq-i4-01",
    stage: "ethics-and-end-of-life",
    topicTag: "withdrawal",
    difficulty: 2,
    prompt: "Which HPCSA guidance governs a decision to withdraw life-sustaining treatment?",
    explanation:
      "Booklet 7, Guidelines for the Withholding and Withdrawing of Treatment, revised September 2025. Some training material cites Booklet 17 on palliative care instead; Booklet 7 is the one that governs this decision.",
    verifiedAgainst: HPCSA_B7,
    choices: [
      { text: "Booklet 17, on palliative care", feedback: "Some material cites it, but withdrawal is governed by Booklet 7." },
      { text: "Booklet 4, on informed consent", feedback: "Booklet 4 covers consent. Withdrawal decisions are governed by Booklet 7." },
      { text: "The Organ Donor Foundation's code of conduct", feedback: "The ODF is an awareness body. Withdrawal is a clinical decision under HPCSA guidance." },
      { text: "Booklet 7, on withholding and withdrawing treatment", isCorrect: true },
    ],
  },
  {
    key: "sq-i4-02",
    stage: "ethics-and-end-of-life",
    topicTag: "withdrawal",
    difficulty: 2,
    prompt: "Which statement reflects HPCSA Booklet 7?",
    explanation:
      "It is not a practitioner's duty to prolong life at all costs. Treatment that no longer benefits the patient may be withheld or withdrawn, while the duty to relieve suffering continues. An intervention intended to end life is unethical and unlawful.",
    verifiedAgainst: HPCSA_B7,
    choices: [
      { text: "Treatment must continue for as long as it is technically possible", feedback: "Booklet 7 says there is no duty to prolong life at all costs." },
      { text: "There is no duty to prolong life at all costs", isCorrect: true },
      { text: "Once treatment is withdrawn, the duty to relieve suffering ends", feedback: "The duty to relieve suffering continues after treatment is withdrawn." },
      { text: "Withdrawal may be used to end a life if the family asks", feedback: "An intervention whose primary intention is to end life is unethical and unlawful." },
    ],
  },
  {
    key: "sq-i4-03",
    stage: "ethics-and-end-of-life",
    topicTag: "withdrawal",
    difficulty: 2,
    scenario: "A patient in intensive care cannot take part in decisions and has left no advance directive.",
    prompt: "Under Booklet 7, how should a decision to withdraw treatment be made?",
    explanation:
      "Close family must be consulted, and the decision taken in the patient's best interests, ideally by the senior practitioner responsible after consulting colleagues. The team should never act in haste.",
    verifiedAgainst: HPCSA_B7,
    choices: [
      { text: "By the family alone, by a majority vote", feedback: "The family must be consulted, but the decision is made in the patient's best interests by the responsible practitioner." },
      { text: "In the patient's best interests, after consulting close family", isCorrect: true },
      { text: "By the transplant coordinator, who knows the donation options", feedback: "The transplant team has no part in the withdrawal decision." },
      { text: "Quickly, by whichever doctor is on duty", feedback: "Booklet 7 says never act in haste, and the senior practitioner responsible should ideally decide." },
    ],
  },
  {
    key: "sq-i4-04",
    stage: "ethics-and-end-of-life",
    topicTag: "withdrawal",
    difficulty: 3,
    prompt:
      "In donation after circulatory death, why must the decision to withdraw treatment be made first, and independently of donation?",
    explanation:
      "So the patient is cared for for their own sake. If the prospect of donation influenced whether or when treatment was withdrawn, the patient would be managed as a source of organs. Keeping the decision separate protects the treating team's duty to the patient, and makes it honest to tell the family that donation played no part.",
    verifiedAgainst: `${WC_DCD}. ${HPCSA_B7}`,
    choices: [
      { text: "So the patient is cared for for their own sake, never as a source of organs", isCorrect: true },
      { text: "Because organs recovered later in the day are healthier", feedback: "The reason is ethical, not about the organs." },
      { text: "Because section 62 makes consent invalid otherwise", feedback: "Section 62 governs who consents. The separation is an ethical safeguard for the patient." },
      { text: "So that the transplant team can plan the theatre schedule around the withdrawal", feedback: "The transplant team's convenience plays no part. That is the point." },
    ],
  },
  {
    key: "sq-i4-05",
    stage: "ethics-and-end-of-life",
    topicTag: "dcd",
    difficulty: 2,
    prompt: "In donation after circulatory death, which of these is never permitted?",
    explanation:
      "Nothing may be done to hasten the dying. The family may be present at withdrawal, support may continue after consent while retrieval is prepared, and the team stands down if the heart does not stop in time.",
    verifiedAgainst: WC_DCD,
    choices: [
      { text: "Allowing the family to be present when treatment is withdrawn", feedback: "This is permitted. The family may be present if they wish." },
      { text: "Giving treatment in order to bring on the patient's death sooner", isCorrect: true },
      { text: "Continuing support, after consent, while retrieval is prepared", feedback: "This is permitted, and it is part of the process." },
      { text: "Standing the retrieval team down if the heart does not stop in time", feedback: "This is what happens. Palliative care then continues." },
    ],
  },
  {
    key: "sq-i4-06",
    stage: "ethics-and-end-of-life",
    topicTag: "family-at-end-of-life",
    difficulty: 3,
    scenario: "After brain death has been determined, a family asks for the ventilator to be kept on for another week.",
    prompt: "What do the South African determination-of-death guidelines say about such a request?",
    explanation:
      "Accommodation is reasonable for a brief, finite period, with the timeframe explained in advance, and ordinarily not beyond 24 hours. Support may be ended once the family has been counselled and donation explored.",
    verifiedAgainst: SAJCC_ACCOMMODATION,
    choices: [
      { text: "The hospital must agree to whatever period the family asks for, however long", feedback: "Accommodation is finite. The guidelines ordinarily cap it at a day." },
      { text: "No accommodation is ever allowed once brain death is determined", feedback: "The guidelines allow a brief period of accommodation." },
      { text: "A week is the standard accommodation period", feedback: "Ordinarily it should not go beyond 24 hours." },
      { text: "Accommodation should be brief and finite, ordinarily no more than a day", isCorrect: true },
    ],
  },
  {
    key: "sq-i4-07",
    stage: "ethics-and-end-of-life",
    topicTag: "family-at-end-of-life",
    difficulty: 2,
    scenario: "A family cannot accept that their daughter has been determined brain dead.",
    prompt: "What do the South African guidelines allow?",
    explanation:
      "Another clinician in the hospital may give the family a second opinion on the determination, where that may help them accept the death. Booklet 7 also gives patients and families the right to seek a second opinion.",
    verifiedAgainst: `${SAJCC_ACCOMMODATION}. ${HPCSA_B7}`,
    choices: [
      { text: "A second opinion on the determination from another clinician", isCorrect: true },
      { text: "A repeat determination performed by the transplant team", feedback: "The transplant team may never take part in determining death." },
      { text: "Nothing: a determination of death cannot be questioned", feedback: "The guidelines expressly allow a second opinion." },
      { text: "The family's own doctor may examine the patient and overrule the determination", feedback: "A second opinion is allowed, but it is not a power to overrule." },
    ],
  },
  {
    key: "sq-i4-08",
    stage: "ethics-and-end-of-life",
    topicTag: "consent-model",
    difficulty: 2,
    prompt: "What does a 'soft' opt-out system of consent mean?",
    explanation:
      "Everyone is treated as willing to donate unless they recorded an objection, but the family is still consulted. South Africa does not use it: it is opt-in, requiring explicit consent.",
    verifiedAgainst: `${OPT_OUT_INTL}. ${NHA_S62}`,
    choices: [
      { text: "Only people who have registered can become donors", feedback: "That describes an opt-in system, like South Africa's." },
      { text: "Organs are recovered without anyone being asked", feedback: "In a soft opt-out system the family is still consulted." },
      { text: "Presumed willing unless they objected, with the family still consulted", isCorrect: true },
      { text: "People may refuse to donate only some of their organs, never all of them", feedback: "Opting out can be complete. 'Soft' refers to the family still being consulted." },
    ],
  },
  {
    key: "sq-i4-09",
    stage: "ethics-and-end-of-life",
    topicTag: "consent-model",
    difficulty: 2,
    prompt: "To what do the leaders of Spain's national transplant organisation credit Spain's high donation rate?",
    explanation:
      "📌 To organisation, in particular a trained transplant coordination team in every donor hospital. They argue there are no clear examples of a sustained increase in donation after a country changed its consent law.",
    verifiedAgainst: OPT_OUT_INTL,
    choices: [
      { text: "Its opt-out consent law on its own", feedback: "Spain's own transplant leaders argue the law alone does not explain it." },
      { text: "Trained transplant coordinators in every donor hospital", isCorrect: true },
      { text: "Payments made to donor families", feedback: "Spain does not pay donor families. Its leaders credit organisation." },
      { text: "A younger population than other countries", feedback: "No source here credits demography. The answer is organisation." },
    ],
  },
  {
    key: "sq-i4-10",
    stage: "ethics-and-end-of-life",
    topicTag: "consent-model",
    difficulty: 3,
    prompt:
      "Why has South Africa's transplant community not assumed that presumed consent would work here?",
    explanation:
      "Its national strategy workshop agreed that, with consent rates this low and public understanding of donation this limited, no evidence supports presuming that most South Africans would consent. Presumed consent presumes a 'yes' that families are not, at present, giving.",
    verifiedAgainst: OPT_OUT_SA,
    choices: [
      { text: "The Constitution forbids any opt-out system", feedback: "No source here says so. The reason given is the lack of evidence for presumed consent." },
      { text: "Opt-out was tried in South Africa and abandoned", feedback: "South Africa has always been opt-in. It has not tried opt-out." },
      { text: "The National Health Act was amended in 2025 to forbid any form of presumed consent", feedback: "No such amendment exists." },
      { text: "Low consent and awareness give no basis to presume most people would agree", isCorrect: true },
    ],
  },
  {
    key: "sq-i4-11",
    stage: "ethics-and-end-of-life",
    topicTag: "consent-model",
    difficulty: 3,
    prompt: "What happened after Wales moved to a soft opt-out system in December 2015?",
    explanation:
      "📌 Family consent rose modestly over about three years, but there was no step change in donation, and the feared mass opting-out did not happen. Changing the law was a first step, not a solution on its own.",
    verifiedAgainst: OPT_OUT_INTL,
    choices: [
      { text: "Donation rates doubled within the first year", feedback: "No. Evaluation found no step change in donation." },
      { text: "Families were no longer approached about donation, because consent was presumed", feedback: "In a soft opt-out system families are still approached." },
      { text: "Consent rose modestly, but there was no step change in donation", isCorrect: true },
      { text: "Large numbers of people opted out in protest", feedback: "Concerns about mass opting-out were not realised." },
    ],
  },
  {
    key: "sq-i4-12",
    stage: "ethics-and-end-of-life",
    topicTag: "scarcity",
    difficulty: 2,
    prompt:
      "At the end of 2021, 2,586 people were on South Africa's transplant waiting list. How many solid organ transplants were performed that year?",
    explanation:
      "229, and 189 people died waiting. These are the most recent verified national figures, from the SATS/SATCS report to the WHO Global Observatory.",
    verifiedAgainst: SATS_5YR,
    choices: [
      { text: "229", isCorrect: true },
      { text: "2,382", feedback: "That is the number waiting for a kidney at the end of 2021, not the number of transplants." },
      { text: "1,190", feedback: "Far too many. 229 solid organ transplants were performed in 2021." },
      { text: "38", feedback: "That is the number of consented deceased donors in 2021, not the number of transplants." },
    ],
  },
  {
    key: "sq-i4-13",
    stage: "ethics-and-end-of-life",
    topicTag: "equity",
    difficulty: 2,
    prompt: "How does the SATS national strategy roadmap describe access to organ transplantation in South Africa?",
    explanation:
      "Concentrated in large cities in the wealthier provinces, and more easily available to people who live near them and to those with private health care. Inequity also shows in consent rates, which in Western Cape figures were far lower in the public sector.",
    verifiedAgainst: SATS_ACCESS,
    choices: [
      { text: "Evenly available in every province", feedback: "The roadmap says services are confined to large urban areas in wealthier provinces." },
      { text: "Available only in private hospitals", feedback: "Both sectors provide transplants, but access is easier with private care." },
      { text: "Available only to people registered as donors", feedback: "Registration as a donor has nothing to do with receiving an organ." },
      { text: "Concentrated in cities and easier to reach with private health care", isCorrect: true },
    ],
  },
  {
    key: "sq-i4-14",
    stage: "ethics-and-end-of-life",
    topicTag: "equity",
    difficulty: 2,
    scenario:
      "A doctor decides not to raise donation with a family, assuming that people of their faith would not agree to it.",
    prompt: "What is wrong with that decision?",
    explanation:
      "No community should be excluded from being offered donation. The Western Cape policy says a family's ethnic, cultural or spiritual background must never be used as a reason to skip the conversation. The assumption removes the family's choice before it is offered.",
    verifiedAgainst: WC_EQUALITY,
    choices: [
      { text: "Nothing: it spares the family an awkward conversation", feedback: "It takes a choice away from the family on the strength of an assumption." },
      { text: "It excludes the family from a choice on an assumption about their background", isCorrect: true },
      { text: "Only that the law requires every family to be asked", feedback: "The objection is ethical and in provincial policy, not a statutory duty to ask." },
      { text: "A faith leader from the family's community should have been asked to decide for them", feedback: "A faith representative may support the family, but the decision is the family's." },
    ],
  },
  {
    key: "sq-i4-15",
    stage: "ethics-and-end-of-life",
    topicTag: "scarcity",
    difficulty: 3,
    prompt:
      "A potential donor had high blood pressure and diabetes. According to the SATCS Red File, how is that handled?",
    explanation:
      "To address the shortage, extended selection criteria are sometimes applied: donors with conditions such as hypertension, diabetes or HIV can be considered, with each organ assessed individually. Such donors have shown excellent outcomes, with a significant survival benefit over no transplant.",
    verifiedAgainst: RED_FILE_ECD,
    choices: [
      { text: "Each organ is assessed individually for whether it can be transplanted", isCorrect: true },
      { text: "Donation is ruled out for anyone with either condition", feedback: "Neither condition rules a donor out. Each organ is assessed individually." },
      { text: "Only tissue can be considered, never organs", feedback: "Organs can be considered too, each assessed on its own." },
      { text: "Organs are used, but the recipient's team is not told about the donor's conditions", feedback: "The recipient's team weighs and explains the risk. Nothing is hidden." },
    ],
  },
];

export const intermediateStageQuizBanks: StageQuizBanks = {
  "how-donation-happens": howDonationHappens,
  "consent-whose-decision": consentWhoseDecision,
  "sa-legal-framework": saLegalFramework,
  "ethics-and-end-of-life": ethicsAndEndOfLife,
};
