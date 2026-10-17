import type { Client } from "pg";

import { api, tokenFor } from "./rest";
import type { Identity } from "./people";

/**
 * Arranging a Student's progress quickly, through the database's own marking
 * functions.
 *
 * A journey that needs a Student who has already sat the Baseline or passed a Level
 * should not click through it again. These call the same security-definer functions
 * the app calls (`learn_submit_baseline_sitting`, `learn_start_stage_quiz`,
 * `learn_submit_attempt`, `learn_issue_certificate`), as that Student, with their
 * access token. So the progress is real: marked by the real rules, refused by the
 * real age and consent checks, and visible to every screen. The answer key is read as
 * the superuser, only to decide what to send.
 *
 * Arranging only. What a test asserts must be something a person could see.
 */

type Answers = Record<string, { chosen: string[]; free_text: null }>;

/** Answer a paper: every question right, or every question wrong. */
async function answersFor(db: Client, questionIds: string[], mode: "correct" | "wrong"): Promise<Answers> {
  const { rows } = await db.query<{ question_id: string; option_key: string; is_correct: boolean }>(
    "select question_id, option_key, is_correct from learn_choices where question_id = any($1) order by position",
    [questionIds],
  );
  const answers: Answers = {};
  for (const id of questionIds) {
    const mine = rows.filter((r) => r.question_id === id);
    const picked =
      mode === "correct"
        ? mine.filter((r) => r.is_correct).map((r) => r.option_key)
        : [mine.find((r) => !r.is_correct)!.option_key];
    answers[id] = { chosen: picked, free_text: null };
  }
  return answers;
}

async function rpc<T>(db: Client, who: Identity, name: string, args: unknown = {}): Promise<T> {
  const result = await api<T>(`rpc/${name}`, { token: await tokenFor(db, who), method: "POST", body: args });
  if (!result.ok) throw new Error(`${name} failed for ${who.email}: ${result.status} ${result.message}`);
  return result.body;
}

/** Sit the next Baseline Sitting with every answer right or every answer wrong. */
export async function sitBaseline(db: Client, who: Identity, mode: "correct" | "wrong") {
  const { rows } = await db.query<{ id: string }>("select id from learn_questions where scope = 'PRE'");
  const answers = await answersFor(
    db,
    rows.map((r) => r.id),
    mode,
  );
  await rpc(db, who, "learn_submit_baseline_sitting", {
    p_answers: Object.fromEntries(Object.entries(answers).map(([id, a]) => [id, { chosen: a.chosen }])),
  });
}

/** Take one Stage Quiz, all right or all wrong. A pass is permanent; a fail is just an attempt. */
export async function takeStageQuiz(db: Client, who: Identity, stage: string, mode: "correct" | "wrong") {
  const started = await rpc<{ id: string; question_ids: string[] }>(db, who, "learn_start_stage_quiz", {
    p_stage: stage,
  });
  await rpc(db, who, "learn_submit_attempt", {
    p_attempt: started.id,
    p_answers: await answersFor(db, started.question_ids, mode),
  });
}

/** The Stage slugs of a Level, in order. */
export async function stagesOf(db: Client, level: string): Promise<string[]> {
  const { rows } = await db.query<{ slug: string }>(
    "select slug from learn_modules where level_slug = $1 order by position",
    [level],
  );
  return rows.map((r) => r.slug);
}

/** Pass every Stage Quiz in a Level and take the Certificate it earns. */
export async function completeLevel(db: Client, who: Identity, level: string) {
  for (const stage of await stagesOf(db, level)) await takeStageQuiz(db, who, stage, "correct");
  await rpc(db, who, "learn_issue_certificate", { p_level_slug: level });
}

/**
 * A dashboard event, as the app writes when a Student opens a lesson. Backdated so a
 * test can tell "last active" from "signed up". Written as the superuser: events are
 * the app's to write, and there is no page that lets a test choose their date.
 */
export async function recordActivity(
  db: Client,
  who: Identity,
  type: "lesson_view" | "quiz_start" | "quiz_submit",
  daysAgo: number,
  stage?: string,
) {
  await db.query(
    `insert into learn_events (learner_id, session_key, type, module_slug, created_at)
     select id, 'e2e', $2, $3, now() - make_interval(days => $4::int)
       from learners where lower(email) = lower($1)`,
    [who.email, type, stage ?? null, daysAgo],
  );
}

/**
 * Make "last active" read as a chosen day: forget the activity the arranging itself
 * caused (the marking functions stamp the Student as seen, and issuing a Certificate
 * records an event) and leave one event, this many days ago.
 */
export async function setLastActive(db: Client, who: Identity, daysAgo: number) {
  await db.query(
    `update learners set last_seen_at = null where lower(email) = lower($1)`,
    [who.email],
  );
  await db.query(
    `delete from learn_events where learner_id = (select id from learners where lower(email) = lower($1))`,
    [who.email],
  );
  await recordActivity(db, who, "lesson_view", daysAgo, "why-donation-matters");
}

/**
 * Make one Stage Quiz question the most missed: three Students' papers each hold it,
 * answered wrongly. Which five of a Stage's fifteen a paper draws is random, so a real
 * run cannot promise any question is set three times; this writes the answer rows
 * directly (as only the marking function does in life) so the figure has something
 * known to show. Returns the question's prompt.
 */
export async function makeMostMissed(db: Client, stage: string, students: Identity[]): Promise<string> {
  const { rows: question } = await db.query<{ id: string; prompt: string }>(
    "select id, prompt from learn_questions where scope = 'POST' and module_slug = $1 order by position limit 1",
    [stage],
  );
  const q = question[0];
  for (const who of students) {
    const { rows: attempts } = await db.query<{ id: string }>(
      `select a.id from learn_attempts a join learners l on l.id = a.learner_id
        where lower(l.email) = lower($1) and a.module_slug = $2 and a.submitted_at is not null
        order by a.attempt_no limit 1`,
      [who.email, stage],
    );
    await db.query(
      `insert into learn_answers (attempt_id, question_id, chosen, was_correct)
       values ($1, $2, '{}', false)
       on conflict (attempt_id, question_id) do update set was_correct = false`,
      [attempts[0].id, q.id],
    );
  }
  return q.prompt;
}
