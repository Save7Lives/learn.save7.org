/**
 * Progress Record fixtures, shaped exactly like what `learn_progress_record()` returns
 * (save7-os 0138). Each named case here is the same case that
 * scripts/progress-record/scenarios.sql builds in the database, under the same name,
 * so a rule is pinned from both sides: SQL decides it, the app maps and reads it.
 *
 *   NEW_STUDENT                  no Sitting, Sitting 1 owed, nothing started
 *   READ_MARK_ONLY               a Read Mark with no pass: read, not complete
 *   FAIL_THEN_PASS_THEN_FAIL     complete at the first pass; the latest attempt is the failed third
 *   TWO_LEVELS_BETWEEN_SITTINGS  two Levels done since Sitting 1: Sitting 2 owed once ...
 *   TWO_LEVELS_AFTER_SITTING_2   ... and nothing owed once Sitting 2 is in
 *   REVOKED_CERTIFICATE          a live Certificate on its Level, a revoked one on none
 *   OUT_OF_ORDER                 Intermediate done and Advanced started, Beginner never opened
 *   ALL_PASSED                   every Stage Quiz passed: each Level resumes at its last Stage
 *   ANOTHER_STUDENTS_RECORD      null: a Student asking for somebody else's
 *
 * The catalogue is small on purpose: three Levels, four Stages.
 */
import type { RawProgressRecord } from "../progress-record";
import type { Catalogue, StudentRecord } from "../admin/model";
import type { Sitting } from "../baseline";

export const CATALOGUE: Catalogue = [
  {
    slug: "beginner",
    title: "Beginner",
    stages: [
      { slug: "stage-1", title: "Stage 1", position: 1 },
      { slug: "stage-2", title: "Stage 2", position: 2 },
    ],
  },
  { slug: "intermediate", title: "Intermediate", stages: [{ slug: "stage-3", title: "Stage 3", position: 1 }] },
  { slug: "advanced", title: "Advanced", stages: [{ slug: "stage-4", title: "Stage 4", position: 1 }] },
];

/** Whole days after a fixed start, as the ISO strings the database returns. */
const START = Date.UTC(2026, 0, 1);
export const day = (n: number): Date => new Date(START + n * 86_400_000);
export const iso = (n: number): string => day(n).toISOString();

type Raw = RawProgressRecord;
type RawStage = Raw["stages"][number];
type RawLevel = Raw["levels"][number];

const STAGE_LAYOUT: Array<[stage: string, level: string, position: number]> = [
  ["stage-1", "beginner", 1],
  ["stage-2", "beginner", 2],
  ["stage-3", "intermediate", 1],
  ["stage-4", "advanced", 1],
];

const LEVEL_LAYOUT: Array<[level: string, position: number, stages: number, resume: string]> = [
  ["beginner", 1, 2, "stage-1"],
  ["intermediate", 2, 1, "stage-3"],
  ["advanced", 3, 1, "stage-4"],
];

export function rawStage(stage: string, over: Partial<RawStage> = {}): RawStage {
  const [, level, position] = STAGE_LAYOUT.find(([s]) => s === stage)!;
  return {
    stage_slug: stage,
    level_slug: level,
    position,
    is_mandatory: true,
    read: false,
    read_at: null,
    started: false,
    last_lesson_slug: null,
    complete: false,
    completed_at: null,
    quiz: { attempts: 0, latest: null, open_attempt_id: null },
    ...over,
  };
}

export function rawLevel(level: string, over: Partial<RawLevel> = {}): RawLevel {
  const [, position, total, resume] = LEVEL_LAYOUT.find(([l]) => l === level)!;
  return {
    level_slug: level,
    position,
    complete: false,
    completed_at: null,
    stages_total: total,
    stages_passed: 0,
    stages_read: 0,
    percent_complete: 0,
    status: "NOT_STARTED",
    resume_stage_slug: resume,
    certificate: null,
    ...over,
  };
}

export function sittingRow(
  no: number,
  at: string,
  scores: Record<string, [score: number, max: number]>,
  total: [number, number],
): Raw["baseline"]["sittings"][number] {
  return {
    sitting_no: no,
    submitted_at: at,
    level_scores: Object.fromEntries(Object.entries(scores).map(([k, [score, max]]) => [k, { score, max }])),
    total_score: total[0],
    total_max: total[1],
  };
}

const LEARNER = { id: "00000000-0000-4000-8000-00000000000a", name: "Probe Student A" };

