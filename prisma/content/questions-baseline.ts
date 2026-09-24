/**
 * The Baseline Assessment bank — twenty questions, fixed-form.
 *
 * Written for wayfinder ticket #50 against the Assessment Blueprint in
 * CURRICULUM-ASSESSMENT-SPEC.md. The Baseline is not a Stage Quiz and belongs to
 * no single Level: it is sat at signup and again after each Level, **the same
 * twenty questions in the same order every time**, so four sittings can be
 * compared. It is purely diagnostic — nothing passes or fails.
 *
 * **The weighting is the Blueprint's, and `assertBaselineIsWellFormed` holds it
 * there.** Deliberately Beginner-heavy, because every learner reaches Beginner and
 * later Levels are not guaranteed: 8 Beginner (3/3/2), 6 Intermediate (2/2/1/1),
 * 6 Advanced (2/2/1/1). The emitter calls it before writing anything, the same
 * way it calls `assertBankIsWellFormed` on the Stage Quiz banks.
 *
 * **How the emitter writes these rows.** `scope = 'PRE'`, `level_slug` from
 * `level`, `module_slug` null, option keys by array position.
 * `learn_submit_baseline_sitting()` (save7-os 0110) marks every `scope = 'PRE'`
 * row and groups the result by `learn_questions.level_slug` into
 * `learn_baseline_sittings.level_scores` — the per-Level breakdown the Blueprint
 * reports — so `level_slug` is load-bearing and `module_slug` is not: the Stage is
 * authoring provenance, held in `stage` for the weighting check. Leaving it null
 * also keeps these rows out of anything that selects a Stage's questions by
 * `module_slug`.
 *
 * **Because the function reads every PRE row, the prior build's twelve `pre-*`
 * rows must be swept from production when this bank lands** — otherwise the
 * Baseline silently becomes thirty-two questions with a twelve-point
 * `'unassigned'` bucket. #47's reset left them alone, so the sweep is #54's:
 * save7-os 0116, hand-written ahead of this bank's emitted rows, and safe only
 * while no learner has sat the Baseline.
 *
 * Depth, per the Blueprint:
 *
 * - **Difficulty scales with source Level** — 1 for Beginner, 2 Intermediate,
 *   3 Advanced — and is flagged as adjustable post-launch.
 * - **Intermediate Stage 1 is capped at the conceptual tier.** Two ways of
 *   determining death, and why a heart can beat after brain death — never the
 *   reflexes or the apnoea test. A question at that depth scores zero for everyone
 *   at the signup sitting and discriminates nothing.
 * - **Advanced items are not capped** (#50): a near-chance score at signup is the
 *   gain the fourth sitting measures. What keeps them informative is that every
 *   wrong answer is a misconception someone could actually hold.
 *
 * **Answer positions are spread by hand.** The renderer shows options in authored
 * order — a fixed form is not shuffled — and the emitter assigns option keys by
 * array position. The prior build keyed every item's correct answer first, which
 * makes a bank answerable without reading it; the well-formedness check refuses a
 * bank that drifts back towards that.
 *
 * Items marked `recycledFrom` began as the prior build's PRE items and were
 * re-keyed, reshaped to four-option single-best-answer and re-sourced — their old
 * `verifiedAgainst` strings were largely copied between unrelated items. `pairKey`
 * is gone: #41 replaced pair-matching with sitting-over-sitting comparison.
 *
 * **Never render `scope = 'GATE'` questions as the Baseline.** The forty
 * volunteer-portal items are a different instrument, and all of them key `'a'`.
 */

import { courseStructure } from "./structure";
import type { LevelStructure } from "./structure";

export type BaselineChoice = {
  text: string;
  isCorrect?: boolean;
  /** Shown after answering. Written on every distractor, because the wrong
   *  answers are where the teaching happens. */
  feedback?: string;
};

export type BaselineQuestion = {
  /** Permanent authoring key — `baseline-<level initial><stage number>-<n>`.
   *  Never reused, never renumbered: it is the upsert key. A sitting keeps no
   *  answers, only its marks, so what makes an edit here dangerous once anyone
   *  has sat the Baseline is comparability, not lost records: a changed item
   *  makes later sittings a different paper from the first. */
  key: string;
  /** Level slug — written to `learn_questions.level_slug`, which is what the
   *  per-Level breakdown groups on. */
  level: string;
  /** Stage slug the item is drawn from. Checked against the Blueprint's
   *  weighting; not written to the database. */
  stage: string;
  topicTag: string;
  difficulty: 1 | 2 | 3;
  /** Set where the stem needs a situation before the question. */
  scenario?: string;
  prompt: string;
  explanation: string;
  /** The source the keyed answer and explanation were checked against. An item
   *  without one enters the content-review register as outstanding. */
  verifiedAgainst?: string;
  /** The prior build's authoring key, where this item was recycled from one.
   *  Provenance only — the old row is swept by save7-os 0116 (#54). */
  recycledFrom?: string;
  choices: [BaselineChoice, BaselineChoice, BaselineChoice, BaselineChoice];
};

