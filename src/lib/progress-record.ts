import "server-only";

import { cache } from "react";
import { supabaseServer } from "./supabase/server";
import type { ProgressStatus } from "./constants";

/**
 * The Progress Record, as the app reads it.
 *
 * One SQL module owns it (save7-os 0138, ADR 0001): `learn_progress_record()` for one
 * Student and `learn_progress_records()` for the Admin's pool. Nothing in the app
 * works out whether a Stage or a Level is complete, which Quiz attempt is the latest,
 * or which Baseline Sitting is owed: those arrive decided, and this file only gives
 * them TypeScript names. Improvement and the Growth Indicators are still computed
 * from the record at read time (`levelImprovement()` in baseline.ts, and the Admin's
 * `model.ts`); they are never stored and never asked of SQL.
 *
 * Terms are CONTEXT.md's. A Stage is `complete` when its Stage Quiz was first passed,
 * and a later attempt never clears that. `read` is the Read Mark and is only that:
 * nothing here, and nothing that reads this, may treat it as a completion flag.
 *
 * Who can read what is the database's call, not this file's. A Student asking for
 * anyone else's record gets null, and so does anyone with no Student row.
 */

// --- Sittings (moved here from baseline.ts, which re-exports them) -------------

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

/** A Sitting as the database returns it, from the record or from the submit call. */
export type SittingRow = {
  sitting_no: number;
  submitted_at: string;
  level_scores: Record<string, LevelScore> | null;
  total_score: number;
  total_max: number;
};

export function percent(score: number, max: number): number {
  return max > 0 ? Math.round((100 * score) / max) : 0;
}

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

// --- The record --------------------------------------------------------------

export type StageQuizAttempt = {
  attemptId: string;
  attemptNo: number;
  scoreRaw: number;
  scoreMax: number;
  scorePct: number;
  passed: boolean;
  submittedAt: Date;
};

export type StageEntry = {
  slug: string;
  levelSlug: string;
  order: number;
  isMandatory: boolean;
  /** The Read Mark: opened and marked read, so the Student can resume. Not completion. */
  read: boolean;
  readAt: Date | null;
  /** Opened a lesson in this Stage, or sat its Stage Quiz. */
  started: boolean;
  lastLessonSlug: string | null;
  /** The Stage Quiz was first passed. Set once; a later attempt never clears it. */
  complete: boolean;
  completedAt: Date | null;
  quiz: {
    /** Submitted Stage Quiz attempts. Every one is kept; the record shows the latest. */
    attempts: number;
    latest: StageQuizAttempt | null;
    openAttemptId: string | null;
  };
};

export type LevelEntry = {
  slug: string;
  order: number;
  /** Every mandatory Stage Quiz in the Level passed: `learn_level_earned()` itself. */
  complete: boolean;
  completedAt: Date | null;
  stagesTotal: number;
  stagesPassed: number;
  stagesRead: number;
  percentComplete: number;
  status: ProgressStatus;
  /** The first mandatory Stage not yet passed, else the last. */
  resumeStageSlug: string | null;
  /** The live Certificate, or null (none issued, or revoked). */
  certificate: { code: string; issuedAt: Date } | null;
};

export type CertificateEntry = {
  code: string;
  levelSlug: string | null;
  issuedName: string;
  awardTitle: string | null;
  scorePct: number | null;
  issuedAt: Date;
  revokedAt: Date | null;
};

export type ProgressRecord = {
  learner: { id: string; name: string; signedUpAt: Date; lastActiveAt: Date };
  baseline: {
    /** Oldest first. Scores only, never answers. */
    sittings: Sitting[];
    /** The Sitting owed now: 1 until it is sat, then once per run of Levels, null at four. */
    sittingDue: number | null;
  };
  /** Every Stage, in Course order. */
  stages: StageEntry[];
  /** Every Level, in Course order. */
  levels: LevelEntry[];
  /** Every Certificate, revoked ones included. */
  certificates: CertificateEntry[];
};

