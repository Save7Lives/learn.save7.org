import "server-only";

import { SITTING_COLUMNS, mapSitting, type Sitting } from "@/lib/baseline";
import { supabaseServer } from "@/lib/supabase/server";
import { loadActorNames } from "@/lib/admin/actors";
import type {
  Catalogue,
  EligibilityRule,
  EligibilitySignal,
  StageRecord,
  StudentRecord,
} from "./model";

/**
 * The Admin's reads (#84). Every query runs with the signed-in Admin's own
 * JWT, so row level security is the boundary and `requireAdmin` in the layout is the
 * second layer: the `learn_is_admin()` arm of each `learn_*` select policy is what
 * lets one query return every Student.
 *
 * Nothing here selects an email address, a date of birth or a raw answer (#72, #18).
 */

type SittingRow = Parameters<typeof mapSitting>[0];

type LearnerRow = {
  id: string;
  name: string;
  created_at: string;
  last_seen_at: string | null;
  learn_baseline_sittings: SittingRow[] | null;
  learn_module_progress: Array<{ module_slug: string; quiz_passed_at: string | null }> | null;
  learn_level_progress: Array<{ level_slug: string; completed_at: string | null }> | null;
  learn_attempts: Array<{
    scope: string;
    module_slug: string | null;
    attempt_no: number;
    score_raw: number | null;
    score_max: number | null;
    passed: boolean | null;
    submitted_at: string | null;
  }> | null;
  learn_certificates: Array<{
    code: string;
    level_slug: string | null;
    award_title: string | null;
    issued_at: string;
    revoked_at: string | null;
  }> | null;
  /** One row per Student: the signal's primary key is the learner. */
  learn_eligibility_signals: {
    eligible: boolean;
    evaluated_at: string;
    rule_version: number;
  } | null;
  /** The newest event only, by the embedded order and limit below. */
  learn_events: Array<{ created_at: string }> | null;
};

const LEARNER_SELECT =
  "id, name, created_at, last_seen_at, " +
  `learn_baseline_sittings(${SITTING_COLUMNS}), ` +
  "learn_module_progress(module_slug, quiz_passed_at), " +
  "learn_level_progress(level_slug, completed_at), " +
  "learn_attempts(scope, module_slug, attempt_no, score_raw, score_max, passed, submitted_at), " +
  "learn_certificates(code, level_slug, award_title, issued_at, revoked_at), " +
  "learn_eligibility_signals(eligible, evaluated_at, rule_version), " +
  "learn_events(created_at)";

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

function mapLearner(row: LearnerRow, catalogue: Catalogue): StudentRecord {
  const signedUpAt = new Date(row.created_at);

  const stages: Record<string, StageRecord> = {};
  const stage = (slug: string): StageRecord =>
    (stages[slug] ??= { passedAt: null, started: false, attempts: 0, latest: null });

  for (const p of row.learn_module_progress ?? []) {
    const s = stage(p.module_slug);
    s.started = true;
    s.passedAt = p.quiz_passed_at ? new Date(p.quiz_passed_at) : null;
  }
  /* Stage Quiz attempts only: a Baseline Sitting is its own table, and the old
     PRE and CHECK scopes are not Stage Quizzes. Newest submitted attempt last. */
  const attempts = (row.learn_attempts ?? [])
    .filter((a) => a.scope === "POST" && a.module_slug && a.submitted_at)
    .sort((a, b) => a.attempt_no - b.attempt_no);
  for (const a of attempts) {
    const s = stage(a.module_slug as string);
    s.attempts += 1;
    s.latest = {
      score: a.score_raw ?? 0,
      max: a.score_max ?? 0,
      at: new Date(a.submitted_at as string),
      passed: a.passed === true,
    };
  }

  const levelCompletedAt: Record<string, Date | null> = {};
  for (const l of catalogue) levelCompletedAt[l.slug] = null;
  for (const p of row.learn_level_progress ?? []) {
    levelCompletedAt[p.level_slug] = p.completed_at ? new Date(p.completed_at) : null;
  }

  /* "Last active" has no column of its own: `last_seen_at` is stamped only when an
     account is claimed. The source is the newest dashboard event (lesson views, quiz
     starts and submissions, module completions), falling back to the signup. */
  const eventAt = row.learn_events?.[0]?.created_at;
  const lastActiveAt = new Date(
    Math.max(
      signedUpAt.getTime(),
      eventAt ? new Date(eventAt).getTime() : 0,
      row.last_seen_at ? new Date(row.last_seen_at).getTime() : 0,
    ),
  );

  const signal: EligibilitySignal | null = row.learn_eligibility_signals
    ? {
        eligible: row.learn_eligibility_signals.eligible,
        evaluatedAt: new Date(row.learn_eligibility_signals.evaluated_at),
        ruleVersion: row.learn_eligibility_signals.rule_version,
      }
    : null;

  return {
    id: row.id,
    name: row.name,
    signedUpAt,
    lastActiveAt,
    sittings: (row.learn_baseline_sittings ?? []).map(mapSitting).sort((a, b) => a.sittingNo - b.sittingNo),
    stages,
    levelCompletedAt,
    certificates: (row.learn_certificates ?? []).map((c) => ({
      code: c.code,
      levelSlug: c.level_slug,
      awardTitle: c.award_title ?? "",
      issuedAt: new Date(c.issued_at),
      revokedAt: c.revoked_at ? new Date(c.revoked_at) : null,
    })),
    signal,
  };
}

const BATCH = 500;

/** Everyone who has signed up, newest first. Paged, because the API caps a response. */
export async function loadStudents(catalogue: Catalogue): Promise<StudentRecord[]> {
  const supabase = await supabaseServer();
  const students: StudentRecord[] = [];
  for (let from = 0; ; from += BATCH) {
    const { data, error } = await supabase
      .from("learners")
      .select(LEARNER_SELECT)
      .order("created_at", { ascending: false })
      .order("created_at", { referencedTable: "learn_events", ascending: false })
      .limit(1, { referencedTable: "learn_events" })
      .range(from, from + BATCH - 1);
    if (error) throw new Error(`Could not read the Students: ${error.message}`);
    const rows = (data ?? []) as unknown as LearnerRow[];
    students.push(...rows.map((r) => mapLearner(r, catalogue)));
    if (rows.length < BATCH) return students;
  }
}

export async function loadStudent(id: string, catalogue: Catalogue): Promise<StudentRecord | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("learners")
    .select(LEARNER_SELECT)
    .eq("id", id)
    .order("created_at", { referencedTable: "learn_events", ascending: false })
    .limit(1, { referencedTable: "learn_events" })
    .maybeSingle();
  return data ? mapLearner(data as unknown as LearnerRow, catalogue) : null;
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
  const [questions, modules] = await Promise.all([
    supabase
      .from("learn_questions")
      .select("id, prompt, module_slug, learn_answers(was_correct)")
      .eq("scope", "POST"),
    supabase.from("learn_modules").select("slug, title"),
  ]);
  const titles = new Map(
    ((modules.data ?? []) as unknown as Array<{ slug: string; title: string }>).map((m) => [m.slug, m.title]),
  );
  return ((questions.data ?? []) as unknown as Array<{
    id: string;
    prompt: string;
    module_slug: string | null;
    learn_answers: Array<{ was_correct: boolean }> | null;
  }>)
    .map((q) => {
      const answered = q.learn_answers?.length ?? 0;
      const missed = (q.learn_answers ?? []).filter((a) => !a.was_correct).length;
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

export type { Sitting };