export const BASELINE_SIZE = 20;

/** Questions per Stage, from the Assessment Blueprint. */
export const BASELINE_WEIGHTING: Record<string, number> = {
  // Beginner — 8
  "why-donation-matters": 3,
  "busting-the-myths": 3,
  "how-donation-works": 2,
  // Intermediate — 6
  "how-donation-happens": 2,
  "consent-whose-decision": 2,
  "sa-legal-framework": 1,
  "ethics-and-end-of-life": 1,
  // Advanced — 6
  "coordinator-role": 2,
  "donation-conversation": 2,
  "consent-ethics-in-depth": 1,
  "public-advocacy": 1,
};

// Sources, named once and shared by the items they actually back.
const ODF_FAQ =
  "Organ Donor Foundation of South Africa, FAQs (odf.org.za/faqs/, checked 23 September 2026): the heart, liver and pancreas can save three lives and the kidneys and lungs help up to four more, so one donor can save seven lives; up to fifty people can be helped by donating corneas, skin, bone, tendons and heart valves; recovery 'does not change the way the body looks'; donors are urged to discuss their decision with their family";
const GAUTENG_AGE =
  "Gauteng Department of Health, quoted by SAnews, 'Save a life: register as an organ and tissue donor', 29 August 2026: age alone or the presence of certain medical conditions does not automatically prevent a person from becoming a donor, and suitability is carefully assessed by medical professionals at the appropriate time";
const WITS_MODEL =
  "de Jager et al., 'Increasing deceased organ donor numbers in Johannesburg, South Africa: 18-month results of the Wits Transplant Procurement Model', SAMJ 2019;109(9):626-631 (DOI 10.7196/SAMJ.2019.v109i9.14313): the model's two phases target the two points where potential donations were being lost — referral and family consent";
const REG_9 =
  "Regulation 9 ('Establishment of death') of GN R180, Government Gazette 35099 of 2 March 2012, made under the National Health Act 61 of 2003: death shall be established by at least two medical practitioners, one of whom shall have been practising for at least five years after registration, and none of whom shall transplant tissue removed from that person or take part in such transplantation";
const RED_FILE_ODF =
  "SATS/SATCS Red File (Document H in the Source Corpus), p.11: registering with the Organ Donor Foundation 'does not mean that the donor's organs will automatically be donated at the time of death', and next-of-kin consent is still required; p.8: the ODF is an awareness, education and registry body, not a medical or allocation body";
const FAMILY_PRACTICE =
  "National Health Act 61 of 2003 s 62(1)-(2), checked against the consolidated text, read with the Red File p.11. The gap between the statute and hospital practice — families are approached in every case and a refusal is respected — is documented in Slabbert & Venter, 'Autonomy in organ donations v family consent: A South African legislative context', De Jure, 2019";
const TISSUE_CRITERIA =
  "Organ Donor Foundation of South Africa, FAQs (odf.org.za/faqs/): organs (heart, liver, pancreas, kidneys, lungs) are distinguished from tissue (corneas, skin, bone, tendons, heart valves); Centre for Tissue Engineering (South African tissue bank) donor criteria";
const SAJCC_DEATH =
  "Thomson D, et al. South African guidelines on the determination of death. S Afr J Crit Care 2021;37(1b):41-54, DOI 10.7196/SAJCC.2021v37i1b.466 (also S Afr Med J 2021;111(4b):367-380): death is determined either by neurological criteria (brain death) or by circulatory criteria; brain death is determined only once conditions that mimic it, including sedation, have been excluded; mechanical ventilation maintains oxygenation, and so the heartbeat, after brain death";
const CONSENT_UNDERSTOOD =
  "HPCSA Booklet 4, 'Seeking Patients' Informed Consent: The Ethical Considerations' (rev. December 2021): consent is informed only where the information given is sufficient and is understood by the person giving it, applied to third-party consent by a patient's representatives";
const NHA_S60 =
  "National Health Act 61 of 2003 s 60(4)-(5), checked against the consolidated text: it is an offence for a donor to receive any financial or other reward for a donation, except reimbursement of reasonable costs incurred to provide it, and an offence to sell or trade in tissue except as Chapter 8 provides — punishable by a fine, up to five years' imprisonment, or both. Section 1 defines 'tissue' to include an organ";
