import type { Client } from "pg";

/**
 * The answer key, for the test and nobody else.
 *
 * The app cannot read `learn_choices.is_correct` and neither can any browser: that is
 * an invariant, not a convenience. A test that has to *pass* a quiz therefore asks the
 * database directly, as the superuser the harness owns. It is used only to decide what
 * to click. Nothing is asserted from it.
 */
export type Choice = { text: string; isCorrect: boolean };

/**
 * The choices of the question on screen. A prompt is not quite unique in the bank, so
 * the choice texts the page shows pick out the one that was drawn.
 */
export async function choicesFor(db: Client, prompt: string, shown: string[]): Promise<Choice[]> {
  const { rows } = await db.query<{ id: string; text: string; is_correct: boolean }>(
    `select q.id, c.text, c.is_correct
       from learn_questions q
       join learn_choices c on c.question_id = q.id
      where q.prompt = $1
      order by q.id, c.position`,
    [prompt],
  );

  const byQuestion = new Map<string, Choice[]>();
  for (const r of rows) {
    const list = byQuestion.get(r.id) ?? [];
    list.push({ text: r.text, isCorrect: r.is_correct });
    byQuestion.set(r.id, list);
  }

  const wanted = [...shown].sort().join("\n");
  for (const choices of byQuestion.values()) {
    if (choices.map((c) => c.text).sort().join("\n") === wanted) return choices;
  }
  throw new Error(`No question in the bank reads "${prompt}" with those choices`);
}
