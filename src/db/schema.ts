import { relations } from "drizzle-orm";
import {
  customType,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

/**
 * Save7 Learning Platform — data model.
 *
 * This mirrors the previous Prisma schema exactly, table for table and column for
 * column, so that moving to Drizzle needed no data migration: the SQL in
 * prisma/d1-migrations/0001_init.sql still creates this schema, and an existing
 * database keeps working untouched.
 *
 * Why Drizzle at all: Prisma 7 compiles queries with WebAssembly, and Cloudflare
 * Workers forbids instantiating WASM from a buffer. Drizzle emits SQL directly,
 * so it runs on Workers with D1 and on Node with SQLite from one definition.
 *
 * Two conventions inherited from the Prisma era, both deliberate:
 *
 *   - Enum-like columns are TEXT constrained by TypeScript unions in
 *     src/lib/constants.ts, and lists are JSON text. SQLite has no enums or
 *     arrays. Nothing about the data's shape changes if it ever moves to
 *     Postgres.
 *   - Timestamps are ISO-8601 text with an explicit +00:00 offset, which is what
 *     Prisma wrote. Keeping the format identical means existing rows sort and
 *     compare correctly alongside new ones.
 *
 * The model is multi-course: nothing is hardcoded to Transplant Alchemy 101.
 */

/**
 * A timestamp stored as ISO-8601 text, e.g. `2026-08-18T14:30:00.000+00:00`.
 *
 * Note that the SQL carries `DEFAULT CURRENT_TIMESTAMP` on several of these
 * columns, but SQLite renders that as `2026-08-18 14:30:00` — no `T`, no
 * milliseconds — which would not round-trip. Every insert therefore supplies its
 * own value via `$defaultFn`, and the SQL default is never allowed to fire.
 */
const timestamp = customType<{ data: Date; driverData: string }>({
  dataType: () => "datetime",
  toDriver: (value) => value.toISOString().replace(/Z$/, "+00:00"),
  fromDriver: (value) => new Date(value),
});

/** Primary key: a cuid, matching the ids Prisma generated. */
const pk = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => createId());

/** `createdAt` / `startedAt`: set once, on insert. */
const createdAt = (name: string) =>
  timestamp(name)
    .notNull()
    .$defaultFn(() => new Date());

/** `updatedAt`: set on insert and refreshed on every update. */
const updatedAt = () =>
  timestamp("updatedAt")
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date());

// --- People ----------------------------------------------------------------

export const users = sqliteTable(
  "User",
  {
    id: pk(),
    email: text("email").notNull(),
    /**
     * The composed full name, e.g. "Zubayr Parak".
     *
     * Kept as the single display name because certificates, the admin dashboards
     * and the session all read it, and a certificate's name has to be one string.
     * Always derived from firstName + lastName — never set directly.
     */
    name: text("name").notNull(),
    /**
     * The parts the learner actually edits, on /profile.
     *
     * Nullable because accounts created before this existed had only `name`;
     * migration 0002 backfills them by splitting on the first space, which is a
     * guess the learner can correct.
     */
    firstName: text("firstName"),
    lastName: text("lastName"),
    passwordHash: text("passwordHash").notNull(),
    /** LEARNER | ADMIN — see UserRole in src/lib/constants.ts. */
    role: text("role").notNull().default("LEARNER"),
    /** When POPIA consent was given at signup. Null means never consented. */
    popiaConsentAt: timestamp("popiaConsentAt"),
    createdAt: createdAt("createdAt"),
    updatedAt: updatedAt(),
    lastSeenAt: timestamp("lastSeenAt"),
  },
  (t) => [
    uniqueIndex("User_email_key").on(t.email),
    index("User_role_idx").on(t.role),
    index("User_createdAt_idx").on(t.createdAt),
  ],
);

// --- Course structure ------------------------------------------------------

