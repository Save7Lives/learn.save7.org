import "server-only";

import { supabaseServer } from "./supabase/server";
import { getProgressRecord } from "./progress-record";
import type { QuestionKind, QuizScope } from "./constants";
import type { OptionRow, QuestionRow } from "@/db/rows";

/**
 * The quiz engine, used by the Baseline, the per-Stage Stage Quizzes, and the
 * inline "check your understanding" blocks inside Stages.
 *
 * Two invariants hold throughout, and both are now enforced by the database
 * rather than by this file being careful:
 *
 * 1. **The answer key never reaches the browser before an answer is submitted.**
 *    `learn_choices.is_correct` has no read path for any role; questions are read
 *    from `learn_options_pub`, which does not carry the column. It is not stripped
 *    on the way out — it is unreadable, so a forgotten mapping step cannot leak it.
 * 2. **Grading happens on the server.** It happens in `learn_submit_attempt()`,
 *    `learn_grade_check()` and `learn_submit_baseline_sitting()`, which are
 *    security definer functions holding the only read path to the key. This app
 *    cannot grade even if it tried.
 *
 * What is left here is the shape the pages expect: `ClientQuestion`, `AttemptRef`,
 * `AttemptResult`. The functions are thin because the logic they used to hold —
 * loading the expected questions server-side, treating unanswered as incorrect,
 * exact set matching, idempotent resubmission — is in migration 0097, stated there
 * in the same terms. The Baseline is not an attempt at all since 0110: its
 * Sittings are read and written in `baseline.ts`, and only its questions come
 * from here.
 *
 * ── ON CHOICE IDS ───────────────────────────────────────────────────────────
 * A choice's `id` is its **option key** — 'a', 'b', 'c', 'd'. It is stable under
 * shuffling, which a row id is not, and it is what the volunteer portal has
 * always submitted, so historical gate attempts still resolve against it.
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

type QuestionFields = Pick<
  QuestionRow,
  "id" | "kind" | "prompt" | "scenario" | "topic_tag" | "position"
>;

const QUESTION_COLUMNS = "id, kind, prompt, scenario, topic_tag, position";

/**
 * Read a set of questions with their options, for the client.
 *
 * Two reads and a join in memory rather than a PostgREST embed: `learn_options_pub`
 * is a view, and an embedded resource on a view has no declared relationship to
 * embed through.
 */
async function readQuestions(
  scope: QuizScope,
  where: { levelSlug?: string; moduleSlug?: string } = {},
): Promise<ClientQuestion[]> {
  const supabase = await supabaseServer();

  let query = supabase.from("learn_questions_pub").select(QUESTION_COLUMNS).eq("scope", scope);
  if (where.levelSlug) query = query.eq("level_slug", where.levelSlug);
  if (where.moduleSlug) query = query.eq("module_slug", where.moduleSlug);

  const { data: questionData } = await query.order("position");

  const rows = (questionData ?? []) as unknown as QuestionFields[];
  if (rows.length === 0) return [];

  const { data: optionData } = await supabase
    .from("learn_options_pub")
    .select("question_id, option_key, position, text")
    .in(
      "question_id",
      rows.map((r) => r.id),
    )
    .order("position");

  const optionsByQuestion = new Map<string, ClientChoice[]>();
  for (const option of (optionData ?? []) as unknown as OptionRow[]) {
    const list = optionsByQuestion.get(option.question_id) ?? [];
    list.push({ id: option.option_key, text: option.text });
    optionsByQuestion.set(option.question_id, list);
  }

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind as QuestionKind,
    prompt: row.prompt,
    scenario: row.scenario,
    topicTag: row.topic_tag,
    choices: optionsByQuestion.get(row.id) ?? [],
  }));
}

// --- Reading questions ------------------------------------------------------

/**
 * The Baseline paper: every PRE question, in its one fixed order, with options in
 * authored order. Never shuffled, so every Sitting is the same paper. Scoped to
 * PRE by `readQuestions`, so the volunteer gate's GATE items can never appear.
 */
export async function getBaselineQuestions(): Promise<ClientQuestion[]> {
  return readQuestions("PRE");
}

export async function getCheckQuestions(moduleId: string): Promise<ClientQuestion[]> {
  return readQuestions("CHECK", { moduleSlug: moduleId });
}

