import type { QuestionSeed } from "./types";

/**
 * The question bank.
 *
 * Two design rules govern every item here.
 *
 * 1. **Nothing tests an unverified clinical or legal fact.** Because the source
 *    study guide has not been supplied, questions test the things Save7's brief
 *    states explicitly — the pathway, the loss points, the brain-death/coma
 *    distinction, the "don't rule anyone out" framing, and above all how to
 *    hold a conversation. That is what the course actually teaches, and it is
 *    what an advocate actually needs. Clinical detail belongs in further
 *    reading, not in an assessment.
 *
 * 2. **`pairKey` links each POST item to its PRE counterpart.** Improvement is
 *    reported on matched pairs, so a gain reflects understanding rather than
 *    remembering the wording of a specific question. Some pairs are identical
 *    items (a true baseline), some are equivalent items testing the same idea
 *    differently, and some extend the idea into a scenario.
 *
 * Every item is registered in the content-review register regardless, so Save7
 * signs off the assessment as well as the lessons.
 */

// ---------------------------------------------------------------------------
// PRE-COURSE BASELINE — 12 items, taken once, spanning all three levels.
// Deliberately non-technical: this measures what someone walks in with.
// ---------------------------------------------------------------------------

const preQuestions: QuestionSeed[] = [
  {
    key: "pre-01",
    scope: "PRE",
    kind: "SINGLE",
    topicTag: "who-needs-organs",
    pairKey: "need-organs",
    difficulty: 1,
    prompt: "Why do people need organ transplants?",
    explanation:
      "Transplantation is not an enhancement or an optional upgrade. When an organ fails completely, treatment can often buy time, but for some conditions a transplant is the only remaining option.",
    choices: [
      { text: "Their organ has failed completely and cannot be repaired", isCorrect: true, feedback: "Correct. This is what end-stage organ failure means." },
      { text: "To improve the performance of a healthy organ", feedback: "Transplantation is not an enhancement — it treats organs that have failed." },
      { text: "Because they have chosen a transplant over medication", feedback: "Transplantation is not usually an alternative someone simply prefers; it is what remains when other treatment cannot sustain the organ's function." },
      { text: "Only after a serious accident", feedback: "Accidents are one route to organ failure, but most transplant recipients have a chronic disease." },
    ],
  },
  {
    key: "pre-02",
    scope: "PRE",
    kind: "MULTI",
    topicTag: "what-can-be-donated",
    pairKey: "tissue-donation",
    difficulty: 1,
    prompt: "Which of these can be donated and transplanted? Select all that apply.",
    explanation:
      "Donation covers far more than the organs people usually picture. Tissue donation — corneas, bone, skin, heart valves — helps a large number of people and is routinely left out of public conversation.",
    choices: [
      { text: "Kidneys", isCorrect: true },
      { text: "Corneas", isCorrect: true, feedback: "Corneal donation restores sight and is one of the most commonly performed tissue transplants." },
      { text: "Skin", isCorrect: true, feedback: "Donated skin is used in the treatment of severe burns." },
      { text: "Heart valves", isCorrect: true },
      { text: "Brain tissue", feedback: "The brain is not transplanted." },
    ],
  },
  {
    key: "pre-03",
    scope: "PRE",
    kind: "SINGLE",
    topicTag: "loss-points",
    pairKey: "loss-points",
    difficulty: 1,
    prompt:
      "South Africa has many people waiting for organs but relatively few transplants. What is the main reason?",
    explanation:
      "The shortage is a pathway problem. A donation can be lost at any point between a potential donor and a recipient, and most of those loss points are human — awareness, myths, fear, and families never having discussed donation — rather than medical or surgical.",
    choices: [
      { text: "Donations are lost at several human points along the pathway, especially family refusal and never having discussed donation", isCorrect: true, feedback: "Correct. This is the central argument of the course." },
      { text: "South Africa lacks the surgical skill to perform transplants", feedback: "South Africa has a long and distinguished transplant history. Surgical capability is not the primary constraint." },
      { text: "There are very few people who die in circumstances where donation is possible", feedback: "Potential donors exist. The problem is that potential donations are lost along the pathway." },
      { text: "The law prohibits most organ donation", feedback: "Donation is lawful in South Africa. Module 9 covers the legal framework." },
    ],
  },
  {
    key: "pre-04",
    scope: "PRE",
    kind: "SINGLE",
    topicTag: "family-conversation",
    pairKey: "family-conversation",
    difficulty: 1,
    prompt: "You have registered as an organ donor. What else most improves the chance that your wishes are followed?",
    explanation:
      "Registering signals your wishes. Telling your family is what makes those wishes actionable, because a family that has never heard them is being asked to guess at the worst moment of their lives.",
    choices: [
      { text: "Telling your family what you want", isCorrect: true, feedback: "Correct. This single act is what Save7 exists to encourage." },
      { text: "Carrying a donor card at all times", feedback: "Helpful, but a card cannot have a conversation with your family on your behalf." },
      { text: "Registering a second time to be sure", feedback: "Registering again adds nothing. Talking to your family does." },
      { text: "Nothing — registration is legally sufficient on its own", feedback: "In practice families are involved, and a family that does not know your wishes has to guess." },
    ],
  },
  {
    key: "pre-05",
    scope: "PRE",
    kind: "TRUE_FALSE",
    topicTag: "brain-death",
    pairKey: "brain-death-vs-coma",
    difficulty: 2,
    prompt: "Brain death and a coma are essentially the same thing.",
    explanation:
      "They are fundamentally different. Brain death is death, determined by neurological criteria. A coma is a state of profound unconsciousness from which recovery is possible. Conflating the two is the most common and most damaging misunderstanding in organ donation.",
    choices: [
      { text: "True", feedback: "This is the misconception the course works hardest to correct. Module 6 covers the distinction in detail." },
      { text: "False", isCorrect: true, feedback: "Correct. Brain death is death; a coma is not." },
    ],
  },
  {
    key: "pre-06",
    scope: "PRE",
    kind: "SINGLE",
    topicTag: "brain-death",
    pairKey: "brain-death-heart-beating",
    difficulty: 2,
    prompt: "How can someone be declared dead while their heart is still beating?",
    explanation:
      "Mechanical ventilation supplies oxygen the person can no longer obtain for themselves, which allows the heart to continue beating for a period after death has been determined by neurological criteria. This is why a family at the bedside sees a warm body and a beating heart — and why their disbelief is a reasonable human response rather than ignorance.",
    choices: [
      { text: "A ventilator is supplying oxygen the person can no longer obtain for themselves", isCorrect: true, feedback: "Correct, and this is the explanation you will most often be asked to give." },
      { text: "The declaration is provisional and may be reversed", feedback: "Determination of death is not provisional. It follows a defined process with deliberate safeguards." },
      { text: "The heart has its own separate brain", feedback: "No." },
      { text: "It cannot — a beating heart always means the person is alive", feedback: "This is precisely the misconception that stops donation conversations. Module 6 addresses it." },
    ],
  },
  {
    key: "pre-07",
    scope: "PRE",
    kind: "SINGLE",
    topicTag: "myths",
    pairKey: "independent-teams",
    difficulty: 2,
    prompt:
      'A friend says: "If I\'m registered as a donor, doctors won\'t try as hard to save me." What is the strongest factual reassurance?',
    explanation:
      "The clinicians who determine death are independent of the transplant team. That separation is a designed structural safeguard, and it is the direct answer to this specific fear.",
    choices: [
      { text: "The clinicians who determine death are independent of the transplant team", isCorrect: true, feedback: "Correct. A structural safeguard is far more reassuring than an assurance about good intentions." },
      { text: "Doctors take an oath, so they would never do that", feedback: "An appeal to professional character. It does not explain what actually prevents the conflict, and it invites argument." },
      { text: "Hospitals are not told who is a registered donor", feedback: "Do not offer reassurance you cannot support. The honest answer is the independence of the teams." },
      { text: "It is illegal, so it does not happen", feedback: "Legality alone does not explain the safeguard, and it sidesteps the fear being expressed." },
    ],
  },
  {
    key: "pre-08",
    scope: "PRE",
    kind: "SINGLE",
    topicTag: "eligibility",
    pairKey: "eligibility-age",
    difficulty: 1,
    prompt: 'Someone in their late sixties asks whether they are "too old" to be a donor. What is the accurate answer?',
    explanation:
      "Do not assume anyone cannot donate. Suitability is determined through appropriate medical assessment at the time — it is not something a member of the public, or the potential donor, can decide in advance.",
    choices: [
      { text: "Don't rule yourself out — suitability is assessed individually by medical teams", isCorrect: true, feedback: "Correct. This is the accurate answer and the one Save7 asks advocates to use." },
      { text: "Yes, there is an upper age limit for donation", feedback: "Stating a confident exclusion rule can permanently remove a potential donor. Suitability is assessed individually." },
      { text: "No, age is completely irrelevant to donation", feedback: "Overcorrection. Claiming a factor is irrelevant is as inaccurate as claiming it disqualifies, and it damages credibility." },
      { text: "Only for tissue donation, not organs", feedback: "This invents a rule. The honest answer is that suitability is individually assessed." },
    ],
  },
  {
    key: "pre-09",
    scope: "PRE",
    kind: "SINGLE",
    topicTag: "eligibility",
    pairKey: "eligibility-comorbidity",
    difficulty: 2,
    prompt: "Which statement about donor eligibility is most accurate?",
    explanation:
      "Suitability is assessed individually, and can be organ-specific: being unsuitable for one donation does not mean being unsuitable for all. Simple exclusion rules are frequently wrong and change as clinical practice changes.",
    choices: [
      { text: "Suitability is assessed individually at the time, and can differ between organs", isCorrect: true, feedback: "Correct." },
      { text: "A fixed list of medical conditions permanently excludes donation", feedback: "Exclusion rules are frequently wrong and change as practice changes. This is why the course avoids teaching them." },
      { text: "Anyone who has ever taken chronic medication is excluded", feedback: "Not so. This is exactly the kind of assumption that causes self-exclusion." },
      { text: "Eligibility is decided by the donor when they register", feedback: "Registration records wishes. Suitability is a medical assessment made at the time." },
    ],
  },
  {
    key: "pre-10",
    scope: "PRE",
    kind: "SINGLE",
    topicTag: "who-is-involved",
    pairKey: "team-safeguards",
    difficulty: 2,
    prompt: "Why do translators matter in the donation process?",
    explanation:
      "Consent that is not understood is not consent. Translators are part of the safeguards around a genuinely informed decision, not merely a courtesy for the family's comfort.",
    choices: [
      { text: "Consent that is not understood is not genuinely informed consent", isCorrect: true, feedback: "Correct — translators are a consent safeguard, not a convenience." },
      { text: "They speed the process up", feedback: "Their purpose is the validity of consent, not efficiency." },
      { text: "They are only needed for international patients", feedback: "South Africa has many languages. Translation is routinely relevant." },
      { text: "They are optional if a family member can interpret", feedback: "Relying on a grieving relative to interpret a consent conversation is not a safeguard." },
    ],
  },
  {
    key: "pre-11",
    scope: "PRE",
    kind: "SINGLE",
    topicTag: "after-transplant",
    pairKey: "after-transplant",
    difficulty: 2,
    prompt: "What best describes life for someone after a successful transplant?",
    explanation:
      "Transplantation is the start of a lifelong medical journey, not a cure. Describing it honestly is more persuasive than a happy ending, and it respects recipients' actual experience.",
    choices: [
      { text: "The beginning of a lifelong medical journey involving ongoing medication and monitoring", isCorrect: true, feedback: "Correct. Overselling transplantation damages credibility." },
      { text: "A complete cure, with no further medical involvement", feedback: "A transplant is not a cure. Presenting it as one misrepresents recipients' lives." },
      { text: "A short recovery, then a return to exactly how things were before", feedback: "Recovery is real but the medical relationship continues indefinitely." },
      { text: "A temporary fix that always fails within a few years", feedback: "Unduly pessimistic. Graft survival varies by organ and by person." },
    ],
  },
  {
    key: "pre-12",
    scope: "PRE",
    kind: "SCENARIO",
    topicTag: "conversation",
    pairKey: "responding-to-religion",
    difficulty: 2,
    scenario: "At a community event, someone tells you their religion does not allow organ donation.",
    prompt: "What is the best response?",
    explanation:
      "Never tell someone what their own faith permits — that oversteps your competence and costs you their trust. Accept their position, and remember that Save7's goal is a family that has talked, not a converted donor. A clearly communicated 'no' is a good outcome.",
    choices: [
      { text: "Accept their position, and ask whether they would still tell their family what they want so nobody has to guess", isCorrect: true, feedback: "Correct. It fully respects their belief and still achieves the actual goal." },
      { text: "Explain that most major religions do in fact permit organ donation", feedback: "Even where broadly true, telling someone what their own faith permits is overstepping, and you will lose their trust." },
      { text: "Ask which religion, so you can look up its position for them", feedback: "Well-intentioned, but it puts you in the position of interpreting their faith to them." },
      { text: "Move on to someone more likely to register", feedback: "This treats the person as a target rather than a participant in a conversation." },
    ],
  },
];

