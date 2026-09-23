/* -----------------------------------------------------------------------------
 * SUPERSEDED — salvage source only. Not the structure of the Course.
 *
 * The Course's structure is `./structure.ts`: three Levels, eleven Stages,
 * settled in wayfinder ticket #33 against CURRICULUM-ASSESSMENT-SPEC.md. The
 * thirteen modules below are the prior build's outline, which #26 established is
 * a *different curriculum*, not a relabeling — so none of their slugs carry over
 * and none of this is emitted as-is.
 *
 * It is kept, unedited, because ~9,000-10,000 of its ~20,800 authored words map
 * cleanly onto one of the eleven Stages. Each Stage's `intro.md` under `content/`
 * names which lessons here to draw on, what to cut, and what must be written from
 * scratch. The per-Level content tickets consume this file; when the last one
 * closes, delete it.
 *
 * Three whole modules have no home in the eleven Stages and were ruled out of
 * scope in #33: `transplant-landscape`, `life-after-donation` and
 * `become-a-save7-advocate`.
 * -------------------------------------------------------------------------- */

import { type LevelSeed } from "./types";

/**
 * 🟢 BEGINNER — "Start the Conversation"
 *
 * This level has to stand on its own. Someone who completes only this should be
 * able to say, honestly, "I understand organ donation and I feel comfortable
 * starting the conversation" — so it covers need, shortage, mechanism and
 * conversation, and stops deliberately short of clinical depth.
 *
 * Sources for this level:
 *   · Save7, "Transplant Alchemy 101 — Study Guide", Objectives 1, 2 and 5
 *   · SATCS, "The Organ and Tissue Donation Reference File" (the Red File)
 *   · Han et al. (2017), Annals of Transplantation 22:17–23
 *   · Excellence in Deceased Donation course manual (updated 2025)
 *
 * Statistics are decade totals for 2010–2019 as published by the Organ Donor
 * Foundation and reproduced in the Red File. They are date-stamped everywhere
 * they appear and flagged for Save7 to refresh, because an undated statistic
 * quietly becomes a wrong one.
 *
 * Checked August 2026: the ODF statistics page no longer publishes these figures
 * and now redirects to the South African Transplant Society. Current national
 * figures could not be obtained from ODF, SATS or IRODaT in that check, so
 * nothing here has been substituted — the decade totals stand, explicitly dated,
 * until Save7 supplies current ones. Secondary sources quote conflicting
 * waiting-list totals (figures around 2 780 and around 4 300 both circulate),
 * which is why no single number is stated as fact below.
 */
