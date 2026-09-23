import type { LevelTier, LessonKind } from "../../src/lib/constants";

/**
 * The Course's structure: three Levels, eleven Stages.
 *
 * This file is the **structural source of truth** — Stage identity, order and
 * Level metadata — settled in wayfinder ticket #33 against
 * CURRICULUM-ASSESSMENT-SPEC.md. The prior build's thirteen modules were a
 * different curriculum outline, not a relabeling of these eleven (#26), so none
 * of their slugs carry over.
 *
 * **The domain says Stage; the schema says `module`.** That split is deliberate
 * and was re-affirmed in #26: no stored key is renamed. `stageSlug` here is
 * written to `learn_modules.slug`, and the mapping happens at this boundary
 * only.
 *
 * **Slugs are permanent.** Lesson identity is `(module_slug, slug)`, not `slug`
 * alone — `intro`, `takeaways`, `study-guide` and the rest recur once per Stage
 * by design. Reading a lesson slug as globally unique is what once collapsed 97
 * lessons into 26 rows.
 *
 * Prose lives in Markdown, not here (#33 Q2): every prose lesson names a
 * `bodyPath` under `content/`, which `loadStageContent()` in ./markdown.ts
 * resolves. What stays in TypeScript is what benefits from being type-checked —
 * question banks, interactive payloads, and `verifiedAgainst` sign-offs — where
 * a silent error is expensive. CHECK lessons carry a question bank rather than
 * prose; COMPLETE is a shell.
 */

export type StageLessonSeed = {
  slug: string;
  title: string;
  kind: LessonKind;
  /** Markdown file holding this lesson's prose, relative to the repo root. */
  bodyPath?: string;
};

export type StageSeed = {
  slug: string;
  /** Display number within its Level. Stage numbering restarts per Level,
   *  because the Certificate is per Level. */
  number: number;
  title: string;
  coreQuestion: string;
  estMinutes: number;
  lessons: StageLessonSeed[];
};

export type LevelStructure = {
  slug: string;
  tier: LevelTier;
  /** The Level name, and nothing else. The prior build's marketing titles
   *  ("Start the Conversation", "Understand the Journey", "Become a Transplant
   *  Advocate") were dropped in #33: the spec puts the Level name on the
   *  Certificate, and "Transplant Advocate" overstated what the holder did. */
  title: string;
  strapline: string;
  goal: string;
  estMinMinutes: number;
  estMaxMinutes: number;
  accentToken: string;
  /** Snapshotted onto an issued Certificate as `learn_certificates.award_title`.
   *  Changing it does not retitle certificates already issued. */
  certificateTitle: string;
  certificateCode: string;
  /** 4 of 5 to pass, per the Assessment Blueprint. Was 70 in the prior build. */
  passMarkPct: number;
  stages: StageSeed[];
};


