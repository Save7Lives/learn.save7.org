/**
 * Beginner Level Stage Quiz banks — 45 questions, 15 per Stage.
 *
 * Written for ticket #47 against the three Stages' Markdown under
 * `content/beginner/`. Nothing here tests a fact the lessons do not teach, and
 * nothing tests a fact the course cannot source.
 *
 * **Depth is deliberate.** Beginner items sit at difficulty 1–2. Death
 * determination beyond "two independent doctors, neither of them on the
 * transplant team" belongs to Intermediate Level and is not tested here, even
 * where a learner might plausibly know it.
 *
 * Items marked `recycledFrom` began life in the prior build's `questions.ts`
 * and were re-keyed onto a Stage. Two conversions were forced by the Blueprint:
 * it requires four-option single-best-answer throughout, so the prior build's
 * MULTI and TRUE_FALSE items were rewritten rather than carried over, and
 * `pairKey` is gone — #26/#41 replaced pair-matching with sitting-over-sitting
 * comparison, so it measures nothing.
 *
 * Correct answers are spread across all four positions (12/11/11/11), because
 * options display in authoring order. Keep them spread when editing —
 * `assertBankIsWellFormed` refuses a bank that keys over half its answers to
 * one position.
 */

import type { StageQuizBanks, StageQuizQuestion } from "./quiz";

// Sources, named once and shared by the items they actually back.
const SATS_5YR =
  "SATS/SATCS, '5-Year National Organ Transplant Activity, South Africa 2017-2021', the joint report to the WHO-ONT Global Observatory on Donation and Transplantation (published 2024): donation rate 1.60 pmp in 2017 falling to 0.48 pmp in 2021; waiting list at 31 December 2021 of 2,586 (renal 2,382, heart 108, liver 52, lung 44); 189 waiting-list deaths in 2021";
const ODF_DONOR_INFO =
  "Organ Donor Foundation of South Africa, donor information and FAQ pages (odf.org.za/faqs/, /cornea-faqs/): one donor can save seven lives and improve up to fifty more through tissue donation; no strict upper age limit; recovery does not change the body's appearance; donation is a voluntary gift and trading organs is illegal; the family is not billed for the donation";
const SPAIN_COMPARATOR =
  "📌 Non-South African comparator. Spain's deceased-donor rate of 47.05 pmp in 2017 (2,183 deceased donors), from Global Observatory data cited in a 2020 South African Medical Journal study and reported in Spotlight, 29 September 2025";
const REG_9 =
  "Regulation 9 ('Establishment of death') of GN R180, Government Gazette 35099 of 2 March 2012, made under the National Health Act 61 of 2003: death shall be established by at least two medical practitioners, one of whom shall have been practising for at least five years after registration, and none of whom shall transplant tissue removed from that person or take part in such transplantation";
const NHA_COSTS =
  "Checked to conclusion against the National Health Act 61 of 2003 (consolidated) and GN R180 of 2 March 2012: neither allocates the costs of donation. The Act's money provisions are s 60 (prohibition on trading in tissue; reimbursement of a donor's reasonable expenses). The bill-free position is the Organ Donor Foundation's stated practice, quoted from its FAQs — the hospital or tissue bank carries the medical expenses of the donation from the moment consent is given";
const FPS =
  "National Health Act s 66(1)(c) with s 3 of the Inquests Act 58 of 1959: an unnatural death must be referred for a medico-legal post-mortem, and recovery requires the forensic pathologist's authorisation. Medico-legal post-mortems are performed by the Forensic Pathology Service under the Department of Health; the district surgeon's office no longer performs this function";
const FAMILY_PRACTICE =
  "National Health Act s 62(1)-(2): relatives may donate only in the absence of a donation by the person, or of a contrary direction given while alive. The gap between that and hospital practice — families are approached in every case and a refusal is respected — is documented in Slabbert & Venter, 'Autonomy in organ donations v family consent: A South African legislative context', De Jure, 2019";
const LOSS_POINTS =
  "Donation pathway and its loss points per de Jager et al., SAMJ 2019;109(9):626-631; consent from next of kin is always required per Save7, 'Transplant Alchemy 101 - Study Guide', Objective 2";
const TISSUE_CRITERIA =
  "SATCS, 'The Organ and Tissue Donation Reference File' (the Red File), pp.15-16, 21, 41-43: tissue donation can take place irrespective of the manner of death; the body is restored with prostheses and an open-casket funeral is possible after tissue recovery; cataracts and poor eyesight do not prevent cornea donation; per-tissue age windows and exclusions. Organ Donor Foundation FAQ and cornea FAQ: tissue retrieval can take place several hours and even days after death; corneas can be used even if the donor wore glasses. Checked in T47 research findings, section 1 and section 5";
const RED_FILE_ELIGIBILITY =
  "Organ Donor Foundation FAQ: having a medical condition does not necessarily prevent a person from becoming an organ or tissue donor, and suitability is established at the time of death. SATCS Red File p.20: no age restriction for organ donation; the transplant coordinator and team discuss and document donor suitability; individual organs are assessed for transplantability in donors with comorbidities such as hypertension, diabetes and HIV. Red File pp.21, 41-42: most cancers do not exclude cornea donation (leukaemia and lymphoma do); cancer excludes skin, bone and heart-valve donation. 📌 UK: SaBTO, 'Transplantation of organs from deceased donors with cancer or a history of cancer' v2.1 — cancers not in its tables are considered case by case. Checked in T47 research findings, section 4";
const LIVING_DONOR_SAFETY =
  "SA: Groote Schuur Hospital Kidney Paired Donation SOP (23 May 2025, via sats.org.za), Annexure G donor brochure — the operation is safe and low-risk but not risk-free; workup includes clinical suitability, blood group and tissue typing, social-work and where needed psychological assessment. Dayal C et al., PLoS ONE 2022;17(5):e0268183 — Charlotte Maxeke Johannesburg Academic Hospital 1981-2015, 298 of 1,208 potential donors (24.7%) donated. Botha J et al., S Afr J Surg 2019;57(3):11-16 — 65 living liver donors at Wits Donald Gordon, 0 deaths. National Health Act ss 58, 60(4). 📌 US: Massie AB et al., JAMA 2024;332(12):1015-1017 (0.9 per 10,000 perioperative mortality, 2013-2022); Segev DL et al., JAMA 2010 (3.1 per 10,000, 1994-2009); Lentine KL et al., CJASN 2019 (major complications <3%); Muzaale AD et al., JAMA 2014 (lifetime ESRD risk 90 per 10,000 donors vs 14 healthy non-donors vs 326 general population). Checked in T47 research findings, section 2 and section 3";
