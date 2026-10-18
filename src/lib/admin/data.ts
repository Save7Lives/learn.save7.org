import "server-only";

import { getProgressRecord, getProgressRecords, type ProgressRecord } from "@/lib/progress-record";
import { coursePosition, type CoursePosition } from "@/lib/course-position";
import { supabaseServer } from "@/lib/supabase/server";
import { loadActorNames } from "@/lib/admin/actors";
import {
  rankMissedQuestions,
  type Catalogue,
  type EligibilityRule,
  type EligibilitySignal,
  type MissedQuestion,
  type StageRecord,
  type StudentRecord,
} from "./model";

/**
 * The Admin's reads (#84). Every query runs with the signed-in Admin's own
 * JWT, so row level security is the boundary and `requireAdmin` in the layout is the
 * second layer: the `learn_is_admin()` arm of each `learn_*` select policy is what
 * lets one query return every Student.
 *
 * A Student's progress is read as their Progress Record (`learn_progress_record()` and
 * `learn_progress_records()`, save7-os 0138): the same record a Student reads for
 * themselves, so nothing here works out a completion, a latest attempt or a Sitting.
 * `mapLearner` only reshapes it into the `StudentRecord` that `model.ts` reads. The
 * Eligibility Signal is not part of the record (it is produced by evaluating one), so
 * it is read beside it.
 *
 * Nothing here selects an email address, a date of birth or a raw answer (#72, #18).
 */

export async function loadCatalogue(): Promise<Catalogue> {
  const supabase = await supabaseServer();
  const [levelResult, moduleResult] = await Promise.all([
    supabase.from("learn_levels").select("slug, title, position").order("position"),
    supabase.from("learn_modules").select("slug, title, position, level_slug").order("position"),
  ]);
  const stages = (moduleResult.data ?? []) as unknown as Array<{
    slug: string;
    title: string;
    position: number;
    level_slug: string;
  }>;
  return ((levelResult.data ?? []) as unknown as Array<{ slug: string; title: string }>).map(
    (l) => ({
      slug: l.slug,
      title: l.title,
      stages: stages
        .filter((m) => m.level_slug === l.slug)
        .map((m) => ({ slug: m.slug, title: m.title, position: m.position })),
    }),
  );
}

/** The Student's record reshaped for `model.ts`. No rule is applied here. Exported for the tests. */
export function mapLearner(
  record: ProgressRecord,
  signal: EligibilitySignal | null,
  catalogue: Catalogue,
): StudentRecord {
  /* A Stage appears only once it has been opened or its quiz attempted, as before: a
     Stage with no entry has never been opened. */
  const stages: Record<string, StageRecord> = {};
  for (const s of record.stages) {
    if (!s.started && !s.complete) continue;
    stages[s.slug] = {
      passedAt: s.completedAt,
      started: s.started,
      attempts: s.quiz.attempts,
      latest: s.quiz.latest && {
        score: s.quiz.latest.scoreRaw,
        max: s.quiz.latest.scoreMax,
        at: s.quiz.latest.submittedAt,
        passed: s.quiz.latest.passed,
      },
    };
  }

  const levelCompletedAt: Record<string, Date | null> = {};
  for (const l of catalogue) levelCompletedAt[l.slug] = null;
  for (const l of record.levels) levelCompletedAt[l.slug] = l.complete ? l.completedAt : null;

  return {
    id: record.learner.id,
    name: record.learner.name,
    signedUpAt: record.learner.signedUpAt,
    lastActiveAt: record.learner.lastActiveAt,
    sittings: record.baseline.sittings,
    stages,
    levelCompletedAt,
    sittingDue: record.baseline.sittingDue,
    certificates: record.certificates.map((c) => ({
      code: c.code,
      levelSlug: c.levelSlug,
      awardTitle: c.awardTitle ?? "",
      issuedAt: c.issuedAt,
      revokedAt: c.revokedAt,
    })),
    signal,
  };
}

type SignalRow = {
  learner_id: string;
  eligible: boolean;
  evaluated_at: string;
  rule_version: number;
};

const toSignal = (r: SignalRow): EligibilitySignal => ({
  eligible: r.eligible,
  evaluatedAt: new Date(r.evaluated_at),
  ruleVersion: r.rule_version,
});

const BATCH = 500;

/** Everyone who has signed up, newest first. Paged, because the API caps a response. */
export async function loadStudents(catalogue: Catalogue): Promise<StudentRecord[]> {
  const supabase = await supabaseServer();

  /* One Signal per Student (its primary key is the learner), so a map by learner. */
  const signals = new Map<string, EligibilitySignal>();
  for (let from = 0; ; from += BATCH) {
    const { data, error } = await supabase
      .from("learn_eligibility_signals")
      .select("learner_id, eligible, evaluated_at, rule_version")
      .order("learner_id")
      .range(from, from + BATCH - 1);
    if (error) throw new Error(`Could not read the Eligibility Signals: ${error.message}`);
    const rows = (data ?? []) as unknown as SignalRow[];
    for (const r of rows) signals.set(r.learner_id, toSignal(r));
    if (rows.length < BATCH) break;
  }

  const students: StudentRecord[] = [];
  for (let from = 0; ; from += BATCH) {
    const records = await getProgressRecords(BATCH, from);
    students.push(...records.map((r) => mapLearner(r, signals.get(r.learner.id) ?? null, catalogue)));
    if (records.length < BATCH) return students;
  }
}

