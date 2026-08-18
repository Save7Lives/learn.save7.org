import "server-only";

import { and, asc, desc, eq, isNull } from "drizzle-orm";

import { db } from "./db";
import { choices, questions, quizAnswers, quizAttempts } from "@/db/schema";
import { getCourse } from "./course";
import type { QuestionKind, QuizScope } from "./constants";

/**
 * The quiz engine, used by all three kinds of assessment: the one-time baseline,
 * the per-level post assessment, and the inline "check your understanding"
 * blocks inside modules.
 *
 * Two invariants hold throughout:
 *
 * 1. **`isCorrect` never reaches the browser before an answer is submitted.**
 *    `toClientQuestion` is the only way a question is serialised for the client,
 *    and it strips the answer key. Anything that bypasses it is a bug.
 * 2. **Grading happens on the server**, including for the formative inline
 *    checks. Grading in the browser would mean shipping the answers.
 */

// --- What the client is allowed to see --------------------------------------

export type ClientChoice = {
  id: string;
  text: string;
};

export type ClientQuestion = {
  id: string;
  kind: QuestionKind;
  prompt: string;
  scenario: string | null;
  topicTag: string;
  choices: ClientChoice[];
};

type QuestionRow = {
  id: string;
  kind: string;
  prompt: string;
  scenario: string | null;
  topicTag: string;
  choices: Array<{ id: string; text: string; order: number }>;
};

/** Strips the answer key. The only sanctioned path from a question row to the client. */
function toClientQuestion(q: QuestionRow): ClientQuestion {
  return {
    id: q.id,
    kind: q.kind as QuestionKind,
    prompt: q.prompt,
    scenario: q.scenario,
    topicTag: q.topicTag,
    choices: [...q.choices]
      .sort((a, b) => a.order - b.order)
      .map((c) => ({ id: c.id, text: c.text })),
  };
}

/**
 * The columns a question is read with when it is bound for the client.
 *
 * Note what is absent: `choices.isCorrect` and `choices.feedback`. The answer key
 * is not merely stripped later — it is never selected in the first place, so it
 * cannot leak through a forgotten mapping step.
 */
const CLIENT_QUESTION_QUERY = {
  columns: {
    id: true,
    kind: true,
    prompt: true,
    scenario: true,
    topicTag: true,
  },
  with: {
    choices: {
      columns: { id: true, text: true, order: true },
      orderBy: asc(choices.order),
    },
  },
} as const;

// --- Grading ---------------------------------------------------------------

/**
 * A multi-select answer is correct only on an exact set match: every correct
 * choice selected and no incorrect one. Partial credit would let a learner
 * select everything and score well, which teaches the wrong habit.
 */
export function gradeSelection(
  selected: string[],
  choiceRows: Array<{ id: string; isCorrect: boolean }>,
): boolean {
  const correct = new Set(choiceRows.filter((c) => c.isCorrect).map((c) => c.id));
  const picked = new Set(selected);
  if (correct.size !== picked.size) return false;
  for (const id of correct) if (!picked.has(id)) return false;
  return true;
}

// --- Reading questions ------------------------------------------------------

export async function getBaselineQuestions(): Promise<ClientQuestion[]> {
  const course = await getCourse();
  const rows = await db.query.questions.findMany({
    where: and(eq(questions.courseId, course.id), eq(questions.scope, "PRE")),
    orderBy: asc(questions.order),
    ...CLIENT_QUESTION_QUERY,
  });
  return rows.map(toClientQuestion);
}

export async function getPostQuestions(levelId: string): Promise<ClientQuestion[]> {
  const rows = await db.query.questions.findMany({
    where: and(eq(questions.levelId, levelId), eq(questions.scope, "POST")),
    orderBy: asc(questions.order),
    ...CLIENT_QUESTION_QUERY,
  });
  return rows.map(toClientQuestion);
}

