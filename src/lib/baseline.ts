import "server-only";

import { supabaseServer } from "./supabase/server";
import type { LevelTier } from "./constants";
import type { SubmittedAnswer } from "./quiz";

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
 * Level they complete". The rule, in `dueSitting()`:
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
 * The database enforces only the cap of four. The schedule lives here because it
 * has no stakes for anyone but the learner: nothing downstream (vetting, the
 * Eligibility Rule, a Certificate) reads a Baseline score. A learner who calls the
 * RPC directly to sit early spends their own Sittings, nobody else's.
 *
 * ── NO ANSWER REVIEW, DELIBERATELY ──────────────────────────────────────────
 * A Stage Quiz shows its marked paper. A Sitting does not, and must not: the same
 * twenty questions come back at every Sitting, so showing the key after the first
 * would turn every later Sitting into a memory test.
 */

export const MAX_SITTINGS = 4;

export type LevelScore = { score: number; max: number };

export type Sitting = {
  sittingNo: number;
  submittedAt: Date;
  /** Keyed by Level slug. */
  levelScores: Record<string, LevelScore>;
  totalScore: number;
  totalMax: number;
  totalPct: number;
};

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

export function percent(score: number, max: number): number {
  return max > 0 ? Math.round((100 * score) / max) : 0;
}

/**
 * Which Sitting is owed now, if any. See the header for the rule and why a
 * skipped Sitting rolls forward rather than stacking up.
 */
export function dueSitting(sittings: Sitting[], levelsCompletedAt: Date[]): number | null {
  const n = sittings.length;
  if (n >= MAX_SITTINGS) return null;
  if (n === 0) return 1;
  const last = sittings[n - 1].submittedAt;
  return levelsCompletedAt.some((d) => d > last) ? n + 1 : null;
}

/**
 * What prompted a Sitting, for the trend's row labels: "At signup", or the Levels
 * completed between the previous Sitting and this one.
 */
export function sittingLabel(state: Pick<BaselineState, "sittings" | "levels" | "levelsCompleted">, sitting: Sitting): string {
  if (sitting.sittingNo === 1) return "At signup";
  const previous = state.sittings.find((s) => s.sittingNo === sitting.sittingNo - 1);
  const titles = state.levels
    .filter((level) => {
      const done = state.levelsCompleted.find((c) => c.slug === level.slug)?.completedAt;
      return done && done <= sitting.submittedAt && (!previous || done > previous.submittedAt);
    })
    .map((level) => level.title);
  return titles.length > 0 ? `After ${titles.join(" and ")}` : `Sitting ${sitting.sittingNo}`;
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

type SittingRow = {
  sitting_no: number;
  submitted_at: string;
  level_scores: Record<string, LevelScore> | null;
  total_score: number;
  total_max: number;
};

export function mapSitting(row: SittingRow): Sitting {
  return {
    sittingNo: row.sitting_no,
    submittedAt: new Date(row.submitted_at),
    levelScores: row.level_scores ?? {},
    totalScore: row.total_score,
    totalMax: row.total_max,
    totalPct: percent(row.total_score, row.total_max),
  };
}

export const SITTING_COLUMNS = "sitting_no, submitted_at, level_scores, total_score, total_max";

/**
 * Where the learner stands on the Baseline.
 *
 * Row level security scopes both reads to the caller; `learnerId` narrows them for
 * a staff member who also has a learners row, whose policy admits every learner.
 */
export async function getBaselineState(learnerId: string): Promise<BaselineState> {
  const supabase = await supabaseServer();

  const [sittingResult, progressResult, levelResult] = await Promise.all([
    supabase
      .from("learn_baseline_sittings")
      .select(SITTING_COLUMNS)
      .eq("learner_id", learnerId)
      .order("sitting_no"),
    supabase
      .from("learn_level_progress")
      .select("level_slug, completed_at")
      .eq("learner_id", learnerId)
      .not("completed_at", "is", null),
    supabase.from("learn_levels").select("slug, title, tier").order("position"),
  ]);

  const sittings = ((sittingResult.data ?? []) as unknown as SittingRow[]).map(mapSitting);
  const levelsCompleted = (
    (progressResult.data ?? []) as unknown as Array<{ level_slug: string; completed_at: string }>
  ).map((p) => ({ slug: p.level_slug, completedAt: new Date(p.completed_at) }));
  const levels = (levelResult.data ?? []) as unknown as BaselineLevel[];

  const first = sittings.find((s) => s.sittingNo === 1) ?? null;
  const later = sittings.filter((s) => s.sittingNo > 1);

  return {
    sittings,
    completed: first !== null,
    due: dueSitting(
      sittings,
      levelsCompleted.map((c) => c.completedAt),
    ),
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