const CARDIAC_OUTCOMES =
  "One-year survival after cardiac transplantation approaches 90%, with 50% of recipients surviving beyond 11 years — carried over from the prior build's sourced advanced-heart-failure material";

// ---------------------------------------------------------------------------
// STAGE 1 — Why Donation Matters
// ---------------------------------------------------------------------------

const whyDonationMatters: StageQuizQuestion[] = [
  {
    key: "sq-b1-01",
    stage: "why-donation-matters",
    topicTag: "who-is-waiting",
    difficulty: 1,
    recycledFrom: "chk-m1-01",
    prompt: "What does end-stage organ failure mean?",
    explanation:
      "The organ has failed to the point where it can no longer sustain its function, and it cannot be repaired. For some conditions transplantation is the only option that remains.",
    verifiedAgainst: ODF_DONOR_INFO,
    choices: [
      { text: "The organ is working at reduced capacity but is stable", feedback: "Reduced but stable function is not end-stage; it is usually managed with treatment." },
      { text: "The organ has already been surgically removed", feedback: "End-stage failure describes an organ still in the body that no longer works." },
      { text: "The organ can no longer sustain its function and cannot be repaired", isCorrect: true },
      { text: "The organ is failing but will recover with medication", feedback: "If medication can restore the organ, it has not reached end-stage failure." },
    ],
  },
  {
    key: "sq-b1-02",
    stage: "why-donation-matters",
    topicTag: "what-can-be-donated",
    difficulty: 1,
    recycledFrom: "chk-m1-02",
    prompt: "Which of these is transplanted as tissue rather than as a solid organ?",
    explanation:
      "Corneas, bone and ligaments, skin and heart valves are tissue. Kidneys, liver, heart, lungs and pancreas are solid organs.",
    verifiedAgainst: TISSUE_CRITERIA,
    choices: [
      { text: "A kidney", feedback: "A kidney is a solid organ." },
      { text: "The pancreas", feedback: "The pancreas is a solid organ." },
      { text: "A lung", feedback: "Lungs are solid organs." },
      { text: "Heart valves", isCorrect: true },
    ],
  },
  {
    key: "sq-b1-03",
    stage: "why-donation-matters",
    topicTag: "what-can-be-donated",
    difficulty: 1,
    recycledFrom: "chk-m1-03",
    prompt: "Where does Save7's name come from?",
    explanation:
      "One donor can save seven lives through organ donation. Tissue donation from the same donor can improve up to fifty more.",
    verifiedAgainst: ODF_DONOR_INFO,
    choices: [
      { text: "Seven organs are recovered in every donation", feedback: "What can be recovered varies with the circumstances of each death." },
      { text: "One decision can save seven lives", isCorrect: true },
      { text: "The organisation was founded by seven people", feedback: "The name refers to what one donor can do, not to the founders." },
      { text: "Seven hospitals in South Africa perform transplants", feedback: "The name is not a count of transplant centres." },
    ],
  },
  {
    key: "sq-b1-04",
    stage: "why-donation-matters",
    topicTag: "what-can-be-donated",
    difficulty: 1,
    prompt: "How many people can one donor help through tissue donation?",
    explanation:
      "Up to fifty. Tissue — corneas, bone, ligaments, skin, heart valves — goes further and reaches more people than the solid organs do. By volume it is the largest part of what donation achieves.",
    verifiedAgainst: ODF_DONOR_INFO,
    choices: [
      { text: "Up to fifty", isCorrect: true },
      { text: "Up to seven", feedback: "Seven is the organ figure. Tissue reaches many more people than that." },
      { text: "One, because tissue is matched to a single recipient", feedback: "Tissue from one donor is divided among many recipients." },
      { text: "Up to two hundred", feedback: "Larger figures circulate but cannot be sourced. This course uses the published figure of fifty." },
    ],
  },
  {
    key: "sq-b1-05",
    stage: "why-donation-matters",
    topicTag: "sa-shortage",
    difficulty: 1,
    prompt:
      "What happened to South Africa's deceased-donation rate between 2017 and 2021?",
    explanation:
      "It fell from 1.60 to 0.48 donors per million people — roughly two thirds in five years. Activity dropped during the COVID-19 pandemic and has not recovered since.",
    verifiedAgainst: SATS_5YR,
    choices: [
      { text: "It roughly doubled, from 0.48 to 1.60 per million people", feedback: "The direction is the wrong way round. The rate fell." },
      { text: "It fell by roughly two thirds, from 1.60 to 0.48 per million people", isCorrect: true },
      { text: "It stayed broadly flat", feedback: "It fell in every one of the five years reported." },
      { text: "It fell during 2020 and recovered fully by 2021", feedback: "2021 was the lowest year of the five, not a recovery." },
    ],
  },
  {
    key: "sq-b1-06",
    stage: "why-donation-matters",
    topicTag: "sa-shortage",
    difficulty: 2,
    prompt:
      "How many people were on South Africa's national transplant waiting list at the end of 2021, the most recent verified figure?",
    explanation:
      "2,586 — of whom 2,382 were waiting for a kidney. 189 people on the list died that year.",
    verifiedAgainst: SATS_5YR,
    choices: [
      { text: "258", feedback: "Too low by a factor of ten. 2,586 people were waiting." },
      { text: "25,860", feedback: "Too high by a factor of ten." },
      { text: "Nobody knows, because no figure has ever been collected", feedback: "2021 was the first year the waiting list was collected nationally, and the figure is 2,586." },
      { text: "2,586", isCorrect: true },
    ],
  },
  {
    key: "sq-b1-07",
    stage: "why-donation-matters",
    topicTag: "sa-shortage",
    difficulty: 2,
    prompt:
      "Spain's deceased-donor rate was 47.05 per million in 2017, against South Africa's 1.60. What does that comparison establish?",
    explanation:
      "That South Africa's rate is a result rather than a limit. Spain's health system is not ours and the figure is not a South African one, but it shows that a low donation rate is something a country's organisation of donation produces, not a natural floor.",
    verifiedAgainst: SPAIN_COMPARATOR,
    choices: [
      { text: "That South African doctors are less skilled than Spanish ones", feedback: "South Africa has a long and distinguished transplant history. Surgical capability is not the constraint." },
      { text: "That South Africa should adopt Spanish law exactly", feedback: "The comparison establishes what is achievable, not which policy achieves it." },
      { text: "That a low donation rate is a result of how donation is organised, not a natural limit", isCorrect: true },
      { text: "Nothing, because the two countries cannot be compared at all", feedback: "The comparison has real limits, and it still shows the gap is not medically fixed." },
    ],
  },
  {
    key: "sq-b1-08",
    stage: "why-donation-matters",
    topicTag: "who-is-waiting",
    difficulty: 1,
    prompt: "What is donated skin used for?",
    explanation:
      "Keeping severely burned patients alive. It is one of the clearest examples of tissue donation saving a life outright, and one of the least known.",
    verifiedAgainst: TISSUE_CRITERIA,
    choices: [
      { text: "Cosmetic surgery", feedback: "Donated skin is a treatment for severe burn injury, not a cosmetic material." },
      { text: "Treating patients with severe burns", isCorrect: true },
      { text: "Replacing a damaged cornea", feedback: "Corneal damage is treated with a donated cornea." },
      { text: "Repairing damaged ligaments", feedback: "Ligament damage is repaired with donated bone and ligament tissue." },
    ],
  },
  {
    key: "sq-b1-09",
    stage: "why-donation-matters",
    topicTag: "eligibility",
    difficulty: 1,
    prompt: "Can someone who wore glasses all their life donate their corneas?",
    explanation:
      "Yes. Poor eyesight and cataracts do not disqualify a cornea donor — the cornea is the clear front surface of the eye, and the reasons most people wear glasses have nothing to do with it.",
    verifiedAgainst: TISSUE_CRITERIA,
    choices: [
      { text: "Yes — wearing glasses does not disqualify a cornea donor", isCorrect: true },
      { text: "No — donated corneas must have had perfect vision", feedback: "This is one of the most common reasons people wrongly rule themselves out." },
      { text: "Only if the glasses were for reading", feedback: "The reason for the glasses makes no difference." },
      { text: "Only if they had laser surgery to correct their vision first", feedback: "No such requirement exists." },
    ],
  },
  {
    key: "sq-b1-10",
    stage: "why-donation-matters",
    topicTag: "sa-shortage",
    difficulty: 2,
    prompt:
      "You need a current national figure for transplants performed in South Africa. Where should you look?",
    explanation:
      "The South African Transplant Society. The Organ Donor Foundation is the awareness and registration body and its own statistics page now refers enquiries to SATS.",
    verifiedAgainst:
      "The Organ Donor Foundation's statistics page (odf.org.za/statistics/) carries no independent figures and defers to the South African Transplant Society for comprehensive transplant statistics",
    choices: [
      { text: "The Organ Donor Foundation", feedback: "The ODF is the registration and awareness body; its statistics page now points to SATS." },
      { text: "Whichever news article was published most recently", feedback: "News coverage often repeats figures without a primary source or a date." },
      { text: "The hospital where the transplant was performed", feedback: "A single hospital cannot give you a national figure." },
      { text: "The South African Transplant Society (SATS)", isCorrect: true },
    ],
  },
  {
    key: "sq-b1-11",
    stage: "why-donation-matters",
    topicTag: "sa-shortage",
    difficulty: 2,
    prompt: "Why does this course insist you quote the date alongside any donation statistic?",
    explanation:
      "Because an undated statistic quietly becomes a wrong one. South Africa has no single national transplant register, published figures disagree with each other, and the most recent verified national data is from 2021.",
    verifiedAgainst: SATS_5YR,
    choices: [
      { text: "Because the figures change and an undated number eventually becomes a wrong one", isCorrect: true },
      { text: "Because it makes the statistic sound more authoritative", feedback: "The reason is accuracy, not presentation." },
      { text: "Because the law requires statistics to be dated", feedback: "No such requirement exists. The reason is that the figures genuinely change." },
      { text: "It does not really matter, as long as the figure was accurate once", feedback: "A figure that was accurate in 2017 is misleading if quoted as current." },
    ],
  },
  {
    key: "sq-b1-12",
    stage: "why-donation-matters",
    topicTag: "what-can-be-donated",
    difficulty: 1,
    prompt: "By the number of people helped, which part of donation is the largest?",
    explanation:
      "Tissue. It is almost absent from public conversation about donation, and it reaches far more people than solid organs do.",
    verifiedAgainst: ODF_DONOR_INFO,
    choices: [
      { text: "Heart transplantation", feedback: "Hearts are what most people picture, and they are among the rarest transplants." },
      { text: "Lung transplantation", feedback: "Lung transplantation remains rare in South Africa." },
      { text: "Living donation", feedback: "Living donation matters, but tissue reaches far more people." },
      { text: "Tissue donation", isCorrect: true },
    ],
  },
  {
    key: "sq-b1-13",
    stage: "why-donation-matters",
    topicTag: "who-is-waiting",
    difficulty: 2,
    prompt: "Which statement about outcomes after a heart transplant is most accurate?",
    explanation:
      "One-year survival approaches 90% and half of recipients live beyond eleven years. Those are good outcomes, and a transplant is still not a cure — it trades one serious medical situation for a much better one that involves daily medication and lifelong monitoring.",
    verifiedAgainst: CARDIAC_OUTCOMES,
    choices: [
      { text: "A transplant restores the recipient completely, with no further treatment needed", feedback: "Overselling transplantation does the cause no favours. Recipients take medication and are monitored for life." },
      { text: "Most recipients survive less than a year", feedback: "Outcomes are far better than this. One-year survival approaches 90%." },
      { text: "Outcomes are unknown because too few transplants are performed", feedback: "Outcomes after cardiac transplantation are well documented." },
      { text: "One-year survival approaches 90%, and half of recipients live beyond eleven years", isCorrect: true },
    ],
  },
  {
    key: "sq-b1-14",
    stage: "why-donation-matters",
    topicTag: "sa-shortage",
    difficulty: 2,
    scenario:
      "A 2026 news article reports the Gauteng Department of Health as saying around 6,500 South Africans are waiting for a transplant, and that 317 organ transplants were performed nationally in 2024.",
    prompt: "How should an advocate use those figures?",
    explanation:
      "Use them, and say where they come from. They are consistent with the verified data and no primary document behind them has been located, so they are quoted as reported rather than as established.",
    verifiedAgainst:
      "Channel Africa (26 August 2026) and allAfrica (27 August 2026), both attributing the ~6,500 waiting and 317 transplants in 2024 figures to the Gauteng Department of Health without a linked primary document. Flagged as unverified in T01 research findings, Gap G5",
    choices: [
      { text: "Quote them as the current official national statistics", feedback: "No primary document behind them has been located. Presenting them as official overstates what is known." },
      { text: "Refuse to use them at all", feedback: "They are consistent with the verified data and genuinely useful. The answer is to caveat them, not to drop them." },
      { text: "Quote them and attribute them to the South African Transplant Society", feedback: "Attributing a figure to a source that did not publish it is worse than not using it." },
      { text: "Quote them with an explicit note that they are reported, not independently verified", isCorrect: true },
    ],
  },
  {
    key: "sq-b1-15",
    stage: "why-donation-matters",
    topicTag: "who-is-waiting",
    difficulty: 1,
    recycledFrom: "post-b-01",
    prompt: "Why do people need organ transplants?",
    explanation:
      "Because their organ has failed completely and cannot be repaired. Transplantation is not an enhancement and it is not usually a preference — it is what remains when other treatment can no longer sustain the organ's function.",
    verifiedAgainst: ODF_DONOR_INFO,
    choices: [
      { text: "To improve the performance of a healthy organ", feedback: "Transplantation treats organs that have failed; it is not an enhancement." },
      { text: "Because they have chosen a transplant instead of taking medication", feedback: "Transplantation is not usually an alternative someone simply prefers." },
      { text: "Only after a serious accident", feedback: "Accidents are one route to organ failure, but most recipients have a chronic disease." },
      { text: "Their organ has failed completely and cannot be repaired", isCorrect: true },
    ],
  },
];