export async function getCheckQuestions(moduleId: string): Promise<ClientQuestion[]> {
  const rows = await db.query.questions.findMany({
    where: and(eq(questions.moduleId, moduleId), eq(questions.scope, "CHECK")),
    orderBy: asc(questions.order),
    ...CLIENT_QUESTION_QUERY,
  });
  return rows.map(toClientQuestion);
}

// --- Attempts ---------------------------------------------------------------

export type AttemptRef = { id: string; attemptNo: number };

/**
 * Start, or resume, an attempt.
 *
 * The baseline is special: it may only ever be taken once, so an existing
 * submitted PRE attempt is returned rather than a new one being created. A
 * learner who could retake the baseline could manufacture an improvement.
 */
export async function startAttempt(
  userId: string,
  kind: QuizScope,
  levelId: string | null,
): Promise<{ attempt: AttemptRef; alreadySubmitted: boolean }> {
  const course = await getCourse();

  // The most recent attempt: retakes increment attemptNo, so the highest is the
  // one to resume or count from.
  const [highest] = await db
    .select({
      id: quizAttempts.id,
      attemptNo: quizAttempts.attemptNo,
      submittedAt: quizAttempts.submittedAt,
    })
    .from(quizAttempts)
    .where(
      and(
        eq(quizAttempts.userId, userId),
        eq(quizAttempts.courseId, course.id),
        eq(quizAttempts.kind, kind),
        // Explicit null handling: a course-wide attempt has no level, and
        // `eq(column, null)` is never true in SQL.
        levelId === null ? isNull(quizAttempts.levelId) : eq(quizAttempts.levelId, levelId),
      ),
    )
    .orderBy(desc(quizAttempts.attemptNo))
    .limit(1);

  if (highest && !highest.submittedAt) {
    // An abandoned attempt — let them carry on rather than losing their answers.
    return {
      attempt: { id: highest.id, attemptNo: highest.attemptNo },
      alreadySubmitted: false,
    };
  }

  if (kind === "PRE" && highest?.submittedAt) {
    return {
      attempt: { id: highest.id, attemptNo: highest.attemptNo },
      alreadySubmitted: true,
    };
  }

  const [created] = await db
    .insert(quizAttempts)
    .values({
      userId,
      courseId: course.id,
      levelId,
      kind,
      attemptNo: (highest?.attemptNo ?? 0) + 1,
    })
    .returning({ id: quizAttempts.id, attemptNo: quizAttempts.attemptNo });

  return { attempt: created, alreadySubmitted: false };
}

export type SubmittedAnswer = {
  questionId: string;
  choiceIds: string[];
  freeText?: string;
};

export type GradedAnswer = {
  questionId: string;
  prompt: string;
  scenario: string | null;
  topicTag: string;
  isCorrect: boolean;
  explanation: string;
  selectedChoiceIds: string[];
  choices: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    feedback: string | null;
    wasSelected: boolean;
  }>;
};

export type AttemptResult = {
  attemptId: string;
  attemptNo: number;
  scoreRaw: number;
  scoreMax: number;
  scorePct: number;
  answers: GradedAnswer[];
};

/**
 * Grade and record a submission.
 *
 * Idempotent by design: re-submitting the same attempt returns the stored result
 * rather than regrading, so a double-tap on a slow phone connection cannot
 * produce two different scores.
 */