export function rawRecord(over: {
  sittings?: Raw["baseline"]["sittings"];
  sitting_due?: number | null;
  stages?: Record<string, Partial<RawStage>>;
  levels?: Record<string, Partial<RawLevel>>;
  certificates?: Raw["certificates"];
} = {}): Raw {
  return {
    learner: { ...LEARNER, signed_up_at: iso(0), last_active_at: iso(0) },
    baseline: { sittings: over.sittings ?? [], sitting_due: over.sitting_due === undefined ? 1 : over.sitting_due },
    stages: STAGE_LAYOUT.map(([s]) => rawStage(s, over.stages?.[s])),
    levels: LEVEL_LAYOUT.map(([l]) => rawLevel(l, over.levels?.[l])),
    certificates: over.certificates ?? [],
  };
}

// --- The named cases ---------------------------------------------------------

export const NEW_STUDENT: Raw = rawRecord();

export const READ_MARK_ONLY: Raw = rawRecord({
  stages: { "stage-1": { read: true, read_at: iso(1), started: true, last_lesson_slug: "lesson-1" } },
  levels: { beginner: { status: "IN_PROGRESS", stages_read: 1 } },
});

/** Attempt 1 fails (3 of 5), attempt 2 passes (4 of 5) on day 2, attempt 3 fails (0 of 5). */
export const FAIL_THEN_PASS_THEN_FAIL: Raw = rawRecord({
  stages: {
    "stage-1": {
      read: true,
      read_at: iso(1),
      started: true,
      complete: true,
      completed_at: iso(2),
      quiz: {
        attempts: 3,
        open_attempt_id: null,
        latest: {
          attempt_id: "00000000-0000-4000-8000-0000000000a3",
          attempt_no: 3,
          score_raw: 0,
          score_max: 5,
          score_pct: 0,
          passed: false,
          submitted_at: iso(4),
        },
      },
    },
  },
  levels: { beginner: { status: "IN_PROGRESS", stages_passed: 1, stages_read: 1, percent_complete: 50, resume_stage_slug: "stage-2" } },
});

const SITTING_1 = sittingRow(1, iso(1), { beginner: [1, 4], intermediate: [2, 4] }, [3, 20]);
const SITTING_2 = sittingRow(2, iso(20), { beginner: [3, 4], intermediate: [3, 4] }, [12, 20]);

const TWO_LEVELS_DONE = {
  stages: {
    "stage-1": { read: true, read_at: iso(3), started: true, complete: true, completed_at: iso(4) },
    "stage-2": { read: true, read_at: iso(5), started: true, complete: true, completed_at: iso(6) },
    "stage-3": { read: true, read_at: iso(7), started: true, complete: true, completed_at: iso(8) },
  },
  levels: {
    beginner: {
      complete: true, completed_at: iso(6), status: "COMPLETE" as const,
      stages_passed: 2, stages_read: 2, percent_complete: 100, resume_stage_slug: "stage-2",
    },
    intermediate: {
      complete: true, completed_at: iso(8), status: "COMPLETE" as const,
      stages_passed: 1, stages_read: 1, percent_complete: 100, resume_stage_slug: "stage-3",
    },
  },
};

export const TWO_LEVELS_BETWEEN_SITTINGS: Raw = rawRecord({ ...TWO_LEVELS_DONE, sittings: [SITTING_1], sitting_due: 2 });

export const TWO_LEVELS_AFTER_SITTING_2: Raw = rawRecord({
  ...TWO_LEVELS_DONE,
  sittings: [SITTING_1, SITTING_2],
  sitting_due: null,
});

const CERT_LIVE = {
  code: "ZZPROBE-0001", level_slug: "beginner", issued_name: "Probe Student A",
  award_title: "Probe award", score_pct: 100, issued_at: iso(7), revoked_at: null,
};
const CERT_REVOKED = {
  code: "ZZPROBE-0002", level_slug: "intermediate", issued_name: "Probe Student A",
  award_title: "Probe award", score_pct: 100, issued_at: iso(9), revoked_at: iso(10),
};

/** Newest first, as the builder orders them; the Level carries only its live one. */
export const REVOKED_CERTIFICATE: Raw = rawRecord({
  ...TWO_LEVELS_DONE,
  sittings: [SITTING_1],
  sitting_due: 2,
  levels: {
    ...TWO_LEVELS_DONE.levels,
    beginner: { ...TWO_LEVELS_DONE.levels.beginner, certificate: { code: CERT_LIVE.code, issued_at: CERT_LIVE.issued_at } },
  },
  certificates: [CERT_REVOKED, CERT_LIVE],
});