// --- Attempts ---------------------------------------------------------------

export type AttemptRef = { id: string; attemptNo: number };

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
  /** Set for a Stage Quiz: whether this attempt reached the pass mark. */
  passed: boolean | null;
  moduleSlug: string | null;
  levelSlug: string | null;
  scoreRaw: number;
  scoreMax: number;
  scorePct: number;
  answers: GradedAnswer[];
};

/** The database's marked paper, in the shape the review screen renders. */
type DetailPayload = {
  error?: string;
  attempt_id: string;
  attempt_no: number;
  passed?: boolean | null;
  module_slug?: string | null;
  level_slug?: string | null;
  score_raw: number;
  score_max: number;
  score_pct: number;
  answers: Array<{
    question_id: string;
    prompt: string;
    scenario: string | null;
    topic_tag: string;
    explanation: string;
    is_correct: boolean;
    selected: string[] | null;
    choices: Array<{
      id: string;
      text: string;
      is_correct: boolean;
      feedback: string | null;
      was_selected: boolean;
    }> | null;
  }> | null;
};

function mapDetail(payload: DetailPayload): AttemptResult {
  return {
    attemptId: payload.attempt_id,
    attemptNo: payload.attempt_no,
    passed: payload.passed ?? null,
    moduleSlug: payload.module_slug ?? null,
    levelSlug: payload.level_slug ?? null,
    scoreRaw: payload.score_raw,
    scoreMax: payload.score_max,
    scorePct: payload.score_pct,
    answers: (payload.answers ?? []).map((a) => ({
      questionId: a.question_id,
      prompt: a.prompt,
      scenario: a.scenario,
      topicTag: a.topic_tag,
      isCorrect: a.is_correct,
      explanation: a.explanation,
      selectedChoiceIds: a.selected ?? [],
      choices: (a.choices ?? []).map((c) => ({
        id: c.id,
        text: c.text,
        isCorrect: c.is_correct,
        feedback: c.feedback,
        wasSelected: c.was_selected,
      })),
    })),
  };
}

/**
 * Grade and record a submission.
 *
 * Idempotent by design: re-submitting the same attempt returns the stored result
 * rather than regrading, so a double-tap on a slow phone connection cannot produce
 * two different scores. `userId` is kept in the signature because every caller has
 * it, but ownership is checked against the JWT inside the function — an argument
 * naming somebody else would be a client grading another learner's paper.
 */
export async function submitAttempt(
  userId: string,
  attemptId: string,
  submitted: SubmittedAnswer[],
): Promise<AttemptResult | { error: string }> {
  const supabase = await supabaseServer();

  // Keyed by question id, which is how the function looks each answer up. The
  // payload is advisory: the questions the attempt *should* contain are loaded
  // server-side, so an answer for anything outside the paper is ignored.
  const answers: Record<string, { chosen: string[]; free_text: string | null }> = {};
  for (const answer of submitted) {
    answers[answer.questionId] = {
      chosen: answer.choiceIds,
      free_text: answer.freeText?.trim() ? answer.freeText.trim() : null,
    };
  }

  const { data, error } = await supabase.rpc("learn_submit_attempt", {
    p_attempt: attemptId,
    p_answers: answers,
  });

  if (error) return { error: error.message };

  const payload = data as DetailPayload | null;
  if (!payload) return { error: "Could not read back the graded attempt." };
  if (payload.error) return { error: payload.error };

  return mapDetail(payload);
}

/** The full graded detail of a submitted attempt, for the review screen. */
export async function readAttemptResult(
  userId: string,
  attemptId: string,
): Promise<AttemptResult | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc("learn_read_attempt", { p_attempt: attemptId });

  const payload = data as DetailPayload | null;
  // Null covers all three refusals in one: no such attempt, somebody else's, or
  // not submitted yet. The function applies them; this cannot tell them apart and
  // has no reason to.
  if (!payload || payload.error) return null;

  return mapDetail(payload);
}


// --- Stage Quizzes ----------------------------------------------------------

/**
 * Open, or resume, the learner's Stage Quiz for one Stage.
 *
 * The five questions are drawn by `learn_start_stage_quiz()` (migration 0113),
 * not here: which five, and the rule that a retry avoids the previous paper, are
 * decided where the attempt is recorded, and resuming returns the same five so a
 * refresh cannot re-roll them. This only reads the drawn questions back, in the
 * order they were drawn.
 */