export const beginnerLevel: LevelStructure = {
  slug: "beginner",
  tier: "BEGINNER",
  title: "Beginner",
  strapline: "For anyone who wants to understand the basics of organ donation.",
  goal: "Understand why donation matters, which common beliefs about it are false, and how it actually works.",
  estMinMinutes: 30,
  estMaxMinutes: 45,
  accentToken: "beginner",
  certificateTitle: "Beginner",
  certificateCode: "B",
  passMarkPct: 80,
  stages: [
    {
      slug: "why-donation-matters",
      number: 1,
      title: "Why Donation Matters",
      coreQuestion: "Why do people need donated organs and tissues, and how short is South Africa?",
      estMinutes: 8,
      lessons: [
        { slug: "intro", title: "Why this matters", kind: "INTRO", bodyPath: "content/beginner/why-donation-matters/intro.md" },
        { slug: "who-is-waiting", title: "Who is waiting", kind: "PRIMARY", bodyPath: "content/beginner/why-donation-matters/who-is-waiting.md" },
        { slug: "takeaways", title: "Key takeaways", kind: "TAKEAWAYS", bodyPath: "content/beginner/why-donation-matters/takeaways.md" },
        { slug: "check", title: "Check your understanding", kind: "CHECK" },
        { slug: "study-guide", title: "Study guide", kind: "STUDY_GUIDE", bodyPath: "content/beginner/why-donation-matters/study-guide.md" },
        { slug: "further-reading", title: "Further reading", kind: "FURTHER_READING", bodyPath: "content/beginner/why-donation-matters/further-reading.md" },
        { slug: "complete", title: "Complete Stage", kind: "COMPLETE" },
      ],
    },
    {
      slug: "busting-the-myths",
      number: 2,
      title: "Busting the Myths",
      coreQuestion: "Which widely-held beliefs about donation are false, and what is actually true?",
      estMinutes: 15,
      lessons: [
        { slug: "intro", title: "Why this matters", kind: "INTRO", bodyPath: "content/beginner/busting-the-myths/intro.md" },
        { slug: "the-twelve-myths", title: "The twelve myths", kind: "PRIMARY", bodyPath: "content/beginner/busting-the-myths/the-twelve-myths.md" },
        { slug: "takeaways", title: "Key takeaways", kind: "TAKEAWAYS", bodyPath: "content/beginner/busting-the-myths/takeaways.md" },
        { slug: "check", title: "Check your understanding", kind: "CHECK" },
        { slug: "study-guide", title: "Study guide", kind: "STUDY_GUIDE", bodyPath: "content/beginner/busting-the-myths/study-guide.md" },
        { slug: "further-reading", title: "Further reading", kind: "FURTHER_READING", bodyPath: "content/beginner/busting-the-myths/further-reading.md" },
        { slug: "complete", title: "Complete Stage", kind: "COMPLETE" },
      ],
    },
    {
      slug: "how-donation-works",
      number: 3,
      title: "How Donation Actually Works",
      coreQuestion: "In plain language, how does donation actually happen?",
      estMinutes: 8,
      lessons: [
        { slug: "intro", title: "Why this matters", kind: "INTRO", bodyPath: "content/beginner/how-donation-works/intro.md" },
        { slug: "routes-to-donation", title: "Routes to donation", kind: "PRIMARY", bodyPath: "content/beginner/how-donation-works/routes-to-donation.md" },
        { slug: "takeaways", title: "Key takeaways", kind: "TAKEAWAYS", bodyPath: "content/beginner/how-donation-works/takeaways.md" },
        { slug: "check", title: "Check your understanding", kind: "CHECK" },
        { slug: "study-guide", title: "Study guide", kind: "STUDY_GUIDE", bodyPath: "content/beginner/how-donation-works/study-guide.md" },
        { slug: "further-reading", title: "Further reading", kind: "FURTHER_READING", bodyPath: "content/beginner/how-donation-works/further-reading.md" },
        { slug: "complete", title: "Complete Stage", kind: "COMPLETE" },
      ],
    },
  ],
};

