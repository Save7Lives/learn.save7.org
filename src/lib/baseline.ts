import "server-only";

import { supabaseServer } from "./supabase/server";
import type { LevelTier } from "./constants";
import {
  getProgressRecord,
  mapSitting,
  percent,
  type ProgressRecord,
  type Sitting,
  type SittingRow,
} from "./progress-record";
import type { SubmittedAnswer } from "./quiz";

// Sittings are part of the Progress Record, so their shape and mapping live with it.
// Re-exported so the pages and the Admin keep importing them from here.
export { mapSitting, percent };
export type { LevelScore, Sitting } from "./progress-record";

/**
 * The Baseline Assessment, read off its Sittings.
 *
 * A Sitting is one row in `learn_baseline_sittings` (save7-os 0110): the twenty
 * fixed-form questions, marked and frozen in a single call to
 * `learn_submit_baseline_sitting()`. It keeps a score per Level and a total, and
 * no answers. There is no "started but not submitted" state, so nothing here can
 * resume a half-sat paper: a Sitting either exists in full or not at all.
 *
 * ── WHEN A SITTING IS OFFERED ───────────────────────────────────────────────
 * The Blueprint's four slots are at signup and after each Level. The Course lets a
 * learner start at any Level, so "after Beginner" really means "after the next
 * Level they complete". The rule lives in the Progress Record (save7-os 0138,
 * `baseline.sitting_due`), which this file reads and does not repeat:
 *
 *   - Sitting 1 is owed until it is sat, and **Stage content waits for it** (#54,
 *     the user's call): a "before" taken after reading a Stage is not a before.
 *   - After that, a Sitting is owed once a Level has been completed since the last
 *     one. Later Sittings are offered and never required: no score, and no missing
 *     Sitting, blocks anything.
 *   - A Sitting skipped before another Level is completed is not owed twice. Sitting
 *     the same paper twice in a row would measure nothing, so a learner who
 *     finishes two Levels between Sittings gets one, and can end with fewer than
 *     four.
 *
 * The submit call enforces only the cap of four. The schedule is the Progress
 * Record's and has no stakes for anyone but the learner: nothing downstream
 * (vetting, the Eligibility Rule, a Certificate) reads a Baseline score. A learner
 * who calls the RPC directly to sit early spends their own Sittings, nobody else's.
 *
 * ── NO ANSWER REVIEW, DELIBERATELY ──────────────────────────────────────────
 * A Stage Quiz shows its marked paper. A Sitting does not, and must not: the same
 * twenty questions come back at every Sitting, so showing the key after the first
 * would turn every later Sitting into a memory test.
 */

export const MAX_SITTINGS = 4;

export type BaselineLevel = { slug: string; title: string; tier: LevelTier };

export type BaselineState = {
  /** Oldest first. */
  sittings: Sitting[];
  /** Sitting 1 is in: the "before" figure exists, and Stage content opens. */
  completed: boolean;
  /** The Sitting the learner is owed now, if any. */
  due: number | null;
  first: Sitting | null;
  /** The latest Sitting after the first. What Improvement compares against. */
  latestLater: Sitting | null;
  /** In Course order, for the per-Level columns. */
  levels: BaselineLevel[];
  /** When each Level was completed, for labelling Sittings and for what is owed. */
  levelsCompleted: Array<{ slug: string; completedAt: Date }>;
};

/**
 * The four slots of CONTEXT.md's fixed schedule, named for a learner who completes one
 * Level between Sittings. Only a view that adds Sittings up across Students (the
 * Admin's Overview) labels them this way, because a group has no one set of Levels
 * behind its Sitting 2. One Student's Sitting is labelled by `sittingLabel()`.
 */
export const SITTING_SLOTS = ["At signup", "After Beginner", "After Intermediate", "After Advanced"] as const;

/**
 * What one Student's Sittings are labelled from: their Sittings, the Levels in Course
 * order, and when they completed each. `BaselineState` is one; the Admin builds the
 * same from the Student's Progress Record (`sittingContext()` in admin/model.ts).
 */
export type SittingContext = {
  sittings: Sitting[];
  levels: Array<{ slug: string; title: string }>;
  levelsCompleted: Array<{ slug: string; completedAt: Date }>;
};

const listJoin = (items: string[]): string =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/**
 * What prompted a Sitting: "At signup", or the Levels completed between the previous
 * Sitting and this one. The one label for a Student's Sitting, on their dashboard and
 * in the Admin alike.
 */
export function sittingLabel(context: SittingContext, sitting: Sitting): string {
  if (sitting.sittingNo === 1) return "At signup";
  const previous = context.sittings.find((s) => s.sittingNo === sitting.sittingNo - 1);
  const titles = context.levels
    .filter((level) => {
      const done = context.levelsCompleted.find((c) => c.slug === level.slug)?.completedAt;
      return done && done <= sitting.submittedAt && (!previous || done > previous.submittedAt);
    })
    .map((level) => level.title);
  return titles.length > 0 ? `After ${listJoin(titles)}` : `Sitting ${sitting.sittingNo}`;
}