const OPT_OUT_EVIDENCE =
  "National Health Act 61 of 2003 s 62(1)-(2) for the opt-in position: donation rests on the person's own donation or, failing that, the family's, in a fixed order. Evidence on switching: Etheredge HR (Wits Donald Gordon Medical Centre; Steve Biko Centre for Bioethics), 'Assessing Global Organ Donation Policies: Opt-In vs Opt-Out', Risk Manag Healthc Policy 2021;14:1985-1998, DOI 10.2147/RMHP.S270234 — there is little difference between the two systems for increasing donor numbers when used in isolation, and barriers must be addressed at several levels alongside any switch";
const WC_COORDINATOR =
  "Western Cape Government Health circular H84/2025 (policy on deceased organ and tissue donation), §1 (the transplant coordinator is a specialist nurse in organ donation) and §5 (the coordinator is contacted before end-of-life discussions with the family, so feasibility, the national priority list and ODF registration can be checked first); corroborated by the SATS Red File (Document H), p.5";
const SATCS =
  "SATS/SATCS Red File (Document H), 'Who we are', p.2: the South African Transplant Coordinators Society, founded 30 June 2017 as a special-interest group of the Southern African Transplantation Society, exists 'to educate, develop and support all transplant coordinators in South Africa' under a Code of Conduct";
const FACTS =
  "📌 SA-adapted from UK NHSBT guidance. Wits Transplant FACTS protocol (Family Approach to Consent for Transplant Strategy), reproduced in the SATS Red File (Document H) §8.1: Steps 2-4 separate the death conversation from the donation conversation, so the family understands and accepts the death before donation is raised; the treating doctor and the coordinator deliver the approach together; the troubleshooting section covers a family who believe they are being asked to 'switch off the machine'";
const ACCOMMODATION =
  "Thomson D, et al. South African guidelines on the determination of death. S Afr J Crit Care 2021;37(1b):41-54: family accommodation — a brief period of continued support after death is determined — is ordinarily capped at 24 hours";
const SURROGATE =
  "HPCSA Booklet 4, 'Seeking Patients' Informed Consent: The Ethical Considerations' (rev. December 2021), on third-party and surrogate consent; HPCSA 'Ethical Guidelines on Palliative Care' (2019), on advance directives and the best-interests test where a patient cannot decide — both reproduced in the Excellence in Deceased Donation course manual, pp.86-119";
const WC_EQUALITY =
  "Western Cape Government Health circular H84/2025 (policy on deceased organ and tissue donation), §18 'Equality and diversity': no community is excluded from being offered donation, assumptions about a family's ethnic, cultural or spiritual background must never be used to skip the conversation, and a faith representative or hospital chaplain may be brought in to support it";

// ---------------------------------------------------------------------------
// BEGINNER — 8 items (3 / 3 / 2)
// ---------------------------------------------------------------------------