export const beginnerLevel: LevelSeed = {
  slug: "beginner",
  tier: "BEGINNER",
  title: "Start the Conversation",
  strapline: "For anyone who wants to understand the basics of organ donation.",
  goal:
    "Give you enough knowledge to confidently talk about organ donation with family, friends and the public.",
  estMinMinutes: 30,
  estMaxMinutes: 45,
  accentToken: "beginner",
  certificateTitle: "Conversation Starter",
  certificateCode: "B",
  passMarkPct: 70,
  modules: [
    // ---------------------------------------------------------------- M1
    {
      slug: "who-needs-organs",
      number: 1,
      title: "Who Needs Organs?",
      coreQuestion: "Why do people need donated organs and tissues?",
      introMarkdown:
        "Transplantation is easy to think about in the abstract. It is much harder to ignore once you know who is actually waiting.\n\nThis module puts people, not procedures, at the centre. Before we talk about how donation works, or why it so often does not, it is worth understanding what is at stake for someone in end-stage organ failure — and what a transplant actually gives back.",
      estMinutes: 8,
      lessons: [
        {
          slug: "intro",
          title: "Why this matters",
          kind: "INTRO",
          bodyMarkdown:
            "Most conversations about organ donation start in the wrong place — with death. This one starts with the people who are still alive, and waiting.\n\nOrgan and tissue transplantation is needed by patients with **end-stage organ failure**, to save their lives or significantly improve them. When an organ fails completely there is often no way to repair it. Treatment can buy time, sometimes a great deal of it, but for some conditions a transplant is the only remaining option.\n\n**Thousands of South Africans are on waiting lists** for lifesaving organ and tissue transplants. Published totals vary between sources, which is why this course says *thousands* rather than a number it cannot stand behind.\n\nThe rest of this course is about why so few of them receive one. This module is about who they are.",
        },
        {
          slug: "explore-organs-and-tissues",
          title: "What can be donated, and who needs it",
          kind: "PRIMARY",
          componentKey: "OrganExplorer",
          payload: {
            intro:
              "Select any organ or tissue to see why someone might need it, and what a transplant gives them back. Notice how wide the list is — donation is not only about hearts.",
            groups: [
              {
                id: "solid-organs",
                label: "Solid organs",
                caption:
                  "Recovered and transplanted within hours, and only from a clinical setting. These are the donations most people picture.",
                items: [
                  {
                    id: "kidney",
                    name: "Kidneys",
                    category: "Solid organ",
                    whyNeeded:
                      "End-stage renal disease — chronic kidney disease stage 5, where the kidneys can no longer filter the blood well enough to sustain life.",
                    restores:
                      "Freedom from dialysis, and protection from early death. This is the most commonly transplanted organ in South Africa: 2 416 kidney transplants between 2010 and 2019.",
                    note: "A kidney can also come from a living donor.",
                  },
                  {
                    id: "liver",
                    name: "Liver",
                    category: "Solid organ",
                    whyNeeded:
                      "Hepatocellular carcinoma, decompensated cirrhosis, or fulminant hepatic failure — liver disease that has passed the point of recovery.",
                    restores:
                      "Life itself. 593 South African patients were helped with liver transplants between 2010 and 2019.",
                    note: "A segment of liver can also come from a living donor.",
                  },
                  {
                    id: "heart",
                    name: "Heart",
                    category: "Solid organ",
                    whyNeeded:
                      "End-stage heart failure — typically NYHA class IV, often with an ejection fraction below 20%. The heart can no longer pump enough blood to sustain ordinary activity. (Transplant listing itself turns on exercise capacity, haemodynamics and risk scores rather than on an ejection-fraction cut-off.)",
                    restores:
                      "Years of active living. 292 hearts were transplanted in South Africa between 2010 and 2019.",
                  },
                  {
                    id: "lungs",
                    name: "Lungs",
                    category: "Solid organ",
                    whyNeeded:
                      "Advanced lung disease such as COPD or cystic fibrosis, where the risk of death exceeds 50% over the next two years.",
                    restores:
                      "The ability to breathe unaided. Lung transplantation remains rare here: 101 lungs transplanted between 2010 and 2019.",
                  },
                  {
                    id: "pancreas",
                    name: "Pancreas",
                    category: "Solid organ",
                    whyNeeded:
                      "Diabetes severe enough that insulin can no longer manage it well, often alongside kidney failure.",
                    restores:
                      "An end to insulin dependency.",
                  },
                ],
              },
              {
                id: "tissue",
                label: "Tissue",
                caption:
                  "Often left out of public conversation, and by volume the largest part of what donation achieves. In excess of 150 000 South Africans received tissue transplants between 2010 and 2019.",
                items: [
                  {
                    id: "corneas",
                    name: "Corneas",
                    category: "Tissue",
                    whyNeeded:
                      "Corneal damage or disease causing blindness. Note that poor eyesight or cataracts in the donor do not disqualify a cornea.",
                    restores:
                      "Sight. 1 911 patients had their sight restored by corneal transplants between 2010 and 2019.",
                    note: "Cornea donors are generally between 6 and 65 years old.",
                  },
                  {
                    id: "bone-ligaments",
                    name: "Bone and ligaments",
                    category: "Tissue",
                    whyNeeded:
                      "Bone loss or ligament damage from injury, disease or surgery.",
                    restores: "Mobility, and relief from pain.",
                    note: "Bone donors are typically healthy individuals between 16 and 80, without infectious disease or cancer.",
                  },
                  {
                    id: "skin",
                    name: "Skin",
                    category: "Tissue",
                    whyNeeded: "Severe burn injury.",
                    restores:
                      "Survival. Donated skin is what keeps a badly burned patient alive.",
                    note: "Skin donors are typically healthy individuals between 16 and 80, without infectious disease or cancer.",
                  },
                  {
                    id: "heart-valves",
                    name: "Heart valves",
                    category: "Tissue",
                    whyNeeded:
                      "Valve disease, including in children born with heart defects.",
                    restores: "Heart function.",
                    note: "Heart valve donors are eligible from 6 months up to 55 years of age.",
                  },
                ],
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
                text: "Transplantation is not an enhancement. For people in end-stage organ failure it saves or significantly improves life, and for some conditions it is the only remaining option.",
              },
              {
                id: "t2",
                text: "Thousands of South Africans are on waiting lists for organ and tissue transplants. Published totals differ between sources, so quote the scale rather than a figure.",
              },
              {
                id: "t3",
                text: "One donor can save seven lives through organ donation, and improve up to fifty more through tissue and corneas — the published South African figures, and where Save7's name comes from.",
                detail:
                  "This is where Save7's name comes from. The tissue figure is the part most people have never heard.",
              },
              {
                id: "t4",
                text: "Donation is far wider than hearts: kidneys, liver, heart, lungs and pancreas, plus corneas, bone, ligaments, skin and heart valves.",
              },
              {
                id: "t5",
                text: "By volume, tissue is the largest part of what donation achieves — in excess of 150 000 South Africans received tissue transplants between 2010 and 2019.",
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
              "Objective 1 of the Save7 study guide: understand who needs organs.",
            sections: [
              {
                id: "s1",
                heading: "End-stage organ failure",
                body: "Organ and tissue transplantation is required by patients with end-stage organ failure, to save or significantly improve their lives. Thousands of patients are on national waiting lists for lifesaving organ and tissue transplants; published totals vary between sources, so the scale is what to quote.\n\nRecipients include people needing hearts for years of active living, lungs to allow unaided breathing, and kidneys to save them from dialysis or early death. Patients with liver failure require transplants to restore life, and those needing a pancreas can eliminate insulin dependency.",
              },
              {
                id: "s2",
                heading: "Specific indications",
                bullets: [
                  "Kidney — end-stage renal disease (CKD 5)",
                  "Liver — hepatocellular carcinoma, decompensated cirrhosis, fulminant hepatic failure",
                  "Heart — end-stage heart failure, typically NYHA class IV, often with an ejection fraction below 20%",
                  "Lung — advanced lung disease such as COPD or cystic fibrosis, with a risk of death exceeding 50% over the next two years",
                  "Pancreas — to eliminate insulin dependency",
                ],
              },
              {
                id: "s3",
                heading: "Tissue transplantation",
                body: "Tissue transplants restore sight (corneas), increase mobility and reduce pain (bone and ligaments), save lives after severe burn injury (skin), and improve heart function (heart valves).",
              },
              {
                id: "s4",
                heading: "The impact of one donor",
                body: "One donor can save seven lives through organ donation, and improve up to fifty more through tissue donation — the figures the Organ Donor Foundation and ORTIDA both publish, and where Save7's name comes from. (An earlier version of this page said \u201c65 or more\u201d; that figure could not be sourced, and the published South African number is fifty.)",
                bullets: [
                  "2 416 kidneys transplanted (2010–2019)",
                  "593 patients helped with liver transplants (2010–2019)",
                  "292 hearts transplanted (2010–2019)",
                  "101 lungs transplanted (2010–2019)",
                  "1 911 patients had sight restored by corneal transplants (2010–2019)",
                  "In excess of 150 000 South Africans received tissue transplants (2010–2019)",
                ],
                verifiedAgainst:
                  "Organ Donor Foundation and ORTIDA published figures: one donor can save seven lives and enhance up to fifty more through tissue donation. The 2010–2019 decade totals remain as published by the ODF and are date-stamped; the ODF no longer hosts them, so Save7 should refresh them from SATS when current figures are available.",
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
              "Optional. The course is complete without these — they are here for learners who want the clinical detail behind the indications.",
            note: 'Anything marked "Opens here" is the document Save7 supplied.',
          },
        },
        { slug: "complete", title: "Complete module", kind: "COMPLETE" },
      ],
    },

    // ---------------------------------------------------------------- M2
    {
      slug: "why-are-we-losing-organs",
      number: 2,
      title: "Why Are We Losing Organs?",
      coreQuestion: "If so many people need organs, why aren't more organs reaching them?",
      introMarkdown:
        "This is the most important module in the course.\n\nSouth Africa does not have an organ shortage because donation is impossible. It has a shortage because the pathway from a potential donor to a transplanted recipient has many points at which it can quietly break — and most of those points are human, not medical.\n\nOnce you can see where donations are lost, you understand exactly why the conversation Save7 asks you to start actually matters.",
      estMinutes: 12,
      lessons: [
        {
          slug: "intro",
          title: "Why this matters",
          kind: "INTRO",
          bodyMarkdown:
            "It is tempting to explain the shortage with a single cause. The reality is a chain, and a chain fails at whichever link gives way first.\n\nA potential donor has to be identified. They have to be referred. Death has to be determined. A family has to be approached and asked to consent. Only then can recovery and transplantation follow.\n\nOne fact sits underneath all of it, and it is the single most useful thing you can carry out of this module:\n\n> **Consent from next of kin is always required for donation to proceed.**\n\nThat is why registering is not enough on its own. If your family has never heard you say what you want, they are being asked to guess — at the worst moment of their lives.",
        },
        {
          slug: "where-donations-are-lost",
          title: "Where donations are lost",
          kind: "PRIMARY",
          componentKey: "PathwayJourney",
          payload: {
            intro:
              "Walk the pathway a potential donation follows. At each step, open the loss points to see how a donation can be lost there.",
            showLossPoints: true,
            steps: [
              {
                id: "potential-donor",
                label: "Potential donor",
                summary: "Someone whose circumstances mean donation may become possible.",
                detail:
                  "Organ donation can only take place in a clinical setting — most often an intensive care unit, where a patient is on a mechanical ventilator. Tissue donation is broader, and can occur irrespective of the manner of death.",
                lossPoints: [
                  {
                    id: "no-awareness",
                    label: "Lack of awareness and ignorance of the process",
                    detail:
                      "If people have never considered donation, their families have nothing to go on when they are asked.",
                  },
                  {
                    id: "never-discussed",
                    label: "Registered donors never told their family",
                    detail:
                      "This is the loss point Save7 exists to address. Consent from next of kin is always required — so a registration nobody knows about cannot be acted on.",
                  },
                ],
              },
              {
                id: "identification",
                label: "Identification",
                summary: "A clinical team recognises that donation may be possible.",
                detail:
                  "Identification and referral are the responsibility of the primary treatment team — the doctors and nurses already caring for the patient — as part of end-of-life care.",
                lossPoints: [
                  {
                    id: "not-identified",
                    label: "Potential donors are never identified",
                    detail:
                      "Three triggers should prompt a referral in any ventilated patient: a decision has been made to perform brain death tests; there is a catastrophic brain injury with GCS 3–4 not explained by sedation, after a period of observation; or there is an intention to discuss withdrawal of life-sustaining treatment that is expected to result in circulatory death.",
                  },
                ],
              },
              {
                id: "referral",
                label: "Referral",
                summary: "The potential donor is referred to a transplant coordinator.",
                detail:
                  "There is no legal requirement to refer a potential donor. Referral happens because a clinician chooses to make it happen — which is exactly why awareness among clinical staff matters so much. Early referral lets the coordinator screen the patient, identify when donation is not feasible, and avoid delays for the family.",
                lossPoints: [
                  {
                    id: "not-referred",
                    label: "Failure to refer before death, or before treatment is withdrawn",
                    detail:
                      "Once the window closes it cannot be reopened. A referral made too late is the same as no referral at all.",
                  },
                ],
              },
              {
                id: "determination-of-death",
                label: "Determination of death",
                summary: "Death is formally determined, according to established criteria.",
                detail:
                  "Two independent doctors are legally required to certify brain death, and neither may be part of the transplant team. Module 6 covers the process in detail.",
                lossPoints: [
                  {
                    id: "brain-death-misunderstood",
                    label: "Brain death is misunderstood",
                    detail:
                      "Families may believe their relative is still alive because a ventilator is providing oxygen and the heart is still beating. If a family believes recovery is possible, no consent conversation can succeed.",
                  },
                ],
              },
              {
                id: "family-conversation",
                label: "Family conversation",
                summary: "The family is approached about donation.",
                detail:
                  "The diagnosis of death and the question of donation are deliberately kept apart. The family is told about the death first, and must understand and accept it, before donation is raised at all — usually by a transplant coordinator rather than the treating doctor. This separation is called decoupling.",
                lossPoints: [
                  {
                    id: "fear",
                    label: "Fear-based understandings",
                    detail:
                      "Fear does not respond to information delivered impatiently. It responds to being taken seriously.",
                  },
                  {
                    id: "myths",
                    label: "Myths and misunderstandings within communities",
                    detail: "Covered in the next lesson, with what is actually true.",
                  },
                  {
                    id: "cultural",
                    label: "Cultural and religious barriers",
                    detail:
                      "Donation is possible from all communities and cultures in South Africa. It should never be assumed that because a patient or family comes from a particular ethnic, cultural or spiritual background, a referral should not be made — that assumption removes the family's choice before they are given it.",
                  },
                  {
                    id: "timing",
                    label: "Being approached at an inappropriate time",
                    detail:
                      "Families who are approached before they have accepted the death, or who are rushed, are far more likely to refuse.",
                  },
                ],
              },
              {
                id: "consent",
                label: "Consent",
                summary: "Consent for donation is given or withheld by next of kin.",
                detail:
                  "Informed consent must be obtained from next of kin — a spouse, parent, child, brother or sister — or from a legal guardian. There is an ethical obligation to give every family the opportunity to make a fully informed decision, whichever way they decide.",
                lossPoints: [
                  {
                    id: "family-refusal",
                    label: "Family refusal",
                    detail:
                      "Families often say no because they never received factual information, or because they were asked at the wrong moment. A family that already knows their relative's wishes is not being asked to guess.",
                  },
                  {
                    id: "rushing",
                    label: "Rushing the decision",
                    detail:
                      "A single-centre study of 107 brain-dead potential donors found that families who took 48 hours or more to decide consented at 73% (11 of 15), compared with 55% (51 of 92) among those who decided sooner. The authors\u2019 own conclusion is the careful one: the delayed group was *not inferior*, not that waiting produces consent. The numbers in that subgroup are small and the setting is not South African — but it is a real argument for continuing to support a family rather than pressing them.",
                  },
                ],
              },
              {
                id: "recovery",
                label: "Recovery",
                summary: "Organs and tissues are surgically recovered.",
                detail:
                  "Recovery is performed in an operating theatre by trained teams, ethically and respectfully. Anaesthesia is given to the deceased to reduce the remaining physiologic response to surgery, and the body is restored to its original state afterwards.",
                lossPoints: [
                  {
                    id: "logistics",
                    label: "Logistical and resource constraints",
                    detail:
                      "Theatre availability, staffing and transport all have to align within a narrow window.",
                  },
                ],
              },
              {
                id: "transplantation",
                label: "Transplantation",
                summary: "A recipient receives the transplant.",
                detail:
                  "Long-term outcomes across the whole system improve when there is a larger pool of donors to allocate from — so every donation that is lost affects more than one person.",
                lossPoints: [],
              },
            ],
          },
        },
        {
          slug: "common-myths",
          title: "The myths that cost lives",
          kind: "PRIMARY",
          componentKey: "MythFlip",
          payload: {
            intro:
              "These are the beliefs that most often end a donation conversation. Turn each card over. You will meet all of them again in Module 4, where you practise responding.",
            cards: [
              {
                id: "m1",
                myth: "Doctors won't try as hard to save me if I'm a registered organ donor.",
                fact: "Two independent registered medical doctors are legally required to certify brain death, and neither of them may be part of the transplant team. The people caring for you and the people who would recover organs are deliberately kept separate — that separation is built into the law, not left to good intentions.",
                whyItPersists:
                  "It taps a real and reasonable fear: that someone else's interests could outweigh your own while you cannot speak for yourself.",
              },
              {
                id: "m2",
                myth: "I don't want doctors cutting me up after I'm dead.",
                fact: "Recovery is a surgical procedure carried out in an operating theatre with the same care as any other operation, and the body is restored to its original state afterwards. Anaesthesia is given to the deceased to reduce the remaining physiologic response to the surgery.",
                whyItPersists:
                  "This is rarely a factual objection. It is usually about dignity, and about protecting the body of someone loved.",
              },
              {
                id: "m3",
                myth: "My religion doesn't allow organ donation.",
                fact: "Donation is possible from all communities and cultures in South Africa, and a faith representative or hospital chaplain can be included to support a family during these discussions. What is not appropriate is for anyone else to decide what a person's faith permits on their behalf — including you.",
                whyItPersists:
                  "Assumptions about a faith's position are often inherited rather than checked. The honest response is to help someone find out, not to tell them what their faith says.",
              },
              {
                id: "m4",
                myth: "I'm too old or too sick to be a donor.",
                fact: "There is no age restriction for solid organ donation. Donors with conditions such as hypertension, diabetes or HIV may still be eligible if individual organs are assessed as transplantable. Module 8 covers this properly.",
                whyItPersists:
                  "People rule themselves out privately, and never mention it — so nobody ever gets the chance to correct them.",
              },
              {
                id: "m5",
                myth: "Brain death isn't really death — people wake up from comas.",
                fact: "There is no documented case of a person who met the preconditions and criteria for brain death ever subsequently regaining any brain function. A coma is a different state entirely, and recovery from a coma is possible. Module 6 separates the two carefully.",
                whyItPersists:
                  "Coma and brain death look similar from a bedside, and are constantly conflated in film and news reporting.",
              },
              {
                id: "m6",
                myth: "Donation will cost my family money.",
                fact: "By law, once brain death has been declared and consent obtained, the donor's medical aid, estate and next of kin are not responsible for any costs related to the donation.",
                whyItPersists:
                  "Families facing a sudden death are often already frightened about money, and nobody has told them otherwise.",
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
                text: "Consent from next of kin is always required. Registering records your wishes; telling your family is what makes them actionable.",
              },
              {
                id: "t2",
                text: "The shortage is a pathway problem. A donation can be lost at any step between a potential donor and a recipient, and most of those steps are human rather than medical.",
              },
              {
                id: "t3",
                text: "Families often refuse because they never received factual information, or because they were approached at the wrong moment — not because they are against donation.",
              },
              {
                id: "t4",
                text: "There is no legal requirement to refer a potential donor. Referral happens because someone chooses to make it happen.",
              },
              {
                id: "t5",
                text: "Taking longer to decide does not mean refusing. Families who took more than 48 hours consented at a higher rate, not a lower one.",
              },
              {
                id: "t6",
                text: "Never assume someone's culture, religion or background means donation shouldn't be raised. That assumption takes the choice away before it is offered.",
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
              "Objective 2 of the Save7 study guide: know where and why we are losing organs.",
            sections: [
              {
                id: "s1",
                heading: "Where and why organs are lost",
                bullets: [
                  "Lack of awareness and ignorance regarding the donation process",
                  "Fear-based understandings, cultural barriers, myths and misunderstandings within communities",
                  'Families automatically saying "no" because they never received factual information, or were approached at an inappropriate time',
                  "Registered donors not sharing their intentions with loved ones — consent from next of kin is always required",
                  "Misunderstanding brain death, such as believing a patient is still alive because a ventilator is providing oxygen",
                  "Concerns about body disfigurement during recovery surgery, despite the body being restored to its original state afterwards",
                  "In the clinical setting, failure to identify and refer a potential donor to a coordinator before death or before treatment is withdrawn",
                ],
              },
              {
                id: "s2",
                heading: "Referral triggers",
                body: "In any mechanically ventilated patient, a referral should be considered where a decision has been made to perform brain death tests; where there is a catastrophic brain injury with GCS 3–4 that cannot be explained by sedation, after a period of observation to allow prognostication; or where there is an intention to discuss withdrawal of life-sustaining treatment expected to result in circulatory death.",
              },
              {
                id: "s3",
                heading: "Decoupling",
                body: "The diagnosis of death and the request for donation are separated. The family is informed of the death and must understand and accept it before donation is raised, and the donation conversation is usually led by a transplant coordinator rather than the treating team.",
              },
              {
                id: "s4",
                heading: "Time is not the enemy",
                body: "Han et al. (2017) reviewed 107 brain-dead potential donors. The overall consent rate was 58%. Families deciding within 48 hours consented at 55%; those taking longer consented at 73%. Delay did not reduce consent, which supports continuing to counsel and support a family rather than pressing for an immediate answer.",
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
            intro: "The evidence behind this module.",
            note: 'Anything marked "Opens here" is the document Save7 supplied.',
          },
        },
        { slug: "complete", title: "Complete module", kind: "COMPLETE" },
      ],
    },

    // ---------------------------------------------------------------- M3
    {
      slug: "basics-of-organ-donation",
      number: 3,
      title: "The Basics of Organ Donation",
      coreQuestion: "What actually happens when someone becomes a donor?",
      introMarkdown:
        "You now know who is waiting, and where donations are lost. This module fills in the mechanism in between.\n\nIt stays deliberately simple. There are only four routes to donation, and knowing which is which is enough to answer most questions you will be asked in an ordinary conversation.",
      estMinutes: 10,
      lessons: [
        {
          slug: "intro",
          title: "Why this matters",
          kind: "INTRO",
          bodyMarkdown:
            "People do not usually ask advocates technical questions. They ask practical ones: *How does it actually work? Do you have to be dead? Can you donate while you're alive? What's the difference between organs and tissue?*\n\nThis module gives you clear answers to exactly those questions.\n\nTwo facts frame everything that follows. **Organ donation can only take place in a clinical setting** — in practice, an intensive care unit. And **early identification and good management of a potential donor are what make a successful donation possible**; a donation is not a single decision but a process that has to be supported from the beginning.",
        },
        {
          slug: "routes-to-donation",
          title: "The routes to donation",
          kind: "PRIMARY",
          componentKey: "ComparePanel",
          payload: {
            intro:
              "There are four routes to donation, and the differences matter. Compare them side by side.",
            columns: [
              {
                id: "dbd",
                label: "After brain death",
                caption: "Donation after brain death (DBD)",
                emphasis: true,
              },
              {
                id: "dcd",
                label: "After circulatory death",
                caption: "Donation after circulatory death (DCD)",
              },
              { id: "living", label: "Living donation", caption: "From a living donor" },
              { id: "tissue", label: "Tissue donation", caption: "Tissue rather than solid organs" },
            ],
            rows: [
              {
                id: "when",
                label: "When it happens",
                cells: {
                  dbd: "A patient on a mechanical ventilator is declared brain dead by two doctors.",
                  dcd: "In palliative care settings, where treatment is withdrawn and death is imminent.",
                  living: "While the donor is alive and well, by their own conscious decision.",
                  tissue: "Irrespective of the manner of death — and even after the body has been moved to a mortuary.",
                },
              },
              {
                id: "what",
                label: "What can be donated",
                cells: {
                  dbd: "Heart, lungs, liver, kidneys and pancreas, plus tissue.",
                  dcd: "Depends on the circumstances and how quickly recovery can follow death.",
                  living: "A kidney, or a segment of liver.",
                  tissue: "Corneas, bone and ligaments, skin, heart valves.",
                },
              },
              {
                id: "who-consents",
                label: "Who gives consent",
                cells: {
                  dbd: "Next of kin — spouse, parent, child, brother or sister — or a legal guardian.",
                  dcd: "Next of kin or a legal guardian, as above.",
                  living: "The donor themselves.",
                  tissue: "Next of kin. A tissue donation coordinator is specifically trained to counsel next of kin and obtain consent for tissue-only donations.",
                },
              },
              {
                id: "setting",
                label: "Where it happens",
                cells: {
                  dbd: "Intensive care, then an operating theatre.",
                  dcd: "Intensive care or a palliative setting, then an operating theatre.",
                  living: "A planned operation, with the donor fully assessed beforehand.",
                  tissue: "Wider range of settings, including after transfer to a mortuary.",
                },
              },
            ],
            bottomLine:
              "Most deceased organ donation in South Africa follows one of two routes — after brain death, or after circulatory death — and both require consent from next of kin. Tissue donation is possible far more widely than most people assume.",
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
                text: "Deceased organ donation follows two routes: donation after brain death (DBD), and donation after circulatory death (DCD).",
              },
              {
                id: "t2",
                text: "Living donation is possible for a kidney or a segment of liver, by the donor's own conscious decision.",
              },
              {
                id: "t3",
                text: "Tissue donation is much broader: it can occur irrespective of the manner of death, and even after the body has been moved to a mortuary.",
              },
              {
                id: "t4",
                text: "Organ donation can only take place in a clinical setting. Early identification and good donor management are what make it possible.",
              },
              {
                id: "t5",
                text: "Every deceased donation route requires consent from next of kin — which is why the family conversation is never optional.",
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
            summary: "The routes to donation, drawn from study guide Objective 5 and the SATCS Red File.",
            sections: [
              {
                id: "s1",
                heading: "Donation after brain death (DBD)",
                body: "Occurs when a patient on a mechanical ventilator is declared brain dead by two doctors. Any patient declared brain dead — irreversible structural brain damage with total loss of brainstem function — is a potential organ donor.",
              },
              {
                id: "s2",
                heading: "Donation after circulatory death (DCD)",
                body: "Possible in palliative care settings where treatment is withdrawn and death is imminent.",
              },
              {
                id: "s3",
                heading: "Living donation",
                body: "Living organ donors are eligible if they make a conscious decision to donate a kidney or a segment of liver.",
              },
              {
                id: "s4",
                heading: "Tissue donation",
                body: "Tissue donation eligibility is broader than organ donation. It can occur irrespective of the manner of death, and even after the body has been moved to a mortuary. A tissue donation coordinator is specifically trained to counsel next of kin and obtain consent for tissue-only donations.",
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
            intro: "The SATCS Red File is the practical handbook behind this module.",
            note: 'Anything marked "Opens here" is the document Save7 supplied.',
          },
        },
        { slug: "complete", title: "Complete module", kind: "COMPLETE" },
      ],
    },

    // ---------------------------------------------------------------- M4
    {
      slug: "having-the-conversation",
      number: 4,
      title: "Having the Conversation",
      coreQuestion: "How do I actually talk to someone about organ donation?",
      introMarkdown:
        "This is where the Beginner level pays off.\n\nEverything you have learned so far exists to support one thing: a conversation with the people you love. Not a debate, not a campaign — a conversation.\n\nSave7's position is simple. Whether it is a public awareness campaign or a quiet word with your family, the most important part is simply starting the conversation.",
      estMinutes: 12,
      lessons: [
        {
          slug: "intro",
          title: "Why this matters",
          kind: "INTRO",
          bodyMarkdown:
            "The purpose of this module is **not** to teach you to win arguments.\n\nPeople who feel argued with dig in. People who feel heard reconsider. So the skills that matter here are listening, acknowledging what someone is actually worried about, correcting misinformation gently, and pointing to reliable information rather than to your own authority.\n\nThere is good evidence that the conversation itself has value regardless of the outcome: having discussions about donation as part of end-of-life care helps families **independent of what they ultimately decide**. You are not only recruiting donors. You are making sure people are not left guessing.\n\nYou are also allowed to say *I don't know*. It is a far better answer than a confident guess, and it protects the trust that makes the next conversation possible.",
        },
        {
          slug: "practise-responding",
          title: "Practise responding",
          kind: "PRIMARY",
          componentKey: "ScenarioDialogue",
          payload: {
            intro:
              "Four conversations you are likely to have. Read what the person says, think about what is really behind it, then choose how you would respond. There is often more than one reasonable answer.",
            scenarios: [
              {
                id: "s1",
                speaker: "A friend",
                quote: "If I'm an organ donor, doctors won't try as hard to save me.",
                whatsReallyHappening:
                  "This is a fear about being abandoned when you are most vulnerable. It is not really a question about hospital policy.",
                reflectPrompt:
                  "Before you look at the options — what would you actually say to a friend who said this?",
                options: [
                  {
                    id: "o1",
                    text: "That's a myth. It's completely untrue and there's no evidence for it.",
                    quality: "poor",
                    feedback:
                      "Accurate in substance, but it dismisses the fear rather than addressing it. Being told you are wrong rarely changes what you believe — and your friend will simply stop raising it with you.",
                  },
                  {
                    id: "o2",
                    text: "That's a really common worry, and it makes sense — nobody wants to feel like a number. Can I tell you how the teams are actually kept separate?",
                    quality: "strong",
                    feedback:
                      "This acknowledges the emotion first, normalises the worry so your friend does not feel foolish, and then asks permission before offering information. Permission matters: it turns a correction into a conversation. And the fact you are about to give is a strong one — two independent doctors must certify brain death, and neither may be part of the transplant team.",
                  },
                  {
                    id: "o3",
                    text: "Honestly, I had the same thought. What changed my mind was learning that the law requires two independent doctors to confirm death, and neither of them can be on the transplant team.",
                    quality: "strong",
                    feedback:
                      "Sharing that you had the same doubt removes the hierarchy from the conversation, and you have given the specific safeguard rather than a general reassurance. This is the strongest single fact you have for this objection.",
                  },
                  {
                    id: "o4",
                    text: "Do you really think doctors would do that? They take an oath.",
                    quality: "poor",
                    feedback:
                      "This makes your friend defend themselves, and appeals to professional character rather than explaining what actually prevents the conflict. The conversation is now an argument.",
                  },
                ],
                debrief:
                  "Notice what the strong responses have in common: they name the emotion, they do not make the person feel stupid, and they offer a concrete safeguard rather than an assurance about good intentions. The separation of the two medical teams is written into the requirements for certifying death — it is not left to trust.",
              },
              {
                id: "s2",
                speaker: "A family member",
                quote: "I don't want doctors cutting me up after I'm dead.",
                whatsReallyHappening:
                  "Almost never a factual objection. This is about dignity, and about the body of someone loved being treated with respect.",
                reflectPrompt: "What is this person actually asking you to reassure them about?",
                options: [
                  {
                    id: "o1",
                    text: "Recovery is done in an operating theatre with the same care as any other surgery, and the body is restored to its original state afterwards. Would it help to know more about what actually happens?",
                    quality: "strong",
                    feedback:
                      "Answers the real concern — dignity — with a specific fact, and offers detail without forcing it on them. That the body is restored afterwards is exactly the reassurance this objection is asking for.",
                  },
                  {
                    id: "o2",
                    text: "You won't feel anything, you'll be dead.",
                    quality: "poor",
                    feedback:
                      "Technically responsive and emotionally tone-deaf. The objection was never about pain.",
                  },
                  {
                    id: "o3",
                    text: "I understand. Can I ask what worries you most about it — is it how you'd look, or something else?",
                    quality: "strong",
                    feedback:
                      "A genuinely good move. You do not yet know whether this is about an open casket, religious washing rites, or something else entirely. Asking beats assuming.",
                  },
                  {
                    id: "o4",
                    text: "Think of it this way — you won't need your organs any more, but seven other people will.",
                    quality: "workable",
                    feedback:
                      "The reframe is memorable and true, and the number is right. But leading with it before acknowledging the concern can feel like being sold to. Try it after they feel heard, not instead.",
                  },
                ],
                debrief:
                  "When an objection is about dignity, information alone will not resolve it — but the right information helps. Two specifics are worth knowing: the body is restored to its original state after recovery, and anaesthesia is given to the deceased to reduce the remaining physiologic response to the surgery. Both are the kind of concrete detail that reassures a family far more than a general promise of respect.",
              },
              {
                id: "s3",
                speaker: "Someone at a community event",
                quote: "My religion doesn't allow organ donation.",
                whatsReallyHappening:
                  "This may be accurate, or it may be an inherited assumption that has never been checked with their own faith leader. Either way, it is not yours to overrule.",
                reflectPrompt: "What is the line you should not cross here?",
                options: [
                  {
                    id: "o1",
                    text: "Actually most major religions do permit organ donation.",
                    quality: "poor",
                    feedback:
                      "Even where broadly true, telling someone what their own faith permits is overstepping. You have made yourself an authority on their beliefs, and lost their trust.",
                  },
                  {
                    id: "o2",
                    text: "Thank you for telling me — that's important, and I'd never want to push against it. Some people find it useful to ask their own faith leader directly, because positions vary. Would that be worth doing?",
                    quality: "strong",
                    feedback:
                      "Respects their belief, stays inside your competence, and points them to the right authority — their faith leader, not you. In hospital, a faith representative or chaplain can be included to support a family for exactly this reason.",
                  },
                  {
                    id: "o3",
                    text: "That's fine. Would you still be willing to talk to your family about what you'd want, so they aren't left guessing?",
                    quality: "strong",
                    feedback:
                      "Excellent. It accepts their position completely and still advances Save7's actual goal: that families know each other's wishes. Since consent from next of kin is always required, a clearly communicated 'no' is genuinely useful — it spares a family an impossible guess.",
                  },
                  {
                    id: "o4",
                    text: "Which religion? I can look up what they say about it.",
                    quality: "workable",
                    feedback:
                      "Well-intentioned, but it puts you in the position of interpreting their faith to them. Better to point them to someone inside their own tradition.",
                  },
                ],
                debrief:
                  "Save7's goal is not to convert anyone. Donation is possible from all communities and cultures in South Africa, and it should never be assumed that someone's background means the subject shouldn't be raised — but nor is it yours to settle. Someone who declines donation and has told their family is a success, not a failure.",
              },
              {
                id: "s4",
                speaker: "A colleague",
                quote:
                  "I'd probably be turned down anyway — I'm in my sixties and I'm on medication for blood pressure.",
                whatsReallyHappening:
                  "Self-exclusion. This person has quietly ruled themselves out and would never have raised it if you had not been talking about donation.",
                reflectPrompt: "Why is this one of the most valuable conversations you can have?",
                options: [
                  {
                    id: "o1",
                    text: "Please don't rule yourself out — there's actually no age restriction for solid organ donation, and conditions like high blood pressure don't automatically exclude someone. It's assessed organ by organ at the time.",
                    quality: "strong",
                    feedback:
                      "Exactly right, and specific. There is no age limit for solid organ donation, and extended criteria donors with conditions such as hypertension, diabetes or HIV may still be eligible if individual organs are assessed as transplantable.",
                  },
                  {
                    id: "o2",
                    text: "Age and blood pressure don't matter at all for donation.",
                    quality: "poor",
                    feedback:
                      "Overcorrection. These factors are assessed rather than ignored, and claiming they are irrelevant damages your credibility when someone checks.",
                  },
                  {
                    id: "o3",
                    text: "That's really common to assume. The decision isn't yours or mine to make — it's a medical assessment at the time, so the best thing is to register your wishes, tell your family, and let the doctors decide.",
                    quality: "strong",
                    feedback:
                      "Puts the decision where it belongs and gives your colleague two concrete things to do.",
                  },
                  {
                    id: "o4",
                    text: "You could still donate your corneas, probably.",
                    quality: "workable",
                    feedback:
                      "Tissue donation is a genuinely useful point, and cornea donors are generally accepted between 6 and 65 — so at 60-something this may well be accurate. But 'probably' is speculation about a specific outcome; keep the framing general and let the assessment decide.",
                  },
                ],
                debrief:
                  "Self-exclusion is invisible unless you start the conversation. The single most useful sentence here is that there is no age restriction for solid organ donation. Module 8 covers eligibility properly.",
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
                text: "The goal is a conversation, not a conversion. Because consent from next of kin is always required, someone who decides against donation but tells their family has still done something valuable.",
              },
              {
                id: "t2",
                text: "Acknowledge the emotion before you correct the facts. People who feel dismissed stop listening.",
              },
              {
                id: "t3",
                text: "Ask permission before informing. It turns a correction into a conversation.",
              },
              {
                id: "t4",
                text: "Your strongest single fact: two independent doctors must certify brain death, and neither may be part of the transplant team.",
              },
              {
                id: "t5",
                text: "For dignity concerns: the body is restored to its original state after recovery, and anaesthesia is given to the deceased during it.",
              },
              {
                id: "t6",
                text: "Stay inside your competence. Never tell someone what their own religion permits — point them to their faith leader.",
              },
              {
                id: "t7",
                text: '"I don\'t know, let me find out" protects your credibility and the next conversation.',
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
            summary: "Respectful conversation practice, and the facts that support it.",
            sections: [
              {
                id: "s1",
                heading: "Why talking to your family matters",
                body: "Consent from next of kin is always required for donation to proceed. A registration your family has never heard about leaves them guessing at the worst possible moment. Evidence also suggests that discussing donation as part of end-of-life care helps families regardless of what they decide.",
              },
              {
                id: "s2",
                heading: "The four facts worth memorising",
                bullets: [
                  "Two independent doctors must certify brain death, and neither may be part of the transplant team",
                  "The body is restored to its original state after recovery surgery, and anaesthesia is given to the deceased during it",
                  "There is no age restriction for solid organ donation",
                  "The donor's medical aid, estate and next of kin bear no costs for the donation once death is declared and consent obtained",
                ],
              },
              {
                id: "s3",
                heading: "How to approach the subject",
                body: "Acknowledge the emotion first. Ask permission before offering information. Do not overcorrect — claiming a factor is irrelevant is as inaccurate as claiming it disqualifies. Stay inside your competence, particularly on matters of faith. And say when you do not know.",
              },
              {
                id: "s4",
                heading: "What counts as success",
                body: "A family that has talked. Not a signature.",
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
            intro: "Save7's own referral pathway, and the evidence on family decisions.",
            note: 'Anything marked "Opens here" is the document Save7 supplied.',
          },
        },
        { slug: "complete", title: "Complete module", kind: "COMPLETE" },
      ],
    },
  ],
};