/**
 * A slot's name for one Student: its label once taken, "At signup" for the first,
 * and otherwise just its number. Which Levels an untaken later Sitting will follow is
 * not known until they are completed, so it is not named after one.
 */
export function sittingName(context: SittingContext, sittingNo: number): string {
  const sitting = context.sittings.find((s) => s.sittingNo === sittingNo);
  if (sitting) return sittingLabel(context, sitting);
  return sittingNo === 1 ? "At signup" : `Sitting ${sittingNo}`;
}

export type SittingSlot = {
  sittingNo: number;
  name: string;
  /** "11 of 20", "Do this first", "Offered now", "After another Level" or "Not owed". */
  status: string;
  taken: boolean;
  /** The Sitting owed now, per the Progress Record. */
  offered: boolean;
};

/**
 * The four slots on the learner's My progress, read off their record. Only the
 * Sitting the record says is owed (`due`) reads as offered. Any other untaken slot
 * says what it waits for: another Level completed, or nothing, once every Level is.
 */
export function sittingSlots(state: BaselineState): SittingSlot[] {
  const levelsLeft = state.levels.some((l) => !state.levelsCompleted.some((c) => c.slug === l.slug));
  return Array.from({ length: MAX_SITTINGS }, (_, i) => {
    const sittingNo = i + 1;
    const sitting = state.sittings.find((s) => s.sittingNo === sittingNo);
    const offered = !sitting && state.due === sittingNo;
    const status = sitting
      ? `${sitting.totalScore} of ${sitting.totalMax}`
      : offered
        ? sittingNo === 1
          ? "Do this first"
          : "Offered now"
        : levelsLeft
          ? "After another Level"
          : "Not owed";
    return { sittingNo, name: sittingName(state, sittingNo), status, taken: !!sitting, offered };
  });
}

/**
 * One Level's Improvement (CONTEXT.md): its sub-score at Sitting 1 against the
 * first Sitting taken after that Level was completed. Null until both exist.
 * Derived here, never stored.
 */
export function levelImprovement(
  sittings: Sitting[],
  levelSlug: string,
  completedAt: Date | null,
): { beforePct: number; afterPct: number; change: number } | null {
  const first = sittings.find((s) => s.sittingNo === 1);
  if (!first || !completedAt) return null;
  const after = sittings.find((s) => s.sittingNo > 1 && s.submittedAt > completedAt);
  const before = first.levelScores[levelSlug];
  const later = after?.levelScores[levelSlug];
  if (!before || !later) return null;
  const beforePct = percent(before.score, before.max);
  const afterPct = percent(later.score, later.max);
  return { beforePct, afterPct, change: afterPct - beforePct };
}

/**
 * Where the learner stands on the Baseline, read off their Progress Record.
 *
 * The Sittings, the Levels they completed and the Sitting owed all come from the
 * record; only the Level titles (the catalogue, which is not a Student's) are read
 * beside it. With no record (no Student row) the state is the empty one: Sitting 1
 * owed, so a page that sends a learner to the baseline never loops.
 */
export async function getBaselineState(learnerId: string): Promise<BaselineState> {
  const supabase = await supabaseServer();

  const [record, levelResult] = await Promise.all([
    getProgressRecord(learnerId),
    supabase.from("learn_levels").select("slug, title, tier").order("position"),
  ]);

  return baselineStateFrom(record, (levelResult.data ?? []) as unknown as BaselineLevel[]);
}

/** `getBaselineState()` without the reads: the record and the Level catalogue, given. */
export function baselineStateFrom(record: ProgressRecord | null, levels: BaselineLevel[]): BaselineState {
  const sittings = record?.baseline.sittings ?? [];
  const levelsCompleted = (record?.levels ?? []).flatMap((l) =>
    l.complete && l.completedAt ? [{ slug: l.slug, completedAt: l.completedAt }] : [],
  );

  const first = sittings.find((s) => s.sittingNo === 1) ?? null;
  const later = sittings.filter((s) => s.sittingNo > 1);

  return {
    sittings,
    completed: first !== null,
    due: record ? record.baseline.sittingDue : 1,
    first,
    latestLater: later[later.length - 1] ?? null,
    levels,
    levelsCompleted,
  };
}

/**
 * Mark and record one Sitting.
 *
 * Not idempotent, unlike a Stage Quiz: each call writes the next Sitting. The
 * caller checks that the Sitting it rendered is still the one owed before calling,
 * so a second tab or a resubmitted form cannot spend a slot on the same answers.
 */
export async function submitBaselineSitting(
  submitted: SubmittedAnswer[],
): Promise<Sitting | { error: string }> {
  const supabase = await supabaseServer();

  const answers: Record<string, { chosen: string[] }> = {};
  for (const answer of submitted) answers[answer.questionId] = { chosen: answer.choiceIds };

  const { data, error } = await supabase.rpc("learn_submit_baseline_sitting", {
    p_answers: answers,
  });
  if (error) return { error: error.message };

  const row = data as SittingRow | null;
  if (!row) return { error: "Could not read back the recorded sitting." };
  return mapSitting(row);
}