// ---------------------------------------------------------------------------
// STAGE 2 — Busting the Myths
// ---------------------------------------------------------------------------

const bustingTheMyths: StageQuizQuestion[] = [
  {
    key: "sq-b2-01",
    stage: "busting-the-myths",
    topicTag: "myths",
    difficulty: 2,
    recycledFrom: "post-b-07",
    prompt: "What actually answers the fear that doctors won't try as hard to save a registered donor?",
    explanation:
      "The doctors who certify death are independent of the transplant team, and none of them may take part in the transplant. Pointing to that structural separation is far stronger than an assurance about professional character.",
    verifiedAgainst: REG_9,
    choices: [
      { text: "The doctors who certify death may not take part in the transplant", isCorrect: true },
      { text: "Doctors take an oath, so they would never do that", feedback: "An appeal to character asks the person to trust. The separation of teams means they do not have to." },
      { text: "Hospitals are never told who is a registered donor", feedback: "Not the safeguard. The protection is who may certify death, not who knows about the registration." },
      { text: "It would be illegal, so it cannot happen", feedback: "Vague. The specific safeguard — separate teams — is what reassures." },
    ],
  },
  {
    key: "sq-b2-02",
    stage: "busting-the-myths",
    topicTag: "myths",
    difficulty: 1,
    prompt: "A family worries that donation will mean they cannot have an open-casket funeral. What is true?",
    explanation:
      "Recovery is carried out with surgical care, the donor's appearance is preserved, and an open-casket funeral remains possible.",
    verifiedAgainst: ODF_DONOR_INFO,
    choices: [
      { text: "An open casket is not possible after any donation", feedback: "This is the myth. Great care is taken to preserve the donor's appearance." },
      { text: "Only a closed casket is allowed after organ donation, but not after tissue donation", feedback: "Neither form of donation rules out an open casket." },
      { text: "The funeral must be delayed by several weeks", feedback: "Donation does not delay a funeral in any way the family would notice." },
      { text: "The body is restored and an open-casket funeral remains possible", isCorrect: true },
    ],
  },
  {
    key: "sq-b2-03",
    stage: "busting-the-myths",
    topicTag: "costs",
    difficulty: 2,
    prompt: "What is the most accurate way to tell a family that donation will not cost them anything?",
    explanation:
      "State it as practice. The hospital or tissue bank carries the costs of the donation from the point consent is given — that is the stated position of the Organ Donor Foundation and the tissue banks. Neither the National Health Act nor its regulations allocate donation costs, so claiming the law guarantees it is an error.",
    verifiedAgainst: NHA_COSTS,
    choices: [
      { text: "The National Health Act prohibits anyone from charging the family", feedback: "Neither the Act nor its regulations allocate donation costs. This course corrected exactly this claim." },
      { text: "The hospital or tissue bank carries the costs of the donation from the point consent is given", isCorrect: true },
      { text: "The family's medical aid pays, so there is nothing out of pocket", feedback: "The donation is not billed to the donor's cover at all." },
      { text: "The recipient pays the donor's family's costs", feedback: "Any payment from a recipient to a donor's family would be a criminal offence." },
    ],
  },
  {
    key: "sq-b2-04",
    stage: "busting-the-myths",
    topicTag: "law",
    difficulty: 1,
    prompt: "Someone asks whether organs in South Africa go to whoever can pay. What is true?",
    explanation:
      "No. Trading in human tissue is a criminal offence, and organs are allocated according to prescribed rules rather than by payment or any single doctor's discretion.",
    verifiedAgainst:
      "National Health Act 61 of 2003 s 60 (prohibition on trading in human tissue; reward beyond reasonable costs is an offence) and s 61(1)-(3) (organs to be allocated in the prescribed manner; transplant into a non-citizen or non-permanent-resident requires the Minister's written authorisation)",
    choices: [
      { text: "No — trading in human tissue is a crime and organs are allocated by prescribed rules", isCorrect: true },
      { text: "Yes, private patients can pay to move up the list", feedback: "Allocation is regulated, not sold." },
      { text: "Only for organs from living donors", feedback: "The prohibition on trading applies to living and deceased donation alike." },
      { text: "Only when the organ is transplanted outside South Africa", feedback: "Trading is prohibited, and transplanting into a non-resident needs the Minister's written authorisation." },
    ],
  },
  {
    key: "sq-b2-05",
    stage: "busting-the-myths",
    topicTag: "myths",
    difficulty: 2,
    scenario: "Someone at a community event tells you their religion does not allow organ donation.",
    prompt: "Which response best reflects what this Stage teaches?",
    explanation:
      "Accept their position and point them to the right authority. Most religions support donation, but positions differ and it is not yours to settle. A clearly communicated 'no' that their family has heard is a good outcome, not a failure.",
    verifiedAgainst:
      "Organ Donor Foundation FAQ: most religions support organ and tissue donation as consistent with the preservation of life; the prior build's sourced guidance that a faith representative or chaplain may be included in hospital, and that no one's background should be assumed to rule donation out",
    choices: [
      { text: "Tell them most religions actually permit it, so they are probably mistaken", feedback: "Even where broadly true, telling someone what their own faith permits oversteps — and loses their trust." },
      { text: "Respect it, suggest they ask their own faith leader, and ask whether their family knows their wishes", isCorrect: true },
      { text: "Look up their religion's position for them on the spot", feedback: "Well-meant, but it makes you the interpreter of their faith. Point them to someone inside it." },
      { text: "Drop the subject and move on to someone more likely to register", feedback: "Their family still needs to know their wishes. That conversation is worth having whatever they decide." },
    ],
  },
  {
    key: "sq-b2-06",
    stage: "busting-the-myths",
    topicTag: "eligibility",
    difficulty: 1,
    recycledFrom: "post-b-06",
    scenario: "A colleague says: \"I'm in my sixties and on blood pressure medication — I'd be turned down anyway.\"",
    prompt: "What is the best response?",
    explanation:
      "Do not let anyone rule themselves out, and do not overcorrect by claiming the factor is irrelevant. There is no strict upper age limit, and suitability is assessed organ by organ by clinicians at the time.",
    verifiedAgainst: RED_FILE_ELIGIBILITY,
    choices: [
      { text: "You're right, that combination would exclude you", feedback: "A confident exclusion can permanently remove a potential donor. There is no strict upper age limit." },
      { text: "Don't rule yourself out — suitability is assessed individually by doctors at the time", isCorrect: true },
      { text: "Age and blood pressure make no difference at all to donation", feedback: "Overcorrection. These factors are assessed rather than ignored, and the claim will not survive someone checking." },
      { text: "You could only donate your corneas", feedback: "Speculation about a specific outcome. Keep it general and let the assessment decide." },
    ],
  },
  {
    key: "sq-b2-07",
    stage: "busting-the-myths",
    topicTag: "family-conversation",
    difficulty: 1,
    prompt: "Why is registering as a donor not enough on its own?",
    explanation:
      "Because in South African practice the family is approached in every case and a refusal is respected. A registration the family has never heard about leaves them guessing.",
    verifiedAgainst: FAMILY_PRACTICE,
    choices: [
      { text: "The family is always asked, so they need to know what you want", isCorrect: true },
      { text: "The register is often lost or out of date", feedback: "The reason is not the register's reliability. It is that the family is asked in every case." },
      { text: "Registration expires after five years", feedback: "It does not expire. It is simply not the decision the family will be asked to make." },
      { text: "It is enough — hospitals follow the register without asking the family", feedback: "This is the myth. Hospitals approach the family in every case." },
    ],
  },
  {
    key: "sq-b2-08",
    stage: "busting-the-myths",
    topicTag: "family-conversation",
    difficulty: 2,
    prompt: "A family agreed to donation some years ago. Why might donation still not go ahead?",
    explanation:
      "A family meeting the decision again in acute grief can change its mind at the bedside, and in practice a family's refusal is respected. That is why the conversation is worth having more than once.",
    verifiedAgainst:
      "Gauteng Department of Health spokesperson Steve Mabona, quoted in Channel Africa (26 August 2026), on families who agreed and then declined at the time on cultural grounds; hospital practice of respecting a family refusal per Slabbert & Venter, De Jure, 2019",
    choices: [
      { text: "Earlier agreement is legally void after one year", feedback: "There is no such rule. The issue is that families are asked again at the time." },
      { text: "Agreement only counts if it was given in writing to a hospital", feedback: "The form of the earlier agreement is not the issue. The family is asked again at the time." },
      { text: "The family can change its mind at the bedside, and a refusal is respected in practice", isCorrect: true },
      { text: "It will always go ahead — earlier agreement binds the family", feedback: "This is the myth. Agreement given calmly years ago can change in acute grief." },
    ],
  },
  {
    key: "sq-b2-09",
    stage: "busting-the-myths",
    topicTag: "sa-shortage",
    difficulty: 1,
    prompt: "Someone says South Africa's organ shortage isn't really that serious. Which fact best answers them?",
    explanation:
      "The deceased-donation rate fell by roughly two thirds between 2017 and 2021, to 0.48 per million people, and 2,586 people were on the national waiting list at the end of 2021.",
    verifiedAgainst: SATS_5YR,
    choices: [
      { text: "South Africa has the highest donation rate in Africa", feedback: "That would not answer the concern, and it is not what this course teaches." },
      { text: "The donation rate fell by about two thirds in five years, to 0.48 per million", isCorrect: true },
      { text: "Most people on the waiting list receive a transplant within a year", feedback: "Nothing in the national data supports this. 189 people died waiting in 2021." },
      { text: "The shortage is mainly caused by a lack of surgeons", feedback: "South Africa has the surgical capability. The shortage is in donors." },
    ],
  },
  {
    key: "sq-b2-10",
    stage: "busting-the-myths",
    topicTag: "what-can-be-donated",
    difficulty: 2,
    prompt: "Which statement about tissue donation is true?",
    explanation:
      "Tissue donation does not need a 'perfect body' and does not depend on circulation being maintained in intensive care. It can happen irrespective of the manner of death, even after the body has been moved to a mortuary, and it does not rule out funeral rites.",
    verifiedAgainst: TISSUE_CRITERIA,
    choices: [
      { text: "It needs a donor in perfect health with no medical history", feedback: "Each tissue is assessed on its own criteria. No 'perfect body' is needed." },
      { text: "It must happen in intensive care, like organ donation", feedback: "That applies to organs. Tissue does not depend on circulation being maintained." },
      { text: "It can take place after death has occurred, even after the body has gone to a mortuary", isCorrect: true },
      { text: "It rules out a traditional funeral", feedback: "The donor's appearance is preserved and funeral rites go ahead." },
    ],
  },
  {
    key: "sq-b2-11",
    stage: "busting-the-myths",
    topicTag: "eligibility",
    difficulty: 2,
    scenario: "A friend had cancer ten years ago and says there is no point registering as a donor.",
    prompt: "What is the most accurate thing to tell them?",
    explanation:
      "A medical history is not an automatic exclusion. Suitability is assessed at the time of death, by the transplant team, and the answer depends on what is being donated — most cancers do not prevent cornea donation, for example, and organs are assessed case by case.",
    verifiedAgainst: RED_FILE_ELIGIBILITY,
    choices: [
      { text: "Any history of cancer rules out every kind of donation", feedback: "Not true. Most cancers do not prevent cornea donation, and organs are assessed case by case." },
      { text: "It isn't an automatic exclusion — it would be assessed at the time, and depends on what is donated", isCorrect: true },
      { text: "A cancer history makes no difference to donation at all", feedback: "Overcorrection. A cancer history is assessed carefully — it rules out skin, bone and heart-valve donation, for example." },
      { text: "They need medical clearance before they are allowed to register", feedback: "No medical tests are needed to register. Suitability is assessed only at the time of death." },
    ],
  },
  {
    key: "sq-b2-12",
    stage: "busting-the-myths",
    topicTag: "living-donation",
    difficulty: 2,
    prompt: "Which statement best describes the safety of donating a kidney while you are alive?",
    explanation:
      "Not risk-free, but low-risk for carefully screened donors. Screening is the safety: every potential donor is fully assessed, and most people who come forward are turned away. Donating part of a liver carries more risk than donating a kidney.",
    verifiedAgainst: LIVING_DONOR_SAFETY,
    choices: [
      { text: "Completely safe, with no risk to the donor at all", feedback: "Overcorrection. It is major surgery and every operation carries some risk." },
      { text: "So dangerous that it is only permitted in emergencies", feedback: "Living kidney donation is a planned, routine operation in South Africa — 57 were performed in 2021." },
      { text: "Acceptable because the donor is paid for taking the risk", feedback: "Paying a donor is a criminal offence in South Africa." },
      { text: "Low-risk but not risk-free, because donors are carefully screened and most are turned away", isCorrect: true },
    ],
  },
  {
    key: "sq-b2-13",
    stage: "busting-the-myths",
    topicTag: "myths",
    difficulty: 2,
    recycledFrom: "chk-m2-02",
    prompt: "Why is it useful to understand why a myth persists, rather than only knowing that it is false?",
    explanation:
      "Because most myths are a reasonable fear wearing a factual disguise. Knowing why a belief is persuasive is what lets you answer the real concern. People who feel dismissed stop listening long before they stop believing.",
    verifiedAgainst: LOSS_POINTS,
    choices: [
      { text: "It lets you answer the real concern instead of dismissing the person", isCorrect: true },
      { text: "It makes the myth easier to memorise", feedback: "The point is the conversation, not recall." },
      { text: "It proves the person is being unreasonable", feedback: "The opposite. Most of these beliefs are reasonable fears." },
      { text: "It is not useful — correcting the fact is enough", feedback: "A correction that ignores the fear behind it rarely changes anyone's mind." },
    ],
  },
  {
    key: "sq-b2-14",
    stage: "busting-the-myths",
    topicTag: "loss-points",
    difficulty: 1,
    recycledFrom: "chk-m2-01",
    prompt: "Which loss point on the way from a potential donor to a transplant is most directly changed by a family having talked about donation beforehand?",
    explanation:
      "Family refusal at the consent stage. A family that already knows what their relative wanted is not being asked to guess.",
    verifiedAgainst: LOSS_POINTS,
    choices: [
      { text: "Family refusal at the consent stage", isCorrect: true },
      { text: "Surgical complications during recovery", feedback: "Not something a family conversation affects." },
      { text: "A shortage of transplant surgeons", feedback: "Surgical capability is not the constraint, and a family conversation would not change it." },
      { text: "Organs being damaged in transit", feedback: "A logistics problem, not one a family conversation changes." },
    ],
  },
  {
    key: "sq-b2-15",
    stage: "busting-the-myths",
    topicTag: "loss-points",
    difficulty: 1,
    recycledFrom: "chk-m2-03",
    prompt: "Where are most potential donations in South Africa lost?",
    explanation:
      "At human points rather than medical ones — awareness, myths, fear, and families who have never discussed donation. That is why busting myths and starting conversations matters.",
    verifiedAgainst: LOSS_POINTS,
    choices: [
      { text: "At human points, such as myths, fear and families who never discussed it", isCorrect: true },
      { text: "In the operating theatre, through surgical failure", feedback: "Surgical capability is not the main constraint." },
      { text: "In transport between hospitals", feedback: "Logistics matter, but most losses are human." },
      { text: "Through laws that prohibit most donation", feedback: "Donation is lawful in South Africa." },
    ],
  },
];