export const intermediateLevel: LevelStructure = {
  slug: "intermediate",
  tier: "INTERMEDIATE",
  title: "Intermediate",
  strapline: "For learners who want to understand how donation and transplantation actually work.",
  goal: "Move beyond basic awareness and understand how organ donation actually works in South Africa.",
  estMinMinutes: 45,
  estMaxMinutes: 60,
  accentToken: "intermediate",
  certificateTitle: "Intermediate",
  certificateCode: "I",
  passMarkPct: 80,
  stages: [
    {
      slug: "how-donation-happens",
      number: 1,
      title: "How Donation Happens: The Process",
      coreQuestion: "From referral to recovery, how does the donation process actually run?",
      estMinutes: 15,
      lessons: [
        { slug: "intro", title: "Why this matters", kind: "INTRO", bodyPath: "content/intermediate/how-donation-happens/intro.md" },
        { slug: "determining-death", title: "Determining death", kind: "PRIMARY", bodyPath: "content/intermediate/how-donation-happens/determining-death.md" },
        { slug: "the-process-end-to-end", title: "The process end to end", kind: "PRIMARY", bodyPath: "content/intermediate/how-donation-happens/the-process-end-to-end.md" },
        { slug: "takeaways", title: "Key takeaways", kind: "TAKEAWAYS", bodyPath: "content/intermediate/how-donation-happens/takeaways.md" },
        { slug: "check", title: "Check your understanding", kind: "CHECK" },
        { slug: "study-guide", title: "Study guide", kind: "STUDY_GUIDE", bodyPath: "content/intermediate/how-donation-happens/study-guide.md" },
        { slug: "further-reading", title: "Further reading", kind: "FURTHER_READING", bodyPath: "content/intermediate/how-donation-happens/further-reading.md" },
        { slug: "complete", title: "Complete Stage", kind: "COMPLETE" },
      ],
    },
    {
      slug: "consent-whose-decision",
      number: 2,
      title: "Consent: Whose Decision and How",
      coreQuestion: "Who may consent to donation, and what does registering actually guarantee?",
      estMinutes: 10,
      lessons: [
        { slug: "intro", title: "Why this matters", kind: "INTRO", bodyPath: "content/intermediate/consent-whose-decision/intro.md" },
        { slug: "who-decides", title: "Who decides", kind: "PRIMARY", bodyPath: "content/intermediate/consent-whose-decision/who-decides.md" },
        { slug: "takeaways", title: "Key takeaways", kind: "TAKEAWAYS", bodyPath: "content/intermediate/consent-whose-decision/takeaways.md" },
        { slug: "check", title: "Check your understanding", kind: "CHECK" },
        { slug: "study-guide", title: "Study guide", kind: "STUDY_GUIDE", bodyPath: "content/intermediate/consent-whose-decision/study-guide.md" },
        { slug: "further-reading", title: "Further reading", kind: "FURTHER_READING", bodyPath: "content/intermediate/consent-whose-decision/further-reading.md" },
        { slug: "complete", title: "Complete Stage", kind: "COMPLETE" },
      ],
    },
    {
      slug: "sa-legal-framework",
      number: 3,
      title: "The South African Legal Framework",
      coreQuestion: "What does South African law actually require for donation?",
      estMinutes: 12,
      lessons: [
        { slug: "intro", title: "Why this matters", kind: "INTRO", bodyPath: "content/intermediate/sa-legal-framework/intro.md" },
        { slug: "the-law-and-the-regulations", title: "The law and the regulations", kind: "PRIMARY", bodyPath: "content/intermediate/sa-legal-framework/the-law-and-the-regulations.md" },
        { slug: "takeaways", title: "Key takeaways", kind: "TAKEAWAYS", bodyPath: "content/intermediate/sa-legal-framework/takeaways.md" },
        { slug: "check", title: "Check your understanding", kind: "CHECK" },
        { slug: "study-guide", title: "Study guide", kind: "STUDY_GUIDE", bodyPath: "content/intermediate/sa-legal-framework/study-guide.md" },
        { slug: "further-reading", title: "Further reading", kind: "FURTHER_READING", bodyPath: "content/intermediate/sa-legal-framework/further-reading.md" },
        { slug: "complete", title: "Complete Stage", kind: "COMPLETE" },
      ],
    },
    {
      slug: "ethics-and-end-of-life",
      number: 4,
      title: "Ethics of Donation and End-of-Life Care",
      coreQuestion: "How does donation sit alongside end-of-life care, and what makes it ethical?",
      estMinutes: 12,
      lessons: [
        { slug: "intro", title: "Why this matters", kind: "INTRO", bodyPath: "content/intermediate/ethics-and-end-of-life/intro.md" },
        { slug: "ethics-in-practice", title: "Ethics in practice", kind: "PRIMARY", bodyPath: "content/intermediate/ethics-and-end-of-life/ethics-in-practice.md" },
        { slug: "takeaways", title: "Key takeaways", kind: "TAKEAWAYS", bodyPath: "content/intermediate/ethics-and-end-of-life/takeaways.md" },
        { slug: "check", title: "Check your understanding", kind: "CHECK" },
        { slug: "study-guide", title: "Study guide", kind: "STUDY_GUIDE", bodyPath: "content/intermediate/ethics-and-end-of-life/study-guide.md" },
        { slug: "further-reading", title: "Further reading", kind: "FURTHER_READING", bodyPath: "content/intermediate/ethics-and-end-of-life/further-reading.md" },
        { slug: "complete", title: "Complete Stage", kind: "COMPLETE" },
      ],
    },
  ],
};

