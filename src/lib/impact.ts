import "server-only";

import { and, asc, eq, isNotNull, sql } from "drizzle-orm";

import { db } from "./db";
import { levels, quizAttempts } from "@/db/schema";
import { getCourse } from "./course";

/**
 * Knowledge improvement.
 *
 * This is the metric the whole platform exists to produce, so it is worth being
 * precise about what is being compared.
 *
 * The naive calculation — baseline percentage against level-assessment percentage —
 * compares two different question sets. It is the figure the brief's example uses
 * (52% → 84% → +32pp) and it is genuinely useful, but on its own it overstates
 * precision: a learner could "improve" simply because one paper was easier.
 *
 * So we compute both, and label both:
 *
 *   1. **Matched-pair improvement** (the honest primary figure). Every post
 *      question carries a `pairKey` linking it to the baseline question testing the
 *      same idea. Restricting both sides to the shared pairs compares like with
 *      like. The pair count is always reported, so a thin comparison is visibly
 *      thin rather than quietly misleading.
 *
 *   2. **Overall scores**, shown alongside, clearly labelled as different papers.
 *
 * Where a level's material barely overlaps the non-technical baseline — Advanced
 * especially — the matched-pair set is small by design, and the UI says so instead
 * of dressing up three questions as a trend.
 */

/** Below this, a paired comparison is reported as indicative only. */
export const MIN_PAIRS_FOR_CONFIDENCE = 4;

/**
 * Relative change is only reported when the baseline is a sane denominator.
 *
 * A learner who scored 8% and then 90% has technically improved by 1025%, which is
 * arithmetically correct and rhetorically ridiculous — the sort of figure that
 * discredits a report the moment someone screenshots it. Below this floor we show
 * the percentage-point change only, which is the honest and more meaningful number.
 */
export const MIN_BASELINE_FOR_RELATIVE = 25;

export type TopicMovement = {
  pairKey: string;
  topicTag: string;
  /** The baseline question's prompt, for display. */
  beforePrompt: string;
  wasCorrectBefore: boolean;
  isCorrectAfter: boolean;
};

export type KnowledgeImpact = {
  /** Whole baseline paper. */
  before: { scorePct: number; raw: number; max: number } | null;
  /** The recorded (first) attempt at this level's assessment. */
  after: { scorePct: number; raw: number; max: number; attemptNo: number } | null;
  /** Best score across all attempts, used for the pass decision. */
  bestScorePct: number | null;

  /** Difference in percentage points between the two papers. */
  absolutePointChange: number | null;
  /** Change relative to the starting score, e.g. 52 → 84 is +61.5% relative. */
  relativeChangePct: number | null;

  paired: {
    pairCount: number;
    correctBefore: number;
    correctAfter: number;
    beforePct: number;
    afterPct: number;
    pointChange: number;
    /** True when there are enough pairs to describe this as a real comparison. */
    isConfident: boolean;
    movements: TopicMovement[];
  } | null;

  passMarkPct: number;
  passed: boolean;
};