const beginner: BaselineQuestion[] = [
  {
    key: "baseline-b1-01",
    level: "beginner",
    stage: "why-donation-matters",
    topicTag: "who-needs-organs",
    difficulty: 1,
    recycledFrom: "pre-01",
    prompt: "Why do people need organ transplants?",
    explanation:
      "Transplantation is not an enhancement or a preference. When an organ fails completely, treatment can often buy time, but for some conditions a transplant is the only option that remains.",
    verifiedAgainst: ODF_FAQ,
    choices: [
      { text: "To boost an organ that is still working normally", feedback: "Transplantation is not an enhancement — it replaces an organ that has failed." },
      { text: "Their organ has failed and cannot be repaired", isCorrect: true, feedback: "Correct. This is what end-stage organ failure means." },
      { text: "Because they prefer a transplant to taking medication", feedback: "A transplant is not a preference. It is what remains when other treatment can no longer sustain the organ." },
      { text: "Only after injuries from a serious accident", feedback: "Accidents are one route to organ failure, but most people waiting have a long-term illness." },
    ],
  },
  {
    key: "baseline-b1-02",
    level: "beginner",
    stage: "why-donation-matters",
    topicTag: "loss-points",
    difficulty: 1,
    recycledFrom: "pre-03",
    prompt:
      "South Africa has many people waiting for organs but relatively few transplants. What is the main reason?",
    explanation:
      "The shortage is a pathway problem. Potential donations are lost between a potential donor and a recipient — above all when a potential donor is never referred, or when a family is not asked or declines — rather than for surgical or legal reasons.",
    verifiedAgainst: WITS_MODEL,
    choices: [
      { text: "South Africa lacks the surgical skill to carry out transplants", feedback: "South Africa has a long transplant history. Surgical capability is not the main constraint." },
      { text: "Very few people die in circumstances where donating their organs is possible", feedback: "Potential donors exist. The problem is what happens to them along the way." },
      { text: "South African law prohibits most kinds of organ donation", feedback: "Donation is lawful in South Africa, under Chapter 8 of the National Health Act." },
      { text: "Donations are lost along the way, mostly at referral or consent", isCorrect: true, feedback: "Correct. Most of the loss points are human, not medical." },
    ],
  },
  {
    key: "baseline-b1-03",
    level: "beginner",
    stage: "why-donation-matters",
    topicTag: "scale-of-impact",
    difficulty: 1,
    prompt: "How many people can a single deceased donor help?",
    explanation:
      "One donor's organs can save up to seven lives, and their tissue — corneas, skin, bone, tendons and heart valves — can help up to fifty more.",
    verifiedAgainst: ODF_FAQ,
    choices: [
      { text: "Up to seven through organs, and up to fifty more through tissue", isCorrect: true, feedback: "Correct. Tissue donation is the part most people leave out." },
      { text: "One — each donor's organs go to a single recipient", feedback: "Different organs go to different recipients. One donor can help many people." },
      { text: "Up to seven, but only through organs, as tissue cannot be donated", feedback: "Tissue can be donated, and it helps far more people than organs do." },
      { text: "Two at most, because only the kidneys can be transplanted", feedback: "Hearts, livers, lungs and pancreases are transplanted too, as well as tissue." },
    ],
  },
  {
    key: "baseline-b2-01",
    level: "beginner",
    stage: "busting-the-myths",
    topicTag: "independent-teams",
    difficulty: 1,
    recycledFrom: "pre-07",
    prompt:
      'A friend says: "If I\'m registered as a donor, doctors won\'t try as hard to save me." What is the strongest factual answer?',
    explanation:
      "The doctors who determine death must be independent of the transplant team. That is not a custom — the regulations under the National Health Act require it, and require two doctors. Pointing at a structural safeguard answers this fear far better than vouching for doctors' character.",
    verifiedAgainst: REG_9,
    choices: [
      { text: "Doctors take an oath to do their best for every patient, so they would never do that", feedback: "An appeal to character. It does not explain what actually prevents the conflict, and it invites argument." },
      { text: "Hospitals are never told who is a registered donor", feedback: "Do not offer a reassurance you cannot support. The honest answer is the independence of the teams." },
      { text: "Doctors who determine death must be independent of the transplant team", isCorrect: true, feedback: "Correct. A legal safeguard is far more reassuring than an assurance about good intentions." },
      { text: "It would be illegal, so it never happens", feedback: "Legality alone does not explain the safeguard, and it sidesteps the fear being expressed." },
    ],
  },
  {
    key: "baseline-b2-02",
    level: "beginner",
    stage: "busting-the-myths",
    topicTag: "eligibility",
    difficulty: 1,
    recycledFrom: "pre-08",
    prompt: 'Someone in their late sixties asks whether they are "too old" to be a donor. What is the accurate answer?',
    explanation:
      "Age alone does not rule anyone out. Suitability is assessed by medical professionals at the time — it is not something a member of the public, or the donor, can decide in advance.",
    verifiedAgainst: GAUTENG_AGE,
    choices: [
      { text: "Not on age alone — suitability is assessed at the time", isCorrect: true, feedback: "Correct. This is the accurate answer, and the one that keeps a potential donor from ruling themselves out." },
      { text: "Yes — donors have to be younger than sixty-five", feedback: "There is no such cut-off. A confident exclusion rule can remove a potential donor for good." },
      { text: "Age makes no difference at all to whether their organs can be used", feedback: "An overcorrection. Age is part of the medical assessment; it just does not decide it on its own." },
      { text: "Only their corneas could be used at that age", feedback: "This invents a rule. Suitability is assessed individually." },
    ],
  },
  {
    key: "baseline-b2-03",
    level: "beginner",
    stage: "busting-the-myths",
    topicTag: "appearance",
    difficulty: 1,
    prompt: "A family worries that donation would rule out an open-casket funeral. What is accurate?",
    explanation:
      "Organs and tissue are recovered with great care by surgeons and trained staff, and the process does not change the way the body looks. An open-casket funeral remains possible.",
    verifiedAgainst: ODF_FAQ,
    choices: [
      { text: "Donation leaves visible damage, so the coffin has to stay closed", feedback: "This is the myth. Recovery does not change the way the body looks." },
      { text: "The body can be viewed only if just the corneas were donated", feedback: "Appearance is preserved whatever is donated." },
      { text: "The family has to choose between donation and an open casket", feedback: "There is no such choice to make. Donation does not change the way the body looks." },
      { text: "The body is treated with care and its appearance is preserved", isCorrect: true, feedback: "Correct. An open-casket funeral is still possible." },
    ],
  },
  {
    key: "baseline-b3-01",
    level: "beginner",
    stage: "how-donation-works",
    topicTag: "telling-family",
    difficulty: 1,
    recycledFrom: "pre-04",
    prompt: "You have registered as an organ donor. What else most improves the chance that your wishes are followed?",
    explanation:
      "Registering records your wish. Telling your family is what makes it actionable, because a family that has never heard it is asked to guess at the worst moment of their lives.",
    verifiedAgainst: ODF_FAQ,
    choices: [
      { text: "Carrying a donor card with you at all times", feedback: "Helpful, but a card cannot have a conversation with your family on your behalf." },
      { text: "Telling your family what you want", isCorrect: true, feedback: "Correct. This single act is what Save7 exists to encourage." },
      { text: "Registering a second time to be sure", feedback: "Registering again adds nothing. Talking to your family does." },
      { text: "Nothing — registering is enough on its own", feedback: "Your family is still asked. A family that does not know your wishes has to guess." },
    ],
  },
  {
    key: "baseline-b3-02",
    level: "beginner",
    stage: "how-donation-works",
    topicTag: "organ-vs-tissue",
    difficulty: 1,
    prompt: "Which of these is donated as tissue rather than as an organ?",
    explanation:
      "Organs are the heart, liver, pancreas, kidneys and lungs. Tissue — corneas, skin, bone, tendons and heart valves — is donated separately, and helps far more people.",
    verifiedAgainst: TISSUE_CRITERIA,
    choices: [
      { text: "A kidney", feedback: "A kidney is an organ." },
      { text: "A liver", feedback: "The liver is an organ." },
      { text: "A cornea", isCorrect: true, feedback: "Correct. Corneas are tissue, and restore sight." },
      { text: "A heart", feedback: "The heart is an organ — though its valves can be donated as tissue." },
    ],
  },
];

