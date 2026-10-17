import { levelImprovement, percent, type Sitting } from "@/lib/baseline";
import { flagLabel, levelFlag, readsEligible } from "./flags";

/**
 * The Admin's view of the Progress Records (#72, #84), as plain data and pure
 * functions. Nothing here reads the database, so every figure on Overview, Students
 * and the drill-down can be rendered, tested and audited from sample records.
 *
 * What it computes is #18's five Growth Indicators and nothing else: Students,
 * completion by Level, the Baseline trend, Improvement by Level and the Stage Quiz
 * pass rate. A Student is never ranked, and no engagement figure other than "last
 * active" is derived (#81).
 */

export type CatalogueStage = { slug: string; title: string; position: number };
export type CatalogueLevel = { slug: string; title: string; stages: CatalogueStage[] };
export type Catalogue = CatalogueLevel[];

export type StageRecord = {
  /** The Stage's first Quiz pass. Set once, never cleared by a later attempt. */
  passedAt: Date | null;
  /** Opened at least one lesson in this Stage, or attempted its quiz. */
  started: boolean;
  /** Submitted Stage Quiz attempts. */
  attempts: number;
  latest: { score: number; max: number; at: Date; passed: boolean } | null;
};

export type CertificateRecord = {
  code: string;
  levelSlug: string | null;
  awardTitle: string;
  issuedAt: Date;
  revokedAt: Date | null;
};

export type EligibilitySignal = { eligible: boolean; evaluatedAt: Date; ruleVersion: number };

export type StudentRecord = {
  id: string;
  name: string;
  signedUpAt: Date;
  /** The latest dashboard activity, or the signup when there has been none (#81). */
  lastActiveAt: Date;
  sittings: Sitting[];
  /** Keyed by Stage slug. A Stage with no row has never been opened. */
  stages: Record<string, StageRecord>;
  levelCompletedAt: Record<string, Date | null>;
  certificates: CertificateRecord[];
  signal: EligibilitySignal | null;
};

export type EligibilityRule = {
  version: number;
  requiredFlags: string[];
  createdAt: Date;
  createdByName: string | null;
};

// --- Eligibility flags (#83) ------------------------------------------------

export { flagLabel, levelFlag, readsEligible };

export function heldFlags(student: StudentRecord): string[] {
  return Object.entries(student.levelCompletedAt)
    .filter(([, at]) => at !== null)
    .map(([slug]) => levelFlag(slug));
}

export function stillNeeded(student: StudentRecord, flags: string[]): string[] {
  const held = new Set(heldFlags(student));
  return flags.filter((f) => !held.has(f));
}

// --- Slicing ----------------------------------------------------------------

export type SignedUpWindow = "all" | "30" | "90";
export const SIGNED_UP_OPTIONS: Array<[SignedUpWindow, string]> = [
  ["all", "All time"],
  ["30", "Last 30 days"],
  ["90", "Last 90 days"],
];

const DAY = 86_400_000;

export function inWindow(student: StudentRecord, window: SignedUpWindow, now: Date): boolean {
  return window === "all" || now.getTime() - student.signedUpAt.getTime() <= Number(window) * DAY;
}

/** Fewer than this and a rate swings on one Student. The view says so. */
export const SMALL_VIEW = 10;

// --- Where a Student is -----------------------------------------------------

export type CurrentLevel =
  | { kind: "awaiting" }
  | { kind: "level"; slug: string; title: string }
  | { kind: "complete" };

/**
 * The Level they are on: none until Sitting 1 is in (Stage content stays closed
 * until then), then the first Level not yet complete, in Course order.
 */
export function currentLevel(student: StudentRecord, catalogue: Catalogue): CurrentLevel {
  if (!student.sittings.some((s) => s.sittingNo === 1)) return { kind: "awaiting" };
  const open = catalogue.find((l) => !student.levelCompletedAt[l.slug]);
  return open ? { kind: "level", slug: open.slug, title: open.title } : { kind: "complete" };
}

export type LevelFilter = "any" | "awaiting" | "complete" | (string & {});

export function matchesLevel(student: StudentRecord, filter: LevelFilter, catalogue: Catalogue): boolean {
  if (filter === "any") return true;
  const c = currentLevel(student, catalogue);
  if (filter === "awaiting") return c.kind === "awaiting";
  if (filter === "complete") return c.kind === "complete";
  return c.kind === "level" && c.slug === filter;
}

export const stagesPassed = (student: StudentRecord): number =>
  Object.values(student.stages).filter((s) => s.passedAt).length;

export const latestSitting = (student: StudentRecord): Sitting | null =>
  student.sittings.reduce<Sitting | null>((a, s) => (!a || s.sittingNo > a.sittingNo ? s : a), null);

export const liveCertificates = (student: StudentRecord) =>
  student.certificates.filter((c) => c.revokedAt === null);

// --- The Growth Indicators --------------------------------------------------

export type Indicators = {
  students: number;
  signedUpLast30: number;
  completion: Array<{ slug: string; title: string; done: number; of: number; pct: number | null }>;
  trend: Array<{ slot: number; students: number; meanPct: number | null }>;
  improvement: Array<{ slug: string; title: string; students: number; meanChange: number | null }>;
  stageQuiz: Array<{
    slug: string;
    title: string;
    stages: Array<{
      slug: string;
      title: string;
      position: number;
      attempted: number;
      passed: number;
      passPct: number | null;
      started: number;
      notPassed: number;
    }>;
  }>;
};