/**
 * One Student for the drill-down: their record in the Admin's shape, and their Course
 * Position, the same one their own pages read, so "the Stage they are up to" and
 * "content open" are never worked out twice.
 */
export async function loadStudent(
  id: string,
  catalogue: Catalogue,
): Promise<{ student: StudentRecord; position: CoursePosition } | null> {
  const supabase = await supabaseServer();
  const [record, signalResult] = await Promise.all([
    getProgressRecord(id),
    supabase
      .from("learn_eligibility_signals")
      .select("learner_id, eligible, evaluated_at, rule_version")
      .eq("learner_id", id)
      .maybeSingle(),
  ]);
  if (!record) return null;
  const signalRow = signalResult.data as unknown as SignalRow | null;
  return {
    student: mapLearner(record, signalRow ? toSignal(signalRow) : null, catalogue),
    position: coursePosition(catalogue, record, { signedIn: true }),
  };
}

export type ActivityEvent = { type: string; stage: string | null; at: Date };

/** A Student's latest dashboard events, newest first (#81). No IP, no device (privacy notice). */
export async function loadActivity(id: string, limit = 12): Promise<ActivityEvent[]> {
  const supabase = await supabaseServer();
  const [events, modules] = await Promise.all([
    supabase
      .from("learn_events")
      .select("type, module_slug, created_at")
      .eq("learner_id", id)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase.from("learn_modules").select("slug, title"),
  ]);
  const titles = new Map(
    ((modules.data ?? []) as unknown as Array<{ slug: string; title: string }>).map((m) => [m.slug, m.title]),
  );
  return ((events.data ?? []) as unknown as Array<{ type: string; module_slug: string | null; created_at: string }>).map(
    (e) => ({ type: e.type, stage: e.module_slug ? (titles.get(e.module_slug) ?? null) : null, at: new Date(e.created_at) }),
  );
}

type RuleRow = {
  version: number;
  required_flags: string[];
  created_at: string;
  created_by_user: string | null;
};

/** Every version, newest first. The current rule is the highest version (#83). */
export async function loadRules(): Promise<EligibilityRule[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("learn_eligibility_rules")
    .select("version, required_flags, created_at, created_by_user")
    .order("version", { ascending: false });
  const rows = (data ?? []) as unknown as RuleRow[];
  const names = await loadActorNames(rows.map((r) => r.created_by_user));
  return rows.map((r) => ({
    version: r.version,
    requiredFlags: r.required_flags,
    createdAt: new Date(r.created_at),
    createdByName: (r.created_by_user && names.get(r.created_by_user)) || null,
  }));
}

/** One row of `learn_answers` as read here: which question, and whether it was answered correctly. */
type AnswerRow = { question_id: string; was_correct: boolean };

/** Rows per page of `learn_answers`: the API caps a response. */
const ANSWER_BATCH = 1000;

/**
 * The most commonly missed Stage Quiz questions.
 *
 * Each Stage Quiz attempt is a paper of five from the Stage's fifteen, and its
 * `learn_answers` rows are one per question on that paper (checked 2026-10-17), so
 * `was_correct` over a question's rows is "of the times it was set, how often it was
 * missed". Baseline Sittings store no answers, so this is Stage Quizzes only, and it
 * covers every Student, not the signed-up window.
 */
export async function loadMissedQuestions(limit = 5): Promise<MissedQuestion[]> {
  const supabase = await supabaseServer();
  /* The question text comes from `learn_questions_pub`: `learn_questions` itself has
     no grant for any signed-in role (it holds the explanations beside the answer
     keys), so reading it, as this once did, returned nothing for every Admin. The
     answer rows are the Admin's to read (`learn_answers_own`), so they are read apart
     and paged: the API caps a response, and one row is written per question answered. */
  const [questions, modules] = await Promise.all([
    supabase.from("learn_questions_pub").select("id, prompt, module_slug").eq("scope", "POST"),
    supabase.from("learn_modules").select("slug, title"),
  ]);
  const answers: AnswerRow[] = [];
  for (let from = 0; ; from += ANSWER_BATCH) {
    const { data, error } = await supabase
      .from("learn_answers")
      .select("question_id, was_correct")
      .order("id")
      .range(from, from + ANSWER_BATCH - 1);
    if (error) throw new Error(`Could not read the answers: ${error.message}`);
    const rows = (data ?? []) as unknown as AnswerRow[];
    answers.push(...rows);
    if (rows.length < ANSWER_BATCH) break;
  }
  return rankMissedQuestions(
    (questions.data ?? []) as unknown as Array<{ id: string; prompt: string; module_slug: string | null }>,
    (modules.data ?? []) as unknown as Array<{ slug: string; title: string }>,
    answers,
    limit,
  );
}

export type { MissedQuestion };
export type { Sitting } from "@/lib/progress-record";
