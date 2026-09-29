import type { ResourceType } from "../../src/lib/constants";

/**
 * Authoring types for the seed.
 *
 * These describe the course as content rather than as database rows: the seed
 * walks this structure and writes it out. Keeping the two separate means the
 * shape Save7 edits stays readable even as the schema grows.
 */

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
  /** The source this citation was confirmed against. */
  verifiedAgainst?: VerifiedAgainst;
};

export type ChoiceSeed = {
  text: string;
  isCorrect?: boolean;
  feedback?: string;
};

/**
 * A recorded sign-off.
 *
 * The review register is derived from the content, so a claim cannot enter the
 * course without entering the queue. This is the other half of that: the source a
 * claim was checked against, recorded next to the claim rather than in someone's
 * memory or a spreadsheet.
 *
 * A claim carrying this is emitted as APPROVED with the source in its notes. A
 * claim carrying neither this nor a correction stays NEEDS_VERIFICATION. Nothing
 * is ever cleared by having been looked at — only by naming what it was checked
 * against.
 */
export type VerifiedAgainst = string;

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
  /** The source the keyed answer and explanation were checked against. */
  verifiedAgainst?: VerifiedAgainst;
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
  /** APPROVED only where a source is recorded against the claim. */
  status?: "NEEDS_VERIFICATION" | "APPROVED";
};

/** Standard placeholder copy, so every gap in the course reads identically. */
export const AWAITING =
  "_Content pending._ This section will be written from the Save7 study guide and supporting material. It is intentionally blank rather than filled with unverified text.";

/**
 * A volunteer-gate question, imported from the portal by
 * scripts/import-gate-questions.mjs.
 *
 * Separate from `QuestionSeed` for two reasons rather than one flag on it:
 *
 * 1. **`optionKey` is load-bearing here and absent there.** A gate submission
 *    names the option key, and `volunteer_quiz_attempts.answers` has recorded
 *    those keys since 0088 — so the keys are historical data, not presentation.
 * 2. **A gate item has no level, module or `pairKey`.** It is not part of the
 *    course's measured pre/post pair; it is the organisation's vetting gate,
 *    which passes or fails at 15 of 20 and reports no improvement.
 *
 * `position` is authored order only. The correct answer is option "a" in all
 * forty, which is why **the renderer must shuffle per render** — the portal has
 * always done so, and a client that sorts by key would show the answer first
 * every time.
 */
export type GateQuestionSeed = {
  key: string;
  scope: "GATE";
  gate: "clinical" | "basics";
  kind: "SINGLE";
  topicTag: string;
  position: number;
  prompt: string;
  explanation: string;
  /** The source the keyed answer and explanation were checked against. */
  verifiedAgainst?: VerifiedAgainst;
  choices: Array<{
    optionKey: string;
    position: number;
    text: string;
    isCorrect?: boolean;
  }>;
};