export const advancedLevel: LevelStructure = {
  slug: "advanced",
  tier: "ADVANCED",
  title: "Advanced",
  strapline: "For healthcare-adjacent learners who advocate for donation in practice.",
  goal: "Work confidently with the donation conversation, the consent framework, and public advocacy.",
  estMinMinutes: 55,
  estMaxMinutes: 75,
  accentToken: "advanced",
  certificateTitle: "Advanced",
  certificateCode: "A",
  passMarkPct: 80,
  stages: [
    {
      slug: "coordinator-role",
      number: 1,
      title: "The Transplant/Donation Coordinator's Role",
      coreQuestion: "What does a transplant or donation coordinator actually do, and when?",
      estMinutes: 10,
      lessons: [
        { slug: "intro", title: "Why this matters", kind: "INTRO", bodyPath: "content/advanced/coordinator-role/intro.md" },
        { slug: "the-coordinator-role", title: "The coordinator role", kind: "PRIMARY", bodyPath: "content/advanced/coordinator-role/the-coordinator-role.md" },
        { slug: "takeaways", title: "Key takeaways", kind: "TAKEAWAYS", bodyPath: "content/advanced/coordinator-role/takeaways.md" },
        { slug: "check", title: "Check your understanding", kind: "CHECK" },
        { slug: "study-guide", title: "Study guide", kind: "STUDY_GUIDE", bodyPath: "content/advanced/coordinator-role/study-guide.md" },
        { slug: "further-reading", title: "Further reading", kind: "FURTHER_READING", bodyPath: "content/advanced/coordinator-role/further-reading.md" },
        { slug: "complete", title: "Complete Stage", kind: "COMPLETE" },
      ],
    },
    {
      slug: "donation-conversation",
      number: 2,
      title: "Having the Donation Conversation",
      coreQuestion: "How is the donation conversation actually conducted with a family?",
      estMinutes: 15,
      lessons: [
        { slug: "intro", title: "Why this matters", kind: "INTRO", bodyPath: "content/advanced/donation-conversation/intro.md" },
        { slug: "the-conversation-framework", title: "The conversation framework", kind: "PRIMARY", bodyPath: "content/advanced/donation-conversation/the-conversation-framework.md" },
        { slug: "takeaways", title: "Key takeaways", kind: "TAKEAWAYS", bodyPath: "content/advanced/donation-conversation/takeaways.md" },
        { slug: "check", title: "Check your understanding", kind: "CHECK" },
        { slug: "study-guide", title: "Study guide", kind: "STUDY_GUIDE", bodyPath: "content/advanced/donation-conversation/study-guide.md" },
        { slug: "further-reading", title: "Further reading", kind: "FURTHER_READING", bodyPath: "content/advanced/donation-conversation/further-reading.md" },
        { slug: "complete", title: "Complete Stage", kind: "COMPLETE" },
      ],
    },
    {
      slug: "consent-ethics-in-depth",
      number: 3,
      title: "Consent and End-of-Life Ethics, In Depth",
      coreQuestion: "At depth, what makes consent to donation valid?",
      estMinutes: 12,
      lessons: [
        { slug: "intro", title: "Why this matters", kind: "INTRO", bodyPath: "content/advanced/consent-ethics-in-depth/intro.md" },
        { slug: "consent-at-depth", title: "Consent at depth", kind: "PRIMARY", bodyPath: "content/advanced/consent-ethics-in-depth/consent-at-depth.md" },
        { slug: "takeaways", title: "Key takeaways", kind: "TAKEAWAYS", bodyPath: "content/advanced/consent-ethics-in-depth/takeaways.md" },
        { slug: "check", title: "Check your understanding", kind: "CHECK" },
        { slug: "study-guide", title: "Study guide", kind: "STUDY_GUIDE", bodyPath: "content/advanced/consent-ethics-in-depth/study-guide.md" },
        { slug: "further-reading", title: "Further reading", kind: "FURTHER_READING", bodyPath: "content/advanced/consent-ethics-in-depth/further-reading.md" },
        { slug: "complete", title: "Complete Stage", kind: "COMPLETE" },
      ],
    },
    {
      slug: "public-advocacy",
      number: 4,
      title: "Public Advocacy: Equity, Media, and Community Trust",
      coreQuestion: "How is donation advocated for in public without breaking trust?",
      estMinutes: 12,
      lessons: [
        { slug: "intro", title: "Why this matters", kind: "INTRO", bodyPath: "content/advanced/public-advocacy/intro.md" },
        { slug: "advocacy-in-public", title: "Advocacy in public", kind: "PRIMARY", bodyPath: "content/advanced/public-advocacy/advocacy-in-public.md" },
        { slug: "takeaways", title: "Key takeaways", kind: "TAKEAWAYS", bodyPath: "content/advanced/public-advocacy/takeaways.md" },
        { slug: "check", title: "Check your understanding", kind: "CHECK" },
        { slug: "study-guide", title: "Study guide", kind: "STUDY_GUIDE", bodyPath: "content/advanced/public-advocacy/study-guide.md" },
        { slug: "further-reading", title: "Further reading", kind: "FURTHER_READING", bodyPath: "content/advanced/public-advocacy/further-reading.md" },
        { slug: "complete", title: "Complete Stage", kind: "COMPLETE" },
      ],
    },
  ],
};

/** The Course, in order. */
export const courseStructure: LevelStructure[] = [
  beginnerLevel,
  intermediateLevel,
  advancedLevel,
];
