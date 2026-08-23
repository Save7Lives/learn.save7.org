import { type LevelSeed } from "./types";

/**
 * 🔴 ADVANCED — "Become a Transplant Advocate"
 *
 * For Save7 volunteers and motivated learners. This is the only level where the
 * academic material becomes central rather than optional, which is the whole
 * point of the three-tier split: beginners never have to walk through it.
 *
 * Sources for this level:
 *   · Save7, "Transplant Alchemy 101 — Study Guide", Objective 4 (legislation)
 *   · Save7, "7 Lives in 7 Steps" (documentation and referral steps)
 *   · Excellence in Deceased Donation course manual (updated 2025), including the
 *     HPCSA guidance on informed consent and on palliative care
 *   · Mancini & Lietz (2010), Circulation 122(2):173–183
 *   · Weill et al. (2015), J Heart Lung Transplant 34(1):1–15
 *   · Porrett, Hsu & Shaked (2009), Liver Transplantation 15(S2):S12–S18
 *   · Han et al. (2017), Annals of Transplantation 22:17–23
 *
 * Two deliberate decisions in this level:
 *
 * 1. Module 10 is about **recipient** candidacy, not donor eligibility. Modules 1
 *    to 8 are about who can give; this module is about who can receive. Conflating
 *    the two would be a genuine error, so the distinction is stated explicitly.
 *
 * 2. Module 12 now teaches FACTS — the Family Approach to Consent for Transplant
 *    Strategy. The acronym, its Wits Transplant origin, its adaptation from the UK
 *    NHSBT model and its intended users (transplant procurement coordinators) are
 *    verified against de Jager et al., SAMJ 2019;109(9), which was read directly.
 *    That paper describes FACTS as a stepwise process but does not enumerate the
 *    steps. A numbered eight-step sequence, taken second-hand from the gated Organ
 *    and Tissue Donation Reference File, was removed on 23 August 2026: it could
 *    not be checked, and misstating another organisation's own clinical protocol is
 *    worse than teaching the reasoning without it. What remains rests on the
 *    published paper, and the staged walkthrough is labelled as Save7's teaching
 *    sequence rather than as the strategy itself.
 *
 *    The framing is deliberate and is a safety matter: FACTS is a clinical
 *    procurement strategy. The module teaches learners to understand why the
 *    professional conversation is structured as it is — never to conduct it. A
 *    course completion must not read as authorisation to approach a donor family.
 */