// ---------------------------------------------------------------------------
// STAGE 3 — How Donation Actually Works
// ---------------------------------------------------------------------------

const howDonationWorks: StageQuizQuestion[] = [
  {
    key: "sq-b3-01",
    stage: "how-donation-works",
    topicTag: "routes-to-donation",
    difficulty: 1,
    recycledFrom: "chk-m3-01",
    prompt: "What are the two routes to deceased organ donation?",
    explanation:
      "Donation after brain death, and donation after circulatory death. Both require consent from next of kin.",
    verifiedAgainst: LOSS_POINTS,
    choices: [
      { text: "Living donation, and tissue donation", feedback: "Living donation is not deceased donation, and tissue donation is a separate category again." },
      { text: "Voluntary donation, and involuntary donation", feedback: "All donation in South Africa is voluntary. There is no involuntary route." },
      { text: "After brain death, and after circulatory death", isCorrect: true },
      { text: "Hospital donation, and community donation", feedback: "Organ donation only happens in a clinical setting; there is no community route." },
    ],
  },
  {
    key: "sq-b3-02",
    stage: "how-donation-works",
    topicTag: "routes-to-donation",
    difficulty: 1,
    recycledFrom: "chk-m3-02",
    prompt: "What can a living donor donate?",
    explanation:
      "A kidney, or a segment of liver. Both are possible because the donor can live well with what remains.",
    verifiedAgainst: LOSS_POINTS,
    choices: [
      { text: "A kidney, or a segment of liver", isCorrect: true },
      { text: "A heart", feedback: "A heart cannot come from a living donor." },
      { text: "Corneas", feedback: "Corneas are recovered after death." },
      { text: "Any organ, provided the donor consents", feedback: "Living donation is limited to organs the donor can live without — in practice a kidney or part of a liver." },
    ],
  },
  {
    key: "sq-b3-03",
    stage: "how-donation-works",
    topicTag: "family-conversation",
    difficulty: 1,
    recycledFrom: "chk-m3-03",
    prompt: "You have registered as an organ donor. What most improves the chance your wishes are followed?",
    explanation:
      "Your family knowing what you want. In South African practice hospitals approach the family in every case, so the conversation — not the register — is what your family will be asked to act on.",
    verifiedAgainst: FAMILY_PRACTICE,
    choices: [
      { text: "Registering a second time to be sure", feedback: "Registering twice changes nothing. Telling your family changes everything." },
      { text: "Carrying a donor card in your wallet", feedback: "A card in a wallet is unlikely to be found in time, and the family will still be asked." },
      { text: "Telling your family what you have decided", isCorrect: true },
      { text: "Nothing further — registration is sufficient on its own", feedback: "This is the single most consequential misunderstanding in South African donation." },
    ],
  },
  {
    key: "sq-b3-04",
    stage: "how-donation-works",
    topicTag: "routes-to-donation",
    difficulty: 1,
    prompt: "What is the main practical difference between organ and tissue donation?",
    explanation:
      "Organs must keep working, so they can only be recovered in hospital and must be transplanted within hours. Tissue can be recovered irrespective of the manner of death, in far more settings, and stored for later use.",
    verifiedAgainst: TISSUE_CRITERIA,
    choices: [
      { text: "Tissue can be recovered in far more settings and much later; organs cannot", isCorrect: true },
      { text: "Tissue donation requires a court order and organ donation does not", feedback: "Neither requires a court order. Both require consent from next of kin." },
      { text: "Organs can be stored for months; tissue cannot", feedback: "It is the other way round. Tissue can be stored; organs must be transplanted within hours." },
      { text: "There is no practical difference — the rules are identical", feedback: "The differences in timing and setting are what make tissue donation possible for many more people." },
    ],
  },
  {
    key: "sq-b3-05",
    stage: "how-donation-works",
    topicTag: "determination-of-death",
    difficulty: 2,
    prompt: "Who may certify that a potential donor has died?",
    explanation:
      "At least two medical practitioners, at least one of them registered as a doctor for five years or more, and none of them involved in transplanting the tissue. Each tests independently.",
    verifiedAgainst: REG_9,
    choices: [
      { text: "The transplant surgeon who will perform the recovery", feedback: "This is precisely what the rule forbids. The people who establish death may have nothing to gain from the organs." },
      { text: "Any one doctor on duty", feedback: "One doctor is not enough. At least two are required, each testing independently." },
      { text: "At least two doctors, one registered five years or more, none of them on the transplant team", isCorrect: true },
      { text: "The transplant coordinator", feedback: "A coordinator organises the process but does not certify death." },
    ],
  },
  {
    key: "sq-b3-06",
    stage: "how-donation-works",
    topicTag: "myths",
    difficulty: 2,
    prompt:
      "Why are the doctors who certify death kept separate from the transplant team?",
    explanation:
      "So that nobody deciding whether a patient has died has anything to gain from the answer. It is a structural safeguard written into the rules, not a matter of professional good intentions.",
    verifiedAgainst: REG_9,
    choices: [
      { text: "Because transplant surgeons are not qualified to certify death", feedback: "Many are perfectly qualified. They are excluded because of the conflict, not the competence." },
      { text: "To save the transplant team's time", feedback: "The separation is a safeguard, not a scheduling convenience." },
      { text: "So that nobody who decides whether a patient has died has anything to gain from the organs", isCorrect: true },
      { text: "Because the treating team knows the patient better", feedback: "Familiarity is not the reason. Independence is." },
    ],
  },
  {
    key: "sq-b3-07",
    stage: "how-donation-works",
    topicTag: "routes-to-donation",
    difficulty: 1,
    prompt: "What does donation after brain death (DBD) describe?",
    explanation:
      "A patient on a mechanical ventilator who has been certified brain dead. Circulation is maintained, which is why the organs remain transplantable.",
    verifiedAgainst: LOSS_POINTS,
    choices: [
      { text: "A patient who died at home and was brought to hospital", feedback: "Organ donation requires a clinical setting with circulation maintained." },
      { text: "A donor who chose to donate before they became ill", feedback: "That describes registering, which can precede either route or neither." },
      { text: "A patient on a ventilator who has been certified brain dead by two independent doctors", isCorrect: true },
      { text: "Any patient in a coma", feedback: "A coma is not death, and a patient in a coma is not a donor." },
    ],
  },
  {
    key: "sq-b3-08",
    stage: "how-donation-works",
    topicTag: "routes-to-donation",
    difficulty: 2,
    prompt: "What does donation after circulatory death (DCD) describe?",
    explanation:
      "Donation where a decision has been taken to withdraw life-sustaining treatment and death is expected to follow. What can be recovered depends on the circumstances and on how quickly recovery can follow death.",
    verifiedAgainst: LOSS_POINTS,
    choices: [
      { text: "Donation from a donor whose heart was transplanted", feedback: "This describes the recipient, not the donor's route." },
      { text: "Donation after treatment is withdrawn and the heart stops", isCorrect: true },
      { text: "Donation that takes place at a mortuary", feedback: "Tissue donation can happen after transfer to a mortuary; DCD happens in hospital." },
      { text: "Donation by a living donor with a heart condition", feedback: "DCD is a deceased-donation route." },
    ],
  },
  {
    key: "sq-b3-09",
    stage: "how-donation-works",
    topicTag: "consent",
    difficulty: 1,
    prompt: "Which route to donation is the only one where the donor consents for themselves?",
    explanation:
      "Living donation. Every deceased route — after brain death, after circulatory death, and tissue donation — requires consent from next of kin.",
    verifiedAgainst: FAMILY_PRACTICE,
    choices: [
      { text: "Donation after brain death", feedback: "Next of kin are asked in every deceased donation." },
      { text: "Living donation", isCorrect: true },
      { text: "Tissue donation", feedback: "Tissue donation requires consent from next of kin, obtained by a tissue donation coordinator." },
      { text: "All of them, if the person registered as a donor", feedback: "Registration records your wishes; in practice the family is still asked." },
    ],
  },
  {
    key: "sq-b3-10",
    stage: "how-donation-works",
    topicTag: "law",
    difficulty: 2,
    scenario: "Someone dies in a road accident and their family wants to donate.",
    prompt: "What does an unnatural death add to the process?",
    explanation:
      "One more authority. The death must be referred for a forensic post-mortem, and recovery needs the Forensic Pathology Service's authorisation for what may be taken without compromising the examination. Donation is still possible.",
    verifiedAgainst: FPS,
    choices: [
      { text: "Donation becomes impossible", feedback: "Donation after an unnatural death is possible; it simply involves one more authorisation." },
      { text: "The family's consent is no longer needed", feedback: "Family consent is still required — it is just no longer sufficient on its own." },
      { text: "The police decide which organs may be donated", feedback: "The forensic pathologist decides. The police may be involved in liaison, not in the decision." },
      { text: "The Forensic Pathology Service must also authorise what may be recovered", isCorrect: true },
    ],
  },
  {
    key: "sq-b3-11",
    stage: "how-donation-works",
    topicTag: "costs",
    difficulty: 2,
    prompt: "Who pays for recovering the organs and tissue from a donor?",
    explanation:
      "The hospital or the tissue bank, from the point consent is given. The family still pays for the care the patient received before death, exactly as they would for any admission — donation neither adds to that bill nor removes it.",
    verifiedAgainst: NHA_COSTS,
    choices: [
      { text: "The donor's family, out of the estate", feedback: "The family does not pay for the donation. This fear is one of the commonest reasons people hesitate." },
      { text: "The recipient, directly to the donor's family", feedback: "Any payment to a donor or their family is a criminal offence." },
      { text: "The hospital or the tissue bank, from the point consent is given", isCorrect: true },
      { text: "The donor's medical aid, which is billed for the recovery surgery", feedback: "The donation costs are carried by the hospital or tissue bank, not billed to the donor's cover." },
    ],
  },
  {
    key: "sq-b3-12",
    stage: "how-donation-works",
    topicTag: "law",
    difficulty: 1,
    prompt: "Can a family be paid for donating a relative's organs in South Africa?",
    explanation:
      "No. Trading in human tissue is a criminal offence, and it is an offence for a donor to receive any reward beyond reimbursement of costs actually incurred. Donation is a gift.",
    verifiedAgainst: NHA_COSTS,
    choices: [
      { text: "Yes, a standard fee is paid to the family", feedback: "No such fee exists, and paying one would be a crime." },
      { text: "Yes, but only for tissue rather than organs", feedback: "The prohibition covers human tissue generally." },
      { text: "Only if the recipient offers the payment voluntarily", feedback: "Who offers it makes no difference. Payment for tissue is prohibited." },
      { text: "No — trading in human tissue is a criminal offence", isCorrect: true },
    ],
  },
  {
    key: "sq-b3-13",
    stage: "how-donation-works",
    topicTag: "routes-to-donation",
    difficulty: 2,
    prompt: "When can tissue donation take place?",
    explanation:
      "Irrespective of the manner of death, and considerably later than organ donation — including after the body has been moved to a mortuary. This is why tissue donation is possible for far more people than the public assumes.",
    verifiedAgainst: TISSUE_CRITERIA,
    choices: [
      { text: "Only in an intensive care unit, like organ donation", feedback: "That restriction applies to organs, which must keep working. Tissue does not." },
      { text: "Only where the person died of natural causes", feedback: "Tissue donation is possible irrespective of the manner of death." },
      { text: "Irrespective of the manner of death, including after transfer to a mortuary", isCorrect: true },
      { text: "Only within one hour of death", feedback: "Tissue has a far longer window than organs do." },
    ],
  },
  {
    key: "sq-b3-14",
    stage: "how-donation-works",
    topicTag: "routes-to-donation",
    difficulty: 2,
    prompt: "Why can solid organs only be recovered in a clinical setting?",
    explanation:
      "Because they have to keep working. Organ donation depends on circulation having been maintained up to recovery, and on the organ reaching a recipient within hours — neither of which is possible outside a hospital.",
    verifiedAgainst: LOSS_POINTS,
    choices: [
      { text: "Because the organs must keep working, which depends on circulation being maintained", isCorrect: true },
      { text: "Because the law only permits donation inside a hospital building", feedback: "The constraint is biological rather than legal — tissue donation happens outside intensive care routinely." },
      { text: "Because the family can only give consent at a hospital", feedback: "Consent can be obtained wherever the family is; the constraint is on the organs." },
      { text: "Because transplant surgeons are not allowed to travel", feedback: "Recovery teams do travel. The organs are what cannot wait." },
    ],
  },
  {
    key: "sq-b3-15",
    stage: "how-donation-works",
    topicTag: "law",
    difficulty: 2,
    prompt:
      "Older donation material refers to the 'district surgeon' or 'state pathologist'. Why should an advocate not use those terms?",
    explanation:
      "Because that office no longer performs the function. Medico-legal post-mortems moved to the Forensic Pathology Service under the Department of Health. Using the old term dates the speaker and invites correction.",
    verifiedAgainst: FPS,
    choices: [
      { text: "The terms are legally accurate but considered impolite", feedback: "The problem is accuracy, not tone." },
      { text: "The office no longer performs the function — it is now the Forensic Pathology Service", isCorrect: true },
      { text: "They refer to a role that only exists in the private sector", feedback: "The function moved to the Forensic Pathology Service, which is a state service." },
      { text: "They are correct, and this course prefers them", feedback: "They are out of date. The course uses Forensic Pathology Service." },
    ],
  },
];

export const beginnerStageQuizBanks: StageQuizBanks = {
  "why-donation-matters": whyDonationMatters,
  "busting-the-myths": bustingTheMyths,
  "how-donation-works": howDonationWorks,
};