export async function getKnowledgeImpact(
  userId: string,
  levelId: string,
): Promise<KnowledgeImpact> {
  const course = await getCourse();

  const [level] = await db
    .select({ passMarkPct: levels.passMarkPct })
    .from(levels)
    .where(eq(levels.id, levelId))
    .limit(1);
  const passMarkPct = level?.passMarkPct ?? 70;

  const [preAttempt, postAttempts] = await Promise.all([
    db.query.quizAttempts.findFirst({
      where: and(
        eq(quizAttempts.userId, userId),
        eq(quizAttempts.courseId, course.id),
        eq(quizAttempts.kind, "PRE"),
        isNotNull(quizAttempts.submittedAt),
      ),
      orderBy: asc(quizAttempts.attemptNo),
      columns: { id: true, scoreRaw: true, scoreMax: true, scorePct: true },
      with: {
        answers: {
          columns: { isCorrect: true },
          with: {
            question: { columns: { pairKey: true, topicTag: true, prompt: true } },
          },
        },
      },
    }),
    db.query.quizAttempts.findMany({
      where: and(
        eq(quizAttempts.userId, userId),
        eq(quizAttempts.courseId, course.id),
        eq(quizAttempts.levelId, levelId),
        eq(quizAttempts.kind, "POST"),
        isNotNull(quizAttempts.submittedAt),
      ),
      orderBy: asc(quizAttempts.attemptNo),
      columns: { attemptNo: true, scoreRaw: true, scoreMax: true, scorePct: true },
      with: {
        answers: {
          columns: { isCorrect: true },
          with: { question: { columns: { pairKey: true, topicTag: true } } },
        },
      },
    }),
  ]);

  // attemptNo 1 is the recorded measure: retakes must not inflate reported gains.
  const recorded = postAttempts.find((a) => a.attemptNo === 1) ?? postAttempts[0] ?? null;

  const before = preAttempt
    ? {
        scorePct: preAttempt.scorePct ?? 0,
        raw: preAttempt.scoreRaw ?? 0,
        max: preAttempt.scoreMax ?? 0,
      }
    : null;

  const after = recorded
    ? {
        scorePct: recorded.scorePct ?? 0,
        raw: recorded.scoreRaw ?? 0,
        max: recorded.scoreMax ?? 0,
        attemptNo: recorded.attemptNo,
      }
    : null;

  const bestScorePct = postAttempts.length
    ? Math.max(...postAttempts.map((a) => a.scorePct ?? 0))
    : null;

  const absolutePointChange =
    before && after ? after.scorePct - before.scorePct : null;

  // Relative change is suppressed on a small baseline — see
  // MIN_BASELINE_FOR_RELATIVE. This also removes the divide-by-zero case.
  const relativeChangePct =
    before && after && before.scorePct >= MIN_BASELINE_FOR_RELATIVE
      ? Math.round(((after.scorePct - before.scorePct) / before.scorePct) * 100)
      : null;

  // --- Matched pairs -------------------------------------------------------
  let paired: KnowledgeImpact["paired"] = null;

  if (preAttempt && recorded) {
    const beforeByPair = new Map(
      preAttempt.answers
        .filter((a) => a.question.pairKey)
        .map((a) => [
          a.question.pairKey!,
          {
            isCorrect: a.isCorrect,
            topicTag: a.question.topicTag,
            prompt: a.question.prompt,
          },
        ]),
    );

    const movements: TopicMovement[] = [];

    for (const answer of recorded.answers) {
      const key = answer.question.pairKey;
      if (!key) continue;
      const beforeEntry = beforeByPair.get(key);
      if (!beforeEntry) continue;

      movements.push({
        pairKey: key,
        topicTag: answer.question.topicTag,
        beforePrompt: beforeEntry.prompt,
        wasCorrectBefore: beforeEntry.isCorrect,
        isCorrectAfter: answer.isCorrect,
      });
    }

    if (movements.length > 0) {
      const correctBefore = movements.filter((m) => m.wasCorrectBefore).length;
      const correctAfter = movements.filter((m) => m.isCorrectAfter).length;
      const beforePct = Math.round((correctBefore / movements.length) * 100);
      const afterPct = Math.round((correctAfter / movements.length) * 100);

      paired = {
        pairCount: movements.length,
        correctBefore,
        correctAfter,
        beforePct,
        afterPct,
        pointChange: afterPct - beforePct,
        isConfident: movements.length >= MIN_PAIRS_FOR_CONFIDENCE,
        movements,
      };
    }
  }

  return {
    before,
    after,
    bestScorePct,
    absolutePointChange,
    relativeChangePct,
    paired,
    passMarkPct,
    passed: (bestScorePct ?? 0) >= passMarkPct,
  };
}

/**
 * Course-level improvement, for the learner dashboard.
 *
 * Averages the recorded assessments across every level the learner has completed.
 * Levels not yet attempted are excluded rather than counted as zero — a learner who
 * has done Beginner only should not be shown a two-thirds penalty for work they
 * never claimed to have done.
 */
export async function getCourseImpact(userId: string): Promise<{
  beforePct: number | null;
  afterPct: number | null;
  pointChange: number | null;
  levelsAssessed: number;
  levelsTotal: number;
}> {
  const course = await getCourse();

  const [pre, posts, levelsTotal] = await Promise.all([
    db
      .select({ scorePct: quizAttempts.scorePct })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.courseId, course.id),
          eq(quizAttempts.kind, "PRE"),
          isNotNull(quizAttempts.submittedAt),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select({ scorePct: quizAttempts.scorePct, levelId: quizAttempts.levelId })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.courseId, course.id),
          eq(quizAttempts.kind, "POST"),
          // Only the first attempt counts, so retakes cannot inflate the average.
          eq(quizAttempts.attemptNo, 1),
          isNotNull(quizAttempts.submittedAt),
        ),
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(levels)
      .where(eq(levels.courseId, course.id))
      .then((rows) => Number(rows[0]?.count ?? 0)),
  ]);

  const beforePct = pre?.scorePct ?? null;

  const scores = posts.map((p) => p.scorePct ?? 0);
  const afterPct = scores.length
    ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
    : null;

  return {
    beforePct,
    afterPct,
    pointChange: beforePct !== null && afterPct !== null ? afterPct - beforePct : null,
    levelsAssessed: scores.length,
    levelsTotal,
  };
}