export const advancedLevel: LevelSeed = {
  slug: "advanced",
  tier: "ADVANCED",
  title: "Become a Transplant Advocate",
  strapline:
    "For Save7 volunteers and motivated learners who want a deeper understanding of the transplant landscape.",
  goal:
    "Develop a deeper understanding of the clinical, ethical, legal and communication landscape surrounding transplantation.",
  estMinMinutes: 60,
  estMaxMinutes: 90,
  accentToken: "advanced",
  certificateTitle: "Transplant Advocate",
  certificateCode: "A",
  passMarkPct: 70,
  modules: [
    // ---------------------------------------------------------------- M9
    {
      slug: "the-law",
      number: 9,
      title: "The Law",
      coreQuestion: "What does South African law actually say about organ donation?",
      introMarkdown:
        "Advocates get asked legal questions constantly. *Can my family override my wishes? Who has to consent? Does it cost anything?*\n\nThe governing law is **Chapter 8 of the National Health Act No. 61 of 2003**, with the operational detail in the **regulations made under it**. This module states the provisions as they appear in the Act itself, with the places where common donation material gets them wrong marked as you go — because several widely repeated \u201clegal facts\u201d about donation in South Africa are inaccurate, out of date, or belong to an Act repealed in 2003.\n\nOne caution stands. Legislation is amended, and a course is not legal advice: the provisions here still need confirmation against the current consolidated text by someone qualified to do it. Where this module is less certain, it says so.",
      estMinutes: 18,
      lessons: [
        {
          slug: "intro",
          title: "Why this matters",
          kind: "INTRO",
          bodyMarkdown:
            "Three kinds of statement get tangled together whenever donation is discussed, and an advocate who cannot separate them will eventually mislead someone:\n\n- **Educational explanation** — how the system generally works.\n- **Legal requirement** — what the law actually demands.\n- **Clinical guidance** — what good practice recommends.\n\nA worked example. *Two doctors must certify brain death* is a **legal requirement**. *They should ideally test together* is **clinical guidance** from the determination-of-death guidelines. *There is no legal duty to refer a potential donor* is a **legal fact** — and yet referral is strongly recommended practice. All three are true, and they are not the same kind of true.\n\nWhen you speak publicly, say which one you are giving.",
        },
        {
          slug: "legal-framework",
          title: "The legal framework",
          kind: "PRIMARY",
          componentKey: "PathwayJourney",
          payload: {
            intro:
              "The legal touchpoints in a donation, in roughly the order they arise.",
            showLossPoints: false,
            steps: [
              {
                id: "national-health-act",
                label: "The National Health Act",
                summary: "Chapter 8 of Act No. 61 of 2003.",
                detail:
                  "The primary legislation governing organ and tissue donation and transplantation in South Africa is Chapter 8 of the National Health Act No. 61 of 2003. The donation process itself is strictly regulated.\n\nTwo things are worth knowing precisely. First, the Act **defines death**: in section 1, *\u201cdeath\u201d means brain death*. That is not a clinical convention the law tolerates — it is the statutory definition.\n\nSecond, the detail sits one level down. Much of what advocates are asked about — how death is determined, who may authorise what — is set by the **regulations made under the Act**, chiefly the Regulations regarding the general control of human bodies, tissue, blood, blood products and gametes (GN R180, 2 March 2012). Citing \u201cChapter 8\u201d for a rule that actually lives in the regulations is a common and avoidable error.",
              },
              {
                id: "referral",
                label: "Referral — no legal duty",
                summary: "The one place where the law is silent, and it matters.",
                detail:
                  "There is **no legal requirement** for the referral of a potential donor. The process that follows a referral is tightly regulated, but whether a referral happens at all depends on a clinician choosing to make it.\n\nThis is why clinical awareness matters so much. A missed referral breaks no law, and still costs a life.",
              },
              {
                id: "brain-death-certification",
                label: "Brain-death certification",
                summary: "Who may certify, and what qualifies them.",
                detail:
                  "**Regulation 9** of the 2012 regulations — not Chapter 8 itself — sets the requirement, under the heading *Establishment of death*. Its words are worth having exactly:\n\n> The death of a person concerned shall be established by **at least two medical practitioners**, one of whom shall have been **practising as a medical practitioner for at least five years after the date on which she or he was registered**, and **none of those medical practitioners shall transplant tissue removed from that person into a living person or take part in such transplantation**.\n\nThree things follow. It is *at least* two, not exactly two. The five years runs from registration, for one of them. And the exclusion is written as an activity, not a job title — the doctors who establish death may not be the ones who transplant the tissue or take part in it. That independence is the point of the whole rule: the people who decide a patient has died must have nothing to gain from the organs.\n\n**One exception, and it surprises people.** The same regulation provides that where the tissue is **eye tissue**, death is deemed established by the issuing of a death certificate by a medical practitioner. Corneal donation does not need the two-practitioner procedure, which is part of why it is operationally so much simpler than organ donation.\n\nOn **time of death**, the South African guidelines on the determination of death are specific: it is recorded at the confirmatory examination — the moment the arterial paCO\u2082 reaches the target during apnoea testing with no spontaneous breath, confirmed by both doctors. Not the moment donation is discussed, and not the moment the heart stops.",
                verifiedAgainst:
                  "Regulation 9 of GN R180, Government Gazette 35099 of 2 March 2012, read verbatim from the gazette; and the National Health Act 61 of 2003 in a consolidated text carrying amendment annotations (Department of Health)",
              },
              {
                id: "consent",
                label: "Informed consent",
                summary: "Who may give it.",
                detail:
                  "Section 62 works in two layers, and the order matters.\n\n**The person themselves, first.** Someone competent to make a will may donate their body or specified tissue in a will, in a document signed before two competent witnesses, or in an **oral statement made before two competent witnesses**.\n\n**Relatives, only in the absence of that.** Where the person made no donation and gave no contrary direction while alive, section 62(2) allows the following to donate, **in this specific statutory order**: **spouse, partner, major child, parent, guardian, major brother, major sister**.\n\nThree details advocates routinely get wrong. A **partner** is included, and ranks above every relative except a spouse. *Major* means adult — a minor child or sibling cannot consent. And the Act sets a **priority order**, so \u201cthe family\u201d is not a single undifferentiated group.\n\nHPCSA guidance on informed consent governs the standard: sufficient information, room for questions, and a genuinely voluntary decision. Consent that was not understood is not informed consent, which is why translators are treated as a safeguard rather than a convenience.",
              },
              {
                id: "family-override",
                label: "Can a family override a donor?",
                summary: "The question advocates are asked most — and the honest answer has two halves.",
                detail:
                  "**In law:** a donation validly made under section 62(1) stands. Relatives acquire the power to donate only *in the absence of* a donation, or where the person gave a contrary direction while alive. On the face of the statute, a registered decision is the person\u2019s own to make.\n\n**In practice:** South African hospitals approach the family in every case, and a family refusal is respected. Legal scholarship describes exactly this gap between the Act and hospital practice, and treats it as a real weakness in how donor autonomy is protected here.\n\nBoth halves must be said together. Telling someone \u201cyour family cannot override you\u201d is wrong as a description of what will happen. Telling them \u201cregistering is pointless\u201d is wrong as a description of the law, and it also destroys the single most useful thing registration does: it tells your family what you wanted, at the moment they are least able to guess.\n\nSo the accurate advocacy line is the practical one. **Register, and then tell your family** \u2014 because the conversation, not the register, is what your family will be asked to act on.",
                verifiedAgainst:
                  "National Health Act s 62(1)-(2), read from a consolidated text: relatives may donate only in the absence of a donation by the person or a contrary direction given while alive. The gap between that and hospital practice — families are approached in every case and a refusal is respected — is documented in South African legal scholarship (Slabbert & Venter, 'Autonomy in organ donations v family consent: A South African legislative context', De Jure, 2019) and in the transplant literature.",
              },
              {
                id: "unnatural-deaths",
                label: "Unnatural deaths",
                summary: "An additional authority enters the process.",
                detail:
                  "Where death is due to unnatural causes — a motor vehicle accident, for example — the death **must** be referred for a medico-legal (forensic) post-mortem. That duty comes from **section 66(1)(c)** of the National Health Act together with **section 3 of the Inquests Act 58 of 1959**, and it is not waivable by the family.\n\nDonation is still possible, but recovery needs the **authorisation of the forensic pathologist**, who decides which organs may be taken without compromising the medico-legal examination. Family consent alone is not enough.\n\nA note on terminology: older material refers to the *district surgeon*. That office no longer performs this function — medico-legal post-mortems moved to the **Forensic Pathology Service** under the Department of Health. Saying \u201cdistrict surgeon\u201d in public dates the speaker and invites correction.\n\nSave7's own referral pathway — its internal procedure, not a legal requirement — records that an unnatural death requires an FPS 100 form, with the forensic pathology service contacted to determine which organs may be recovered and a SAPS liaison available where there is uncertainty. A natural death instead requires the DHA1663-B1163 form, which must accompany the donor.",
              },
              {
                id: "hospital-authorisation",
                label: "Hospital authorisation",
                summary: "Institutional permission to recover, in writing.",
                detail:
                  "The Act names an office, and it is not the one older material names. Authorisation comes from the **medical practitioner in charge of clinical services** at the hospital or authorised institution — or another medical practitioner authorised by them — in writing (sections 58(1)(b) and 66(2)). Where there is no such practitioner, one authorised by the person in charge of the institution may act.\n\n*Medical superintendent* belongs to the repealed Human Tissue Act of 1983. It is still in circulation in donation material, and it is out of date.",
              },
              {
                id: "costs",
                label: "Costs",
                summary: "The reassurance families most need — stated carefully.",
                detail:
                  "**A donor family does not pay for the donation.** The costs of recovering organs and tissue are carried by the hospital or tissue bank, from the point consent is given. This is the position stated by the Organ Donor Foundation and by the tissue banks, and it is what happens in practice.\n\nSay it that way, rather than as a citation. What the Act itself does say is narrower and about something else: section 60 prohibits trading in human tissue, and it is an **offence** for a donor to receive any financial or other reward for a donation, beyond reimbursement of reasonable costs actually incurred. That is the anti-trafficking rule, not a rule allocating hospital bills.\n\nSo: *\u201cthe donation itself costs the family nothing\u201d* is safe and true. *\u201cThe National Health Act says your medical aid cannot be charged\u201d* is a claim this course cannot support, and Save7\u2019s legal reviewer should confirm the exact source before anyone says it from a platform. The family still pays for the care the patient received before death, as they would for any hospital admission.",
                verifiedAgainst:
                  "Checked to conclusion: the National Health Act (consolidated) and the gazetted regulations GN R180 of 2 March 2012 were both searched, and neither allocates the costs of donation. The Act's only money provisions are s 60 (payment for tissue; reimbursement of a donor's reasonable expenses) and the regulations' equivalents. The practice statement is the Organ Donor Foundation's, quoted from its FAQs: the donor and their family incur no costs because the hospital or tissue bank covers the medical expenses of the donation from the moment consent is given.",
              },
              {
                id: "citizenship",
                label: "Who may receive an organ",
                summary: "A restriction most people have never heard of.",
                detail:
                  "Section 61(3): an organ **may not be transplanted into a person who is not a South African citizen or permanent resident without the Minister\u2019s written authorisation**.\n\nWorth knowing because it answers a question advocates are asked in a suspicious tone — whether South African organs go to foreign patients who can pay. Allocation is also governed by section 61(1) and (2), which require organs to be used and allocated in the prescribed manner rather than at any one clinician\u2019s discretion.",
              },
              {
                id: "palliative-context",
                label: "Withdrawal of treatment",
                summary: "The ethical framework behind donation after circulatory death.",
                detail:
                  "Donation after circulatory death arises in palliative settings where life-sustaining treatment is withdrawn. HPCSA ethical guidance on palliative care covers the withholding and withdrawal of treatment, patient autonomy, and advance care planning — the decision to withdraw is made on its own merits, entirely separately from any question of donation.",
              },
            ],
          },
        },
        {
          slug: "takeaways",
          title: "Key takeaways",
          kind: "TAKEAWAYS",
          componentKey: "TakeawayList",
          payload: {
            takeaways: [
              {
                id: "t1",
                text: "Chapter 8 of the National Health Act No. 61 of 2003 is the governing legislation, and the Act defines death as brain death. Much of the operational detail is in the 2012 regulations made under it, not in the Act itself.",
              },
              {
                id: "t2",
                text: "There is no legal requirement to refer a potential donor — but the donation process itself is strictly regulated.",
              },
              {
                id: "t3",
                text: "Regulation 9 of the 2012 regulations requires two doctors to determine death, one having practised for at least five years since registration, and neither may be on the transplant team.",
              },
              {
                id: "t4",
                text: "Time of death is recorded at the confirmatory examination, when the apnoea test target is reached with no spontaneous breath and both doctors confirm it.",
              },
              {
                id: "t5",
                text: "A person may donate in a will, a document signed before two witnesses, or an oral statement before two witnesses. Only in the absence of that may relatives donate, in the statutory order: spouse, partner, major child, parent, guardian, major brother, major sister.",
              },
              {
                id: "t6",
                text: "An unnatural death must go for a forensic post-mortem (s 66(1)(c); Inquests Act s 3), and recovery needs the forensic pathologist\u2019s authorisation. Institutional authorisation comes from the medical practitioner in charge of clinical services — not a \u201cmedical superintendent\u201d, which is repealed-Act language.",
              },
              {
                id: "t7",
                text: "The donation itself costs the family nothing — the hospital or tissue bank carries it. Say that as practice, not as statute: the Act\u2019s payment section prohibits trading in tissue, it does not allocate donation costs.",
              },
              {
                id: "t8",
                text: "Separate educational explanation, legal requirement and clinical guidance whenever you speak — and refer what you cannot answer confidently.",
              },
            ],
          },
        },
        { slug: "check", title: "Check your understanding", kind: "CHECK" },
        {
          slug: "study-guide",
          title: "Study guide",
          kind: "STUDY_GUIDE",
          payload: {
            summary:
              "Objective 4 of the Save7 study guide: understand the basic legislation surrounding organ donation.",
            sections: [
              {
                id: "s1",
                heading: "The legislation",
                bullets: [
                  "The primary legislation is Chapter 8 of the National Health Act No. 61 of 2003",
                  "The Act defines death: in section 1, \u201cdeath\u201d means brain death",
                  "Operational detail sits in the regulations made under the Act — chiefly GN R180 of 2 March 2012 — not in Chapter 8 itself",
                  "There is no legal requirement for the referral of a potential donor, but the donation process itself is strictly regulated",
                ],
              },
              {
                id: "s2",
                heading: "Certification of death",
                bullets: [
                  "Regulation 9 of the 2012 regulations requires death to be determined by two doctors",
                  "One must have practised as a medical practitioner for at least five years after the date of registration",
                  "Neither may be a member of the transplant team — the independence requirement is the purpose of the rule",
                  "Time of death is recorded at the confirmatory examination, when the apnoea test target is reached with no spontaneous breath and both doctors confirm it",
                ],
              },
              {
                id: "s3",
                heading: "Consent and authorisation",
                bullets: [
                  "A person may donate in a will, in a document signed before two competent witnesses, or in an oral statement before two competent witnesses (s 62(1))",
                  "Only in the absence of such a donation, or where a contrary direction was given while alive, may relatives donate (s 62(2))",
                  "The statutory order is spouse, partner, major child, parent, guardian, major brother, major sister — a partner ranks above all relatives but a spouse, and \u201cmajor\u201d means adult",
                  "An unnatural death must be referred for a forensic post-mortem (s 66(1)(c); Inquests Act 58 of 1959, s 3), and recovery requires the forensic pathologist\u2019s authorisation",
                  "Institutional authorisation comes in writing from the medical practitioner in charge of clinical services, or another practitioner authorised by them (ss 58(1)(b), 66(2))",
                  "An organ may not be transplanted into a non-citizen or non-permanent-resident without the Minister\u2019s written authorisation (s 61(3))",
                ],
              },
              {
                id: "s4",
                heading: "Costs",
                body: "The donation itself costs the donor family nothing: the hospital or tissue bank carries the cost of recovery from the point of consent. State this as the position of the Organ Donor Foundation and the tissue banks — which is what it is — rather than as a provision of the Act.\n\nWhat the Act does say is different in kind. Section 60 prohibits trading in human tissue and makes it an offence for a donor to receive any reward beyond reimbursement of reasonable costs actually incurred. That is an anti-trafficking rule, not a rule about who pays hospital bills. No cost-allocation provision was found in the Act or in the 2012 regulations, so the legal basis for the stronger claim needs to come from Save7\u2019s legal reviewer.",
              },
              {
                id: "s5",
                heading: "What this module was checked against",
                body: "Every provision in this module was read in the primary sources, not taken from a summary: the **National Health Act 61 of 2003** in a consolidated text carrying amendment annotations, and the **gazetted regulations** themselves — Government Notice R180, *Government Gazette* 35099 of 2 March 2012.\n\nThat check corrected six statements this module used to make, all of them inherited from older donation material:\n\n- the consent hierarchy, which has a statutory order, includes **partners**, and requires **adult** relatives;\n- the source of the two-practitioner rule, which is **Regulation 9**, not Chapter 8;\n- the claim that neither doctor may be an intern, which appears nowhere in the regulation;\n- \u201cstate pathologist or district surgeon\u201d, an office that no longer performs this function;\n- \u201cmedical superintendent\u201d, which is language from the Human Tissue Act repealed in 2003;\n- and the claim that the Act makes the donor\u2019s medical aid, estate and family free of costs *by law*, for which no provision exists in either the Act or the regulations.\n\n**What that does not mean.** A course is not legal advice, and legislation is amended. If a provision here is ever load-bearing for a real decision, check it against the gazette on the day — and if you are asked something this module does not cover, refer it rather than reconstructing it.",
                verifiedAgainst:
                  "National Health Act 61 of 2003, consolidated text with amendment annotations (Department of Health), and GN R180 in Government Gazette 35099 of 2 March 2012, both read directly. Supporting analysis: Thomson & Labuschaigne, SAJBL 2024;17(1); McQuoid-Mason, SAMJ 2012;102(9); Slabbert & Venter, De Jure 2019.",
              },
            ],
          },
        },
        {
          slug: "further-reading",
          title: "Further reading",
          kind: "FURTHER_READING",
          componentKey: "ResourceList",
          payload: {
            intro: "The statute and the professional guidance that sits alongside it.",
            note: "Save7 should add a link to the current consolidated text of the Act.",
          },
        },
        { slug: "complete", title: "Complete module", kind: "COMPLETE" },
      ],
    },

    // ---------------------------------------------------------------- M10
    {
      slug: "transplant-landscape",
      number: 10,
      title: "The Transplant Landscape",
      coreQuestion: "How are transplant candidates actually selected and assessed?",
      introMarkdown:
        "This is the most clinical module in the course, and it is here rather than in Beginner for a reason: nobody needs it to start a conversation.\n\n**One distinction before you begin.** Everything up to now has been about who can *give*. This module is about who can *receive*. Donor eligibility and recipient candidacy are different questions with different criteria, and conflating them is one of the easiest mistakes to make in public.",
      estMinutes: 20,
      lessons: [
        {
          slug: "intro",
          title: "Why this matters",
          kind: "INTRO",
          bodyMarkdown:
            "Candidate selection is genuinely hard, genuinely contested, and genuinely changing. Mancini and Lietz put it plainly: *patients with comorbidities who in the past would not be suitable transplantation candidates are now often considered for transplantation.*\n\nThat is worth understanding for its own sake, and it is also the strongest possible reason to avoid stating exclusion rules with confidence in public.\n\nIt is also worth knowing what transplantation achieves at the top end. One-year survival after cardiac transplantation approaches **90%**, and half of recipients survive more than **11 years**. Those numbers are why the shortage matters.",
        },
        {
          slug: "heart-transplantation",
          title: "Heart transplantation",
          kind: "PRIMARY",
          componentKey: "EligibilityMatrix",
          payload: {
            intro:
              "Heart transplant candidacy, as an in-depth example of how recipient assessment works. Note how few factors are truly absolute — and remember these are criteria for *receiving* a heart, not for donating one.",
            bottomLine:
              "Most contraindications to heart transplantation are relative, not absolute, and have shifted as evidence has changed. Candidate selection is a specialist multidisciplinary judgement — which is exactly why an advocate should not attempt it.",
            factors: [
              {
                id: "indications",
                factor: "Who is considered",
                commonAssumption: '"A transplant is offered whenever the heart is failing."',
                reality:
                  "Heart failure is progressive, and only a minority reach the point where transplantation is considered — around 5% to 10% of heart failure patients have advanced, stage D disease. In the most advanced phase, transplantation has been the only means of improving both quality of life and survival.",
                verdict: "depends",
              },
              {
                id: "life-expectancy",
                factor: "Other systemic illness",
                commonAssumption: '"Any other serious illness rules you out."',
                reality:
                  "An absolute contraindication is a systemic illness with a life expectancy under two years *despite* a transplant — the question is whether the transplant would actually change the outcome.",
                verdict: "depends",
              },
              {
                id: "malignancy",
                factor: "Cancer history",
                commonAssumption: '"Any history of cancer is an absolute bar."',
                reality:
                  "There is no five-year rule in current guidance. The 2024 ISHLT guideline recommends individualised risk stratification with oncology, and supports transplantation where malignancy-related survival will not affect post-transplant survival and recurrence risk is low given tumour type, response to therapy and a negative metastatic evaluation.",
                verdict: "depends",
                verifiedAgainst:
                  "ISHLT Guidelines for the Evaluation and Care of Cardiac Transplant Candidates, 2024, read directly",
              },
              {
                id: "hiv",
                factor: "HIV",
                commonAssumption: '"HIV is an absolute contraindication."',
                reality:
                  "HIV is not the contraindication. *Uncontrolled* HIV is. The 2024 ISHLT guideline advises against transplantation where there is opportunistic infection or HIV-related malignancy, no stable antiretroviral regimen, a detectable viral load, or a low CD4 count \u2014 and considers candidates with an undetectable viral load and a CD4 count above 200. A criterion far narrower than the public assumption, and worth stating precisely rather than reassuringly.",
                verdict: "rarely-absolute",
                verifiedAgainst:
                  "ISHLT Guidelines for the Evaluation and Care of Cardiac Transplant Candidates, 2024, read directly",
              },
              {
                id: "renal",
                factor: "Renal dysfunction",
                commonAssumption: '"Kidney problems make a heart transplant impossible."',
                reality:
                  "Irreversible renal dysfunction is an absolute contraindication only for patients being considered for a heart transplant alone. Creatinine above 2.5 mg/dL, or creatinine clearance below 25 mL/min, is listed among the relative contraindications.",
                verdict: "depends",
              },
              {
                id: "obesity",
                factor: "Body mass index",
                commonAssumption: '"Weight is an automatic exclusion."',
                reality:
                  "Both obesity and cachexia are weighed, not decisive. Older guidance published cut-offs (BMI above 35, below 18); the 2024 guideline treats body mass as one comorbidity assessed alongside the others, which is why an advocate should name the factor and never the number.",
                verdict: "rarely-absolute",
              },
              {
                id: "pulmonary",
                factor: "Lung function",
                commonAssumption: '"Only the heart matters for a heart transplant."',
                reality:
                  "Significant obstructive pulmonary disease and fixed pulmonary hypertension appear among the absolute contraindications; severe pulmonary dysfunction with FEV1 below 40% of normal is relative. The rest of the body has to be able to support the new heart.",
                verdict: "depends",
              },
              {
                id: "substance-use",
                factor: "Smoking, alcohol and drug use",
                commonAssumption: '"They just won\'t give organs to people who smoke."',
                reality:
                  "Drug, tobacco or alcohol abuse within six months is a relative contraindication — a window, not a permanent bar. Psychosocial stability is assessed for the same reason: a transplant requires lifelong medication adherence.",
                verdict: "rarely-absolute",
              },
              {
                id: "mcs",
                factor: "Mechanical circulatory support",
                commonAssumption: '"It\'s transplant or nothing."',
                reality:
                  "Mechanical circulatory support means transplantation is not always the only option in advanced heart failure. It can bridge a patient toward transplantation, or serve as a destination therapy in its own right.",
                verdict: "depends",
              },
            ],
          },
        },
        {
          slug: "other-solid-organs",
          title: "Lung, kidney, liver and pancreas",
          kind: "PRIMARY",
          componentKey: "ComparePanel",
          payload: {
            intro:
              "How recipient candidacy differs across organs. The lung column draws on the ISHLT consensus document, which is unusually direct about age.",
            columns: [
              { id: "lung", label: "Lung", emphasis: true },
              { id: "kidney", label: "Kidney" },
              { id: "liver", label: "Liver" },
              { id: "pancreas", label: "Pancreas" },
            ],
            rows: [
              {
                id: "indications",
                label: "Main indications",
                cells: {
                  lung: "Advanced lung disease such as COPD or cystic fibrosis, with a risk of death exceeding 50% over two years.",
                  kidney: "End-stage renal disease (CKD 5).",
                  liver: "Hepatocellular carcinoma, decompensated cirrhosis, fulminant hepatic failure.",
                  pancreas: "Diabetes no longer manageable with insulin, often alongside kidney failure.",
                },
              },
              {
                id: "age",
                label: "Age",
                cells: {
                  lung: "No upper age limit is endorsed as an absolute contraindication, and age alone is not one. The 2021 ISHLT consensus treats age as a risk factor rather than a threshold: the categorical \u201cover 65 with low reserve\u201d rule belongs to the 2006 and 2014 versions. Candidates over 65 are now more than 30% of the United States waiting list and the age group with the highest transplant rate, though survival falls beyond about 70.",
                  kidney: "Assessed as part of overall candidacy.",
                  liver: "Assessed as part of overall candidacy.",
                  pancreas: "Assessed as part of overall candidacy.",
                },
                verifiedAgainst:
                  "Leard LE, et al. Consensus document for the selection of lung transplant candidates: an update from the ISHLT. J Heart Lung Transplant 2021;40(11):1349-1379, read directly",
              },
              {
                id: "malignancy",
                label: "Cancer history",
                cells: {
                  lung: "Malignancy with a high risk of recurrence or death is an absolute contraindication, and every candidate has age-appropriate and disease-specific cancer screening with confirmation that there is no residual or metastatic disease. Note what current guidance does *not* say: the fixed \u201ctwo years clear, five to be safe\u201d intervals come from the superseded 2014 document, and the 2021 update assesses recurrence risk individually instead.",
                  kidney: "Assessed individually.",
                  liver: "Hepatocellular carcinoma can itself be an indication, within defined limits — the Milan criteria: one lesion up to 5 cm, or up to three each up to 3 cm, with no macrovascular invasion.",
                  pancreas: "Assessed individually.",
                },
                verifiedAgainst:
                  "Leard LE, et al. ISHLT consensus for the selection of lung transplant candidates. J Heart Lung Transplant 2021;40(11):1349-1379, read directly (malignancy with high recurrence risk absolute; fixed disease-free intervals dropped); ISHLT Guidelines for the Evaluation and Care of Cardiac Transplant Candidates 2024 (individualised risk stratification with oncology, no fixed interval); Milan criteria for hepatocellular carcinoma",
              },
              {
                id: "obesity",
                label: "Body mass index",
                cells: {
                  lung: "Class I obesity (BMI 30.0–34.9), particularly truncal, is a relative contraindication.",
                  kidney: "Assessed individually.",
                  liver: "Assessed individually.",
                  pancreas: "Assessed individually.",
                },
              },
              {
                id: "living-donation",
                label: "Living donation possible?",
                cells: {
                  lung: "Not in routine South African practice.",
                  kidney: "Yes — the most common form of living donation.",
                  liver: "Yes — a liver segment.",
                  pancreas: "No.",
                },
              },
            ],
            bottomLine:
              "Age by itself is not a contraindication to transplantation. What matters is physiological reserve and the comorbidities that tend to accompany age — which is why these decisions are made by teams, at the time, and not by rules of thumb.",
          },
        },
        {
          slug: "takeaways",
          title: "Key takeaways",
          kind: "TAKEAWAYS",
          componentKey: "TakeawayList",
          payload: {
            takeaways: [
              {
                id: "t1",
                text: "Donor eligibility and recipient candidacy are different questions. This module is about who receives.",
              },
              {
                id: "t2",
                text: "Most contraindications are relative rather than absolute, and several have moved as evidence has moved.",
              },
              {
                id: "t3",
                text: "Age by itself is not considered a contraindication to transplantation — it is physiological reserve and accompanying comorbidities that matter.",
              },
              {
                id: "t4",
                text: "Public assumptions are often far broader than the actual criterion. HIV is not a bar to a heart transplant; uncontrolled HIV is — the 2024 guideline looks for a stable antiretroviral regimen, an undetectable viral load and a CD4 count above 200.",
              },
              {
                id: "t5",
                text: "Mechanical circulatory support means transplantation is not always the only option in advanced heart failure.",
              },
              {
                id: "t6",
                text: "Outcomes are good: one-year survival after cardiac transplantation approaches 90%, and half of recipients survive beyond 11 years.",
              },
              {
                id: "t7",
                text: "You are not expected to reproduce any of this in public. Understanding its shape is enough — and it is the reason to avoid confident exclusion claims.",
              },
            ],
          },
        },
        { slug: "check", title: "Check your understanding", kind: "CHECK" },
        {
          slug: "study-guide",
          title: "Study guide",
          kind: "STUDY_GUIDE",
          payload: {
            summary:
              "Recipient candidacy across the solid organs. Advanced reading — not required knowledge for an advocate.",
            sections: [
              {
                id: "s1",
                heading: "Heart — the shape of the decision",
                body: "Around 5–10% of heart failure patients have advanced, stage D disease. One-year survival after cardiac transplantation approaches 90%, with 50% of patients surviving beyond 11 years. Patients with comorbidities who would previously have been unsuitable are now often considered.",
              },
              {
                id: "s2",
                heading: "Heart — where transplantation is not recommended",
                body: "The 2024 ISHLT guideline does not publish a list of absolute bars. It assesses comorbidities individually, and reserves \u201cnot recommended\u201d for situations where a transplant cannot achieve its purpose. Two examples it names: active infection requiring ongoing antibiotic treatment (an infected durable LVAD excepted), and HIV that is *uncontrolled* \u2014 opportunistic infection or related malignancy, no stable antiretroviral regimen, a detectable viral load, or a low CD4 count.\n\nRead the second one carefully, because it is the opposite of the public assumption. HIV is not the bar. Uncontrolled HIV is. Candidates with an undetectable viral load and a CD4 count above 200 are considered.\n\nThis section previously carried a fixed list \u2014 including \u201cmalignancy within five years\u201d and \u201cAIDS with frequent opportunistic infections\u201d \u2014 taken from guidance now two revisions old. It was removed because current guidance explicitly moved away from that approach.",
                verifiedAgainst:
                  "ISHLT Guidelines for the Evaluation and Care of Cardiac Transplant Candidates, 2024, read directly",
              },
              {
                id: "s3",
                heading: "Heart — the factors actually assessed",
                body: "The 2024 guideline structures candidacy around comorbidities considered one at a time and together: age, obesity, cancer, diabetes, cerebral and peripheral vascular disease, pulmonary disease, pulmonary hypertension, kidney disease, liver disease, connective tissue disease and sarcoidosis, infections and vaccination status, and psychosocial factors including substance use.\n\nOn a history of cancer specifically, it recommends collaboration with oncology for individualised risk stratification, and supports transplantation where malignancy-related survival will not affect post-transplant survival and recurrence risk is low given tumour type, response to therapy and a negative metastatic evaluation. There is no arbitrary interval to clear.\n\nThe thresholds an older version of this page listed \u2014 BMI above 35, creatinine above 2.5 mg/dL, FEV1 below 40% \u2014 are the kind of number that changes between guideline revisions. Advocates should name the factors, never the cut-offs.",
                verifiedAgainst:
                  "ISHLT Guidelines for the Evaluation and Care of Cardiac Transplant Candidates, 2024, read directly",
              },
              {
                id: "s4",
                heading: "Lung — age and malignancy",
                body: "No upper age limit is endorsed as an absolute contraindication, and age alone is not one \u2014 though older candidates have worse long-term survival, and the decline is measurable beyond about 70. The 2021 ISHLT update explicitly notes that the categorical \u201cover 65 with low physiologic reserve\u201d rule was the 2006 and 2014 position, and replaces it with a framework of interacting risk factors. Candidates over 65 are now more than 30% of the United States waiting list.\n\nOn malignancy: a cancer with a high risk of recurrence or death is an absolute contraindication, and every candidate undergoes age-appropriate and disease-specific screening with confirmation of no residual or metastatic disease. The fixed \u201ctwo years clear, five to be prudent\u201d intervals are from the superseded 2014 document and were removed from this page.\n\nThe wider point for an advocate: the 2021 update states that far fewer absolute contraindications exist now than when earlier versions were written. Any list of exclusions you were taught is probably already out of date.",
                verifiedAgainst:
                  "Leard LE, et al. Consensus document for the selection of lung transplant candidates: an update from the ISHLT. J Heart Lung Transplant 2021;40(11):1349-1379, read directly",
              },
            ],
          },
        },
        {
          slug: "further-reading",
          title: "Further reading",
          kind: "FURTHER_READING",
          componentKey: "ResourceList",
          payload: {
            intro:
              "The primary literature behind this module. Advanced reading — the course is complete without it.",
            note: 'Anything marked "Opens here" is the paper Save7 supplied.',
          },
        },
        { slug: "complete", title: "Complete module", kind: "COMPLETE" },
      ],
    },

    // ---------------------------------------------------------------- M11
    {
      slug: "life-after-donation",
      number: 11,
      title: "Life After Donation",
      coreQuestion: "What happens to the recipient after the transplant?",
      introMarkdown:
        "Public conversation about donation tends to stop at the operating theatre, as though transplantation were an ending.\n\nFor the recipient it is a beginning. Understanding what follows — the medication, the monitoring, the possibility of complications years later — makes you a more honest advocate, and it makes the gift you are describing more real.",
      estMinutes: 16,
      lessons: [
        {
          slug: "intro",
          title: "Why this matters",
          kind: "INTRO",
          bodyMarkdown:
            "Overselling transplantation does the cause no favours. A transplant is not a cure and it is not a return to how things were before; it trades one serious medical situation for another, usually far better, one.\n\nSaying that plainly is more persuasive than a happy ending, and it respects recipients' actual experience. It also means you will not be caught out — because a learner who has been told transplantation is a cure will eventually meet someone whose experience says otherwise.\n\nThe honest version is still a good story: one-year survival after a heart transplant approaches 90%, and half of recipients live beyond eleven years. Those years come with daily medication and regular monitoring.",
        },
        {
          slug: "the-recipient-journey",
          title: "The recipient's journey",
          kind: "PRIMARY",
          componentKey: "PathwayJourney",
          payload: {
            intro: "What follows a transplant, over days, months and years.",
            showLossPoints: false,
            steps: [
              {
                id: "transplantation",
                label: "The transplant operation",
                summary: "Major surgery, with a recovery period to match.",
                detail:
                  "The operation itself is the part everyone pictures, and clinically it is the most predictable stage of the whole journey.",
              },
              {
                id: "immunosuppression",
                label: "Immunosuppression",
                summary: "Lifelong medication, with real trade-offs.",
                detail:
                  "The recipient's immune system will recognise the transplanted organ as foreign. Immunosuppressive medication prevents it from rejecting the graft — and by design leaves the recipient more vulnerable to infection.\n\nThis is the central trade of transplantation: a functioning organ in exchange for a managed, lifelong compromise of the immune system. Advances in immunosuppression are a large part of why survival figures have improved so much.",
              },
              {
                id: "rejection",
                label: "Rejection",
                summary: "Monitored for, and often treatable.",
                detail:
                  "Rejection is why follow-up is lifelong rather than a courtesy. It is monitored for deliberately, and an episode of rejection does not automatically mean the graft is lost — it means treatment changes.",
              },
              {
                id: "early-complications",
                label: "Early complications",
                summary: "The first weeks and months.",
                detail:
                  "Surgical and infectious complications are concentrated early, when immunosuppression is heaviest and the surgery is fresh.",
              },
              {
                id: "late-complications",
                label: "Late complications",
                summary: "Months and years later — the part nobody expects.",
                detail:
                  "Complications do not stop once a recipient goes home. In liver transplantation, **biliary strictures and incisional hernias are the most common late surgical complications**.\n\nThe detail shows how ongoing this care is. Anastomotic biliary strictures can usually be managed endoscopically and rarely need surgery. A biliary stricture requires the hepatic artery to be checked, because the two are connected. Ischaemic-type intrahepatic strictures are a common reason for re-transplantation. And recipients of living-related grafts, or grafts donated after circulatory death, are at the highest risk of late biliary and vascular complications.",
              },
              {
                id: "graft-survival",
                label: "Long-term graft survival",
                summary: "Grafts last a long time. They do not last forever.",
                detail:
                  "Survival varies by organ and by person. For hearts, half of recipients survive beyond eleven years. Some recipients will eventually need a second transplant — which is one reason the donor shortage compounds over time.",
              },
              {
                id: "follow-up",
                label: "Lifelong follow-up",
                summary: "Why the medical relationship never really ends.",
                detail:
                  "Medication adherence, monitoring for rejection, and watching for late complications continue indefinitely. This is also why psychosocial stability appears in candidate selection: a transplant asks a great deal of the person who receives it.",
              },
            ],
          },
        },
        {
          slug: "takeaways",
          title: "Key takeaways",
          kind: "TAKEAWAYS",
          componentKey: "TakeawayList",
          payload: {
            takeaways: [
              {
                id: "t1",
                text: "Transplantation is the start of a lifelong medical journey, not a cure.",
              },
              {
                id: "t2",
                text: "Immunosuppression prevents rejection and increases vulnerability to infection. It is a trade, not a fix.",
              },
              {
                id: "t3",
                text: "Rejection is monitored for and often treatable. An episode does not automatically mean losing the graft.",
              },
              {
                id: "t4",
                text: "Complications can appear years later. In liver transplantation, biliary strictures and incisional hernias are the most common late surgical complications.",
              },
              {
                id: "t5",
                text: "Recipients of living-related or circulatory-death grafts carry the highest risk of late biliary and vascular complications.",
              },
              {
                id: "t6",
                text: "Grafts do not last forever, and some recipients need a second transplant — so the shortage compounds.",
              },
              {
                id: "t7",
                text: "Describe transplantation honestly. Overselling it damages credibility and misrepresents recipients' lives.",
              },
            ],
          },
        },
        { slug: "check", title: "Check your understanding", kind: "CHECK" },
        {
          slug: "study-guide",
          title: "Study guide",
          kind: "STUDY_GUIDE",
          payload: {
            summary: "What follows a transplant.",
            sections: [
              {
                id: "s1",
                heading: "Immunosuppression and rejection",
                body: "Immunosuppressive medication prevents the recipient's immune system from rejecting the graft, at the cost of increased vulnerability to infection. It continues for life. Rejection is monitored for, and an episode does not automatically mean the graft is lost.",
              },
              {
                id: "s2",
                heading: "Late complications after liver transplantation",
                bullets: [
                  "Biliary strictures and incisional hernias are the most common late surgical complications",
                  "Anastomotic biliary strictures are amenable to endoscopic intervention and rarely require surgery",
                  "The presence of a biliary stricture mandates evaluation of hepatic artery patency",
                  "Ischaemic-type intrahepatic strictures are a common indication for re-transplantation",
                  "Recipients of living-related liver transplants and of grafts donated after circulatory death are at highest risk: reported stricture incidence is 5–15% after deceased-donor transplantation against 28–32% after right-lobe living-donor surgery",
                ],
                verifiedAgainst:
                  "Checked against the peer-reviewed biliary-complication literature: strictures are the most frequent late biliary complication (about 46% of biliary complications, anastomotic strictures about 40%); endoscopic management is the preferred approach; hepatic artery thrombosis is an established risk factor, which is why arterial patency is assessed when a stricture is found; and donation after circulatory death and living donation are both risk factors — reported stricture incidence is 5-15% after deceased-donor transplantation against 28-32% after right-lobe living-donor surgery.",
              },
              {
                id: "s3",
                heading: "Graft survival",
                body: "Varies by organ and by individual. One-year survival after cardiac transplantation approaches 90%, with half of recipients surviving beyond eleven years. Some recipients will require re-transplantation.",
              },
              {
                id: "s4",
                heading: "Why this matters to an advocate",
                body: "Describing transplantation accurately — including its costs — is more persuasive than presenting it as a cure, and it respects the actual experience of recipients.",
              },
            ],
          },
        },
        {
          slug: "further-reading",
          title: "Further reading",
          kind: "FURTHER_READING",
          componentKey: "ResourceList",
          payload: {
            intro: "Advanced reading on late outcomes.",
            note: 'Anything marked "Opens here" is the paper Save7 supplied.',
          },
        },
        { slug: "complete", title: "Complete module", kind: "COMPLETE" },
      ],
    },

    // ---------------------------------------------------------------- M12
    {
      slug: "art-of-the-conversation",
      number: 12,
      title: "The Art of the Conversation",
      coreQuestion: "How do I handle the hardest conversations, with people in real distress?",
      introMarkdown:
        "Module 4 taught you to talk to a friend over coffee. This module is about the conversations that are genuinely difficult: grief, family disagreement, deep mistrust, and beliefs you do not share.\n\nThese are the conversations where good intentions are not enough, and where an advocate can do real harm.",
      estMinutes: 20,
      lessons: [
        {
          slug: "intro",
          title: "Five things that hold under pressure",
          kind: "INTRO",
          bodyMarkdown:
            "Two rules carry most of the weight here.\n\n**You are not a counsellor.** Recognising when a conversation has moved beyond your role — and stopping — is a skill, not a failure.\n\n**You are never obliged to win.** Someone in acute grief who feels respected by you may reconsider months later. Someone who feels pressured will not.\n\nBeyond that, five principles come directly out of the source material rather than out of intuition:\n\n1. **Decouple.** The death and the donation are separate conversations. A family must understand and accept a death before donation is raised — and it is raised by a coordinator, not by whoever delivered the news.\n2. **Do not rush.** In a single-centre study of 107 brain-dead potential donors, families who took 48 hours or more to decide consented at 73% (11 of 15), against 55% (51 of 92) among those who decided sooner — the authors\u2019 conclusion being that a delayed decision was *not inferior*, not that delay improves consent. The delayed group is small, and the study is not South African. Read it for what it supports: delay is not refusal, and patience costs nothing.\n3. **Patience and empathy are the method, not the garnish.** Accepting a diagnosis of death by neurological criteria genuinely takes time, and the guidelines make room for it — that is what *accommodation* means.\n4. **Do not assume.** It should never be assumed that because someone comes from a particular ethnic, cultural or spiritual background, donation should not be raised. That assumption removes their choice before it is offered.\n5. **The conversation has value either way.** Discussing donation as part of end-of-life care helps families independent of what they decide. You are not only recruiting donors.\n\n> **Where these come from.** The next lesson walks through **FACTS** — the Family Approach to Consent for Transplant Strategy used by transplant coordinators in South Africa. Its published account names planning, interpreters, facilitating the family's own discussion and a donor pause; the staged walkthrough there is Save7's way of teaching that reasoning, not the strategy's own protocol. Several of the principles above are visible in it. Note carefully: FACTS is a clinical strategy for procurement coordinators, and this course teaches you to *understand* it, not to perform it.",
        },
        {
          slug: "hard-conversations",
          title: "Five hard conversations",
          kind: "PRIMARY",
          componentKey: "ScenarioDialogue",
          payload: {
            intro:
              "None of these has a clean answer. Choose the response you think does least harm and most good, then read why.",
            scenarios: [
              {
                id: "s1",
                speaker: "A family at the bedside",
                quote: "She's still warm. Her heart is beating. You're asking us to give up on her.",
                whatsReallyHappening:
                  "The family is being asked to accept something that contradicts what they can see and touch. This is the hardest moment in the entire donation pathway.",
                reflectPrompt: "What should you absolutely not do here?",
                options: [
                  {
                    id: "o1",
                    text: "Explain that brain death is legally and medically death, and that the ventilator is what is keeping her heart beating.",
                    quality: "poor",
                    feedback:
                      "The facts are right and the timing is wrong. A family in this moment cannot absorb a clinical explanation, and leading with one reads as correcting their grief. This explanation belongs to the clinical team.",
                  },
                  {
                    id: "o2",
                    text: "\"I can't imagine how impossible this feels. Nobody is asking you to give up on her.\" Then stop talking, and let them lead.",
                    quality: "strong",
                    feedback:
                      "Correct. It acknowledges the reality of what they are experiencing, gently rejects the framing of 'giving up', and then makes space. Silence is a legitimate and often the best contribution here.",
                  },
                  {
                    id: "o3",
                    text: "Ask whether they would like to talk to the doctors again, or have someone from their faith community with them.",
                    quality: "strong",
                    feedback:
                      "Excellent, and it maps onto how this is actually done: the consultant and coordinator may involve a faith representative or hospital chaplain precisely to support families here. You are connecting them to the right people rather than substituting for them.",
                  },
                  {
                    id: "o4",
                    text: "Point out gently that she would want to help others if she could.",
                    quality: "poor",
                    feedback:
                      "This puts words in the patient's mouth at the family's most vulnerable moment. It will be experienced as pressure, and it can permanently damage trust in everyone present.",
                  },
                ],
                debrief:
                  "This is a clinical and counselling conversation, not an advocacy one. It is also why decoupling exists: the family must be allowed to absorb the death before donation is raised at all, and support is deliberately not withdrawn immediately. The guidelines even have a name for the time this takes — accommodation.",
              },
              {
                id: "s2",
                speaker: "Two siblings, disagreeing in front of you",
                quote:
                  "He never said anything about this. — He did, he told me years ago. — Well he never told me.",
                whatsReallyHappening:
                  "A family with no shared knowledge of the person's wishes. The disagreement is often about far more than donation.",
                reflectPrompt: "Whose side are you on?",
                options: [
                  {
                    id: "o1",
                    text: "Support the sibling who says he wanted to donate — they have the relevant information.",
                    quality: "poor",
                    feedback:
                      "Taking a side inside a grieving family is not your role, and it will fracture the conversation entirely.",
                  },
                  {
                    id: "o2",
                    text: "\"It sounds like this is something you need to work out together, and there's no rush from me. Would it help to have someone from the team explain the options to you both at the same time?\"",
                    quality: "strong",
                    feedback:
                      "Refuses to arbitrate, removes time pressure you have no business applying, and offers a shared source of information so both siblings hear the same thing. The evidence supports the patience: taking longer did not reduce consent.",
                  },
                  {
                    id: "o3",
                    text: "Explain who is legally entitled to consent, so they know where they stand.",
                    quality: "workable",
                    feedback:
                      "The legal position is real — consent comes from next of kin: spouse, parent, child, brother or sister. But delivered by an advocate in a live family dispute it reads as picking a winner. This is better coming from the coordinator.",
                  },
                  {
                    id: "o4",
                    text: "Suggest they think about what he would have wanted.",
                    quality: "workable",
                    feedback:
                      "Reasonable in principle, and it is exactly the question they are already fighting about. It rarely resolves anything in the moment.",
                  },
                ],
                debrief:
                  "This scenario is the clearest possible argument for Save7's whole premise. The disagreement exists because a conversation never happened — and because consent from next of kin is always required, that missing conversation is now doing real damage.",
              },
              {
                id: "s3",
                speaker: "A community member",
                quote: "People like us don't get organs. We only give them.",
                whatsReallyHappening:
                  "A statement about structural inequity and mistrust of the health system. It may well be grounded in real experience, and dismissing it would be both wrong and counterproductive.",
                reflectPrompt: "What makes this different from a factual misconception?",
                options: [
                  {
                    id: "o1",
                    text: "Reassure them that allocation is based on medical criteria, not on who you are.",
                    quality: "workable",
                    feedback:
                      "It may be accurate, but offered as a first response it sounds like a denial of their experience. Trust has to come before information.",
                  },
                  {
                    id: "o2",
                    text: "\"That's a fair thing to be suspicious about, and I'm not going to tell you your experience is wrong. Can I ask what you've seen that makes you say that?\"",
                    quality: "strong",
                    feedback:
                      "Takes the concern seriously as a legitimate position rather than an error to be fixed, and listens before responding. This is the only route to a real conversation here.",
                  },
                  {
                    id: "o3",
                    text: "Acknowledge that equity of access is a real problem in South African healthcare, and be honest about it, while explaining how allocation itself is meant to work.",
                    quality: "strong",
                    feedback:
                      "Honest on both counts — and it happens to align with how the professional guidance frames it: equity of access to donation support pathways is described as a crucial component of healthcare delivery. Conceding a real problem is what makes the rest of what you say believable.",
                  },
                  {
                    id: "o4",
                    text: "Point out that they might need a transplant themselves one day.",
                    quality: "poor",
                    feedback:
                      "Self-interest framing on top of an equity concern will land as manipulative, and it sidesteps what they actually said.",
                  },
                ],
                debrief:
                  "Mistrust grounded in real inequity is not a myth and cannot be corrected like one. Worth knowing: donation is possible from all communities and cultures in South Africa, and it should never be assumed that someone's background means the subject shouldn't be raised — the assumption itself is part of the inequity.",
              },
              {
                id: "s4",
                speaker: "An older relative",
                quote: "My body needs to be whole when it's buried. That's not negotiable for me.",
                whatsReallyHappening:
                  "A religious or cultural conviction about bodily integrity. This is a settled belief, not an information gap.",
                reflectPrompt: "What outcome should you be aiming for here?",
                options: [
                  {
                    id: "o1",
                    text: "Explain that recovery is done surgically and the body is restored to its original state, so burial is not usually affected.",
                    quality: "workable",
                    feedback:
                      "The fact is correct and genuinely reassuring to many people — the body is restored afterwards. But offered unprompted against a stated conviction, it reads as an attempt to talk them out of it. Offer it if they ask.",
                  },
                  {
                    id: "o2",
                    text: "\"I hear you, and I'm not going to try to change that. Thank you for telling me clearly.\"",
                    quality: "strong",
                    feedback:
                      "Accepting a settled position gracefully is a legitimate and successful outcome. It also keeps the relationship intact for every future conversation.",
                  },
                  {
                    id: "o3",
                    text: "Accept their position, and ask whether they've told the rest of the family so nobody has to guess on their behalf.",
                    quality: "strong",
                    feedback:
                      "The best available answer. It fully respects their decision and still achieves Save7's actual goal — a family that knows. Since consent comes from next of kin, a clearly communicated 'no' prevents an agonising guess later.",
                  },
                  {
                    id: "o4",
                    text: "Ask whether tissue donation might be more acceptable than organ donation.",
                    quality: "poor",
                    feedback:
                      "Negotiating around a stated conviction about bodily integrity. It signals that you did not accept their answer the first time.",
                  },
                ],
                debrief:
                  "A clearly communicated refusal is a good outcome for Save7. The failure mode is not 'no' — it is a family left guessing. And there is evidence the conversation itself helps families regardless of the decision they reach.",
              },
              {
                id: "s5",
                speaker: "Someone at a Save7 event",
                quote:
                  "So how many organs actually get transplanted in South Africa each year? What's the real number?",
                whatsReallyHappening:
                  "A direct factual question where a confident guess would be tempting — and where the honest answer requires you to know how old your figures are.",
                reflectPrompt: "What is the professional answer?",
                options: [
                  {
                    id: "o1",
                    text: "Give your best recollection of the figure, with a caveat that you're not certain.",
                    quality: "poor",
                    feedback:
                      "A half-remembered statistic becomes the thing they repeat to other people. The caveat does not travel with it.",
                  },
                  {
                    id: "o2",
                    text: "Give the figures you know with their date attached — \"between 2010 and 2019 there were 2 416 kidney transplants and 292 heart transplants\" — and offer to get the current numbers from the Organ Donor Foundation.",
                    quality: "strong",
                    feedback:
                      "This is the professional answer. You have given real figures, dated them honestly so nobody mistakes a decade total for last year, and pointed to the body that maintains the current numbers.",
                  },
                  {
                    id: "o3",
                    text: "Redirect to the point that the number is far lower than the need, without quoting a figure.",
                    quality: "workable",
                    feedback:
                      "Honest and usable, and it answers the underlying point. Better still if you follow up with dated figures.",
                  },
                  {
                    id: "o4",
                    text: "Explain that statistics vary by source and year, so a single number is misleading.",
                    quality: "workable",
                    feedback:
                      "True, but it can sound evasive. Pair it with the dated figures you do have.",
                  },
                ],
                debrief:
                  "Advocates are trusted because they are careful. Always date a statistic. The figures in this course are decade totals for 2010–2019 from the Organ Donor Foundation — useful, and not the same thing as current annual numbers.",
              },
            ],
          },
        },
        {
          slug: "understanding-the-donation-conversation",
          title: "Understanding the donation conversation",
          kind: "PRIMARY",
          componentKey: "PathwayJourney",
          payload: {
            intro:
              "When a family in South Africa is asked about donation, the conversation usually follows a structured process called **FACTS** — the Family Approach to Consent for Transplant Strategy, developed at Wits Transplant and adapted from the UK's NHS Blood and Transplant model.\n\n**Read this before you go any further.** FACTS is a clinical strategy for transplant procurement coordinators. Completing this course does not qualify you to approach a family or to request consent, and this lesson is not training to do either. You are here to understand *why* the professional conversation is built this way — because the reasoning behind it also makes you better at the conversations that genuinely are yours to have.\n\nWalk through the stages below. They are Save7\u2019s teaching sequence, built from the elements the published account of FACTS describes rather than a reproduction of the strategy itself. For each one, note the principle underneath it.",
            steps: [
              {
                id: "f1",
                label: "Planning",
                summary: "Before anyone speaks to the family, the approach is prepared.",
                detail:
                  "Who should be in the room. When. Where. In which language. What the family already knows. None of this is left to the moment.\n\n**The principle:** the conversations that go worst are the ones nobody thought about first. Setting, timing and language are not details — they are most of the outcome.",
              },
              {
                id: "f2",
                label: "Breaking bad news",
                summary: "The family is told, and helped to understand, that the person has died.",
                detail:
                  "This step is about the death and nothing else. Donation is not mentioned. A family that has not yet grasped that their person has died cannot meaningfully consider anything else.\n\n**The principle:** this is decoupling, and it is the reason it matters. It is not a technique for improving consent rates — it is what makes a decision a real decision.",
              },
              {
                id: "f3",
                label: "Time-out break",
                summary: "The family is deliberately left alone.",
                detail:
                  "A pause is built into the process. Not an accident, not a gap while staff are busy elsewhere — a designed interval before donation is raised at all.\n\n**The principle:** silence and space are part of the method. If a formal clinical strategy schedules them, you can stop treating a pause in your own conversation as a failure to fill.",
              },
              {
                id: "f4",
                label: "Assessing understanding and acceptance of loss",
                summary: "Before donation is raised, someone checks what the family actually understands.",
                detail:
                  "Not whether they were told. What they understood, and whether they accept it. Families sitting beside a warm body with a beating heart very often have not — and that is not stubbornness, it is the situation contradicting the information.\n\n**The principle:** never assume that being told is the same as understanding. Check, gently, before you build on anything.",
              },
              {
                id: "f5",
                label: "The consent conversation",
                summary: "Donation is introduced. Concerns are heard, questions answered.",
                detail:
                  "Only now. The coordinator raises donation, then mostly listens — surfacing concerns, answering what is asked, giving accurate information in a supportive way. It is not a pitch.\n\n**The principle:** listening comes before informing, and information is offered rather than pushed. This is the step most people imagine the whole conversation to be, and it is one of eight.",
              },
              {
                id: "f6",
                label: "Time-out break",
                summary: "A second deliberate pause, so the family can talk among themselves.",
                detail:
                  "The family is left to discuss it without a professional present. A decision that has to be made in front of the person asking for it is not a free one.\n\n**The principle:** people need to process without an audience. Do not stand there waiting for an answer.",
              },
              {
                id: "f7",
                label: "Final family discussion",
                summary: "The coordinator returns, asks for the decision, and respects it.",
                detail:
                  "Remaining concerns are addressed and the family's decision is taken as final. A no is accepted as an answer, not treated as an opening position.\n\n**The principle:** you are never obliged to win. A family who felt respected while declining is a better outcome than one who felt worked on.",
              },
              {
                id: "f8",
                label: "Family follow-up, feedback and support",
                summary: "Support continues after the decision, whatever it was.",
                detail:
                  "Follow-up after recovery, ongoing support, and where appropriate information about what happened to the donated organs.\n\n**The principle:** the family is not a means to an organ. The relationship does not end when the answer is given — which is also the difference between advocacy and recruitment.",
              },
            ],
          },
        },
        {
          slug: "takeaways",
          title: "Key takeaways",
          kind: "TAKEAWAYS",
          componentKey: "TakeawayList",
          payload: {
            takeaways: [
              {
                id: "t1",
                text: "You are not a counsellor. Knowing when to stop and refer is a skill, not a failure.",
              },
              {
                id: "t2",
                text: "Decouple. The death and the donation are separate conversations, and the second is not yours to start at the bedside.",
              },
              {
                id: "t3",
                text: "Do not rush a family. Taking longer than 48 hours was associated with higher consent, not lower.",
              },
              {
                id: "t4",
                text: "A clearly communicated 'no' is a good outcome. A family left guessing is the failure.",
              },
              {
                id: "t5",
                text: "Mistrust grounded in real inequity is not a myth and cannot be corrected like one.",
              },
              {
                id: "t6",
                text: "Never put words in a dead or dying person's mouth, and never negotiate around a stated conviction.",
              },
              {
                id: "t7",
                text: "Always date a statistic. \"2 416 kidney transplants between 2010 and 2019\" is useful; \"about 2 400 a year\" is wrong.",
              },
              {
                id: "t8",
                text: "Silence is a legitimate contribution. Sometimes it is the best one.",
              },
              {
                id: "t9",
                text: "FACTS is a coordinator's strategy, not a volunteer's script. Understanding why it is built that way is the point; performing it is not your role — and the stages taught here are Save7's way of explaining it, not the strategy's own protocol.",
              },
            ],
          },
        },
        { slug: "check", title: "Check your understanding", kind: "CHECK" },
        {
          slug: "study-guide",
          title: "Study guide",
          kind: "STUDY_GUIDE",
          payload: {
            summary: "Difficult conversations, and what the evidence supports.",
            sections: [
              {
                id: "s1",
                heading: "The five principles",
                bullets: [
                  "Decouple the diagnosis from the donation request",
                  "Do not rush — delay is not refusal, and may be associated with higher consent",
                  "Patience and empathy are the method; accommodation exists to give families time",
                  "Never assume someone's background means donation should not be raised",
                  "The conversation helps families regardless of the decision they reach",
                ],
              },
              {
                id: "s2",
                heading: "On grief",
                body: "Routine grief counselling is generally not indicated. Most bereaved people are resilient, and acute grief is integrated through a natural adaptive process supported by family, friends and spiritual support. Counselling is valuable for complicated grief. Bereaved people, especially those who have lost children, often find it very difficult to speak about the loss.",
              },
              {
                id: "s3",
                heading: "The limits of your role",
                body: "An advocate acknowledges, listens, connects people to the right sources, and stops. Clinical explanation belongs to the clinical team; the donation request belongs to a coordinator; matters of faith belong to the person's own faith leader.",
              },
              {
                id: "s4",
                heading: "FACTS — what it is, and what it is not",
                body: "FACTS stands for the **Family Approach to Consent for Transplant Strategy**. It was developed at Wits Transplant (Wits Donald Gordon Medical Centre, Johannesburg), adapted from the National Health Service Blood and Transplant model in the United Kingdom, and is described as a stepwise process guiding transplant procurement coordinators through initiating and following through the donation conversation — with particular attention to planning, choice of words and timing.\n\nIt is a professional procurement strategy. It is **not** a volunteer script, and completing this course does not make anyone a designated consent-requester. This module teaches the reasoning behind FACTS so that advocates understand why real donation conversations are structured as they are.\n\n**Does it work?** In the 18-month results published by the team that built it, the consent rate rose from 25% (n=6) to 73% (n=35) after FACTS was introduced, and referrals from targeted hospitals rose 54% (from 31 to 57). Those are the figures from the paper; note they are one centre\u2019s before-and-after, not a controlled trial.",
              },
              {
                id: "s5",
                heading: "How the conversation is structured",
                body: "**What the published account of FACTS actually contains.** The paper that describes it — de Jager et al., *SAMJ* 2019;109(9) — sets out a stepwise process for procurement coordinators and names its distinctive elements: careful **planning** of the approach, the use of an **interpreter** where language requires it, deliberate **facilitation of the family\u2019s own discussion**, and a **donor pause**. It reports the result too: consent rose from 25% to 73%, and referrals from targeted hospitals by 54%.\n\nWhat it does not do is enumerate a numbered sequence of steps. An earlier version of this page listed eight, taken second-hand from an internal reference file this course cannot obtain. Rather than reproduce someone else\u2019s clinical strategy from a source that could not be checked, the list has been removed — because misstating another organisation\u2019s own protocol is worse than teaching the reasoning without it.\n\n**The structure below is Save7\u2019s teaching sequence**, built from the elements the paper does document. It is a way of understanding why the professional conversation is shaped as it is. It is not a reproduction of FACTS, and it is not a script to follow.",
                verifiedAgainst:
                  "de Jager M, Wilmans C, Fabian J, Botha JF, Etheredge HR. Increasing deceased organ donor numbers in Johannesburg, South Africa: 18-month results of the Wits Transplant Procurement Model. SAMJ 2019;109(9):626-631 — read in full. The paper confirms the acronym, the Wits origin, the adaptation from the UK NHSBT model, the intended users, the named elements (planning, interpreter, family discussion, donor pause) and the outcome figures. It does not enumerate steps, so no numbered sequence is presented as the strategy's own.",
              },
              {
                id: "s6",
                heading: "What an advocate takes from it",
                bullets: [
                  "Do not rush the family",
                  "Make sure they understand the death before anything else",
                  "Allow time for processing, and leave people alone to do it",
                  "Listen before responding",
                  "Acknowledge concerns rather than correcting them",
                  "Provide accurate information without pressure",
                  "Respect the decision that is reached",
                  "Follow up afterwards, whatever was decided",
                ],
              },
            ],
          },
        },
        {
          slug: "further-reading",
          title: "Further reading",
          kind: "FURTHER_READING",
          componentKey: "ResourceList",
          payload: {
            intro: "The evidence behind the principles above.",
            note: "The FACTS strategy is described in the Wits Transplant Procurement Model paper below, which is where every claim this module makes about it comes from. The staged walkthrough in the lesson is Save7's teaching sequence built on that account, not a reproduction of the strategy's own protocol.",
          },
        },
        { slug: "complete", title: "Complete module", kind: "COMPLETE" },
      ],
    },

    // ---------------------------------------------------------------- M13
    {
      slug: "become-a-save7-advocate",
      number: 13,
      title: "Become a Save7 Advocate",
      coreQuestion: "What do I do with all of this?",
      introMarkdown:
        "You have reached the end of the pathway. This module is not new material — it is the point where everything you have learned becomes something you can use.\n\nThe test is simple, and it is the same one the course opened with: can you start the conversation?",
      estMinutes: 10,
      lessons: [
        {
          slug: "intro",
          title: "Where you started, and where you are now",
          kind: "INTRO",
          bodyMarkdown:
            "At the beginning of this course, the goal was stated plainly: to leave feeling *I understand organ donation and transplantation well enough to confidently start a conversation about it.*\n\nYou now know who is waiting, and that one donor can save seven lives and improve up to fifty more. You know where donations are lost, and that most of those losses are human rather than medical. You can explain that death is the irreversible loss of the capacity for consciousness and the capacity to breathe — and why the heart can still be beating. You know that two independent doctors certify brain death and neither may be on the transplant team. You know the statute is Chapter 8 of the National Health Act, that consent comes from next of kin, and that the family bears no costs. You know there is no age restriction for solid organ donation.\n\nAnd you have practised the conversation itself — including the versions of it that go badly.",
        },
        {
          slug: "what-you-can-now-do",
          title: "What you can now do",
          kind: "TAKEAWAYS",
          componentKey: "TakeawayList",
          payload: {
            takeaways: [
              {
                id: "t1",
                text: "Explain why people need donated organs and tissues, without medical jargon.",
              },
              {
                id: "t2",
                text: "Describe the South African donation pathway, and name the points where it breaks down.",
              },
              {
                id: "t3",
                text: "Explain brain death clearly, accurately and kindly — and distinguish it from a coma.",
              },
              {
                id: "t4",
                text: "Name who is involved in a donation, and which roles exist as safeguards.",
              },
              {
                id: "t5",
                text: "Answer the common legal questions: the Act, consent, unnatural deaths, and costs.",
              },
              {
                id: "t6",
                text: "Correct the six commonest myths without making anyone feel foolish.",
              },
              {
                id: "t7",
                text: "Avoid ruling anyone out — and know where firm criteria genuinely do exist.",
              },
              {
                id: "t8",
                text: "Describe life after transplantation honestly, including what it costs the recipient.",
              },
              {
                id: "t9",
                text: "Handle a hard conversation, and recognise when it is not yours to have.",
              },
              {
                id: "t10",
                text: "Date every statistic you quote.",
              },
              {
                id: "t11",
                text: "Encourage the people you love to tell each other what they want.",
              },
            ],
          },
        },
        {
          slug: "the-call-to-action",
          title: "Start the conversation",
          kind: "PRIMARY",
          bodyMarkdown:
            "There is one thing left to do, and it is not a Save7 campaign.\n\n**Talk to your own family.** Tonight, if you can. Not a presentation — a sentence. *I've been doing a course on organ donation, and I want you to know what I'd want.*\n\nThat is the whole thing. Every module in this course exists to make that sentence possible — and it matters because **consent from next of kin is always required**. Without that conversation, the people who love you are left guessing at the worst moment of their lives.\n\n> Whether it is for awareness campaigns or a private conversation with family and friends, the most important part is simply starting the conversation.\n\nOne decision can save seven lives. Yours starts with a conversation.",
        },
        { slug: "check", title: "Check your understanding", kind: "CHECK" },
        {
          slug: "study-guide",
          title: "Study guide",
          kind: "STUDY_GUIDE",
          payload: {
            summary:
              "A single page to keep. Save7 may wish to produce a designed version of this as an advocate reference card.",
            sections: [
              {
                id: "s1",
                heading: "The ten questions this course answered",
                bullets: [
                  "Who needs organs?",
                  "Why are organs being lost?",
                  "What is brain death?",
                  "How does donation work?",
                  "Who is involved?",
                  "What does South African law say?",
                  "Who can donate?",
                  "What happens after transplantation?",
                  "How do I talk about donation?",
                  "How can I become part of the solution?",
                ],
              },
              {
                id: "s2",
                heading: "The facts worth memorising",
                bullets: [
                  "One donor can save seven lives through organ donation, and improve up to fifty more through tissue and corneas — the figures the ODF and ORTIDA publish",
                  "Consent from next of kin is always required",
                  "Two registered doctors certify brain death; neither may be on the transplant team; one must have five years' HPCSA registration",
                  "Death is the irreversible loss of the capacity for consciousness and the capacity to breathe",
                  "There is no age restriction for solid organ donation",
                  "The body is restored to its original state after recovery, and anaesthesia is given during it",
                  "The family bears no costs once death is declared and consent obtained",
                  "The governing statute is Chapter 8 of the National Health Act No. 61 of 2003",
                ],
              },
              {
                id: "s3",
                heading: "The Save7 position",
                body: "Whether it is for awareness campaigns or a private conversation with family and friends, the most important part is simply starting the conversation.",
              },
            ],
          },
        },
        {
          slug: "further-reading",
          title: "Further reading",
          kind: "FURTHER_READING",
          componentKey: "ResourceList",
          payload: {
            intro: "Where to go next.",
            note: "Save7 may wish to add volunteer pathways and contact details here.",
          },
        },
        { slug: "complete", title: "Complete module", kind: "COMPLETE" },
      ],
    },
  ],
};
