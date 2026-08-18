import type { LessonKind, LevelTier, ResourceType } from "../../src/lib/constants";
import type { LessonPayload } from "../../src/lib/lesson-payloads";

/**
 * Authoring types for the seed.
 *
 * These describe the course as content rather than as database rows: the seed
 * walks this structure and writes it out. Keeping the two separate means the
 * shape Save7 edits stays readable even as the schema grows.
 */

export type LessonSeed = {
  slug: string;
  title: string;
  kind: LessonKind;
  bodyMarkdown?: string;
  componentKey?: string;
  payload?: LessonPayload;
};

export type ModuleSeed = {
  slug: string;
  /** Display number as the learner sees it, e.g. 6 for "Module 6". */
  number: number;
  title: string;
  coreQuestion: string;
  introMarkdown: string;
  estMinutes: number;
  isMandatory?: boolean;
  lessons: LessonSeed[];
};

export type LevelSeed = {
  slug: string;
  tier: LevelTier;
  title: string;
  strapline: string;
  goal: string;
  estMinMinutes: number;
  estMaxMinutes: number;
  accentToken: string;
  certificateTitle: string;
  certificateCode: string;
  passMarkPct: number;
  modules: ModuleSeed[];
};

export type ResourceSeed = {
  /** Stable authoring identifier, used for idempotent re-seeding. */
  key: string;
  /** Module slug this belongs to, or null for course-wide. */
  moduleSlug: string | null;
  title: string;
  description?: string;
  type: ResourceType;
  isRequired?: boolean;
  source?: string;
  author?: string;
  externalUrl?: string;
  filePath?: string;
  /** True while the citation is incomplete, awaiting Save7's reference list. */
  isStub?: boolean;
  licenceNote?: string;
};

export type ChoiceSeed = {
  text: string;
  isCorrect?: boolean;
  feedback?: string;
};

export type QuestionSeed = {
  /** Stable authoring key, used for idempotent re-seeding. */
  key: string;
  scope: "PRE" | "POST" | "CHECK";
  kind: "SINGLE" | "MULTI" | "TRUE_FALSE" | "SCENARIO";
  /** Level slug for PRE/POST; CHECK questions use moduleSlug instead. */
  levelSlug?: string;
  moduleSlug?: string;
  scenario?: string;
  prompt: string;
  explanation: string;
  topicTag: string;
  difficulty?: 1 | 2 | 3;
  /** Links a POST item to its PRE counterpart so improvement is measured fairly. */
  pairKey?: string;
  choices: ChoiceSeed[];
};

export type ReviewSeed = {
  entityType: "LESSON" | "QUESTION" | "RESOURCE" | "MODULE";
  /** Authoring identifier — the seed resolves this to a real row id. */
  entityRef: string;
  location: string;
  claim: string;
  category: "MEDICAL" | "LEGAL" | "STATISTIC";
  sourceHint?: string;
  severity?: 1 | 2 | 3;
  notes?: string;
};

/** Standard placeholder copy, so every gap in the course reads identically. */
export const AWAITING =
  "_Content pending._ This section will be written from the Save7 study guide and supporting material. It is intentionally blank rather than filled with unverified text.";
