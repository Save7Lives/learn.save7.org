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
 * 🟡 INTERMEDIATE — "Understand the Journey"
 *
 * Moves from awareness to mechanism: how donation actually works in South
 * Africa. Module 5 is built around Save7's own "The Journey of a Gift" video.
 * Module 6 carries the single most important distinction in the whole course.
 *
 * Sources for this level:
 *   · Save7, "Transplant Alchemy 101 — Study Guide", Objectives 3 and 5
 *   · Save7, "7 Lives in 7 Steps" (the referral pathway)
 *   · Thomson et al. (2021), South African Guidelines on the Determination of
 *     Death — CCSSA; also SAMJ 111(4b):367–380
 *   · Excellence in Deceased Donation course manual (updated 2025)
 *   · SATCS, "The Organ and Tissue Donation Reference File" (the Red File)
 *
 * Module 6 quotes the determination-of-death guidelines closely and deliberately.
 * This is the one place in the course where paraphrasing loosely would be a real
 * harm, so the definitions are reproduced in the guideline's own terms.
 */
export const intermediateLevel: LevelSeed = {
  slug: "intermediate",
  tier: "INTERMEDIATE",
  title: "Understand the Journey",
  strapline:
    "For learners who want to understand how donation and transplantation actually work.",
  goal:
    "Move beyond basic awareness and understand how organ donation actually works in South Africa.",
  estMinMinutes: 45,
  estMaxMinutes: 60,
  accentToken: "intermediate",
  certificateTitle: "Donation Advocate",
  certificateCode: "I",
  passMarkPct: 70,
  modules: [
    // ---------------------------------------------------------------- M5
    {
      slug: "journey-of-a-gift",
      number: 5,
      title: "The Journey of a Gift",
      coreQuestion: "What is the full journey from a potential donor to a recipient's new life?",
      introMarkdown:
        "In Module 2 you walked this pathway looking for the places it breaks. Now you walk it properly, end to end, as the people living through it experience it.\n\nSave7's film *The Journey of a Gift* follows that journey. This module is built around it — not as a video to watch and move past, but as the thread you follow through each stage.",
      estMinutes: 16,
      lessons: [
        {
          slug: "intro",
          title: "Why this matters",
          kind: "INTRO",
          bodyMarkdown:
            "A donation is not an event. It is a chain of decisions and actions, running over hours, involving dozens of people, most of whom never meet each other and none of whom meet the recipient.\n\nUnderstanding the whole arc is what lets you answer the question people most often ask an advocate: *so what actually happens?*\n\nTwo stages in particular are almost never mentioned in public conversation, and both change how the process is understood. **Donor management** is skilled, active care given after death has been determined — it is the reason a donation succeeds or fails. And **allocation** is a matching process, not a queue.",
        },
        {
          slug: "watch-the-journey",
          title: "The Journey of a Gift",
          kind: "PRIMARY",
          componentKey: "ChapterVideo",
          payload: {
            title: "The Journey of a Gift",
            src: "/media/journey-of-a-gift.mp4",
            durationSeconds: 419,
            awaitingAsset: false,
            // Chapter timecodes have not been measured against the film, so they
            // are all zero and the component lists rather than seeks. Better a
            // chapter list that does nothing than one that jumps to the wrong
            // moment.
            chapters: [
              { id: "c1", label: "Why transplantation is needed", startSeconds: 0, summary: "One donor can save seven or more lives." },
              { id: "c2", label: "Who is waiting for a transplant", startSeconds: 0 },
              { id: "c3", label: "Identification and referral", startSeconds: 0 },
              { id: "c4", label: "Determination of death", startSeconds: 0 },
              { id: "c5", label: "The family approach and consent", startSeconds: 0 },
              { id: "c6", label: "Donor management", startSeconds: 0 },
              { id: "c7", label: "Recovery and allocation", startSeconds: 0 },
              { id: "c8", label: "Transplantation", startSeconds: 0 },
              { id: "c9", label: "A life after transplant", startSeconds: 0 },
            ],
          },
        },
        {
          slug: "the-full-journey",
          title: "The full journey, step by step",
          kind: "PRIMARY",
          componentKey: "PathwayJourney",
          payload: {
            intro:
              "The complete pathway, including the stages Module 2 did not cover: donor management, allocation, and what happens to the recipient afterwards.",
            showLossPoints: false,
            steps: [
              {
                id: "potential-donor",
                label: "Potential donor",
                summary: "Where the journey begins.",
                detail:
                  "Organ donation can only happen in a clinical setting, almost always an intensive care unit with the patient on a mechanical ventilator. The most common routes to becoming a potential donor are traumatic head injury, stroke, or cerebral hypoxia following drowning or drug overdose.",
              },
              {
                id: "identification",
                label: "Identification",
                summary: "A clinical team recognises that donation may be possible.",
                detail:
                  "Three triggers should prompt consideration in any mechanically ventilated patient: a decision has been made to perform brain death tests; there is a catastrophic brain injury with GCS 3–4 that cannot be explained by sedation, after a period of observation to allow prognostication; or there is an intention to discuss withdrawal of life-sustaining treatment expected to result in circulatory death.\n\nIdentification is the responsibility of the primary treatment team — the doctors and nurses already caring for the patient — as part of end-of-life care.",
              },
              {
                id: "referral",
                label: "Referral",
                summary: "A transplant or tissue donation coordinator is contacted.",
                detail:
                  "The earliest possible discussion with a transplant coordinator is recommended. It lets the coordinator screen the patient, identify when donation is not feasible, and mobilise support — which minimises delay for the family. Importantly, this first discussion with the coordinator happens *before* end-of-life matters are raised with the family.\n\nThere is no legal requirement to refer. Referral happens because a clinician chooses to make it happen.",
              },
              {
                id: "determination-of-death",
                label: "Determination of death",
                summary: "Death is formally determined by two independent clinicians.",
                detail:
                  "Two registered medical doctors must certify brain death. Neither may be involved with a transplantation team, and one must have been registered with the HPCSA for at least five years. Legal death is the time at which both doctors have confirmed brain death after completing all required clinical tests.\n\nModule 6 covers this in full.",
              },
              {
                id: "family-approach",
                label: "Family approach",
                summary: "The family is told about the death — and donation is not yet mentioned.",
                detail:
                  "This is the step people find most surprising. The family is informed of the diagnosis and must fully understand and accept that their relative has died, **before organ donation is raised at all**. The treating team does not raise it; a transplant coordinator does, afterwards.\n\nThis deliberate separation is called **decoupling**. It exists so that a family is never asked to absorb a death and make a donation decision in the same breath — and so that the diagnosis is never heard as a request.\n\nAccepting the diagnosis takes patience and empathy from everyone involved. Families are given a specific period to process it, and support is not withdrawn immediately.",
              },
              {
                id: "consent",
                label: "Consent",
                summary: "Consent is sought from the person\u2019s own decision first, then relatives in statutory order.",
                detail:
                  "Where the person made no donation while alive, consent comes from relatives in the order section 62(2) sets out: spouse, partner, major child, parent, guardian, major brother, major sister. \u201cMajor\u201d means adult, and a partner ranks above every relative but a spouse. There is an ethical obligation to give every family the chance to make a fully informed decision, and nobody should be excluded from being offered the option.\n\nIf the death was unnatural, it must also go for a medico-legal post-mortem, and recovery needs the forensic pathologist\u2019s authorisation. Institutional authorisation comes in writing from the medical practitioner in charge of clinical services at the hospital. Module 9 covers the legal detail.",
              },
              {
                id: "donor-management",
                label: "Donor management",
                summary: "Active, skilled care that keeps the gift viable.",
                detail:
                  "Care of the potential donor continues the support that began before death was declared, and actively manages the physiological deterioration that follows brain death. **Active management improves both the number of organs recovered and the outcomes for recipients** — this is not holding care, it is treatment with a purpose.\n\nIt includes gentle but effective ventilation and good pulmonary care, positioning the patient head-up at 30 to 45 degrees, and active temperature control, since the loss of hypothalamic function means the body can no longer regulate its own temperature. Fluid balance is kept deliberately restrictive, which improves lung viability without measurably harming kidney outcomes.\n\nFamilies may stay with their relative during this period, including up to the point of transfer to theatre.",
              },
              {
                id: "recovery",
                label: "Organ and tissue recovery",
                summary: "Surgery, performed with the same care and respect as any operation.",
                detail:
                  "Recovery takes place in an operating theatre. Anaesthesia is given to the deceased in order to reduce the remaining physiological response to the surgery. Tissue is recovered by trained tissue recovery technicians, ethically and respectfully. The body is restored to its original state afterwards.\n\nFamilies commonly ask about the procedure itself, about anaesthesia, and about how their relative will be transferred to a funeral home. All three are reasonable questions with straightforward answers.",
              },
              {
                id: "allocation",
                label: "Allocation",
                summary: "Organs are matched to recipients — not handed out in order.",
                detail:
                  "Allocation is a matching process. One concrete rule worth knowing: paediatric donors under 18 are preferentially allocated to paediatric recipients under 18.\n\nThere is also a system-level effect that is easy to miss. Long-term outcomes improve when there is a larger pool of donors to allocate from — so a donation that is lost does not only cost one recipient, it makes matching worse for everyone waiting.",
              },
              {
                id: "transplantation",
                label: "Transplantation",
                summary: "The transplant operation itself.",
                detail:
                  "For the recipient this is the beginning rather than the end. Module 11 follows what happens next.",
              },
              {
                id: "life-after",
                label: "Life after transplant",
                summary: "A lifelong medical journey, not a completed repair.",
                detail:
                  "A transplant restores something specific — sight, breathing, freedom from dialysis, years of active living — and it brings ongoing medication and monitoring with it. Describing both honestly is what makes an advocate credible.",
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
                text: "Donation is a coordinated chain of events over hours, not a single moment.",
              },
              {
                id: "t2",
                text: "The diagnosis conversation and the donation conversation are deliberately separated. This is called decoupling.",
                detail:
                  "The family must understand and accept the death before donation is raised — and it is raised by a coordinator, not by the treating team.",
              },
              {
                id: "t3",
                text: "Donor management is active, skilled care after death has been determined. It measurably improves how many organs are recovered and how well recipients do.",
              },
              {
                id: "t4",
                text: "Recovery is surgery in an operating theatre. Anaesthesia is given to the deceased, and the body is restored to its original state afterwards.",
              },
              {
                id: "t5",
                text: "Allocation is matching, not queueing. Paediatric donors are preferentially allocated to paediatric recipients.",
              },
              {
                id: "t6",
                text: "A larger donor pool improves outcomes for everyone waiting — so a lost donation costs more than one transplant.",
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
            summary: "The donation pathway, end to end.",
            sections: [
              {
                id: "s1",
                heading: "Identification and referral",
                body: "Three triggers should prompt consideration of donation in a mechanically ventilated patient: a decision to perform brain death tests; catastrophic brain injury with GCS 3–4 not explained by sedation, after observation for prognostication; or intended discussion of withdrawal of life-sustaining treatment expected to result in circulatory death. The earliest possible discussion with a transplant coordinator is recommended, and occurs before end-of-life matters are raised with the family.",
              },
              {
                id: "s2",
                heading: "Decoupling",
                body: "The family is informed of the death and must fully understand and accept it before donation is mentioned. The donation conversation is then initiated by a transplant coordinator. Families are given a defined period to process the diagnosis, and support is not withdrawn immediately.",
              },
              {
                id: "s3",
                heading: "Donor management",
                body: "Care continues the support begun before death was declared and actively manages the physiological deterioration that follows. Active management improves organ retrieval rates and transplant outcomes. Components include gentle effective ventilation with good pulmonary care, head-up positioning at 30–45 degrees, active temperature control following loss of hypothalamic function, and a restrictive fluid balance that improves lung viability without substantially affecting kidney outcomes.",
              },
              {
                id: "s4",
                heading: "Recovery",
                body: "Performed in an operating theatre. Anaesthesia is given to the deceased to decrease the remaining physiologic response to the procedures involved. Tissue is recovered by trained technicians. The body is restored to its original state.",
              },
              {
                id: "s5",
                heading: "Allocation",
                body: "A matching process. Paediatric donors under 18 are preferentially allocated to paediatric recipients under 18. Long-term outcomes are improved by having a large pool from which to allocate organs.",
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
            intro: "The film, and the clinical manual behind the pathway.",
            note: 'Anything marked "Opens here" is the document Save7 supplied.',
          },
        },
        { slug: "complete", title: "Complete module", kind: "COMPLETE" },
      ],
    },

    // ---------------------------------------------------------------- M6
    {
      slug: "what-does-death-mean",
      number: 6,
      title: "What Does Death Mean?",
      coreQuestion: "How can someone be declared dead while their heart is still beating?",
      introMarkdown:
        "This is the question that stops donation conversations dead, and the one most advocates feel least equipped to answer.\n\nIt deserves a careful answer, so this module follows the South African Guidelines on the Determination of Death closely rather than paraphrasing loosely. Getting this wrong — in either direction — damages trust in the whole system.\n\n**One distinction matters more than anything else in this course: brain death is not a coma, and it is not simply being unconscious.**",
      estMinutes: 16,
      lessons: [
        {
          slug: "intro",
          title: "Why this matters",
          kind: "INTRO",
          bodyMarkdown:
            "A family sitting beside a ventilated patient sees a warm body and a beating heart. Being told that person has died contradicts what their eyes are telling them.\n\nThat contradiction is not stupidity. It is a completely reasonable response to an unusual situation, and it is the single biggest obstacle in the consent conversation.\n\nStart from the definition itself, which is more precise and more useful than most people expect:\n\n> Death is the clinical point of irreversible loss of the capacity for consciousness and the irreversible loss of the capacity to breathe.\n\nRead it twice. It does not mention the heart. Death is determined either by **neurological criteria** or by **circulatory criteria**, and a correctly performed clinical examination can establish it with complete certainty — it is not necessary to wait for signs like rigor mortis before death can be determined in a hospital.\n\nAnd the fact that answers the objection you will hear most often:\n\n> There is no documented case of a person who fulfils the preconditions and criteria for brain death ever subsequently developing any return of brain function.",
        },
        {
          slug: "brain-death-vs-coma",
          title: "Brain death is not a coma",
          kind: "PRIMARY",
          componentKey: "ComparePanel",
          payload: {
            intro:
              "These three states are constantly confused, including in news reporting and film. Compare them carefully — this is the distinction you will be asked to explain most often.",
            columns: [
              {
                id: "brain-death",
                label: "Brain death",
                caption: "Death by neurological criteria",
                emphasis: true,
              },
              { id: "coma", label: "Coma", caption: "Profound unconsciousness" },
              { id: "vegetative", label: "Vegetative state", caption: "Wakefulness without awareness" },
            ],
            rows: [
              {
                id: "what",
                label: "What it is",
                cells: {
                  "brain-death":
                    "Irreversible structural brain damage with total loss of brainstem function. The capacity for consciousness and the capacity to breathe are both irreversibly gone.",
                  coma: "A state of profound unconsciousness. Brain function is impaired but not irreversibly and totally lost.",
                  vegetative:
                    "Cycles of wakefulness without awareness. Brainstem function is present.",
                },
              },
              {
                id: "brainstem",
                label: "Brainstem function",
                cells: {
                  "brain-death": "Absent — this is what is tested for, and its total loss is the diagnosis.",
                  coma: "Present.",
                  vegetative: "Present.",
                },
              },
              {
                id: "breathing",
                label: "Capacity to breathe",
                cells: {
                  "brain-death":
                    "Irreversibly absent. This is directly tested by an apnoea test, and it is part of the definition of death.",
                  coma: "Usually present, though breathing may need support.",
                  vegetative: "Present.",
                },
              },
              {
                id: "recovery",
                label: "Possibility of recovery",
                cells: {
                  "brain-death":
                    "None. There is no documented case of anyone meeting the preconditions and criteria for brain death subsequently regaining any brain function.",
                  coma: "Possible. People do recover from comas — which is exactly why the two must not be confused.",
                  vegetative: "Limited and variable.",
                },
              },
              {
                id: "legal",
                label: "Legal status",
                cells: {
                  "brain-death":
                    "Dead. Legal death is the time at which two doctors have confirmed brain death after completing all required clinical tests.",
                  coma: "Alive.",
                  vegetative: "Alive.",
                },
              },
              {
                id: "heart",
                label: "Why the heart may still be beating",
                cells: {
                  "brain-death":
                    "A mechanical ventilator is supplying the oxygen the person can no longer obtain for themselves, so the heart continues to beat for a period after death.",
                  coma: "The person is alive; the heart is beating for the ordinary reason.",
                  vegetative: "The person is alive.",
                },
              },
            ],
            bottomLine:
              "Brain death is death. A coma is not. Conflating them is the most common and most damaging misunderstanding in organ donation.",
          },
        },
        {
          slug: "how-death-is-determined",
          title: "How death is determined",
          kind: "PRIMARY",
          componentKey: "PathwayJourney",
          payload: {
            intro:
              "Determination of death follows a defined process with deliberate safeguards. Open each step to see what it involves and why it exists.",
            showLossPoints: false,
            steps: [
              {
                id: "preconditions",
                label: "Preconditions",
                summary: "Establishing that the criteria can be applied at all.",
                detail:
                  "There must be an established cause compatible with complete and irreversible loss of all brain function before testing begins. The patient must also be physiologically stable enough for the tests to mean anything: a temperature of at least 36°C, and a systolic blood pressure above 100 mmHg or a mean arterial pressure above 60 mmHg (with age-appropriate targets in children).",
              },
              {
                id: "exclusions",
                label: "Excluding what could mimic it",
                summary: "Ruling out reversible causes before concluding anything.",
                detail:
                  "The influence of drugs that depress the central nervous system must be excluded — for example by allowing five elimination half-lives to pass. Where severe alcohol intoxication may be the cause of the coma, the blood level should be shown to be below 80 mg/dL. Metabolic and endocrine disturbances are considered, though the guidelines stress that the most important factor is an unequivocal cause for the coma.",
              },
              {
                id: "observation",
                label: "Observation period",
                summary: "Time to be certain the injury is what it appears to be.",
                detail:
                  "No single standard observation period is set — it is judged case by case. Two situations are specified: in anoxic brain injury the observation period should be 24 hours, and where therapeutic hypothermia has been used there should be 24 hours of normal temperature before examination. A cautious approach is advised in children, where confounders are common.",
              },
              {
                id: "clinical-assessment",
                label: "Clinical assessment",
                summary: "Structured examination of brainstem function.",
                detail:
                  "It must be possible to examine the brainstem reflexes properly — at least one eye and one ear — and to perform an apnoea test safely.\n\nThe assessment of coma gives a sense of the rigour involved: deep pressure is applied to a nail bed on each limb and to the sternum. Noxious stimuli must produce no grimacing, no facial movement and no limb response other than reflexes mediated by the spinal cord. Any response that is not spinal in origin is incompatible with a diagnosis of brain death. Distinguishing the two requires expertise, and consultation is recommended where a response is unclear.",
              },
              {
                id: "apnoea-testing",
                label: "Apnoea testing",
                summary: "Testing directly for any capacity to breathe.",
                detail:
                  "Because the irreversible loss of the capacity to breathe is part of the definition of death, it is tested directly rather than inferred. Where two doctors test separately there is no required delay between their examinations, but the guidelines strongly advocate that a single apnoea test be performed by both doctors together.",
              },
              {
                id: "ancillary",
                label: "Ancillary testing",
                summary: "For the situations where clinical testing is not possible.",
                detail:
                  "An ancillary test is an additional investigation that assists the clinical diagnosis. It is used where clinical testing cannot be completed — for instance where apnoea testing is precluded by severe hypoxic respiratory failure or a high cervical cord injury — after confirming that brainstem reflexes are absent. It supplements the clinical diagnosis rather than replacing it.",
              },
              {
                id: "independent-assessment",
                label: "Two independent doctors",
                summary: "The safeguard that answers the most common public fear.",
                detail:
                  "Two registered medical doctors must certify brain death. **Neither may be involved with a transplantation team.** One must have been registered with the HPCSA for at least five years, and may not be an intern. The two should ideally perform the testing together.\n\nLegal death is the time at which both doctors have confirmed brain death after completing all required clinical tests.",
              },
              {
                id: "children",
                label: "Children",
                summary: "The same standard, with one hard limit.",
                detail:
                  "Determination of death in children is held to the same standard as in adults. It cannot be diagnosed in children below 36 weeks corrected gestation.",
              },
              {
                id: "accommodation",
                label: "Accommodation and somatic support",
                summary: "Two terms worth knowing, because they are humane ones.",
                detail:
                  "**Somatic support** is the management of the body and organs, excluding the brain, after brain death has been confirmed.\n\n**Accommodation** is a period of somatic support provided specifically to allow a family time to process the diagnosis of death. The guidelines make recommendations on handling family requests for it — which tells you something about the spirit in which they were written.",
              },
              {
                id: "circulatory",
                label: "Circulatory determination of death",
                summary: "The other route by which death is determined.",
                detail:
                  "Death may also be determined by circulatory criteria — the preferred term over older phrases like cardiac or cardiorespiratory death. This is the route relevant to donation after circulatory death, where treatment is withdrawn in a palliative setting and death is expected.",
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
                text: "Death is the irreversible loss of the capacity for consciousness together with the irreversible loss of the capacity to breathe. The definition does not mention the heart.",
              },
              {
                id: "t2",
                text: "Brain death is not a coma and not simply unconsciousness. Recovery from a coma is possible; there is no documented case of recovery of brain function after brain death was properly determined.",
              },
              {
                id: "t3",
                text: "The heart can keep beating because a ventilator is supplying oxygen the person can no longer obtain for themselves.",
              },
              {
                id: "t4",
                text: "Two registered doctors must certify brain death, neither of them involved with a transplant team, and one registered with the HPCSA for at least five years.",
              },
              {
                id: "t5",
                text: "The capacity to breathe is tested directly, by an apnoea test — it is not assumed.",
              },
              {
                id: "t6",
                text: "Legal death is the moment both doctors have confirmed brain death after completing all required tests.",
              },
              {
                id: "t7",
                text: "A family's disbelief at the bedside is a reasonable human response, not ignorance. Accepting the diagnosis takes patience and empathy, and “accommodation” exists to give them time.",
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
              "Based on the South African Guidelines on the Determination of Death (Critical Care Society of Southern Africa, 2021).",
            sections: [
              {
                id: "s1",
                heading: "The definition",
                body: "Death is the clinical point of irreversible loss of the capacity for consciousness and the irreversible loss of the capacity to breathe. Death is determined by either neurological or circulatory criteria, in accordance with accepted medical standards. A correctly performed clinical examination can determine the point of death with complete certainty; it is not necessary to wait for signs such as hypostasis, rigor mortis or decay in the healthcare setting.",
              },
              {
                id: "s2",
                heading: "Terminology",
                bullets: [
                  "Brain death, or death by neurological criteria — the preferred term, in place of brain-stem death",
                  "Circulatory death, or death by circulatory criteria — preferred over cardiac or cardiorespiratory death",
                  "Somatic support — management of the body and organs, excluding the brain, after brain death is confirmed",
                  "Accommodation — a period of somatic support to allow a family to process the diagnosis",
                  "Ancillary test — an additional test that assists the clinical diagnosis of brain death",
                ],
              },
              {
                id: "s3",
                heading: "Preconditions for brain death testing",
                bullets: [
                  "An established cause compatible with complete and irreversible loss of all brain function",
                  "Temperature of at least 36°C",
                  "Systolic blood pressure above 100 mmHg, or mean arterial pressure above 60 mmHg",
                  "Exclusion of CNS-depressing drugs, for example by allowing five elimination half-lives",
                  "Where severe alcohol intoxication is a concern, a blood level below 80 mg/dL",
                  "Ability to examine brainstem reflexes — at least one eye and one ear — and to perform apnoea testing safely",
                ],
              },
              {
                id: "s4",
                heading: "Observation periods",
                body: "No single standard period is set; it is judged case by case. In anoxic brain injury the observation period should be 24 hours. Where therapeutic hypothermia has been used, 24 hours of normothermia should pass before examination. A cautious approach is advised in paediatrics.",
              },
              {
                id: "s5",
                heading: "Who determines death",
                body: "Two registered medical doctors, neither involved with a transplantation team, one of whom must have been registered with the HPCSA for at least five years and may not be an intern. They should ideally test together, and a single apnoea test performed by both together is strongly advocated. Legal death is the time both have confirmed brain death after completing all required clinical tests.",
              },
              {
                id: "s6",
                heading: "Children",
                body: "Held to the same standard as adults, but brain death cannot be diagnosed in children below 36 weeks corrected gestation.",
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
            intro: "The authoritative source for this module, in both available versions.",
            note: "Cite the journal version in written material. Both open here.",
          },
        },
        { slug: "complete", title: "Complete module", kind: "COMPLETE" },
      ],
    },

    // ---------------------------------------------------------------- M7
    {
      slug: "who-makes-it-happen",
      number: 7,
      title: "Who Makes It Happen?",
      coreQuestion: "Who are all the people involved in a single donation?",
      introMarkdown:
        "Donation is often imagined as something two surgeons do. It is closer to a relay involving a dozen roles, several of which most people have never heard of.\n\nMeet the team. Knowing who does what is genuinely useful in conversation — it makes the process concrete, and it answers questions about safeguards without you having to make claims about them.",
      estMinutes: 12,
      lessons: [
        {
          slug: "intro",
          title: "Why this matters",
          kind: "INTRO",
          bodyMarkdown:
            "Two things become obvious once you see the full team.\n\nThe first is how much care surrounds a donation. The second is how many of these roles exist specifically as safeguards — people whose job is to make sure the process is done properly and that a family is supported through it.\n\nThat is a far more reassuring answer to a sceptical question than any assertion you could make yourself. As the SATCS Red File puts it: organ and tissue donation is a team effort, and you are a crucial part of the team.",
        },
        {
          slug: "meet-the-team",
          title: "Meet the transplant team",
          kind: "PRIMARY",
          componentKey: "TeamRoster",
          payload: {
            intro: "Select any role to see what that person or organisation actually does.",
            members: [
              {
                id: "treating-team",
                role: "Primary treatment team",
                oneLiner: "Cares for the patient long before donation is considered — and identifies the possibility.",
                appearsAt: "Before and during identification",
                responsibilities: [
                  "Provides the critical care the patient is already receiving",
                  "Responsible for the initial identification of a potential donor, as part of end-of-life care",
                  "Makes the referral to a transplant coordinator",
                  "Counsels the family on prognosis, and later delivers the diagnosis of death — without raising donation at that point",
                ],
              },
              {
                id: "transplant-coordinator",
                role: "Transplant coordinator",
                oneLiner: "The central figure who coordinates the entire process.",
                appearsAt: "From referral through to recovery",
                responsibilities: [
                  "Performs donor assessments and screens for suitability",
                  "Oversees donor management",
                  "Coordinates the entire donation process",
                  "Leads the donation conversation with the family, after the death has been accepted",
                ],
              },
              {
                id: "tissue-coordinator",
                role: "Tissue donation coordinator",
                oneLiner: "Specifically trained to counsel families and obtain consent for tissue-only donation.",
                appearsAt: "Referral onwards",
                responsibilities: [
                  "Counsels next of kin about tissue donation",
                  "Obtains consent for tissue-only donations",
                ],
              },
              {
                id: "death-determining-doctors",
                role: "The two doctors who certify death",
                oneLiner: "Independent of the transplant team — a legal safeguard, not a courtesy.",
                appearsAt: "Determination of death",
                responsibilities: [
                  "Two registered medical doctors are legally required to certify brain death",
                  "Neither may be part of the transplant team",
                  "One must have been registered with the HPCSA for at least five years, and may not be an intern",
                  "Ideally perform the testing together, including a single shared apnoea test",
                ],
              },
              {
                id: "nurses",
                role: "Nurses",
                oneLiner: "Continuous care for the patient, and continuous presence for the family.",
                appearsAt: "Throughout",
                responsibilities: [
                  "Deliver the ongoing critical care the patient and then the donor requires",
                  "Part of the identification and referral responsibility of the treatment team",
                  "Often the team member a family speaks to most",
                  "A nursing sister is typically part of the team that meets with the family",
                ],
              },
              {
                id: "counsellors",
                role: "Trauma counsellor",
                oneLiner: "Supports the family through grief and decision-making.",
                appearsAt: "Family approach and after",
                responsibilities: [
                  "May form part of the team that approaches the family",
                  "Supports families through an acute bereavement",
                  "Note that routine grief counselling is generally not indicated — most bereaved people are resilient and grief is integrated with the support of family, friends and spiritual care. Counselling is valuable for complicated grief.",
                ],
              },
              {
                id: "translators",
                role: "Translator",
                oneLiner: "Makes consent genuinely informed across a language barrier.",
                appearsAt: "Family approach and consent",
                responsibilities: [
                  "May form part of the team that approaches the family",
                  "Ensures the family understands the diagnosis and the decision they are being asked to make",
                  "Consent that is not understood is not informed consent — which makes this a safeguard, not a convenience",
                ],
              },
              {
                id: "faith-representatives",
                role: "Faith representative or hospital chaplain",
                oneLiner: "Supports families within their own religious tradition.",
                appearsAt: "Family approach and after",
                responsibilities: [
                  "May form part of the team that approaches the family",
                  "The responsible consultant and transplant coordinator may explore including a faith representative or hospital chaplain to support families during these discussions",
                  "Provides spiritual support, which is part of how most people actually integrate grief",
                ],
              },
              {
                id: "recovery-technicians",
                role: "Tissue recovery technicians",
                oneLiner: "Trained to recover tissue ethically and respectfully.",
                appearsAt: "Recovery",
                responsibilities: [
                  "Surgically recover tissues",
                  "Trained specifically to do so in an ethical and respectful manner",
                ],
              },
              {
                id: "odf",
                role: "Organ Donor Foundation (ODF)",
                oneLiner: "The national umbrella body for awareness and the donor database.",
                appearsAt: "Before the pathway begins",
                isOrganisation: true,
                externalUrl: "https://odf.org.za",
                responsibilities: [
                  "Serves as the national umbrella body for promoting awareness of organ donation",
                  "Manages the national donor database",
                  "The right place to send anyone who wants to register, or who asks for current national figures",
                ],
              },
              {
                id: "satcs",
                role: "South African Transplant Coordinators Society (SATCS)",
                oneLiner: "Represents, unites and supports transplant coordinators nationally.",
                isOrganisation: true,
                responsibilities: [
                  "Exists to represent, unite and support all transplant coordinators in the country",
                  "Publishes the Organ and Tissue Donation Reference File — the Red File — used throughout this course",
                ],
              },
              {
                id: "save7",
                role: "Save7",
                oneLiner: "Awareness, education and donor support — including the LifePod.",
                isOrganisation: true,
                externalUrl: "https://save7.org",
                responsibilities: [
                  "Raises public awareness and enables donor registration",
                  "Runs the LifePod, a dedicated support unit for consented organ donors",
                  "Produced this course, the Journey of a Gift film, and the 7 Lives in 7 Steps referral pathway",
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
                text: "The transplant coordinator is the central figure: donor assessment, donor management, and coordination of the whole process.",
              },
              {
                id: "t2",
                text: "The two doctors who certify brain death are independent of the transplant team by law. This is the structural answer to the most common public fear.",
              },
              {
                id: "t3",
                text: "The team that meets a family typically includes a doctor, a nursing sister and a transplant coordinator, and may include a trauma counsellor, a translator or a faith representative.",
              },
              {
                id: "t4",
                text: "Translators protect the validity of consent, not just the family's comfort — consent that is not understood is not informed consent.",
              },
              {
                id: "t5",
                text: "Identification and referral belong to the primary treatment team, as part of ordinary end-of-life care.",
              },
              {
                id: "t6",
                text: "Two organisations hold the national picture together: the ODF for awareness and the donor database, and SATCS for the coordinators themselves.",
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
            summary: "Objective 3 of the Save7 study guide: know the team involved in transplant.",
            sections: [
              {
                id: "s1",
                heading: "Clinical and coordinating roles",
                bullets: [
                  "The transplant coordinator performs donor assessments, oversees management, and coordinates the entire process",
                  "A tissue donation coordinator is specifically trained to counsel next of kin and obtain consent for tissue-only donations",
                  "Two independent registered medical doctors, who are not part of the transplant team, are legally required to certify brain death",
                  "Trained tissue recovery technicians surgically recover tissues in an ethical and respectful manner",
                  "The primary treatment team — physicians and nurses — is responsible for the initial identification and referral of potential donors as part of end-of-life care",
                ],
              },
              {
                id: "s2",
                heading: "The team that approaches the family",
                body: "Often includes a doctor, a nursing sister and a transplant coordinator, and may include a trauma counsellor, a translator, or a faith representative.",
              },
              {
                id: "s3",
                heading: "The organisations",
                bullets: [
                  "The Organ Donor Foundation (ODF) is the national umbrella body for promoting awareness and managing the donor database",
                  "The South African Transplant Coordinators Society (SATCS) represents, unites and supports all transplant coordinators in the country",
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
            intro: "Where to find the roles described in full.",
            note: 'Anything marked "Opens here" is the document Save7 supplied.',
          },
        },
        { slug: "complete", title: "Complete module", kind: "COMPLETE" },
      ],
    },

    // ---------------------------------------------------------------- M8
    {
      slug: "who-can-donate",
      number: 8,
      title: "Who Can Donate?",
      coreQuestion: "Can I donate if I'm old, sick, or have another medical condition?",
      introMarkdown:
        "More potential donors are lost to self-exclusion than most people realise. Someone decides privately that they would not be eligible, and never mentions it again.\n\nThis module exists to interrupt that. The headline is simple and, unusually, quite definite:\n\n**There is no age restriction for solid organ donation.**\n\nBeyond that, suitability is assessed organ by organ, at the time, by people qualified to do it — and nobody should be excluded from being offered the option to donate.",
      estMinutes: 14,
      lessons: [
        {
          slug: "intro",
          title: "Why this matters",
          kind: "INTRO",
          bodyMarkdown:
            "There is a strong temptation to hand advocates a simple checklist of who can and cannot donate. Mostly that is a bad idea: confident exclusion rules are frequently wrong, and a confident wrong answer from an advocate can permanently remove a potential donor.\n\nBut *mostly* is not *always*, and this module is careful about the difference. Two kinds of statement appear here:\n\n- **Where the guidance states a criterion, this course states it too.** Tissue donation has real age ranges, and pretending otherwise would misreport Save7's own study guide.\n- **Where suitability is a clinical judgement, the honest answer is that it is assessed individually** — which covers age for solid organs, and every comorbidity.\n\nThe framing that survives both: *don't rule anyone out on their behalf.*",
        },
        {
          slug: "does-this-rule-me-out",
          title: '"Does this rule me out?"',
          kind: "PRIMARY",
          componentKey: "EligibilityMatrix",
          payload: {
            intro:
              "The factors people most often rule themselves out for. Open each one to see the assumption people arrive with, and how the question is actually answered.",
            bottomLine:
              "There is no upper age limit for solid organ donation, and hypertension, diabetes and obesity do not disqualify anyone. HIV does not exclude organ donation in South Africa — it has its own established programme — though tissue banks currently do exclude it, which is why the answer depends on what is being donated. Suitability is assessed organ by organ, at the time. Nobody should be excluded from being offered the option to donate.",
            factors: [
              {
                id: "age-solid-organ",
                factor: "Age — solid organs",
                commonAssumption: '"I\'m too old to be a donor."',
                reality:
                  "There is no upper age limit for solid organ donation. Nobody is disqualified by age alone: the organs are assessed at the time of death, and that assessment is what decides. Registering has an age floor rather than a ceiling — 16 to register independently, younger with parental consent.",
                verdict: "rarely-absolute",
              },
              {
                id: "hypertension",
                factor: "High blood pressure",
                commonAssumption: '"I\'m on medication for hypertension, so I\'d be turned down."',
                reality:
                  "Donors with comorbidities such as hypertension are described as extended criteria donors, and may still be eligible if individual organs are assessed as transplantable. It is an assessment, not an exclusion.",
                verdict: "assessed-individually",
              },
              {
                id: "diabetes",
                factor: "Diabetes",
                commonAssumption: '"Diabetics can\'t donate."',
                reality:
                  "Diabetes is one of the comorbidities explicitly named in the extended criteria donor category. Individual organs are assessed for transplantability.",
                verdict: "assessed-individually",
              },
              {
                id: "hiv",
                factor: "HIV",
                commonAssumption: '"Being HIV positive automatically excludes donation."',
                reality:
                  "For **organs**, no — and South Africa led the world here. Groote Schuur Hospital in Cape Town has transplanted kidneys from HIV-positive deceased donors since 2008, into recipients who are themselves HIV positive and on stable treatment with an undetectable viral load. Being HIV positive does not put someone outside donation.\n\nFor **tissue**, the answer is currently different: South African tissue banks list HIV as an exclusion, along with cancer, septicaemia and hepatitis. So the honest answer is *it depends what is being donated* — which is the module\u2019s whole point, and is why an advocate should never answer this from memory.",
                verdict: "assessed-individually",
              },
              {
                id: "cause-of-death",
                factor: "How the person died",
                commonAssumption: '"You can only donate after a car accident."',
                reality:
                  "Common routes to brain death include traumatic head injury, stroke, and cerebral hypoxia following drowning or drug overdose. For tissue donation, eligibility does not depend on the manner of death at all.",
                verdict: "depends",
              },
              {
                id: "tissue-broadly",
                factor: "Tissue donation generally",
                commonAssumption: '"If I can\'t donate organs, I can\'t donate anything."',
                reality:
                  "Tissue donation eligibility is broader than organ donation. It can occur irrespective of the manner of death, and even after the body has been moved to a mortuary.",
                verdict: "rarely-absolute",
              },
              {
                id: "corneas",
                factor: "Corneas",
                commonAssumption: '"My eyesight is terrible, so my corneas are no use."',
                reality:
                  "South African tissue banks give roughly 6 to 65 years, and up to 70 in some cases. Poor eyesight and cataracts do not disqualify a donor. Corneas can be recovered after either a natural or an unnatural death, but the window is short — around 12 hours. Previous laser eye surgery, tuberculosis, lymphoma and leukaemia are contraindications.",
                verdict: "stated-criteria",
              },
              {
                id: "skin-and-bone",
                factor: "Skin and bone",
                commonAssumption: '"Surely there\'s an age limit."',
                reality:
                  "South African tissue banks give roughly 15 or 16 up to 80 years, for donors without cancer, septicaemia, hepatitis or HIV. The recovery window is longer than for corneas — bone up to about five days after death.",
                verdict: "stated-criteria",
              },
              {
                id: "heart-valves",
                factor: "Heart valves",
                commonAssumption: '"Only adults can donate heart valves."',
                reality:
                  "Valve criteria are narrower than for bone or skin, and they are set by the tissue bank rather than by law — published South African criteria group heart valves with bone and skin, and paediatric valves are used where they are available. Treat any specific age range you are given as that bank\u2019s, and check it with them rather than quoting it from a course.",
                verdict: "stated-criteria",
              },
              {
                id: "organ-specific",
                factor: "Organ-by-organ assessment",
                commonAssumption: '"It\'s all or nothing — either you can donate everything or nothing."',
                reality:
                  "It is not all or nothing. Extended criteria donors may be eligible where individual organs are assessed as transplantable, so being unsuitable for one donation does not mean being unsuitable for all.",
                verdict: "depends",
              },
            ],
          },
        },
        {
          slug: "who-is-a-potential-donor",
          title: "Who becomes a potential donor",
          kind: "PRIMARY",
          componentKey: "ComparePanel",
          payload: {
            intro:
              "Eligibility depends partly on the route to donation. The same person can be eligible by one route and not another.",
            columns: [
              { id: "dbd", label: "After brain death", emphasis: true },
              { id: "dcd", label: "After circulatory death" },
              { id: "living", label: "Living donation" },
              { id: "tissue", label: "Tissue donation" },
            ],
            rows: [
              {
                id: "who",
                label: "Who may be considered",
                cells: {
                  dbd: "Any patient declared brain dead — irreversible structural brain damage with total loss of brainstem function — on a mechanical ventilator.",
                  dcd: "Patients in palliative care settings where treatment is withdrawn and death is imminent.",
                  living: "Someone making a conscious decision to donate, who is assessed as fit to do so.",
                  tissue: "Far wider. Eligibility does not depend on the manner of death, and donation is possible even after transfer to a mortuary.",
                },
              },
              {
                id: "typical-cause",
                label: "Typical route there",
                cells: {
                  dbd: "Traumatic head injury, stroke, or cerebral hypoxia from drowning or drug overdose.",
                  dcd: "A decision to withdraw life-sustaining treatment, where death is expected to follow.",
                  living: "A planned decision, often to help a relative.",
                  tissue: "Any manner of death.",
                },
              },
              {
                id: "age",
                label: "Age",
                cells: {
                  dbd: "No age restriction for solid organ donation.",
                  dcd: "No age restriction for solid organ donation.",
                  living: "Assessed as part of the donor work-up.",
                  tissue: "Stated ranges apply, set by the tissue bank rather than by law: corneas generally 6–65 (up to 70 in some cases); skin and bone roughly 15 or 16 to 80. Heart valve limits differ between banks — ask them rather than quoting a range.",
                },
              },
              {
                id: "comorbidities",
                label: "Comorbidities",
                cells: {
                  dbd: "Extended criteria donors with hypertension, diabetes or HIV may still be eligible if individual organs are assessed as transplantable.",
                  dcd: "Assessed individually, as above.",
                  living: "Assessed thoroughly before any donation proceeds.",
                  tissue: "Skin and bone donors are typically without infectious disease or cancer.",
                },
              },
            ],
            bottomLine:
              "Different routes have different requirements, and none of them can be assessed in advance by a member of the public — or by the potential donor themselves.",
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
                text: "There is no age restriction for solid organ donation.",
              },
              {
                id: "t2",
                text: "Extended criteria donors with hypertension, diabetes or HIV may still be eligible if individual organs are assessed as transplantable.",
              },
              {
                id: "t3",
                text: "Tissue donation is broader than organ donation: irrespective of the manner of death, and possible even after the body has been moved to a mortuary.",
              },
              {
                id: "t4",
                text: "Tissue does have stated ranges, set by the bank rather than by law — corneas generally 6–65, skin and bone roughly 15 or 16 to 80. Heart valve limits vary between banks.",
              },
              {
                id: "t5",
                text: "Poor eyesight and cataracts do not disqualify a cornea donor.",
              },
              {
                id: "t6",
                text: "Self-exclusion is a real and invisible loss point. Do not rule anyone out on their behalf, and do not overcorrect by claiming a condition is irrelevant.",
              },
              {
                id: "t7",
                text: "Nobody should be excluded from being offered the option to donate.",
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
              "Objective 5 of the Save7 study guide: know when someone is eligible for organ donation.",
            sections: [
              {
                id: "s1",
                heading: "Who is a potential organ donor",
                body: "Any patient who is declared brain dead — irreversible structural brain damage with total loss of brainstem function — is a potential organ donor. Common causes of eligibility through brain death include traumatic head injuries, strokes, and cerebral hypoxia from drowning or drug overdose.",
              },
              {
                id: "s2",
                heading: "By route",
                bullets: [
                  "Donation after brain death (DBD) — a patient on a mechanical ventilator declared brain dead by two doctors",
                  "Donation after circulatory death (DCD) — possible in palliative care settings where treatment is withdrawn and death is imminent",
                  "Living donation — a conscious decision to donate a kidney or a liver segment",
                  "Tissue donation — irrespective of the manner of death, and even after transfer to a mortuary",
                ],
              },
              {
                id: "s3",
                heading: "Age and comorbidities",
                bullets: [
                  "There is no age restriction for solid organ donation",
                  "Extended criteria donors with comorbidities such as hypertension, diabetes or HIV may still be eligible if individual organs are assessed as transplantable",
                ],
              },
              {
                id: "s4",
                heading: "Tissue-specific criteria",
                bullets: [
                  "Cornea donors are generally between 6 and 65 years old; poor eyesight and cataracts do not disqualify them",
                  "Skin and bone donors are typically healthy individuals between 16 and 80, without infectious diseases or cancer",
                  "Heart valve donors are eligible from 6 months up to 55 years",
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
            intro: "Where the eligibility criteria come from.",
            note: "Current guidance matters here — older sources carry exclusion criteria that no longer reflect practice.",
          },
        },
        { slug: "complete", title: "Complete module", kind: "COMPLETE" },
      ],
    },
  ],
};