// ---------------------------------------------------------------------------
// INTERMEDIATE — 6 items (2 / 2 / 1 / 1)
// ---------------------------------------------------------------------------

const intermediate: BaselineQuestion[] = [
  {
    key: "baseline-i1-01",
    level: "intermediate",
    stage: "how-donation-happens",
    topicTag: "determining-death",
    difficulty: 2,
    prompt: "How can death be determined in South Africa?",
    explanation:
      "South Africa recognises two ways of determining death: by neurological criteria, which is brain death, and by circulatory criteria. Both are death, not a stage of dying.",
    verifiedAgainst: SAJCC_DEATH,
    choices: [
      { text: "Only by the heart stopping — brain death is not treated as death", feedback: "Brain death is death, determined by neurological criteria." },
      { text: "Only by brain death — a stopped heart is not enough on its own", feedback: "Death can also be determined by circulatory criteria." },
      { text: "By the family, once they agree that life-sustaining treatment should end", feedback: "A family's decision about treatment is not a determination of death. Death is determined by doctors, against defined criteria." },
      { text: "By neurological criteria (brain death) or by circulatory criteria", isCorrect: true, feedback: "Correct." },
    ],
  },
  {
    key: "baseline-i1-02",
    level: "intermediate",
    stage: "how-donation-happens",
    topicTag: "determining-death",
    difficulty: 2,
    recycledFrom: "pre-06",
    prompt: "How can someone be declared dead while their heart is still beating?",
    explanation:
      "A ventilator supplies oxygen the person can no longer take in for themselves, which lets the heart keep beating for a time after death has been determined by neurological criteria. That is why a family at the bedside sees a warm body and a beating heart — and why their disbelief is a reasonable human response.",
    verifiedAgainst: SAJCC_DEATH,
    choices: [
      { text: "A ventilator supplies the oxygen they can no longer take in themselves", isCorrect: true, feedback: "Correct, and this is the explanation you will most often be asked for." },
      { text: "The declaration is provisional and may be reversed later", feedback: "Determination of death is not provisional. It follows a defined process with deliberate safeguards." },
      { text: "They are in a deep coma, which the law treats as death", feedback: "A coma is not death — recovery from a coma is possible. Brain death is a different thing." },
      { text: "It cannot happen — a beating heart always means the person is alive", feedback: "This is exactly the misconception that stops donation conversations." },
    ],
  },
  {
    key: "baseline-i2-01",
    level: "intermediate",
    stage: "consent-whose-decision",
    topicTag: "what-registration-does",
    difficulty: 2,
    prompt: "A registered organ donor dies in circumstances where donation is possible. What happens next?",
    explanation:
      "Registering with the Organ Donor Foundation records a wish; it does not authorise donation on its own. The family is still approached, and in practice a refusal is respected.",
    verifiedAgainst: `${RED_FILE_ODF}. ${FAMILY_PRACTICE}`,
    choices: [
      { text: "Donation goes ahead automatically, because they registered", feedback: "Registration records a wish. It does not mean organs are donated automatically." },
      { text: "The Organ Donor Foundation reviews the case and decides whether to proceed", feedback: "The ODF runs awareness and the register. It is not a medical or allocation body, and it makes no bedside decisions." },
      { text: "The family is still asked, and in practice a refusal is respected", isCorrect: true, feedback: "Correct — which is why telling your family matters as much as registering." },
      { text: "The hospital decides alone, without involving the family", feedback: "The family is approached in every case." },
    ],
  },
  {
    key: "baseline-i2-02",
    level: "intermediate",
    stage: "consent-whose-decision",
    topicTag: "consent-understood",
    difficulty: 2,
    recycledFrom: "pre-10",
    prompt: "Why do interpreters matter when a family is asked about donation?",
    explanation:
      "Consent that is not understood is not informed consent. An interpreter is part of what makes a family's decision valid, not a courtesy for their comfort.",
    verifiedAgainst: CONSENT_UNDERSTOOD,
    choices: [
      { text: "They make the conversation quicker", feedback: "Their purpose is a valid decision, not speed." },
      { text: "Consent that is not understood is not informed consent", isCorrect: true, feedback: "Correct — an interpreter is a consent safeguard, not a convenience." },
      { text: "They are needed only for families from outside South Africa", feedback: "South Africa has many languages. Interpretation is routinely needed." },
      { text: "They are unnecessary if a relative can translate", feedback: "Relying on a grieving relative to interpret a consent conversation is not a safeguard." },
    ],
  },
  {
    key: "baseline-i3-01",
    level: "intermediate",
    stage: "sa-legal-framework",
    topicTag: "no-trade",
    difficulty: 2,
    prompt: "What does South African law say about paying for donated organs or tissue?",
    explanation:
      "Under section 60 of the National Health Act, it is an offence to sell or trade in tissue — which in the Act includes organs — and an offence for a donor to receive any reward beyond reimbursement of reasonable costs. That applies to living donors as much as to deceased donation.",
    verifiedAgainst: NHA_S60,
    choices: [
      { text: "Trading is an offence; a donor may only be reimbursed reasonable costs", isCorrect: true, feedback: "Correct. Section 60 of the National Health Act." },
      { text: "Payment is allowed if the donor's family agrees to it", feedback: "Family agreement does not make payment lawful. Trading in tissue is an offence." },
      { text: "Payment is allowed for a living donor, but never for donation after death", feedback: "The prohibition covers living donors too. A living donor may be reimbursed reasonable costs, and nothing more." },
      { text: "The law is silent, so each hospital sets its own rules", feedback: "The National Health Act addresses it directly, in section 60." },
    ],
  },
  {
    key: "baseline-i4-01",
    level: "intermediate",
    stage: "ethics-and-end-of-life",
    topicTag: "consent-model",
    difficulty: 2,
    prompt:
      "South Africa uses an opt-in system: donation needs explicit consent. What does the evidence suggest about switching to opt-out (\"presumed consent\")?",
    explanation:
      "Reviews of the international evidence find little difference between opt-in and opt-out systems for increasing donor numbers when the switch is made on its own. What moves the numbers is addressing the barriers along the donation pathway — referral, family support, trained staff — with or without a change of system.",
    verifiedAgainst: OPT_OUT_EVIDENCE,
    choices: [
      { text: "Switching on its own would reliably raise donation rates within a few years", feedback: "The evidence finds little difference between the systems when the switch is made in isolation." },
      { text: "Families would no longer need to be approached", feedback: "Families are approached under opt-out systems too." },
      { text: "Hospitals would no longer need to identify and refer donors", feedback: "Identification and referral are where many donations are lost, whatever the consent system." },
      { text: "Alone, it is unlikely to help unless other barriers are addressed", isCorrect: true, feedback: "Correct." },
    ],
  },
];

