/**
 * Stage Quiz banks.
 *
 * The Assessment Blueprint (#8) fixes the shape and this type enforces it:
 * **fifteen questions per Stage, four options each, exactly one correct.**
 * Five are drawn at random per attempt and four of five passes.
 *
 * Prose moved to Markdown in #33; question banks did not, and this file is why.
 * A bank is the one part of the content where a silent error is expensive: a
 * question with no correct answer is unanswerable, and one with two is
 * unmarkable — `learn_mark()` compares sets, so it would quietly mark every
 * learner wrong rather than fail. `choices` is a four-tuple so the compiler
 * catches the count, and `assertBankIsWellFormed` catches the rest before
 * anything is emitted.
 *
 * **Authoring keys are permanent.** `learn_questions.authoring_key` is the
 * upsert key, and a question row that is deleted and reinserted takes every
 * answer ever recorded against it — and the knowledge-improvement figures with
 * them. Rename a prompt freely; never renumber a key.
 *
 * Banks are one file per Level so the three content tickets can be worked
 * concurrently without touching each other's files.
 */

import type { LevelStructure } from "./structure";
import { courseStructure } from "./structure";

export type StageQuizChoice = {
  text: string;
  isCorrect?: boolean;
  /** Shown after answering. Worth writing on every distractor a learner might
   *  plausibly choose — the wrong answers are where the teaching happens. */
  feedback?: string;
};

export type StageQuizQuestion = {
  /** Permanent authoring key. Never reused, never renumbered. */
  key: string;
  /** Stage slug — written to `learn_questions.module_slug`. */
  stage: string;
  topicTag: string;
  /** Scales with source Level; Beginner-sourced items sit at 1–2. */
  difficulty: 1 | 2 | 3;
  /** Set where the stem needs a situation before the question. */
  scenario?: string;
  prompt: string;
  explanation: string;
  /** The source the keyed answer and explanation were checked against.
   *  An item without one enters the content-review register as outstanding. */
  verifiedAgainst?: string;
  /** The prior build's authoring key, where this item was recycled from one.
   *  Provenance only — the old row does not survive the #33 content reset. */
  recycledFrom?: string;
  choices: [StageQuizChoice, StageQuizChoice, StageQuizChoice, StageQuizChoice];
};

/** Every Stage Quiz bank in the Course, keyed by Stage slug. */
export type StageQuizBanks = Record<string, StageQuizQuestion[]>;

export const QUESTIONS_PER_BANK = 15;

/**
 * Check a set of banks before anything is emitted from them.
 *
 * Throws on the first problem rather than collecting them: a malformed bank is
 * not a thing to triage, and the generator must not produce SQL from one.
 */
export function assertBankIsWellFormed(
  banks: StageQuizBanks,
  levels: LevelStructure[] = courseStructure,
): void {
  const stages = new Map(
    levels.flatMap((l) => l.stages.map((s) => [s.slug, l.slug] as const)),
  );
  const seenKeys = new Set<string>();

  for (const [stageSlug, bank] of Object.entries(banks)) {
    if (!stages.has(stageSlug)) {
      throw new Error(`quiz bank for unknown Stage ${stageSlug}`);
    }
    if (bank.length !== QUESTIONS_PER_BANK) {
      throw new Error(
        `${stageSlug}: the Blueprint requires ${QUESTIONS_PER_BANK} questions, found ${bank.length}`,
      );
    }
    for (const q of bank) {
      if (q.stage !== stageSlug) {
        throw new Error(`${q.key}: filed under ${stageSlug} but declares stage ${q.stage}`);
      }
      if (seenKeys.has(q.key)) throw new Error(`${q.key}: duplicate authoring key`);
      seenKeys.add(q.key);

      const correct = q.choices.filter((c) => c.isCorrect).length;
      if (correct !== 1) {
        throw new Error(`${q.key}: has ${correct} correct answers, must have exactly 1`);
      }
      const texts = new Set(q.choices.map((c) => c.text.trim()));
      if (texts.size !== 4) throw new Error(`${q.key}: has duplicate option text`);
    }

    /* Choices are displayed in authoring order, so a bank that keys most of its
       answers to one position teaches the position rather than the content. The
       volunteer gate's forty items all key 'a', which is why its renderer has to
       shuffle; a Stage Quiz bank should not need rescuing that way. */
    const atPosition = [0, 0, 0, 0];
    for (const q of bank) atPosition[q.choices.findIndex((c) => c.isCorrect)]++;
    const most = Math.max(...atPosition);
    if (most > bank.length / 2) {
      throw new Error(
        `${stageSlug}: ${most} of ${bank.length} correct answers share one position — spread them out`,
      );
    }
  }
}
