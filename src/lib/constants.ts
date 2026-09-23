/**
 * Enum-like domain values.
 *
 * SQLite cannot store Prisma enums, so every enum-ish column in the schema is a
 * String. These unions are what actually enforce the contract — import them
 * anywhere a value is read or written so a typo fails at compile time rather
 * than quietly writing rubbish to the database. When the datasource becomes
 * Postgres these can be promoted to real enums without touching call sites.
 */

export const USER_ROLES = ["LEARNER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const LEVEL_TIERS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export type LevelTier = (typeof LEVEL_TIERS)[number];

/** The seven-part spine every module follows. Order is data, not code. */
export const LESSON_KINDS = [
  "INTRO",
  "PRIMARY",
  "TAKEAWAYS",
  "CHECK",
  "STUDY_GUIDE",
  "FURTHER_READING",
  "COMPLETE",
] as const;
export type LessonKind = (typeof LESSON_KINDS)[number];

export const LESSON_KIND_LABELS: Record<LessonKind, string> = {
  INTRO: "Why this matters",
  PRIMARY: "Learn",
  TAKEAWAYS: "Key takeaways",
  CHECK: "Check your understanding",
  STUDY_GUIDE: "Study guide",
  FURTHER_READING: "Further reading",
  COMPLETE: "Complete module",
};

export const RESOURCE_TYPES = [
  "VIDEO",
  "AUDIO",
  "PDF",
  "ARTICLE",
  "WEBSITE",
  "ACADEMIC_PAPER",
  "INFOGRAPHIC",
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  VIDEO: "Video",
  AUDIO: "Audio",
  PDF: "PDF",
  ARTICLE: "Article",
  WEBSITE: "Website",
  ACADEMIC_PAPER: "Academic paper",
  INFOGRAPHIC: "Infographic",
};

export const QUIZ_SCOPES = ["PRE", "POST", "CHECK"] as const;

/**
 * Questions on one Stage Quiz paper (#8's Blueprint: 5 drawn from a Stage's 15).
 * The draw itself is `learn_start_stage_quiz()`'s; this is for copy shown before
 * a paper exists.
 */
export const STAGE_QUIZ_SIZE = 5;
export type QuizScope = (typeof QUIZ_SCOPES)[number];

export const QUESTION_KINDS = ["SINGLE", "MULTI", "TRUE_FALSE", "SCENARIO"] as const;
export type QuestionKind = (typeof QUESTION_KINDS)[number];

export const PROGRESS_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETE"] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

export const REVIEW_STATUSES = ["NEEDS_VERIFICATION", "APPROVED", "REJECTED"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_CATEGORIES = ["MEDICAL", "LEGAL", "STATISTIC"] as const;
export type ReviewCategory = (typeof REVIEW_CATEGORIES)[number];

export const REVIEW_ENTITY_TYPES = ["LESSON", "QUESTION", "RESOURCE", "MODULE"] as const;
export type ReviewEntityType = (typeof REVIEW_ENTITY_TYPES)[number];

/**
 * Per-field cap on a learner's first name and surname.
 *
 * Lives here rather than in profile.ts because the signup and profile forms are
 * client components and profile.ts is server-only — but the form's maxLength and
 * the server's validation must be the same number.
 */
export const NAME_MAX = 60;

export const EVENT_TYPES = [
  "level_start",
  "lesson_view",
  "module_complete",
  "quiz_start",
  "quiz_submit",
  "certificate_issue",
  "video_progress",
  "profile_update",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** Interactive components a lesson may render. Keys live in Lesson.componentKey. */
export const COMPONENT_KEYS = [
  "OrganExplorer",
  "PathwayJourney",
  "MythFlip",
  "ScenarioDialogue",
  "ComparePanel",
  "TeamRoster",
  "EligibilityMatrix",
  "ChapterVideo",
  "QuizBlock",
  "TakeawayList",
  "ResourceList",
] as const;
export type ComponentKey = (typeof COMPONENT_KEYS)[number];

/** The one course this deployment ships with. Others are rows, not constants. */
export const COURSE_SLUG = "transplant-alchemy-101";

/** Level accent styling, kept in one place so tiers look consistent everywhere. */
export const TIER_STYLES: Record<
  LevelTier,
  { dot: string; text: string; bg: string; border: string; ring: string }
> = {
  BEGINNER: {
    dot: "bg-level-beginner",
    text: "text-level-beginner",
    bg: "bg-level-beginner-soft",
    border: "border-teal-100",
    ring: "ring-teal-500/30",
  },
  INTERMEDIATE: {
    dot: "bg-level-intermediate",
    text: "text-level-intermediate",
    bg: "bg-level-intermediate-soft",
    border: "border-amber-100",
    ring: "ring-amber-500/30",
  },
  ADVANCED: {
    dot: "bg-level-advanced",
    text: "text-level-advanced",
    bg: "bg-level-advanced-soft",
    border: "border-pink-100",
    ring: "ring-pink-500/30",
  },
};