// ---------------------------------------------------------------------------
// ADVANCED — 6 items (2 / 2 / 1 / 1)
// ---------------------------------------------------------------------------

const advanced: BaselineQuestion[] = [
  {
    key: "baseline-a1-01",
    level: "advanced",
    stage: "coordinator-role",
    topicTag: "coordinator-timing",
    difficulty: 3,
    prompt: "When should the transplant coordinator be contacted about a potential donor?",
    explanation:
      "Before the family is told about end-of-life decisions. Contacting the coordinator first lets the team check feasibility, the national priority list and ODF registration, and plan the conversation — rather than raising donation prematurely, or not at all.",
    verifiedAgainst: WC_COORDINATOR,
    choices: [
      { text: "Only after the family has agreed to donation", feedback: "By then the conversation has already happened without the person best placed to support it." },
      { text: "Only once death is certified and the family has been told", feedback: "Too late to plan the approach. The coordinator is contacted before the family is told." },
      { text: "Before the family is told about end-of-life decisions", isCorrect: true, feedback: "Correct. Early contact is what makes a planned approach possible." },
      { text: "Only if the patient was a registered donor", feedback: "Every potential donor is referred. Registration status is one of the things the coordinator checks." },
    ],
  },
  {
    key: "baseline-a1-02",
    level: "advanced",
    stage: "coordinator-role",
    topicTag: "satcs",
    difficulty: 3,
    prompt: "Which organisation exists to educate, develop and support transplant coordinators in South Africa?",
    explanation:
      "The South African Transplant Coordinators Society (SATCS), founded in 2017 as a special-interest group of the Southern African Transplantation Society. It sets a Code of Conduct for coordinators and produced the Red File that hospitals use as a reference.",
    verifiedAgainst: SATCS,
    choices: [
      { text: "The Organ Donor Foundation (ODF)", feedback: "The ODF runs public awareness and the donor register. It is not the coordinators' professional body." },
      { text: "The South African Transplant Coordinators Society (SATCS)", isCorrect: true, feedback: "Correct." },
      { text: "The Health Professions Council of South Africa (HPCSA)", feedback: "The HPCSA registers and regulates health practitioners generally. It is not a body for coordinators." },
      { text: "The Ministerial Advisory Committee on Organ Transplantation", feedback: "The Committee, established in 2024, advises the Minister. It does not train or support coordinators." },
    ],
  },
  {
    key: "baseline-a2-01",
    level: "advanced",
    stage: "donation-conversation",
    topicTag: "decoupling",
    difficulty: 3,
    prompt: "Why is the conversation about a patient's death kept separate from the conversation about donation?",
    explanation:
      "So the family can understand and accept that death has happened, or is going to, before donation is raised. A request made before that point is heard as a request to give up on the patient.",
    verifiedAgainst: FACTS,
    choices: [
      { text: "So the family can understand and accept the death before donation is raised", isCorrect: true, feedback: "Correct. This is the first principle of the approach." },
      { text: "So the transplant team can prepare the family's decision in advance", feedback: "The family's decision is theirs. Separating the conversations protects it; it does not steer it." },
      { text: "Because the law forbids raising donation on the day of death", feedback: "No such rule exists. The separation is a matter of good practice, not timing law." },
      { text: "So the treating doctor never has to take part in the donation conversation", feedback: "The treating doctor and the coordinator deliver the approach together." },
    ],
  },
  {
    key: "baseline-a2-02",
    level: "advanced",
    stage: "donation-conversation",
    topicTag: "switch-off-misconception",
    difficulty: 3,
    scenario:
      'Brain death has been confirmed. The family say: "We can\'t be the ones who decide to switch off the machine."',
    prompt: "What is the most helpful response?",
    explanation:
      "The family believe the ventilator is keeping their loved one alive, and that they are being asked to end a life. They are not: death has already been determined. Correcting that, gently, comes before anything is said about donation.",
    verifiedAgainst: `${FACTS}. ${ACCOMMODATION}`,
    choices: [
      { text: "Move straight on to asking whether they would consider donation", feedback: "Donation cannot be discussed while the family believe they are being asked to end a life." },
      { text: "Explain that donation is what the patient would have wanted", feedback: "This presumes the answer, and leaves the misconception untouched." },
      { text: "Tell them the machine can stay on for as long as they need, so there is no rush", feedback: "Not accurate — accommodation after death is ordinarily limited to about a day — and it confirms the belief that the machine is keeping the person alive." },
      { text: "Explain that the person has already died, so no one is ending a life", isCorrect: true, feedback: "Correct. The misconception has to be addressed first." },
    ],
  },
  {
    key: "baseline-a3-01",
    level: "advanced",
    stage: "consent-ethics-in-depth",
    topicTag: "surrogate-decisions",
    difficulty: 3,
    prompt: "When a patient can no longer decide for themselves, what should guide the person deciding on their behalf?",
    explanation:
      "The patient's own wishes where they are known — an advance directive, or what they said while they could — and, where they are not, the patient's best interests. It is the patient's decision being made by someone else, not the decision-maker's own.",
    verifiedAgainst: SURROGATE,
    choices: [
      { text: "What the decision-maker would choose for themselves", feedback: "The decision is being made for the patient. The decision-maker's own preference is not the test." },
      { text: "Whatever the treating doctors recommend", feedback: "Doctors advise; they do not decide in the patient's place." },
      { text: "The patient's known wishes, or else their best interests", isCorrect: true, feedback: "Correct." },
      { text: "Whatever most of the family agrees on after discussing it together", feedback: "A family majority is not the test. The patient's own wishes and interests are." },
    ],
  },
  {
    key: "baseline-a4-01",
    level: "advanced",
    stage: "public-advocacy",
    topicTag: "equity",
    difficulty: 3,
    prompt:
      "A ward team assumes a family's faith will forbid donation, and decides not to raise it. What does good practice say?",
    explanation:
      "Every family is offered the conversation. Assumptions about a family's ethnic, cultural or spiritual background must never be used to skip it, and a faith representative or chaplain can be brought in to support the family.",
    verifiedAgainst: WC_EQUALITY,
    choices: [
      { text: "That is appropriate — it spares the family an upsetting question", feedback: "It takes the decision away from the family on the strength of an assumption." },
      { text: "Offer every family the conversation, with faith support if wanted", isCorrect: true, feedback: "Correct. No community is excluded from being asked." },
      { text: "Raise it only if the family brings up donation first", feedback: "Few families raise it themselves. Waiting excludes them just as surely." },
      { text: "Ask a relative privately what their religion allows before deciding", feedback: "This still puts the team's assumption ahead of the family's own decision." },
    ],
  },
];