/**
 * Started out of Course order: Intermediate complete, Advanced's only Stage read and not
 * passed, Beginner never opened. The Student is on Advanced, not on Beginner.
 */
export const OUT_OF_ORDER: Raw = rawRecord({
  sittings: [SITTING_1],
  sitting_due: 2,
  stages: {
    "stage-3": { read: true, read_at: iso(7), started: true, complete: true, completed_at: iso(8) },
    "stage-4": { read: true, read_at: iso(10), started: true, last_lesson_slug: "lesson-2" },
  },
  levels: {
    intermediate: TWO_LEVELS_DONE.levels.intermediate,
    advanced: { status: "IN_PROGRESS", stages_read: 1 },
  },
});

/** Every Stage Quiz passed: every Level complete, each resuming at its last Stage. */
export const ALL_PASSED: Raw = rawRecord({
  sittings: [SITTING_1],
  sitting_due: 2,
  stages: {
    ...TWO_LEVELS_DONE.stages,
    "stage-4": { read: true, read_at: iso(9), started: true, complete: true, completed_at: iso(10) },
  },
  levels: {
    ...TWO_LEVELS_DONE.levels,
    advanced: {
      complete: true, completed_at: iso(10), status: "COMPLETE",
      stages_passed: 1, stages_read: 1, percent_complete: 100, resume_stage_slug: "stage-4",
    },
  },
});

export const ANOTHER_STUDENTS_RECORD = null;

// --- Admin-side Students, for the Growth Indicators --------------------------

export function sitting(no: number, at: number, scores: Record<string, [number, number]>, total: [number, number]): Sitting {
  return {
    sittingNo: no,
    submittedAt: day(at),
    levelScores: Object.fromEntries(Object.entries(scores).map(([k, [score, max]]) => [k, { score, max }])),
    totalScore: total[0],
    totalMax: total[1],
    totalPct: total[1] > 0 ? Math.round((100 * total[0]) / total[1]) : 0,
  };
}

export function student(id: string, over: Partial<StudentRecord> = {}): StudentRecord {
  return {
    id,
    name: id,
    signedUpAt: day(0),
    lastActiveAt: day(0),
    sittings: [],
    stages: {},
    levelCompletedAt: {},
    sittingDue: null,
    certificates: [],
    signal: null,
    ...over,
  };
}

const passedStage = (at: number) => ({ passedAt: day(at), started: true, attempts: 1, latest: null });
const failedStage = (attempts = 1) => ({ passedAt: null, started: true, attempts, latest: null });

/**
 * Three Students:
 *  ana   beginner done on day 6, intermediate on day 8; Sittings 1 (day 1), 2 (day 7), 3 (day 9)
 *  ben   beginner done on day 6; Sittings 1 and 2 (day 7); has tried Stage 3 and failed
 *  cleo  no Sitting; opened Stage 1 only
 */
export const POOL: StudentRecord[] = [
  student("ana", {
    signedUpAt: day(0),
    sittings: [
      sitting(1, 1, { beginner: [1, 4], intermediate: [2, 4] }, [3, 20]),
      sitting(2, 7, { beginner: [3, 4], intermediate: [2, 4] }, [10, 20]),
      sitting(3, 9, { beginner: [4, 4], intermediate: [4, 4] }, [16, 20]),
    ],
    stages: { "stage-1": passedStage(4), "stage-2": passedStage(6), "stage-3": passedStage(8) },
    levelCompletedAt: { beginner: day(6), intermediate: day(8) },
  }),
  student("ben", {
    signedUpAt: day(10),
    sittings: [
      sitting(1, 11, { beginner: [2, 4], intermediate: [1, 4] }, [5, 20]),
      sitting(2, 17, { beginner: [3, 4], intermediate: [1, 4] }, [8, 20]),
    ],
    stages: { "stage-1": passedStage(13), "stage-2": passedStage(15), "stage-3": failedStage(2) },
    levelCompletedAt: { beginner: day(16) },
  }),
  student("cleo", {
    signedUpAt: day(50),
    stages: { "stage-1": { passedAt: null, started: true, attempts: 0, latest: null } },
  }),
];