export async function submitAttempt(
  userId: string,
  attemptId: string,
  submitted: SubmittedAnswer[],
): Promise<AttemptResult | { error: string }> {
  const [attempt] = await db
    .select({
      id: quizAttempts.id,
      userId: quizAttempts.userId,
      kind: quizAttempts.kind,
      levelId: quizAttempts.levelId,
      courseId: quizAttempts.courseId,
      attemptNo: quizAttempts.attemptNo,
      submittedAt: quizAttempts.submittedAt,
    })
    .from(quizAttempts)
    .where(eq(quizAttempts.id, attemptId))
    .limit(1);

  // Ownership is checked here, not only at the route boundary.
  if (!attempt || attempt.userId !== userId) return { error: "Attempt not found." };

  if (attempt.submittedAt) {
    const stored = await readAttemptResult(userId, attemptId);
    return stored ?? { error: "That assessment has already been submitted." };
  }

  // A POST attempt with no level cannot be graded: there would be no way to know
  // which questions it is meant to contain. Previously this fell through to an
  // unfiltered query, which would have graded against every POST question in the
  // course.
  if (attempt.kind !== "PRE" && !attempt.levelId) {
    return { error: "This assessment is not attached to a level." };
  }

  // Load the questions this attempt is *supposed* to contain, from the server's
  // own definition — never from the submitted payload. Otherwise a crafted
  // request could submit a single easy question and score 100%.
  const expected = await db.query.questions.findMany({
    where:
      attempt.kind === "PRE"
        ? and(eq(questions.courseId, attempt.courseId), eq(questions.scope, "PRE"))
        : and(eq(questions.levelId, attempt.levelId!), eq(questions.scope, "POST")),
    orderBy: asc(questions.order),
    with: { choices: { columns: { id: true, isCorrect: true } } },
  });

  if (expected.length === 0) return { error: "This assessment has no questions." };

  const byQuestion = new Map(submitted.map((s) => [s.questionId, s]));

  let scoreRaw = 0;
  const answerRows = expected.map((q) => {
    const given = byQuestion.get(q.id);
    const choiceIds = (given?.choiceIds ?? []).filter((id) =>
      q.choices.some((c) => c.id === id),
    );
    // Unanswered counts as incorrect rather than being silently dropped from the
    // denominator, so a score always means "out of the whole assessment".
    const isCorrect = choiceIds.length > 0 && gradeSelection(choiceIds, q.choices);
    if (isCorrect) scoreRaw += 1;

    return {
      attemptId: attempt.id,
      questionId: q.id,
      choiceIdsJson: JSON.stringify(choiceIds),
      freeText: given?.freeText?.trim() ? given.freeText.trim().slice(0, 4000) : null,
      isCorrect,
    };
  });

  const scoreMax = expected.length;
  const scorePct = Math.round((scoreRaw / scoreMax) * 100);

  // Three statements, deliberately in this order and deliberately not wrapped in
  // an interactive transaction — D1 does not offer one.
  //
  // `submittedAt` is the commit marker, so it is written last. If any earlier
  // step fails the attempt stays unsubmitted, and re-submitting starts again from
  // the delete: no partially-graded attempt can ever be marked as submitted.
  await db.delete(quizAnswers).where(eq(quizAnswers.attemptId, attempt.id));
  await db.insert(quizAnswers).values(answerRows);
  await db
    .update(quizAttempts)
    .set({ submittedAt: new Date(), scoreRaw, scoreMax, scorePct })
    .where(eq(quizAttempts.id, attempt.id));

  const result = await readAttemptResult(userId, attempt.id);
  return result ?? { error: "Could not read back the graded attempt." };
}