const mean = (values: number[]): number | null =>
  values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;

const rate = (n: number, of: number): number | null => (of > 0 ? (100 * n) / of : null);

export function indicators(students: StudentRecord[], catalogue: Catalogue, now: Date): Indicators {
  const n = students.length;

  return {
    students: n,
    signedUpLast30: students.filter((s) => inWindow(s, "30", now)).length,

    completion: catalogue.map((l) => {
      const done = students.filter((s) => s.levelCompletedAt[l.slug]).length;
      return { slug: l.slug, title: l.title, done, of: n, pct: rate(done, n) };
    }),

    /* Each slot is the Students who took that Sitting, so the later points are
       smaller and different groups. The view says so under the chart. */
    trend: [1, 2, 3, 4].map((slot) => {
      const taken = students.flatMap((s) => s.sittings.filter((x) => x.sittingNo === slot));
      return { slot, students: taken.length, meanPct: mean(taken.map((x) => x.totalPct)) };
    }),

    improvement: catalogue.map((l) => {
      const changes = students.flatMap((s) => {
        const imp = levelImprovement(s.sittings, l.slug, s.levelCompletedAt[l.slug] ?? null);
        return imp ? [imp.change] : [];
      });
      return { slug: l.slug, title: l.title, students: changes.length, meanChange: mean(changes) };
    }),

    /* Of the Students who attempted a Stage Quiz, how many have passed it. A pass
       always counts as an attempt, in case a pass was recorded without its row. */
    stageQuiz: catalogue.map((l) => ({
      slug: l.slug,
      title: l.title,
      stages: l.stages.map((st) => {
        const rows = students.map((s) => s.stages[st.slug]);
        const passed = rows.filter((r) => r?.passedAt).length;
        const attempted = rows.filter((r) => r && (r.passedAt || r.attempts > 0)).length;
        const started = rows.filter((r) => r && (r.started || r.passedAt || r.attempts > 0)).length;
        return {
          slug: st.slug,
          title: st.title,
          position: st.position,
          attempted,
          passed,
          passPct: rate(passed, attempted),
          started,
          notPassed: started - passed,
        };
      }),
    })),
  };
}

export const eligibleCount = (students: StudentRecord[]): number =>
  students.filter((s) => s.signal?.eligible).length;

// --- Students table ---------------------------------------------------------

export const PAGE_SIZE = 10;

export function searchStudents(students: StudentRecord[], query: string): StudentRecord[] {
  const q = query.trim().toLowerCase();
  return q ? students.filter((s) => s.name.toLowerCase().includes(q)) : students;
}

export const byNewestSignup = (a: StudentRecord, b: StudentRecord) =>
  b.signedUpAt.getTime() - a.signedUpAt.getTime();

// --- Most missed questions ---------------------------------------------------

export type MissedQuestion = {
  id: string;
  prompt: string;
  stage: string | null;
  answered: number;
  missed: number;
  missedPct: number;
};

/** A question needs this many answers before it can top the list: one wrong answer is not a pattern. */
export const MISSED_MINIMUM = 3;

/** Per question: how many times it was answered and how many of those were wrong. */
export function tallyAnswers(
  answers: Array<{ question_id: string; was_correct: boolean }>,
): Map<string, { answered: number; missed: number }> {
  const tally = new Map<string, { answered: number; missed: number }>();
  for (const a of answers) {
    const t = tally.get(a.question_id) ?? { answered: 0, missed: 0 };
    t.answered += 1;
    if (!a.was_correct) t.missed += 1;
    tally.set(a.question_id, t);
  }
  return tally;
}

/**
 * The most missed questions, worst first: at least `MISSED_MINIMUM` answers, at least
 * one miss, ordered by share missed and then by how often it was answered.
 */
export function rankMissedQuestions(
  questions: Array<{ id: string; prompt: string; module_slug: string | null }>,
  stages: Array<{ slug: string; title: string }>,
  answers: Array<{ question_id: string; was_correct: boolean }>,
  limit: number,
): MissedQuestion[] {
  const tally = tallyAnswers(answers);
  const titles = new Map(stages.map((m) => [m.slug, m.title]));
  return questions
    .map((q) => {
      const { answered, missed } = tally.get(q.id) ?? { answered: 0, missed: 0 };
      return {
        id: q.id,
        prompt: q.prompt,
        stage: q.module_slug ? (titles.get(q.module_slug) ?? null) : null,
        answered,
        missed,
        missedPct: answered > 0 ? Math.round((100 * missed) / answered) : 0,
      };
    })
    .filter((q) => q.answered >= MISSED_MINIMUM && q.missed > 0)
    .sort((a, b) => b.missedPct - a.missedPct || b.answered - a.answered)
    .slice(0, limit);
}

// --- Baseline ---------------------------------------------------------------

export const SITTING_SLOTS = ["At signup", "After Beginner", "After Intermediate", "After Advanced"];

export { levelImprovement, percent };