/** What `learn_progress_record()` returns (see the header of save7-os 0138). */
export type RawProgressRecord = {
  learner: { id: string; name: string; signed_up_at: string; last_active_at: string };
  baseline: { sittings: SittingRow[]; sitting_due: number | null };
  stages: Array<{
    stage_slug: string;
    level_slug: string;
    position: number;
    is_mandatory: boolean;
    read: boolean;
    read_at: string | null;
    started: boolean;
    last_lesson_slug: string | null;
    complete: boolean;
    completed_at: string | null;
    quiz: {
      attempts: number;
      latest: {
        attempt_id: string;
        attempt_no: number;
        score_raw: number;
        score_max: number;
        score_pct: number;
        passed: boolean;
        submitted_at: string;
      } | null;
      open_attempt_id: string | null;
    };
  }>;
  levels: Array<{
    level_slug: string;
    position: number;
    complete: boolean;
    completed_at: string | null;
    stages_total: number;
    stages_passed: number;
    stages_read: number;
    percent_complete: number;
    status: ProgressStatus;
    resume_stage_slug: string | null;
    certificate: { code: string; issued_at: string } | null;
  }>;
  certificates: Array<{
    code: string;
    level_slug: string | null;
    issued_name: string;
    award_title: string | null;
    score_pct: number | null;
    issued_at: string;
    revoked_at: string | null;
  }>;
};

const date = (value: string | null): Date | null => (value ? new Date(value) : null);

export function mapProgressRecord(raw: RawProgressRecord): ProgressRecord {
  return {
    learner: {
      id: raw.learner.id,
      name: raw.learner.name,
      signedUpAt: new Date(raw.learner.signed_up_at),
      lastActiveAt: new Date(raw.learner.last_active_at),
    },
    baseline: {
      sittings: raw.baseline.sittings.map(mapSitting),
      sittingDue: raw.baseline.sitting_due,
    },
    stages: raw.stages.map((s) => ({
      slug: s.stage_slug,
      levelSlug: s.level_slug,
      order: s.position,
      isMandatory: s.is_mandatory,
      read: s.read,
      readAt: date(s.read_at),
      started: s.started,
      lastLessonSlug: s.last_lesson_slug,
      complete: s.complete,
      completedAt: date(s.completed_at),
      quiz: {
        attempts: s.quiz.attempts,
        latest: s.quiz.latest && {
          attemptId: s.quiz.latest.attempt_id,
          attemptNo: s.quiz.latest.attempt_no,
          scoreRaw: s.quiz.latest.score_raw,
          scoreMax: s.quiz.latest.score_max,
          scorePct: s.quiz.latest.score_pct,
          passed: s.quiz.latest.passed === true,
          submittedAt: new Date(s.quiz.latest.submitted_at),
        },
        openAttemptId: s.quiz.open_attempt_id,
      },
    })),
    levels: raw.levels.map((l) => ({
      slug: l.level_slug,
      order: l.position,
      complete: l.complete,
      completedAt: date(l.completed_at),
      stagesTotal: l.stages_total,
      stagesPassed: l.stages_passed,
      stagesRead: l.stages_read,
      percentComplete: l.percent_complete,
      status: l.status,
      resumeStageSlug: l.resume_stage_slug,
      certificate: l.certificate && {
        code: l.certificate.code,
        issuedAt: new Date(l.certificate.issued_at),
      },
    })),
    certificates: raw.certificates.map((c) => ({
      code: c.code,
      levelSlug: c.level_slug,
      issuedName: c.issued_name,
      awardTitle: c.award_title,
      scorePct: c.score_pct,
      issuedAt: new Date(c.issued_at),
      revokedAt: date(c.revoked_at),
    })),
  };
}

// --- Reads -------------------------------------------------------------------

/**
 * One Student's Progress Record, or null when there is none to show: no Student row,
 * or somebody else's record asked for by a caller who is not an Admin.
 *
 * With no id it is the signed-in caller's own. Passing the caller's own id is the same
 * thing; a Student naming anyone else is refused by the database, not here.
 *
 * Memoised per request, so a page that asks for the pathway, the Baseline and the
 * Certificates builds the record once. It must therefore not be called to read back a
 * write made earlier in the same request.
 */
export const getProgressRecord = cache(
  async (learnerId?: string): Promise<ProgressRecord | null> => {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.rpc(
      "learn_progress_record",
      learnerId ? { p_learner: learnerId } : {},
    );
    if (error) throw new Error(`Could not read the Progress Record: ${error.message}`);
    return data ? mapProgressRecord(data as unknown as RawProgressRecord) : null;
  },
);

/**
 * Every Student's record, for an Admin: newest sign-up first, one page at a time
 * because the API caps a response. A Student calling this gets their own single record.
 */
export async function getProgressRecords(
  limit: number,
  offset: number,
): Promise<ProgressRecord[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("learn_progress_records", {
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw new Error(`Could not read the Students: ${error.message}`);
  return ((data ?? []) as unknown as Array<{ record: RawProgressRecord }>).map((r) =>
    mapProgressRecord(r.record),
  );
}