// ---------------------------------------------------------------------------
// POST — BEGINNER · 10 items
// ---------------------------------------------------------------------------

const postBeginner: QuestionSeed[] = [
  {
    key: "post-b-01",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "beginner",
    topicTag: "who-needs-organs",
    pairKey: "need-organs",
    difficulty: 1,
    prompt: "Why do people need organ transplants?",
    explanation:
      "Transplantation treats organs that have failed completely. For some conditions it is the only remaining option once other treatment can no longer sustain the organ's function.",
    choices: [
      { text: "Their organ has failed completely and cannot be repaired", isCorrect: true },
      { text: "To improve the performance of a healthy organ" },
      { text: "Because they have chosen a transplant over medication" },
      { text: "Only after a serious accident" },
    ],
  },
  {
    key: "post-b-02",
    scope: "POST",
    kind: "MULTI",
    levelSlug: "beginner",
    topicTag: "what-can-be-donated",
    pairKey: "tissue-donation",
    difficulty: 1,
    prompt: "Which of these are transplanted as tissue rather than as solid organs? Select all that apply.",
    explanation:
      "Corneas, bone and ligaments, skin and heart valves are tissue donations. Tissue donation helps a large number of people and is routinely missing from public conversation about donation.",
    choices: [
      { text: "Corneas", isCorrect: true },
      { text: "Bone and ligaments", isCorrect: true },
      { text: "Skin", isCorrect: true },
      { text: "Kidneys", feedback: "A kidney is a solid organ." },
      { text: "Lungs", feedback: "Lungs are solid organs." },
    ],
  },
  {
    key: "post-b-03",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "beginner",
    topicTag: "loss-points",
    pairKey: "loss-points",
    difficulty: 1,
    prompt: "Which best describes why so few organs reach the people who need them in South Africa?",
    explanation:
      "The pathway from a potential donor to a recipient has many points at which it can quietly break, and most of them are human rather than medical.",
    choices: [
      { text: "Donations are lost at several human points along the pathway, especially family refusal and never having discussed donation", isCorrect: true },
      { text: "South Africa lacks the surgical skill to perform transplants" },
      { text: "There are very few people who die in circumstances where donation is possible" },
      { text: "The law prohibits most organ donation" },
    ],
  },
  {
    key: "post-b-04",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "beginner",
    topicTag: "loss-points",
    pairKey: "loss-points-largest",
    difficulty: 2,
    prompt:
      "Which loss point in the donation pathway is most directly changed by someone having had a conversation with their family years earlier?",
    explanation:
      "Family refusal is the largest preventable loss point. A family that has heard the person's wishes is not being asked to guess during acute grief, which is exactly what a prior conversation prevents.",
    choices: [
      { text: "Family refusal at the consent stage", isCorrect: true, feedback: "Correct — and this is why Save7's entire premise is the conversation." },
      { text: "Failure to identify a potential donor in hospital", feedback: "A real loss point, but it is a clinical process issue rather than one a family conversation changes." },
      { text: "Logistical constraints during recovery", feedback: "Not something a prior family conversation affects." },
      { text: "Allocation of the organ to a recipient", feedback: "Allocation happens after consent and is not affected by the family conversation." },
    ],
  },
  {
    key: "post-b-05",
    scope: "POST",
    kind: "TRUE_FALSE",
    levelSlug: "beginner",
    topicTag: "brain-death",
    pairKey: "brain-death-vs-coma",
    difficulty: 2,
    prompt: "Brain death and a coma are essentially the same thing.",
    explanation:
      "Brain death is death, determined by neurological criteria. A coma is profound unconsciousness from which recovery is possible. Conflating them is the most damaging misunderstanding in organ donation.",
    choices: [
      { text: "True" },
      { text: "False", isCorrect: true },
    ],
  },
  {
    key: "post-b-06",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "beginner",
    topicTag: "eligibility",
    pairKey: "eligibility-age",
    difficulty: 1,
    prompt: 'A colleague says: "I\'m in my sixties and on blood pressure medication — I\'d be turned down anyway." What is the best response?',
    explanation:
      "Do not rule anyone out, and do not overcorrect by claiming the factor is irrelevant. Suitability is determined by medical assessment at the time.",
    choices: [
      { text: "Don't rule yourself out — suitability is assessed individually by medical teams at the time", isCorrect: true },
      { text: "You're right, that combination would exclude you", feedback: "A confident exclusion can permanently remove a potential donor." },
      { text: "Age and blood pressure make no difference at all to donation", feedback: "Overcorrection, and it damages your credibility when someone checks." },
      { text: "You could only donate corneas", feedback: "Speculating about a specific medical outcome. Keep the framing general." },
    ],
  },
  {
    key: "post-b-07",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "beginner",
    topicTag: "myths",
    pairKey: "independent-teams",
    difficulty: 2,
    prompt: 'What actually addresses the fear that "doctors won\'t try as hard to save a registered donor"?',
    explanation:
      "The clinicians who determine death are independent of the transplant team. Pointing to that structural separation is far stronger than an assurance about professional character.",
    choices: [
      { text: "The clinicians who determine death are independent of the transplant team", isCorrect: true },
      { text: "Doctors take an oath, so they would never do that" },
      { text: "Hospitals are not told who is a registered donor" },
      { text: "It is illegal, so it does not happen" },
    ],
  },
  {
    key: "post-b-08",
    scope: "POST",
    kind: "SCENARIO",
    levelSlug: "beginner",
    topicTag: "conversation",
    pairKey: "responding-to-religion",
    difficulty: 2,
    scenario: "Someone tells you their religion does not allow organ donation.",
    prompt: "What is the best response?",
    explanation:
      "Accept their position and stay inside your competence. Save7's goal is a family that has talked — a clearly communicated 'no' is a good outcome, not a failure.",
    choices: [
      { text: "Accept their position, and ask whether they would still tell their family what they want", isCorrect: true },
      { text: "Explain that most major religions do in fact permit organ donation" },
      { text: "Ask which religion, so you can look up its position for them" },
      { text: "Move on to someone more likely to register" },
    ],
  },
  {
    key: "post-b-09",
    scope: "POST",
    kind: "SCENARIO",
    levelSlug: "beginner",
    topicTag: "conversation",
    pairKey: "conversation-emotion-first",
    difficulty: 2,
    scenario:
      'A family member says, quietly: "I don\'t want doctors cutting me up after I\'m dead."',
    prompt: "What is the most useful thing to do first?",
    explanation:
      "This is almost never a factual objection — it is about dignity. Acknowledge the concern and find out what specifically worries them before offering any information. People who feel dismissed stop listening.",
    choices: [
      { text: "Acknowledge the concern, and ask what worries them most about it", isCorrect: true, feedback: "Correct. You do not yet know whether this is about an open casket, religious rites, or something else." },
      { text: "Explain that they won't feel anything because they'll be dead", feedback: "Technically responsive and emotionally tone-deaf. The objection was never about pain." },
      { text: "Point out that seven other people could benefit", feedback: "The reframe is true, but leading with it before acknowledging the concern feels like being sold to." },
      { text: "Give them a leaflet about the recovery procedure", feedback: "Information without acknowledgement rarely resolves a concern about dignity." },
    ],
  },
  {
    key: "post-b-10",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "beginner",
    topicTag: "conversation",
    pairKey: "family-conversation",
    difficulty: 1,
    prompt: "According to Save7, what is the most important part of advocating for organ donation?",
    explanation:
      "Whether it is for awareness campaigns or a private conversation with family and friends, the most important part is simply starting the conversation.",
    choices: [
      { text: "Simply starting the conversation", isCorrect: true },
      { text: "Persuading as many people as possible to register", feedback: "Registration matters, but the conversation is what makes wishes actionable." },
      { text: "Correcting every myth you hear", feedback: "Correction matters less than being someone people will talk to." },
      { text: "Being able to answer any medical question", feedback: '"I\'ll find out" is a perfectly good answer, and often the better one.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// POST — INTERMEDIATE · 13 items, scenario-weighted
// ---------------------------------------------------------------------------

const postIntermediate: QuestionSeed[] = [
  {
    key: "post-i-01",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "intermediate",
    topicTag: "brain-death",
    pairKey: "brain-death-heart-beating",
    difficulty: 2,
    scenario:
      "A patient has been declared brain dead. Their heart is still beating because they are mechanically ventilated.",
    prompt: "Can this person be considered deceased?",
    explanation:
      "Yes. Brain death is death, determined by neurological criteria. The ventilator supplies oxygen the person can no longer obtain for themselves, which allows the heart to keep beating for a period after death has been determined.",
    choices: [
      { text: "Yes — death has been determined by neurological criteria, and ventilation is what allows the heart to continue", isCorrect: true },
      { text: "No — a beating heart means the person is still alive", feedback: "This is the misconception at the heart of the module. Brain death is death." },
      { text: "Only once the ventilator has been switched off", feedback: "Death has already been determined. Withdrawal of ventilation does not constitute the determination." },
      { text: "It depends on whether the family agrees", feedback: "Determination of death is a clinical and legal process, not a family decision. Consent for donation is a separate question." },
    ],
  },
  {
    key: "post-i-02",
    scope: "POST",
    kind: "TRUE_FALSE",
    levelSlug: "intermediate",
    topicTag: "brain-death",
    pairKey: "brain-death-vs-coma",
    difficulty: 2,
    prompt: "A person who is brain dead may later recover, as sometimes happens with a coma.",
    explanation:
      "No. This is the distinction the module exists to establish. Recovery is possible from a coma, because some brain function remains. Brain death is the irreversible loss of the capacity for consciousness and of the capacity to breathe — there is no function left to recover.",
    choices: [
      { text: "True" },
      { text: "False", isCorrect: true },
    ],
  },
  {
    key: "post-i-03",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "intermediate",
    topicTag: "determination-of-death",
    pairKey: "independent-teams",
    difficulty: 2,
    prompt: "Why is independent medical assessment part of determining death?",
    explanation:
      "It is a deliberate safeguard. The clinicians who determine death are independent of the transplant team, which removes any conflict of interest and is the direct answer to the most common public fear about donation.",
    choices: [
      { text: "It is a deliberate safeguard: those determining death are independent of the transplant team", isCorrect: true },
      { text: "It speeds up the donation process", feedback: "Safeguards are not there for efficiency." },
      { text: "It is required only when the family requests it", feedback: "It is part of the process, not an optional extra." },
      { text: "It allows the transplant team to select suitable donors earlier", feedback: "This describes exactly the conflict of interest the separation exists to prevent." },
    ],
  },
  {
    key: "post-i-04",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "intermediate",
    topicTag: "journey",
    pairKey: "pathway-order",
    difficulty: 2,
    prompt: "In the donation pathway, what comes immediately after consent?",
    explanation:
      "Donor management follows consent: the donor is cared for so that the gift remains viable, before organ and tissue recovery takes place.",
    choices: [
      { text: "Donor management", isCorrect: true, feedback: "Correct — a real and skilled stage of care that public conversation usually omits." },
      { text: "Allocation", feedback: "Allocation comes later, after recovery." },
      { text: "Determination of death", feedback: "Death is determined before the family is approached for consent." },
      { text: "Transplantation", feedback: "Several stages come between consent and transplantation." },
    ],
  },
  {
    key: "post-i-05",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "intermediate",
    topicTag: "journey",
    pairKey: "allocation",
    difficulty: 2,
    prompt: "Which best describes allocation?",
    explanation:
      "Allocation is a matching process rather than a queue. It is not simply first-come-first-served, and prognostic assessment forms part of it.",
    choices: [
      { text: "A matching process between donor organs and recipients", isCorrect: true },
      { text: "First come, first served from a waiting list", feedback: "Allocation is a matching process, not a simple queue." },
      { text: "Decided by the donor's family", feedback: "Families consent to donation; they do not allocate organs." },
      { text: "Decided by whichever hospital recovers the organ", feedback: "Allocation follows a matching process rather than institutional convenience." },
    ],
  },
  {
    key: "post-i-06",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "intermediate",
    topicTag: "who-is-involved",
    pairKey: "team-safeguards",
    difficulty: 2,
    prompt: "Which of these roles exists primarily as a safeguard rather than to provide treatment?",
    explanation:
      "The clinicians who determine death are independent of the transplant team specifically so that no conflict of interest can arise. Several other roles — translators, counsellors, faith representatives — exist to support the family and to protect the validity of consent.",
    choices: [
      { text: "The doctors who determine death, who are independent of the transplant team", isCorrect: true },
      { text: "The tissue recovery technician", feedback: "An essential clinical role, but not a safeguard against conflict of interest." },
      { text: "The primary treating team", feedback: "They provide treatment, long before donation is considered." },
      { text: "The transplant surgeon", feedback: "A treating role, and precisely the one the independence safeguard separates from determining death." },
    ],
  },
  {
    key: "post-i-07",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "intermediate",
    topicTag: "who-is-involved",
    pairKey: "consent-understood",
    difficulty: 2,
    prompt: "Why is a translator's role part of the consent safeguards rather than a courtesy?",
    explanation:
      "Consent that is not understood is not consent. In a country with many languages, translation is often what makes a consent conversation genuinely informed.",
    choices: [
      { text: "Consent that is not understood is not genuinely informed consent", isCorrect: true },
      { text: "It makes the family feel more comfortable", feedback: "True but incidental. The point is the validity of consent." },
      { text: "It is only needed for patients from other countries", feedback: "South Africa has many languages spoken by its own citizens." },
      { text: "A family member can always do it instead", feedback: "Relying on a grieving relative to interpret a consent conversation is not a safeguard." },
    ],
  },
  {
    key: "post-i-08",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "intermediate",
    topicTag: "eligibility",
    pairKey: "eligibility-comorbidity",
    difficulty: 2,
    scenario: "A potential donor has hypertension.",
    prompt: "Does this automatically exclude donation?",
    explanation:
      "No. Suitability is determined through appropriate medical assessment at the time. Neither a confident exclusion nor a claim that the condition is irrelevant is accurate.",
    choices: [
      { text: "No — suitability is assessed individually by medical teams at the time", isCorrect: true },
      { text: "Yes, hypertension is an absolute exclusion", feedback: "Simple exclusion rules are frequently wrong and change as practice changes." },
      { text: "No, because hypertension has no bearing on donation at all", feedback: "Overcorrection. The honest answer is that it is assessed, not that it is irrelevant." },
      { text: "Only tissue donation would be possible", feedback: "This invents a rule rather than describing the assessment." },
    ],
  },
  {
    key: "post-i-09",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "intermediate",
    topicTag: "eligibility",
    pairKey: "eligibility-organ-specific",
    difficulty: 2,
    prompt: "Someone is found to be unsuitable to donate one particular organ. What follows?",
    explanation:
      "Assessment can be organ-specific. Being unsuitable for one donation does not mean being unsuitable for all of them.",
    choices: [
      { text: "Nothing automatically — suitability can differ between organs and tissues", isCorrect: true },
      { text: "They are excluded from donating anything", feedback: "Assessment can be organ-specific." },
      { text: "They must be re-registered before anything else can be considered", feedback: "Registration is not the constraint here." },
      { text: "Their family must consent a second time", feedback: "Not how consent operates." },
    ],
  },
  {
    key: "post-i-10",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "intermediate",
    topicTag: "eligibility",
    pairKey: "eligibility-age",
    difficulty: 1,
    prompt: "What single message about eligibility should an advocate always carry?",
    explanation:
      "Do not automatically assume that someone cannot donate. Suitability is determined through appropriate medical assessment.",
    choices: [
      { text: "Do not assume anyone cannot donate — suitability is medically assessed", isCorrect: true },
      { text: "Most people over sixty are unsuitable", feedback: "An invented exclusion rule." },
      { text: "Healthy people are the only realistic donors", feedback: "This drives exactly the self-exclusion the module warns about." },
      { text: "Eligibility can be worked out from a checklist", feedback: "The course deliberately avoids teaching exclusion checklists." },
    ],
  },
  {
    key: "post-i-11",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "intermediate",
    topicTag: "journey",
    pairKey: "recovery-respect",
    difficulty: 1,
    prompt: "Which is the most accurate description of organ and tissue recovery?",
    explanation:
      "Recovery is a surgical procedure, carried out with the same care and respect as any other operation. Saying so directly answers the dignity concern that underlies many refusals.",
    choices: [
      { text: "A surgical procedure carried out with the same care as any other operation", isCorrect: true },
      { text: "A rapid procedure where appearance is not a consideration", feedback: "This feeds precisely the fear that causes refusals." },
      { text: "A post-mortem examination", feedback: "Recovery is not a post-mortem, though a forensic examination may be separately required in some deaths." },
      { text: "Something performed by the primary treating team", feedback: "Recovery is performed by recovery teams, separate from those who determined death." },
    ],
  },
  {
    key: "post-i-12",
    scope: "POST",
    kind: "SCENARIO",
    levelSlug: "intermediate",
    topicTag: "conversation",
    pairKey: "explaining-brain-death",
    difficulty: 3,
    scenario:
      "A friend, upset, asks you how a hospital could say someone had died when the family could see the heart monitor beeping.",
    prompt: "What is the best way to respond?",
    explanation:
      "Acknowledge that the contradiction is a completely reasonable response to an unusual situation, then explain plainly what the ventilator is doing. Treating disbelief as ignorance loses the conversation immediately.",
    choices: [
      { text: "Acknowledge that it genuinely looks impossible, then explain simply what the ventilator is doing", isCorrect: true, feedback: "Correct — the acknowledgement is what makes the explanation land." },
      { text: "Explain that brain death is legally death and the family were mistaken", feedback: "Accurate and useless. It corrects the family rather than helping your friend understand." },
      { text: "Say that monitors can be misleading and leave it there", feedback: "Vague, and it implies the equipment was at fault rather than explaining anything." },
      { text: "Avoid the question, since it is a clinical matter", feedback: "This is exactly the question the course prepares you to answer, kindly and accurately." },
    ],
  },
  {
    key: "post-i-13",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "intermediate",
    topicTag: "after-transplant",
    pairKey: "after-transplant",
    difficulty: 2,
    prompt: "What best describes what a transplant means for the recipient?",
    explanation:
      "The start of a lifelong medical journey involving ongoing medication and monitoring — not a cure. Describing it honestly is more persuasive than a happy ending.",
    choices: [
      { text: "The beginning of a lifelong medical journey", isCorrect: true },
      { text: "A complete cure" },
      { text: "A short recovery, then life exactly as before" },
      { text: "A temporary fix that always fails within a few years" },
    ],
  },
];

// ---------------------------------------------------------------------------
// POST — ADVANCED · 15 items, scenario-weighted
// ---------------------------------------------------------------------------

const postAdvanced: QuestionSeed[] = [
  {
    key: "post-a-01",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "advanced",
    topicTag: "law",
    pairKey: "law-primary-statute",
    difficulty: 2,
    prompt: "Which statute is the primary legal framework for organ donation and transplantation in South Africa?",
    explanation:
      "The National Health Act 61 of 2003, and Chapter 8 in particular — which also defines death as brain death. Note that much of the operational detail sits in the regulations made under the Act rather than in Chapter 8 itself, and that requirements must be checked against the current consolidated text rather than an older study guide.",
    choices: [
      { text: "The National Health Act", isCorrect: true },
      { text: "The Human Tissue Act, which remains the current governing statute", feedback: "Earlier legislation governed this area historically. Always verify which provisions are currently in force." },
      { text: "The Consumer Protection Act" },
      { text: "There is no specific statute; it is governed by common law alone" },
    ],
  },
  {
    key: "post-a-02",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "advanced",
    topicTag: "advocacy-integrity",
    pairKey: "separate-claim-types",
    difficulty: 3,
    prompt:
      "An advocate is asked whether a particular consent arrangement is allowed. Which distinction matters most in answering?",
    explanation:
      "Educational explanation, legal requirement and clinical guidance are three different kinds of statement. An advocate who cannot separate them will eventually mislead someone — so say which one you are giving, and refer what you do not know.",
    choices: [
      { text: "Whether they are giving an educational explanation, stating a legal requirement, or relaying clinical guidance", isCorrect: true },
      { text: "Whether the questioner is a medical professional", feedback: "Your accuracy obligation does not change with the audience." },
      { text: "Whether the answer is likely to encourage registration", feedback: "Advocacy must never shape the accuracy of an answer." },
      { text: "Whether the question relates to organs or tissue", feedback: "Relevant to the content, but not the distinction that protects against misleading someone." },
    ],
  },
  {
    key: "post-a-03",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "advanced",
    topicTag: "law",
    pairKey: "law-unnatural-death",
    difficulty: 2,
    prompt: "Why do unnatural deaths add complexity to a potential donation?",
    explanation:
      "An unnatural death must be referred for a forensic post-mortem under section 66(1)(c) of the National Health Act and section 3 of the Inquests Act, so recovery also needs the forensic pathologist\u2019s authorisation — family consent alone is not enough. Note that older material calls this office the \u201cdistrict surgeon\u201d; the function now sits with the Forensic Pathology Service.",
    choices: [
      { text: "They bring additional legal requirements and forensic authorities into the process", isCorrect: true },
      { text: "Donation is never possible after an unnatural death", feedback: "An overstatement. Additional requirements apply rather than an absolute bar." },
      { text: "The family loses the right to consent", feedback: "Not an accurate description of how consent operates." },
      { text: "Only tissue may be donated in such cases", feedback: "This invents a rule." },
    ],
  },
  {
    key: "post-a-04",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "advanced",
    topicTag: "transplant-landscape",
    // Deepens the baseline's eligibility item rather than introducing a new
    // idea, so it is a fair matched pair.
    pairKey: "eligibility-comorbidity",
    difficulty: 3,
    prompt: "Which statement about contraindications to heart transplantation is most accurate?",
    explanation:
      "Most are relative rather than absolute, and several have changed substantially as evidence and practice have moved. This is the strongest reason for advocates to avoid stating exclusion rules confidently in public.",
    choices: [
      { text: "Most are relative rather than absolute, and several have changed over time", isCorrect: true },
      { text: "They are fixed and universally agreed", feedback: "They are neither fixed nor universally agreed." },
      { text: "They are decided by the patient's own doctor alone", feedback: "Candidate selection is a specialist multidisciplinary judgement." },
      { text: "Age is the only meaningful contraindication", feedback: "Age is one factor among many, and rarely an absolute one." },
    ],
  },
  {
    key: "post-a-05",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "advanced",
    topicTag: "transplant-landscape",
    pairKey: "mcs-alternative",
    difficulty: 3,
    prompt: "Why does mechanical circulatory support matter when discussing advanced heart failure?",
    explanation:
      "It means transplantation is not always the only option in advanced heart failure, which complicates any simple framing of transplant as the single available answer.",
    choices: [
      { text: "It means transplantation is not always the only option", isCorrect: true },
      { text: "It replaces transplantation entirely", feedback: "It does not replace transplantation." },
      { text: "It is only used after a transplant has failed", feedback: "Too narrow a description of its role." },
      { text: "It removes the need for donor organs nationally", feedback: "The need for donated organs remains." },
    ],
  },
  {
    key: "post-a-06",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "advanced",
    topicTag: "transplant-landscape",
    pairKey: "allocation",
    difficulty: 3,
    prompt: 'Why is "the sickest patient goes first" an inadequate description of allocation?',
    explanation:
      "Prognostic assessment forms part of allocation: the question is not only how ill someone is now, but what outcome a transplant is likely to achieve. It is a matching process, not a queue ordered by severity.",
    choices: [
      { text: "Prognostic assessment forms part of allocation, alongside matching", isCorrect: true },
      { text: "Because allocation is random", feedback: "It is not random." },
      { text: "Because the wealthiest patients are prioritised", feedback: "This describes an inequity concern, not how allocation is designed to work." },
      { text: "Because allocation is decided by the donor family", feedback: "Families consent; they do not allocate." },
    ],
  },
  {
    key: "post-a-07",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "advanced",
    topicTag: "after-transplant",
    pairKey: "immunosuppression-tradeoff",
    difficulty: 2,
    prompt: "Which best describes immunosuppression after transplantation?",
    explanation:
      "It prevents rejection but carries its own risks. It is a trade-off rather than a fix, and describing it that way is more honest than presenting a transplant as a clean solution.",
    choices: [
      { text: "It prevents rejection but carries its own risks — a trade-off", isCorrect: true },
      { text: "A short course of medication after the operation", feedback: "It is generally ongoing rather than a short course." },
      { text: "A cure for rejection", feedback: "It reduces the risk of rejection; it does not cure it." },
      { text: "Optional, depending on the recipient's preference", feedback: "Not a matter of preference." },
    ],
  },
  {
    key: "post-a-08",
    scope: "POST",
    kind: "TRUE_FALSE",
    levelSlug: "advanced",
    topicTag: "after-transplant",
    pairKey: "rejection-treatable",
    difficulty: 2,
    prompt: "An episode of rejection always means the recipient will lose the transplanted organ.",
    explanation:
      "No. Rejection is monitored for and is often treatable. It does not automatically mean losing the graft.",
    choices: [
      { text: "True" },
      { text: "False", isCorrect: true },
    ],
  },
  {
    key: "post-a-09",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "advanced",
    topicTag: "after-transplant",
    pairKey: "after-transplant",
    difficulty: 2,
    prompt: "Why does the course insist on describing transplantation honestly rather than optimistically?",
    explanation:
      "Overselling transplantation damages credibility and misrepresents recipients' actual lives. A transplant trades one serious medical situation for another, usually far better, one — and saying so plainly is more persuasive than a happy ending.",
    choices: [
      { text: "Overselling damages credibility and misrepresents recipients' experience", isCorrect: true },
      { text: "Because transplantation usually fails", feedback: "Not the reason, and not accurate." },
      { text: "Because optimism is unprofessional", feedback: "Honesty is the point, not the absence of hope." },
      { text: "To discourage unsuitable candidates from applying", feedback: "Not the purpose of honest advocacy." },
    ],
  },
  {
    key: "post-a-10",
    scope: "POST",
    kind: "SCENARIO",
    levelSlug: "advanced",
    topicTag: "conversation",
    pairKey: "family-bedside-grief",
    difficulty: 3,
    scenario:
      'At a bedside, a family says: "She\'s still warm. Her heart is beating. You\'re asking us to give up on her."',
    prompt: "As a Save7 advocate, what is the best thing you can do?",
    explanation:
      "Acknowledge the reality of what they are experiencing, reject the framing of 'giving up', then make space — and connect them to the clinical team or their own faith community. This is a clinical and counselling conversation, not an advocacy one.",
    choices: [
      { text: "Acknowledge how impossible it feels, make clear nobody is asking them to give up, and then stop talking", isCorrect: true, feedback: "Correct. Silence is a legitimate and often the best contribution here." },
      { text: "Explain that brain death is legally and medically death, and that the ventilator keeps the heart beating", feedback: "The facts are right and the timing is wrong. This explanation belongs to the clinical team, not to you, and not now." },
      { text: "Gently point out that she would have wanted to help others", feedback: "This puts words in the patient's mouth and will be experienced as pressure. It can permanently damage trust." },
      { text: "Ask whether they have considered how many people could be helped", feedback: "Applying pressure during acute grief. Harmful." },
    ],
  },
  {
    key: "post-a-11",
    scope: "POST",
    kind: "SCENARIO",
    levelSlug: "advanced",
    topicTag: "conversation",
    pairKey: "mistrust-equity",
    difficulty: 3,
    scenario:
      'A community member says: "People like us don\'t get organs. We only give them."',
    prompt: "What is the best response?",
    explanation:
      "Mistrust grounded in real inequity is not a myth and cannot be corrected like one. Take the concern seriously, listen to what they have actually seen, and be honest that inequity in healthcare access is a real problem. Conceding that is what makes anything else you say believable.",
    choices: [
      { text: "Take the concern seriously, ask what they have seen, and be honest that inequity in access is a real problem", isCorrect: true },
      { text: "Reassure them immediately that allocation is based on medical criteria only", feedback: "It may be accurate, but as a first response it sounds like a denial of their experience. Trust has to precede information." },
      { text: "Point out that they might need a transplant themselves one day", feedback: "Self-interest framing on top of an equity concern lands as manipulative." },
      { text: "Explain that this is a misconception about the allocation system", feedback: "Labelling a structural concern a misconception ends the conversation." },
    ],
  },
  {
    key: "post-a-12",
    scope: "POST",
    kind: "SCENARIO",
    levelSlug: "advanced",
    topicTag: "conversation",
    // Same underlying skill as the baseline's religion item — accept a settled
    // position, and still secure a family conversation.
    pairKey: "responding-to-religion",
    difficulty: 3,
    scenario:
      'An older relative says: "My body needs to be whole when it\'s buried. That\'s not negotiable for me."',
    prompt: "What is the best response?",
    explanation:
      "Accept the settled position gracefully, and ask whether they have told the family so nobody has to guess. A clearly communicated 'no' is a good outcome for Save7 — the failure mode is a family left guessing.",
    choices: [
      { text: "Accept their position, and ask whether they have told the family so nobody has to guess", isCorrect: true },
      { text: "Explain that recovery is surgical and would not usually affect burial", feedback: "Sometimes useful information, but offered unprompted against a stated conviction it reads as trying to talk them out of it." },
      { text: "Ask whether tissue donation might be more acceptable", feedback: "Negotiating around a stated conviction. It signals you did not accept their answer." },
      { text: "Explain how many people a single donor can help", feedback: "Applying pressure to a settled belief." },
    ],
  },
  {
    key: "post-a-13",
    scope: "POST",
    kind: "SCENARIO",
    levelSlug: "advanced",
    topicTag: "advocacy-integrity",
    pairKey: "dont-guess-statistics",
    difficulty: 2,
    scenario:
      'At a Save7 event, someone asks: "How many organs actually get transplanted in South Africa each year?" You are not certain of the current figure.',
    prompt: "What should you do?",
    explanation:
      "Say you would rather not give a number you are not sure of, and offer to get the current figure from an authoritative source. A half-remembered statistic becomes the thing they repeat — and the caveat does not travel with it.",
    choices: [
      { text: "Say you don't want to give an uncertain number, and offer to find the current figure from an authoritative source", isCorrect: true },
      { text: "Give your best recollection with a caveat that you're not certain", feedback: "The caveat does not travel with the number once they repeat it." },
      { text: "Give a round approximation to keep the conversation moving", feedback: "Inventing a figure damages Save7's credibility as well as your own." },
      { text: "Say that statistics are unreliable and change the subject", feedback: "Sounds evasive, and does not answer a fair question." },
    ],
  },
  {
    key: "post-a-14",
    scope: "POST",
    kind: "SCENARIO",
    levelSlug: "advanced",
    topicTag: "conversation",
    pairKey: "not-a-counsellor",
    difficulty: 3,
    scenario:
      "Two siblings begin arguing in front of you about whether their late father ever said he wanted to donate.",
    prompt: "What is the best thing you can do?",
    explanation:
      "Refuse to arbitrate, remove any time pressure you have no business applying, and offer a shared source of information so both siblings hear the same thing. Taking a side inside a grieving family fractures the conversation entirely.",
    choices: [
      { text: "Decline to take a side, remove any sense of rush, and offer to have the team explain the options to them together", isCorrect: true },
      { text: "Support the sibling who says he wanted to donate, since they have the relevant information", feedback: "Taking a side inside a grieving family is not your role." },
      { text: "Explain who is legally entitled to consent so they know where they stand", feedback: "It may be relevant, but from an advocate in a live family dispute it reads as picking a winner. Better from the coordinator." },
      { text: "Suggest they decide quickly, since donation is time-sensitive", feedback: "Applying time pressure to a grieving family is not yours to do." },
    ],
  },
  {
    key: "post-a-15",
    scope: "POST",
    kind: "SINGLE",
    levelSlug: "advanced",
    topicTag: "advocacy-integrity",
    pairKey: "limits-of-role",
    difficulty: 2,
    prompt: "Which best describes the limits of a Save7 advocate's role?",
    explanation:
      "You are not a counsellor and not a clinician. Recognising when a conversation has moved beyond your role — and stopping, or referring — is a skill rather than a failure.",
    choices: [
      { text: "Recognising when a conversation has moved beyond your role, and referring it", isCorrect: true },
      { text: "Answering every question asked of you", feedback: "\"I'll find out\" is often the better answer." },
      { text: "Persuading everyone you speak to", feedback: "The goal is a conversation, not a conversion." },
      { text: "Providing emotional counselling to bereaved families", feedback: "That is not an advocate's role, and attempting it can do harm." },
    ],
  },
];

// ---------------------------------------------------------------------------
// CHECK YOUR UNDERSTANDING — inline, per module
// ---------------------------------------------------------------------------

const checkQuestions: QuestionSeed[] = [
  // M1
  {
    key: "chk-m1-01", scope: "CHECK", kind: "SINGLE", moduleSlug: "who-needs-organs",
    topicTag: "who-needs-organs", difficulty: 1,
    prompt: "What does end-stage organ failure mean?",
    explanation: "The organ has failed to the point where it can no longer sustain its function, and cannot be repaired. For some conditions, transplantation is the only remaining option.",
    choices: [
      { text: "The organ can no longer sustain its function and cannot be repaired", isCorrect: true },
      { text: "The organ is working at reduced capacity but is stable" },
      { text: "The organ has been surgically removed" },
      { text: "The organ is failing but will recover with medication" },
    ],
  },
  {
    key: "chk-m1-02", scope: "CHECK", kind: "MULTI", moduleSlug: "who-needs-organs",
    topicTag: "what-can-be-donated", difficulty: 1,
    prompt: "Which of these are tissue donations? Select all that apply.",
    explanation: "Corneas, skin, bone and ligaments, and heart valves are all transplanted as tissue.",
    choices: [
      { text: "Corneas", isCorrect: true },
      { text: "Skin", isCorrect: true },
      { text: "Heart valves", isCorrect: true },
      { text: "Pancreas", feedback: "The pancreas is a solid organ." },
    ],
  },
  {
    key: "chk-m1-03", scope: "CHECK", kind: "SINGLE", moduleSlug: "who-needs-organs",
    topicTag: "what-can-be-donated", difficulty: 1,
    prompt: "Where does Save7's name come from?",
    explanation: "One donor can help several people — one decision can save seven lives.",
    choices: [
      { text: "One decision can save seven lives", isCorrect: true },
      { text: "Seven organs are transplanted in every donation" },
      { text: "The organisation was founded by seven people" },
      { text: "Seven hospitals perform transplants in South Africa" },
    ],
  },

  // M2
  {
    key: "chk-m2-01", scope: "CHECK", kind: "SINGLE", moduleSlug: "why-are-we-losing-organs",
    topicTag: "loss-points", difficulty: 1,
    prompt: "Which is the largest preventable loss point in the donation pathway?",
    explanation: "Family refusal, and it is the loss point most directly changed by a family having discussed donation in advance.",
    choices: [
      { text: "Family refusal at the consent stage", isCorrect: true },
      { text: "Surgical complications during recovery" },
      { text: "A shortage of transplant surgeons" },
      { text: "Organs being damaged in transit" },
    ],
  },
  {
    key: "chk-m2-02", scope: "CHECK", kind: "SINGLE", moduleSlug: "why-are-we-losing-organs",
    topicTag: "loss-points", difficulty: 2,
    prompt: "Why is it useful to understand why a myth persists, rather than just knowing it is false?",
    explanation: "Understanding why a belief is persuasive is what lets you respond to it well. People who feel dismissed stop listening.",
    choices: [
      { text: "It lets you respond to the real concern instead of dismissing the person", isCorrect: true },
      { text: "It makes the myth easier to remember" },
      { text: "It proves the person is being unreasonable" },
      { text: "It is not useful — correcting the fact is enough" },
    ],
  },
  {
    key: "chk-m2-03", scope: "CHECK", kind: "TRUE_FALSE", moduleSlug: "why-are-we-losing-organs",
    topicTag: "loss-points", difficulty: 1,
    prompt: "Most points at which donations are lost are medical or surgical rather than human.",
    explanation: "The opposite. Most loss points are human — awareness, myths, fear, and families never having discussed donation.",
    choices: [
      { text: "True" },
      { text: "False", isCorrect: true },
    ],
  },

  // M3
  {
    key: "chk-m3-01", scope: "CHECK", kind: "SINGLE", moduleSlug: "basics-of-organ-donation",
    topicTag: "routes-to-donation", difficulty: 1,
    prompt: "What are the two main routes to deceased donation?",
    explanation: "Donation after brain death, and donation after circulatory death. Each has its own requirements.",
    choices: [
      { text: "After brain death, and after circulatory death", isCorrect: true },
      { text: "Living donation, and tissue donation" },
      { text: "Voluntary and involuntary donation" },
      { text: "Hospital donation and community donation" },
    ],
  },
  {
    key: "chk-m3-02", scope: "CHECK", kind: "SINGLE", moduleSlug: "basics-of-organ-donation",
    topicTag: "routes-to-donation", difficulty: 1,
    prompt: "Which organ is most commonly donated by a living donor?",
    explanation: "A kidney. Living donation is possible for some organs, most commonly a kidney.",
    choices: [
      { text: "A kidney", isCorrect: true },
      { text: "A heart", feedback: "A heart cannot be donated by a living donor." },
      { text: "A cornea" },
      { text: "A pancreas" },
    ],
  },
  {
    key: "chk-m3-03", scope: "CHECK", kind: "SINGLE", moduleSlug: "basics-of-organ-donation",
    topicTag: "family-conversation", difficulty: 1,
    prompt: "What makes a registered wish actionable in practice?",
    explanation: "Registration signals your wishes; telling your family is what makes them actionable.",
    choices: [
      { text: "Your family knowing what you want", isCorrect: true },
      { text: "Registering more than once" },
      { text: "Carrying a donor card" },
      { text: "Nothing further is needed" },
    ],
  },

  // M4
  {
    key: "chk-m4-01", scope: "CHECK", kind: "SINGLE", moduleSlug: "having-the-conversation",
    topicTag: "conversation", difficulty: 1,
    prompt: "What is the purpose of this module?",
    explanation: "Not to teach you to win arguments. People who feel argued with dig in; people who feel heard reconsider.",
    choices: [
      { text: "To help you hold a respectful conversation, not win an argument", isCorrect: true },
      { text: "To give you arguments that defeat every objection" },
      { text: "To teach you to identify people not worth talking to" },
      { text: "To help you register as many donors as possible" },
    ],
  },
  {
    key: "chk-m4-02", scope: "CHECK", kind: "SINGLE", moduleSlug: "having-the-conversation",
    topicTag: "conversation", difficulty: 2,
    prompt: "Why is asking permission before offering information effective?",
    explanation: "It turns a correction into a conversation, and it stops the other person feeling talked down to.",
    choices: [
      { text: "It turns a correction into a conversation", isCorrect: true },
      { text: "It gives you time to think of an answer" },
      { text: "It is a legal requirement" },
      { text: "It signals that you are the expert" },
    ],
  },
  {
    key: "chk-m4-03", scope: "CHECK", kind: "SINGLE", moduleSlug: "having-the-conversation",
    topicTag: "conversation", difficulty: 2,
    prompt: 'Why is "I don\'t know, let me find out" a good answer?',
    explanation: "It protects your credibility and the possibility of the next conversation. A confident guess does the opposite.",
    choices: [
      { text: "It protects your credibility and the next conversation", isCorrect: true },
      { text: "It ends an awkward conversation politely" },
      { text: "It shifts responsibility to someone else" },
      { text: "It is better than admitting the answer is complicated" },
    ],
  },
  {
    key: "chk-m4-04", scope: "CHECK", kind: "SINGLE", moduleSlug: "having-the-conversation",
    topicTag: "conversation", difficulty: 2,
    prompt: "Someone decides against donation but tells their family clearly. From Save7's perspective, what is this?",
    explanation: "A good outcome. The goal is a family that has talked, not a converted donor. The failure mode is a family left guessing.",
    choices: [
      { text: "A good outcome", isCorrect: true },
      { text: "A failed conversation" },
      { text: "A reason to try again later" },
      { text: "Neither a success nor a failure" },
    ],
  },

  // M5
  {
    key: "chk-m5-01", scope: "CHECK", kind: "SINGLE", moduleSlug: "journey-of-a-gift",
    topicTag: "journey", difficulty: 2,
    prompt: "What happens during donor management?",
    explanation: "The donor is cared for so that the gift remains viable — a real and skilled stage of care between consent and recovery.",
    choices: [
      { text: "The donor is cared for so the organs remain viable", isCorrect: true },
      { text: "The family is counselled about their decision" },
      { text: "Organs are matched to recipients" },
      { text: "Death is formally determined" },
    ],
  },
  {
    key: "chk-m5-02", scope: "CHECK", kind: "SINGLE", moduleSlug: "journey-of-a-gift",
    topicTag: "journey", difficulty: 2,
    prompt: "Which stage comes last in the pathway?",
    explanation: "Life after transplant — for the recipient, the beginning of a lifelong medical journey.",
    choices: [
      { text: "Life after transplant", isCorrect: true },
      { text: "Recovery" },
      { text: "Allocation" },
      { text: "Consent" },
    ],
  },
  {
    key: "chk-m5-03", scope: "CHECK", kind: "TRUE_FALSE", moduleSlug: "journey-of-a-gift",
    topicTag: "journey", difficulty: 1,
    prompt: "A donation is best understood as a single event at one moment in time.",
    explanation: "It is a coordinated chain of events running over hours and involving many people, most of whom never meet each other.",
    choices: [
      { text: "True" },
      { text: "False", isCorrect: true },
    ],
  },

  // M6
  {
    key: "chk-m6-01", scope: "CHECK", kind: "SINGLE", moduleSlug: "what-does-death-mean",
    topicTag: "brain-death", difficulty: 2,
    prompt: "What is the single most important distinction in this module?",
    explanation: "Brain death is not a coma, and not simply being unconscious. It is death, determined by neurological criteria: the South African guidelines define it as the irreversible loss of the capacity for consciousness together with the irreversible loss of the capacity to breathe.",
    choices: [
      { text: "Brain death is death; a coma is not", isCorrect: true },
      { text: "Circulatory death is more common than brain death" },
      { text: "Ventilators cause brain death" },
      { text: "Brain death can only be determined in an ICU" },
    ],
  },
  {
    key: "chk-m6-02", scope: "CHECK", kind: "SINGLE", moduleSlug: "what-does-death-mean",
    topicTag: "determination-of-death", difficulty: 2,
    prompt: "Why are the clinicians who determine death independent of the transplant team?",
    explanation: "It is a designed safeguard against any conflict of interest, and it is the direct answer to the fear that doctors might not try as hard to save a registered donor.",
    choices: [
      { text: "As a safeguard against any conflict of interest", isCorrect: true },
      { text: "Because they have different specialist training" },
      { text: "To share the workload between teams" },
      { text: "Because transplant surgeons are usually unavailable" },
    ],
  },
  {
    key: "chk-m6-03", scope: "CHECK", kind: "SINGLE", moduleSlug: "what-does-death-mean",
    topicTag: "conversation", difficulty: 2,
    prompt: "A family at the bedside cannot accept that their relative has died. How should you regard that?",
    explanation: "As a reasonable human response to an unusual situation, not as ignorance. Treating it as ignorance loses the conversation immediately.",
    choices: [
      { text: "As a reasonable human response to a situation that contradicts what they can see", isCorrect: true },
      { text: "As a lack of medical understanding to be corrected" },
      { text: "As a sign they will refuse consent" },
      { text: "As something to be resolved by repeating the explanation" },
    ],
  },

  // M7
  {
    key: "chk-m7-01", scope: "CHECK", kind: "SINGLE", moduleSlug: "who-makes-it-happen",
    topicTag: "who-is-involved", difficulty: 1,
    prompt: "Who coordinates the donation process as a whole?",
    explanation: "The transplant coordinator, from referral through to recovery.",
    choices: [
      { text: "The transplant coordinator", isCorrect: true },
      { text: "The primary treating team" },
      { text: "The state pathologist" },
      { text: "The recipient's surgeon" },
    ],
  },
  {
    key: "chk-m7-02", scope: "CHECK", kind: "MULTI", moduleSlug: "who-makes-it-happen",
    topicTag: "who-is-involved", difficulty: 2,
    prompt: "Which roles exist primarily to support the family? Select all that apply.",
    explanation: "Counsellors, translators and faith representatives all exist to support the family and, in the case of translators, to protect the validity of consent.",
    choices: [
      { text: "Counsellors", isCorrect: true },
      { text: "Translators", isCorrect: true },
      { text: "Faith representatives", isCorrect: true },
      { text: "Tissue recovery technicians", feedback: "An essential clinical role, but not a family support one." },
    ],
  },
  {
    key: "chk-m7-03", scope: "CHECK", kind: "SINGLE", moduleSlug: "who-makes-it-happen",
    topicTag: "who-is-involved", difficulty: 1,
    prompt: "Which organisation is South Africa's professional body for transplant coordinators?",
    explanation: "The South African Transplant Coordinators Society (SATCS).",
    choices: [
      { text: "The South African Transplant Coordinators Society", isCorrect: true },
      { text: "The Organ Donor Foundation" },
      { text: "Save7" },
      { text: "The Health Professions Council" },
    ],
  },

  // M8
  {
    key: "chk-m8-01", scope: "CHECK", kind: "SINGLE", moduleSlug: "who-can-donate",
    topicTag: "eligibility", difficulty: 1,
    prompt: "What is this module's central message?",
    explanation: "Do not assume someone cannot donate. Suitability is determined through appropriate medical assessment at the time.",
    choices: [
      { text: "Do not assume anyone cannot donate — suitability is medically assessed", isCorrect: true },
      { text: "Most people are unsuitable for donation" },
      { text: "Only healthy young people can donate" },
      { text: "Eligibility can be checked against a simple list" },
    ],
  },
  {
    key: "chk-m8-02", scope: "CHECK", kind: "SINGLE", moduleSlug: "who-can-donate",
    topicTag: "eligibility", difficulty: 2,
    prompt: "Why does the course avoid giving advocates a list of exclusion criteria?",
    explanation: "Simple exclusion rules are frequently wrong and change as practice changes, and a confident wrong answer from an advocate can permanently remove a potential donor.",
    choices: [
      { text: "Because such rules are often wrong, change over time, and a confident wrong answer causes real harm", isCorrect: true },
      { text: "Because the criteria are confidential" },
      { text: "Because advocates are not expected to answer questions" },
      { text: "Because the list is too long to memorise" },
    ],
  },
  {
    key: "chk-m8-03", scope: "CHECK", kind: "SINGLE", moduleSlug: "who-can-donate",
    topicTag: "eligibility", difficulty: 2,
    prompt: 'Why is "that condition makes no difference at all" a poor answer?',
    explanation: "It is an overcorrection. Claiming a factor is irrelevant is as inaccurate as claiming it disqualifies, and it damages credibility when someone checks.",
    choices: [
      { text: "It is as inaccurate as claiming the condition disqualifies someone", isCorrect: true },
      { text: "It is too vague to be useful" },
      { text: "It is only wrong for organ donation, not tissue" },
      { text: "It is correct, but sounds dismissive" },
    ],
  },

  // M9
  {
    key: "chk-m9-01", scope: "CHECK", kind: "SINGLE", moduleSlug: "the-law",
    topicTag: "law", difficulty: 2,
    prompt: "Which three kinds of statement must an advocate keep distinct?",
    explanation: "Educational explanation, legal requirement and clinical guidance. Tangling them is how advocates end up misleading people.",
    choices: [
      { text: "Educational explanation, legal requirement, and clinical guidance", isCorrect: true },
      { text: "Fact, opinion, and speculation" },
      { text: "Medical, surgical, and nursing" },
      { text: "National, provincial, and hospital policy" },
    ],
  },
  {
    key: "chk-m9-02", scope: "CHECK", kind: "SINGLE", moduleSlug: "the-law",
    topicTag: "law", difficulty: 2,
    prompt: "Why should an old study guide not be treated as legally current?",
    explanation: "Legal requirements change. Anything legal must be verified against current authoritative sources before it is presented as fact.",
    choices: [
      { text: "Legal requirements change, so claims must be verified against current sources", isCorrect: true },
      { text: "Study guides are never legally accurate" },
      { text: "Only lawyers may read legislation" },
      { text: "The law differs in every province" },
    ],
  },
  {
    key: "chk-m9-03", scope: "CHECK", kind: "SINGLE", moduleSlug: "the-law",
    topicTag: "law", difficulty: 2,
    prompt: "What additional element does an unnatural death introduce?",
    explanation: "Additional legal requirements, and a forensic authority: the death must go for a medico-legal post-mortem, and the forensic pathologist decides which organs may be recovered. \u201cDistrict surgeon\u201d is out-of-date terminology for this role — it is the Forensic Pathology Service.",
    choices: [
      { text: "Forensic authorities and additional legal requirements", isCorrect: true },
      { text: "An automatic prohibition on donation" },
      { text: "The removal of the family's role entirely" },
      { text: "A requirement that donation happen faster" },
    ],
  },

  // M10
  {
    key: "chk-m10-01", scope: "CHECK", kind: "SINGLE", moduleSlug: "transplant-landscape",
    topicTag: "transplant-landscape", difficulty: 3,
    prompt: "Who decides whether someone is a transplant candidate?",
    explanation: "A specialist multidisciplinary team, applying judgement rather than a checklist.",
    choices: [
      { text: "A specialist multidisciplinary team", isCorrect: true },
      { text: "The patient's general practitioner" },
      { text: "The transplant coordinator" },
      { text: "The patient themselves" },
    ],
  },
  {
    key: "chk-m10-02", scope: "CHECK", kind: "TRUE_FALSE", moduleSlug: "transplant-landscape",
    topicTag: "transplant-landscape", difficulty: 3,
    prompt: "Contraindications to transplantation are fixed and have not changed over time.",
    explanation: "They are largely relative rather than absolute, and several have changed substantially as evidence and practice have moved.",
    choices: [
      { text: "True" },
      { text: "False", isCorrect: true },
    ],
  },
  {
    key: "chk-m10-03", scope: "CHECK", kind: "SINGLE", moduleSlug: "transplant-landscape",
    topicTag: "advocacy-integrity", difficulty: 2,
    prompt: "What practical lesson should an advocate draw from this module?",
    explanation: "Because selection is complex and changing, avoid stating exclusion rules confidently in public. Understanding the shape of the decision is enough.",
    choices: [
      { text: "Avoid stating exclusion rules confidently in public", isCorrect: true },
      { text: "Memorise the selection criteria for each organ" },
      { text: "Refer all questions to a transplant surgeon" },
      { text: "Explain prognostic scoring to anyone who asks" },
    ],
  },

  // M11
  {
    key: "chk-m11-01", scope: "CHECK", kind: "SINGLE", moduleSlug: "life-after-donation",
    topicTag: "after-transplant", difficulty: 2,
    prompt: "What does immunosuppression do?",
    explanation: "It reduces the risk of the body rejecting the graft, at the cost of its own risks. A trade-off rather than a fix.",
    choices: [
      { text: "Reduces the risk of rejection, while carrying its own risks", isCorrect: true },
      { text: "Cures rejection permanently" },
      { text: "Strengthens the immune system" },
      { text: "Replaces the need for follow-up" },
    ],
  },
  {
    key: "chk-m11-02", scope: "CHECK", kind: "SINGLE", moduleSlug: "life-after-donation",
    topicTag: "after-transplant", difficulty: 2,
    prompt: "Why is follow-up lifelong after a transplant?",
    explanation: "Because a transplant is an ongoing medical situation requiring continued medication and monitoring, not a completed repair.",
    choices: [
      { text: "A transplant is an ongoing medical situation, not a completed repair", isCorrect: true },
      { text: "Because rejection always eventually occurs" },
      { text: "For research purposes only" },
      { text: "Only for the first year after surgery" },
    ],
  },
  {
    key: "chk-m11-03", scope: "CHECK", kind: "SINGLE", moduleSlug: "life-after-donation",
    topicTag: "advocacy-integrity", difficulty: 2,
    prompt: "How should an advocate describe transplantation?",
    explanation: "Honestly. A transplant trades one serious medical situation for another, usually far better, one — and saying so is more persuasive than a happy ending.",
    choices: [
      { text: "Honestly, including what it costs the recipient", isCorrect: true },
      { text: "As a complete cure, to encourage registration" },
      { text: "As briefly as possible, to avoid discouraging people" },
      { text: "Only in clinical terms" },
    ],
  },

  // M12
  {
    key: "chk-m12-01", scope: "CHECK", kind: "SINGLE", moduleSlug: "art-of-the-conversation",
    topicTag: "conversation", difficulty: 3,
    prompt: "What is the most valuable thing an advocate can do at a grieving bedside?",
    explanation: "Not make it worse. This is a clinical and counselling conversation; acknowledgement and silence are legitimate contributions.",
    choices: [
      { text: "Acknowledge what they are going through, and not make it worse", isCorrect: true },
      { text: "Explain the clinical basis of brain death" },
      { text: "Describe how many people could be helped" },
      { text: "Ask about the patient's wishes" },
    ],
  },
  {
    key: "chk-m12-02", scope: "CHECK", kind: "SINGLE", moduleSlug: "art-of-the-conversation",
    topicTag: "conversation", difficulty: 3,
    prompt: "Why can mistrust rooted in inequity not be handled like a myth?",
    explanation: "Because it may be grounded in real experience. Labelling it a misconception dismisses that experience and ends the conversation.",
    choices: [
      { text: "It may be grounded in real experience, so dismissing it ends the conversation", isCorrect: true },
      { text: "Because it is always factually correct" },
      { text: "Because advocates are not allowed to discuss it" },
      { text: "Because it only arises in certain communities" },
    ],
  },
  {
    key: "chk-m12-03", scope: "CHECK", kind: "SINGLE", moduleSlug: "art-of-the-conversation",
    topicTag: "conversation", difficulty: 2,
    prompt: "Why should you never negotiate around a stated conviction?",
    explanation: "It signals you did not accept their answer the first time, and it costs you the relationship that makes any future conversation possible.",
    choices: [
      { text: "It signals you did not accept their answer, and costs you their trust", isCorrect: true },
      { text: "It is against Save7 policy" },
      { text: "It rarely produces a different answer" },
      { text: "It takes too long" },
    ],
  },

  {
    key: "chk-m12-04", scope: "CHECK", kind: "SINGLE", moduleSlug: "art-of-the-conversation",
    topicTag: "conversation", difficulty: 2,
    prompt: "Having completed this module, what does the FACTS strategy qualify you to do?",
    explanation: "Nothing operational. FACTS is a clinical strategy for transplant procurement coordinators. Understanding why it is structured as it is makes you a better advocate; it does not make you a consent-requester, and approaching a donor family is not an advocate's role.",
    choices: [
      { text: "Nothing — it helps you understand the professional conversation, not conduct it", isCorrect: true },
      { text: "Approach a potential donor family and request consent" },
      { text: "Assess whether a family has accepted a death" },
      { text: "Act as a transplant procurement coordinator in a hospital" },
    ],
  },
  {
    key: "chk-m12-05", scope: "CHECK", kind: "SINGLE", moduleSlug: "art-of-the-conversation",
    topicTag: "conversation", difficulty: 3,
    prompt: "FACTS builds in two deliberate time-out breaks. Why?",
    explanation: "Processing a death, and then deciding as a family, both take time and neither happens well under observation. The pauses are part of the method rather than gaps in it.",
    choices: [
      { text: "Families need space to absorb the death, and then to decide privately", isCorrect: true },
      { text: "To give the clinical team time to prepare the theatre" },
      { text: "Because coordinators are required to take breaks" },
      { text: "To create urgency so the family decides sooner" },
    ],
  },
  // M13
  {
    key: "chk-m13-01", scope: "CHECK", kind: "SINGLE", moduleSlug: "become-a-save7-advocate",
    topicTag: "conversation", difficulty: 1,
    prompt: "What is the one action this course asks you to take?",
    explanation: "Talk to your own family, and tell them what you would want. Every module exists to make that sentence possible.",
    choices: [
      { text: "Talk to your own family about what you would want", isCorrect: true },
      { text: "Sign up as a Save7 volunteer" },
      { text: "Share the course on social media" },
      { text: "Register as an organ donor a second time" },
    ],
  },
  {
    key: "chk-m13-02", scope: "CHECK", kind: "SINGLE", moduleSlug: "become-a-save7-advocate",
    topicTag: "conversation", difficulty: 1,
    prompt: "Complete the Save7 position: whether for campaigns or a private conversation, the most important part is…",
    explanation: "…simply starting the conversation.",
    choices: [
      { text: "simply starting the conversation", isCorrect: true },
      { text: "getting the medical facts exactly right" },
      { text: "reaching as many people as possible" },
      { text: "encouraging registration on the spot" },
    ],
  },
];

export const questionSeeds: QuestionSeed[] = [
  ...preQuestions,
  ...postBeginner,
  ...postIntermediate,
  ...postAdvanced,
  ...checkQuestions,
];