export async function startStageQuiz(
  stageSlug: string,
): Promise<{ attempt: AttemptRef; questions: ClientQuestion[] }> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("learn_start_stage_quiz", {
    p_stage: stageSlug,
  });

  if (error) throw new Error(`Could not start the Stage Quiz: ${error.message}`);

  const result = data as { id: string; attempt_no: number; question_ids: string[] };
  const questions = await readQuestionsById(result.question_ids);

  return { attempt: { id: result.id, attemptNo: result.attempt_no }, questions };
}

/** Questions by id, in the order given — a Stage Quiz paper is shown as drawn. */
async function readQuestionsById(ids: string[]): Promise<ClientQuestion[]> {
  if (ids.length === 0) return [];
  const supabase = await supabaseServer();

  const [{ data: questionData }, { data: optionData }] = await Promise.all([
    supabase.from("learn_questions_pub").select(QUESTION_COLUMNS).in("id", ids),
    supabase
      .from("learn_options_pub")
      .select("question_id, option_key, position, text")
      .in("question_id", ids)
      .order("position"),
  ]);

  const optionsByQuestion = new Map<string, ClientChoice[]>();
  for (const option of (optionData ?? []) as unknown as OptionRow[]) {
    const list = optionsByQuestion.get(option.question_id) ?? [];
    list.push({ id: option.option_key, text: option.text });
    optionsByQuestion.set(option.question_id, list);
  }

  const byId = new Map(
    ((questionData ?? []) as unknown as QuestionFields[]).map((row) => [row.id, row]),
  );

  return ids.flatMap((id) => {
    const row = byId.get(id);
    if (!row) return [];
    return [
      {
        id: row.id,
        kind: row.kind as QuestionKind,
        prompt: row.prompt,
        scenario: row.scenario,
        topicTag: row.topic_tag,
        choices: optionsByQuestion.get(row.id) ?? [],
      },
    ];
  });
}

/**
 * Where a learner stands on one Stage Quiz: the Progress Record's latest-only
 * view (#16). Every attempt is kept in the database; this is the latest marked
 * one, any open one, and when the Stage was first passed, which, once set, a
 * later practice attempt cannot undo.
 */
export type StageQuizState = {
  passedAt: string | null;
  latest: {
    attemptId: string;
    attemptNo: number;
    scoreRaw: number;
    scoreMax: number;
    passed: boolean;
  } | null;
  openAttemptId: string | null;
};

/**
 * The caller's Stage Quiz state for each Stage asked for, read from their Progress
 * Record. Serialisable (ISO string, plain numbers) because a Stage page hands it to
 * a client component.
 */
export async function getStageQuizStates(
  stageSlugs: string[],
): Promise<Map<string, StageQuizState>> {
  if (stageSlugs.length === 0) return new Map();
  const record = await getProgressRecord();
  const wanted = new Set(stageSlugs);

  return new Map(
    (record?.stages ?? [])
      .filter((s) => wanted.has(s.slug))
      .map((s) => [
        s.slug,
        {
          passedAt: s.completedAt ? s.completedAt.toISOString() : null,
          latest: s.quiz.latest
            ? {
                attemptId: s.quiz.latest.attemptId,
                attemptNo: s.quiz.latest.attemptNo,
                scoreRaw: s.quiz.latest.scoreRaw,
                scoreMax: s.quiz.latest.scoreMax,
                passed: s.quiz.latest.passed,
              }
            : null,
          openAttemptId: s.quiz.openAttemptId,
        },
      ]),
  );
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
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("learn_grade_check", {
    p_question: questionId,
    p_chosen: choiceIds,
  });

  if (error) return { error: error.message };

  const payload = data as {
    error?: string;
    is_correct: boolean;
    explanation: string;
    choices: Array<{ id: string; is_correct: boolean; feedback: string | null }> | null;
  } | null;

  if (!payload) return { error: "Question not found." };
  if (payload.error) return { error: payload.error };

  return {
    isCorrect: payload.is_correct,
    explanation: payload.explanation,
    choices: (payload.choices ?? []).map((c) => ({
      id: c.id,
      isCorrect: c.is_correct,
      feedback: c.feedback,
    })),
  };
}