/** The full graded detail of a submitted attempt, for the review screen. */
export async function readAttemptResult(
  userId: string,
  attemptId: string,
): Promise<AttemptResult | null> {
  const attempt = await db.query.quizAttempts.findFirst({
    where: eq(quizAttempts.id, attemptId),
    columns: {
      id: true,
      userId: true,
      attemptNo: true,
      scoreRaw: true,
      scoreMax: true,
      scorePct: true,
      submittedAt: true,
    },
    with: {
      answers: {
        columns: { questionId: true, choiceIdsJson: true, isCorrect: true },
        with: {
          question: {
            columns: {
              prompt: true,
              scenario: true,
              explanation: true,
              topicTag: true,
              order: true,
            },
            with: {
              choices: {
                columns: {
                  id: true,
                  text: true,
                  isCorrect: true,
                  feedback: true,
                  order: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // The answer key is included here, which is correct: this only ever runs for an
  // attempt that has already been submitted, and it is gated on that below.
  if (!attempt || attempt.userId !== userId || !attempt.submittedAt) return null;

  const answers: GradedAnswer[] = attempt.answers
    .map((a) => {
      const selected = new Set(JSON.parse(a.choiceIdsJson) as string[]);
      return {
        order: a.question.order,
        value: {
          questionId: a.questionId,
          prompt: a.question.prompt,
          scenario: a.question.scenario,
          topicTag: a.question.topicTag,
          isCorrect: a.isCorrect,
          explanation: a.question.explanation,
          selectedChoiceIds: [...selected],
          choices: [...a.question.choices]
            .sort((x, y) => x.order - y.order)
            .map((c) => ({
              id: c.id,
              text: c.text,
              isCorrect: c.isCorrect,
              feedback: c.feedback,
              wasSelected: selected.has(c.id),
            })),
        } satisfies GradedAnswer,
      };
    })
    .sort((a, b) => a.order - b.order)
    .map((x) => x.value);

  return {
    attemptId: attempt.id,
    attemptNo: attempt.attemptNo,
    scoreRaw: attempt.scoreRaw ?? 0,
    scoreMax: attempt.scoreMax ?? answers.length,
    scorePct: attempt.scorePct ?? 0,
    answers,
  };
}

// --- Inline checks ----------------------------------------------------------

export type CheckFeedback = {
  isCorrect: boolean;
  explanation: string;
  choices: Array<{ id: string; isCorrect: boolean; feedback: string | null }>;
};

/**
 * Grade one inline check-your-understanding question.
 *
 * These are formative: there is no pass mark and the result does not gate
 * anything. They are still recorded — against one CHECK attempt per learner per
 * level — because "which inline questions do most learners get wrong" is one of
 * the most useful signals Save7 can have about where the teaching is unclear.
 */
export async function gradeCheckAnswer(
  userId: string,
  questionId: string,
  choiceIds: string[],
): Promise<CheckFeedback | { error: string }> {
  const question = await db.query.questions.findFirst({
    where: eq(questions.id, questionId),
    columns: {
      id: true,
      scope: true,
      courseId: true,
      moduleId: true,
      explanation: true,
    },
    with: {
      module: { columns: { levelId: true } },
      choices: { columns: { id: true, isCorrect: true, feedback: true } },
    },
  });

  if (!question || question.scope !== "CHECK") return { error: "Question not found." };

  const valid = choiceIds.filter((id) => question.choices.some((c) => c.id === id));
  const isCorrect = valid.length > 0 && gradeSelection(valid, question.choices);

  if (question.moduleId) {
    const attempt = await findOrCreateCheckAttempt(userId, question);

    await db
      .insert(quizAnswers)
      .values({
        attemptId: attempt.id,
        questionId,
        choiceIdsJson: JSON.stringify(valid),
        isCorrect,
      })
      .onConflictDoUpdate({
        target: [quizAnswers.attemptId, quizAnswers.questionId],
        set: {
          choiceIdsJson: JSON.stringify(valid),
          isCorrect,
          answeredAt: new Date(),
        },
      });
  }

  return {
    isCorrect,
    explanation: question.explanation,
    choices: question.choices.map((c) => ({
      id: c.id,
      isCorrect: c.isCorrect,
      feedback: c.feedback,
    })),
  };
}

/** One CHECK attempt per learner per level, holding every inline answer in it. */
async function findOrCreateCheckAttempt(
  userId: string,
  question: { courseId: string; module: { levelId: string } | null },
): Promise<{ id: string }> {
  const levelId = question.module?.levelId ?? null;

  const [existing] = await db
    .select({ id: quizAttempts.id })
    .from(quizAttempts)
    .where(
      and(
        eq(quizAttempts.userId, userId),
        eq(quizAttempts.courseId, question.courseId),
        eq(quizAttempts.kind, "CHECK"),
        levelId === null ? isNull(quizAttempts.levelId) : eq(quizAttempts.levelId, levelId),
      ),
    )
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(quizAttempts)
    .values({ userId, courseId: question.courseId, levelId, kind: "CHECK", attemptNo: 1 })
    .returning({ id: quizAttempts.id });
  return created;
}