export const courses = sqliteTable(
  "Course",
  {
    id: pk(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    description: text("description"),
    isPublished: integer("isPublished", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt("createdAt"),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("Course_slug_key").on(t.slug)],
);

export const levels = sqliteTable(
  "Level",
  {
    id: pk(),
    courseId: text("courseId")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade", onUpdate: "cascade" }),
    order: integer("order").notNull(),
    slug: text("slug").notNull(),
    /** BEGINNER | INTERMEDIATE | ADVANCED. */
    tier: text("tier").notNull(),
    title: text("title").notNull(),
    strapline: text("strapline").notNull(),
    goal: text("goal").notNull(),
    estMinMinutes: integer("estMinMinutes").notNull(),
    estMaxMinutes: integer("estMaxMinutes").notNull(),
    accentToken: text("accentToken").notNull(),
    certificateTitle: text("certificateTitle").notNull(),
    /** The letter used in certificate ids, e.g. B in S7-2026-B-000123. */
    certificateCode: text("certificateCode").notNull(),
    passMarkPct: integer("passMarkPct").notNull().default(70),
  },
  (t) => [
    index("Level_courseId_idx").on(t.courseId),
    uniqueIndex("Level_courseId_slug_key").on(t.courseId, t.slug),
    uniqueIndex("Level_courseId_order_key").on(t.courseId, t.order),
  ],
);

export const modules = sqliteTable(
  "Module",
  {
    id: pk(),
    levelId: text("levelId")
      .notNull()
      .references(() => levels.id, { onDelete: "cascade", onUpdate: "cascade" }),
    order: integer("order").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    coreQuestion: text("coreQuestion").notNull(),
    introMarkdown: text("introMarkdown").notNull(),
    estMinutes: integer("estMinutes").notNull(),
    isMandatory: integer("isMandatory", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt("createdAt"),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("Module_levelId_idx").on(t.levelId),
    uniqueIndex("Module_levelId_slug_key").on(t.levelId, t.slug),
    uniqueIndex("Module_levelId_order_key").on(t.levelId, t.order),
  ],
);

export const lessons = sqliteTable(
  "Lesson",
  {
    id: pk(),
    moduleId: text("moduleId")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade", onUpdate: "cascade" }),
    order: integer("order").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    /** INTRO | PRIMARY | TAKEAWAYS | CHECK | STUDY_GUIDE | FURTHER_READING | COMPLETE. */
    kind: text("kind").notNull(),
    bodyMarkdown: text("bodyMarkdown"),
    /** Which interactive component renders this lesson, if any. */
    componentKey: text("componentKey"),
    /** The component's props, as JSON. Typed in src/lib/lesson-payloads.ts. */
    payloadJson: text("payloadJson"),
    createdAt: createdAt("createdAt"),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("Lesson_moduleId_idx").on(t.moduleId),
    uniqueIndex("Lesson_moduleId_slug_key").on(t.moduleId, t.slug),
    uniqueIndex("Lesson_moduleId_order_key").on(t.moduleId, t.order),
  ],
);

export const resources = sqliteTable(
  "Resource",
  {
    id: pk(),
    /** Stable authoring identifier, so re-seeding is idempotent across renames. */
    authoringKey: text("authoringKey").notNull(),
    courseId: text("courseId")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade", onUpdate: "cascade" }),
    moduleId: text("moduleId").references(() => modules.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    title: text("title").notNull(),
    description: text("description"),
    type: text("type").notNull(),
    isRequired: integer("isRequired", { mode: "boolean" }).notNull().default(false),
    source: text("source"),
    author: text("author"),
    publishedOn: timestamp("publishedOn"),
    externalUrl: text("externalUrl"),
    filePath: text("filePath"),
    licenceNote: text("licenceNote"),
    /** True while the citation is incomplete and awaiting Save7. */
    isStub: integer("isStub", { mode: "boolean" }).notNull().default(false),
    order: integer("order").notNull().default(0),
    createdAt: createdAt("createdAt"),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("Resource_authoringKey_key").on(t.authoringKey),
    index("Resource_courseId_idx").on(t.courseId),
    index("Resource_moduleId_idx").on(t.moduleId),
  ],
);

// --- Assessment -----------------------------------------------------------

export const questions = sqliteTable(
  "Question",
  {
    id: pk(),
    authoringKey: text("authoringKey").notNull(),
    courseId: text("courseId")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade", onUpdate: "cascade" }),
    levelId: text("levelId").references(() => levels.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    moduleId: text("moduleId").references(() => modules.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    /** PRE | POST | CHECK. */
    scope: text("scope").notNull(),
    /** SINGLE | MULTI | TRUE_FALSE | SCENARIO. */
    kind: text("kind").notNull(),
    prompt: text("prompt").notNull(),
    scenario: text("scenario"),
    explanation: text("explanation").notNull(),
    topicTag: text("topicTag").notNull(),
    difficulty: integer("difficulty").notNull().default(1),
    /**
     * Links a post-assessment item to its pre-course counterpart. This is what
     * makes knowledge improvement honest: we compare matched pairs rather than
     * two unrelated scores.
     */
    pairKey: text("pairKey"),
    order: integer("order").notNull().default(0),
    createdAt: createdAt("createdAt"),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("Question_authoringKey_key").on(t.authoringKey),
    index("Question_courseId_scope_idx").on(t.courseId, t.scope),
    index("Question_levelId_scope_idx").on(t.levelId, t.scope),
    index("Question_moduleId_idx").on(t.moduleId),
    index("Question_pairKey_idx").on(t.pairKey),
  ],
);

export const choices = sqliteTable(
  "Choice",
  {
    id: pk(),
    questionId: text("questionId")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade", onUpdate: "cascade" }),
    order: integer("order").notNull(),
    text: text("text").notNull(),
    /**
     * The answer key. Never selected into anything sent to a browser — see
     * toClientQuestion in src/lib/quiz.ts, which is the only sanctioned path.
     */
    isCorrect: integer("isCorrect", { mode: "boolean" }).notNull().default(false),
    feedback: text("feedback"),
  },
  (t) => [
    index("Choice_questionId_idx").on(t.questionId),
    uniqueIndex("Choice_questionId_order_key").on(t.questionId, t.order),
  ],
);

export const quizAttempts = sqliteTable(
  "QuizAttempt",
  {
    id: pk(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    courseId: text("courseId")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade", onUpdate: "cascade" }),
    levelId: text("levelId").references(() => levels.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    /** PRE | POST. */
    kind: text("kind").notNull(),
    /**
     * Retakes increment this. Only attempt 1 counts toward the knowledge-impact
     * analytics, so a learner cannot inflate Save7's reported improvement by
     * re-sitting an assessment.
     */
    attemptNo: integer("attemptNo").notNull().default(1),
    startedAt: createdAt("startedAt"),
    submittedAt: timestamp("submittedAt"),
    scoreRaw: integer("scoreRaw"),
    scoreMax: integer("scoreMax"),
    scorePct: integer("scorePct"),
  },
  (t) => [
    index("QuizAttempt_userId_kind_idx").on(t.userId, t.kind),
    index("QuizAttempt_courseId_kind_idx").on(t.courseId, t.kind),
    index("QuizAttempt_levelId_kind_idx").on(t.levelId, t.kind),
    index("QuizAttempt_submittedAt_idx").on(t.submittedAt),
  ],
);

export const quizAnswers = sqliteTable(
  "QuizAnswer",
  {
    id: pk(),
    attemptId: text("attemptId")
      .notNull()
      .references(() => quizAttempts.id, { onDelete: "cascade", onUpdate: "cascade" }),
    questionId: text("questionId")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade", onUpdate: "cascade" }),
    choiceIdsJson: text("choiceIdsJson").notNull().default("[]"),
    freeText: text("freeText"),
    isCorrect: integer("isCorrect", { mode: "boolean" }).notNull(),
    answeredAt: createdAt("answeredAt"),
  },
  (t) => [
    index("QuizAnswer_questionId_isCorrect_idx").on(t.questionId, t.isCorrect),
    uniqueIndex("QuizAnswer_attemptId_questionId_key").on(t.attemptId, t.questionId),
  ],
);

// --- Progress -------------------------------------------------------------

export const moduleProgress = sqliteTable(
  "ModuleProgress",
  {
    id: pk(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    moduleId: text("moduleId")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade", onUpdate: "cascade" }),
    /** IN_PROGRESS | COMPLETE. */
    status: text("status").notNull().default("IN_PROGRESS"),
    completedLessonsJson: text("completedLessonsJson").notNull().default("[]"),
    secondsSpent: integer("secondsSpent").notNull().default(0),
    lastLessonId: text("lastLessonId").references(() => lessons.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    startedAt: createdAt("startedAt"),
    updatedAt: updatedAt(),
    completedAt: timestamp("completedAt"),
  },
  (t) => [
    index("ModuleProgress_moduleId_status_idx").on(t.moduleId, t.status),
    uniqueIndex("ModuleProgress_userId_moduleId_key").on(t.userId, t.moduleId),
  ],
);

export const levelProgress = sqliteTable(
  "LevelProgress",
  {
    id: pk(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    levelId: text("levelId")
      .notNull()
      .references(() => levels.id, { onDelete: "cascade", onUpdate: "cascade" }),
    status: text("status").notNull().default("IN_PROGRESS"),
    percentComplete: integer("percentComplete").notNull().default(0),
    startedAt: createdAt("startedAt"),
    updatedAt: updatedAt(),
    completedAt: timestamp("completedAt"),
  },
  (t) => [
    index("LevelProgress_levelId_status_idx").on(t.levelId, t.status),
    uniqueIndex("LevelProgress_userId_levelId_key").on(t.userId, t.levelId),
  ],
);

export const courseProgress = sqliteTable(
  "CourseProgress",
  {
    id: pk(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    courseId: text("courseId")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade", onUpdate: "cascade" }),
    status: text("status").notNull().default("IN_PROGRESS"),
    percentComplete: integer("percentComplete").notNull().default(0),
    /** Set when the baseline quiz is submitted. Gates it to a single sitting. */
    baselineDoneAt: timestamp("baselineDoneAt"),
    startedAt: createdAt("startedAt"),
    updatedAt: updatedAt(),
    completedAt: timestamp("completedAt"),
  },
  (t) => [
    index("CourseProgress_courseId_status_idx").on(t.courseId, t.status),
    uniqueIndex("CourseProgress_userId_courseId_key").on(t.userId, t.courseId),
  ],
);

// --- Certificates ---------------------------------------------------------

export const certificates = sqliteTable(
  "Certificate",
  {
    id: pk(),
    /** The public verification id, e.g. S7-2026-B-000123. */
    publicId: text("publicId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    courseId: text("courseId")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade", onUpdate: "cascade" }),
    levelId: text("levelId")
      .notNull()
      .references(() => levels.id, { onDelete: "cascade", onUpdate: "cascade" }),
    /**
     * Name and award title are snapshotted at issue. A certificate is a record of
     * what was awarded on a date; renaming an account later must not silently
     * rewrite history.
     */
    learnerNameSnapshot: text("learnerNameSnapshot").notNull(),
    awardTitleSnapshot: text("awardTitleSnapshot").notNull(),
    scorePct: integer("scorePct").notNull(),
    issuedAt: createdAt("issuedAt"),
    revokedAt: timestamp("revokedAt"),
    revokedReason: text("revokedReason"),
  },
  (t) => [
    uniqueIndex("Certificate_publicId_key").on(t.publicId),
    index("Certificate_issuedAt_idx").on(t.issuedAt),
    uniqueIndex("Certificate_userId_levelId_key").on(t.userId, t.levelId),
  ],
);

// --- Content review -------------------------------------------------------

export const contentReviewItems = sqliteTable(
  "ContentReviewItem",
  {
    id: pk(),
    authoringKey: text("authoringKey").notNull(),
    /** LESSON | RESOURCE | QUESTION. */
    entityType: text("entityType").notNull(),
    entityId: text("entityId").notNull(),
    /** Human-readable location, e.g. "M9 · The Law › Study guide". */
    location: text("location").notNull(),
    claim: text("claim").notNull(),
    /** MEDICAL | LEGAL | STATISTIC. */
    category: text("category").notNull(),
    /** NEEDS_VERIFICATION | APPROVED | REJECTED. */
    status: text("status").notNull().default("NEEDS_VERIFICATION"),
    sourceHint: text("sourceHint"),
    notes: text("notes"),
    /** 1 blocks launch, 2 and 3 do not. */
    severity: integer("severity").notNull().default(1),
    reviewedById: text("reviewedById").references(() => users.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    reviewedAt: timestamp("reviewedAt"),
    createdAt: createdAt("createdAt"),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("ContentReviewItem_authoringKey_key").on(t.authoringKey),
    index("ContentReviewItem_status_severity_idx").on(t.status, t.severity),
    index("ContentReviewItem_entityType_entityId_idx").on(t.entityType, t.entityId),
  ],
);

// --- Analytics ------------------------------------------------------------

/**
 * Privacy-conscious by design: no IP address, no user agent, no referrer. The
 * session key is a random per-visit value, not a fingerprint.
 */
export const eventLogs = sqliteTable(
  "EventLog",
  {
    id: pk(),
    userId: text("userId").references(() => users.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    sessionKey: text("sessionKey").notNull(),
    type: text("type").notNull(),
    moduleId: text("moduleId").references(() => modules.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    lessonId: text("lessonId").references(() => lessons.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    metaJson: text("metaJson"),
    createdAt: createdAt("createdAt"),
  },
  (t) => [
    index("EventLog_type_createdAt_idx").on(t.type, t.createdAt),
    index("EventLog_userId_createdAt_idx").on(t.userId, t.createdAt),
    index("EventLog_moduleId_idx").on(t.moduleId),
  ],
);

// --- Relations ------------------------------------------------------------
// These power Drizzle's relational queries (`db.query.modules.findFirst({ with:
// { lessons: true } })`), which is what replaced Prisma's `include`.

export const coursesRelations = relations(courses, ({ many }) => ({
  levels: many(levels),
  resources: many(resources),
  questions: many(questions),
}));

export const levelsRelations = relations(levels, ({ one, many }) => ({
  course: one(courses, { fields: [levels.courseId], references: [courses.id] }),
  modules: many(modules),
  questions: many(questions),
  progress: many(levelProgress),
  certificates: many(certificates),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  level: one(levels, { fields: [modules.levelId], references: [levels.id] }),
  lessons: many(lessons),
  resources: many(resources),
  questions: many(questions),
  progress: many(moduleProgress),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  module: one(modules, { fields: [lessons.moduleId], references: [modules.id] }),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  course: one(courses, { fields: [resources.courseId], references: [courses.id] }),
  module: one(modules, { fields: [resources.moduleId], references: [modules.id] }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  course: one(courses, { fields: [questions.courseId], references: [courses.id] }),
  level: one(levels, { fields: [questions.levelId], references: [levels.id] }),
  module: one(modules, { fields: [questions.moduleId], references: [modules.id] }),
  choices: many(choices),
  answers: many(quizAnswers),
}));

export const choicesRelations = relations(choices, ({ one }) => ({
  question: one(questions, { fields: [choices.questionId], references: [questions.id] }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one, many }) => ({
  user: one(users, { fields: [quizAttempts.userId], references: [users.id] }),
  course: one(courses, { fields: [quizAttempts.courseId], references: [courses.id] }),
  level: one(levels, { fields: [quizAttempts.levelId], references: [levels.id] }),
  answers: many(quizAnswers),
}));

export const quizAnswersRelations = relations(quizAnswers, ({ one }) => ({
  attempt: one(quizAttempts, {
    fields: [quizAnswers.attemptId],
    references: [quizAttempts.id],
  }),
  question: one(questions, {
    fields: [quizAnswers.questionId],
    references: [questions.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  attempts: many(quizAttempts),
  moduleProgress: many(moduleProgress),
  levelProgress: many(levelProgress),
  courseProgress: many(courseProgress),
  certificates: many(certificates),
}));

export const moduleProgressRelations = relations(moduleProgress, ({ one }) => ({
  user: one(users, { fields: [moduleProgress.userId], references: [users.id] }),
  module: one(modules, { fields: [moduleProgress.moduleId], references: [modules.id] }),
}));

export const levelProgressRelations = relations(levelProgress, ({ one }) => ({
  user: one(users, { fields: [levelProgress.userId], references: [users.id] }),
  level: one(levels, { fields: [levelProgress.levelId], references: [levels.id] }),
}));

export const courseProgressRelations = relations(courseProgress, ({ one }) => ({
  user: one(users, { fields: [courseProgress.userId], references: [users.id] }),
  course: one(courses, { fields: [courseProgress.courseId], references: [courses.id] }),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  user: one(users, { fields: [certificates.userId], references: [users.id] }),
  course: one(courses, { fields: [certificates.courseId], references: [courses.id] }),
  level: one(levels, { fields: [certificates.levelId], references: [levels.id] }),
}));

export const contentReviewItemsRelations = relations(contentReviewItems, ({ one }) => ({
  reviewedBy: one(users, {
    fields: [contentReviewItems.reviewedById],
    references: [users.id],
  }),
}));

// --- Inferred row types ---------------------------------------------------

export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Level = typeof levels.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Choice = typeof choices.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type ModuleProgress = typeof moduleProgress.$inferSelect;
export type LevelProgress = typeof levelProgress.$inferSelect;
export type CourseProgress = typeof courseProgress.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type ContentReviewItem = typeof contentReviewItems.$inferSelect;
export type EventLog = typeof eventLogs.$inferSelect;