export const baselineQuestions: BaselineQuestion[] = [...beginner, ...intermediate, ...advanced];

/**
 * Check the bank before anything is emitted from it.
 *
 * Throws on the first problem rather than collecting them: a malformed Baseline
 * is not a thing to triage, and every sitting marked against it would be wrong.
 */
export function assertBaselineIsWellFormed(
  bank: BaselineQuestion[] = baselineQuestions,
  levels: LevelStructure[] = courseStructure,
): void {
  if (bank.length !== BASELINE_SIZE) {
    throw new Error(`the Blueprint requires ${BASELINE_SIZE} baseline questions, found ${bank.length}`);
  }

  const levelOf = new Map(levels.flatMap((l) => l.stages.map((s) => [s.slug, l.slug] as const)));
  for (const stage of levelOf.keys()) {
    if (!(stage in BASELINE_WEIGHTING)) throw new Error(`no baseline weighting for Stage ${stage}`);
  }

  const perStage = new Map<string, number>();
  const seenKeys = new Set<string>();
  const keyedAt = [0, 0, 0, 0];

  for (const q of bank) {
    const level = levelOf.get(q.stage);
    if (!level) throw new Error(`${q.key}: unknown Stage ${q.stage}`);
    if (q.level !== level) throw new Error(`${q.key}: Stage ${q.stage} belongs to ${level}, not ${q.level}`);
    if (!q.key.startsWith("baseline-")) throw new Error(`${q.key}: baseline keys start "baseline-"`);
    if (seenKeys.has(q.key)) throw new Error(`${q.key}: duplicate authoring key`);
    seenKeys.add(q.key);
    perStage.set(q.stage, (perStage.get(q.stage) ?? 0) + 1);

    const correct = q.choices.flatMap((c, i) => (c.isCorrect ? [i] : []));
    if (correct.length !== 1) {
      throw new Error(`${q.key}: has ${correct.length} correct answers, must have exactly 1`);
    }
    keyedAt[correct[0]]++;
    if (new Set(q.choices.map((c) => c.text.trim())).size !== 4) {
      throw new Error(`${q.key}: has duplicate option text`);
    }
  }

  for (const [stage, want] of Object.entries(BASELINE_WEIGHTING)) {
    const got = perStage.get(stage) ?? 0;
    if (got !== want) throw new Error(`${stage}: the Blueprint weights it at ${want}, found ${got}`);
  }

  // Options render in authored order, so a bank that keys one position is
  // answerable without reading it. Two in five is already a pattern.
  const most = Math.max(...keyedAt);
  if (most > BASELINE_SIZE * 0.4) {
    throw new Error(`${most} of ${BASELINE_SIZE} items key the same option position; spread them`);
  }
}

