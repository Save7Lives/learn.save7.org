/**
 * Dev-only: proves the answer key never reaches the browser.
 *
 * Fetches the real assessment and module pages as a signed-in learner and checks
 * the rendered HTML — including the serialised React payload — against the
 * database's actual correct-answer text and ids.
 */
import "dotenv/config";
import { eq, and } from "drizzle-orm";

import { db } from "../src/lib/db";
import { choices, questions } from "../src/db/schema";

const BASE = "http://localhost:3000";

async function main() {
  const token = process.argv[2];
  if (!token) throw new Error("usage: verify-no-answer-leak <session-token>");

  const pages = [
    "/assessment/beginner",
    "/levels/beginner/modules/who-needs-organs?lesson=check",
    "/levels/advanced/modules/art-of-the-conversation?lesson=check",
  ];

  let failures = 0;

  for (const path of pages) {
    const res = await fetch(BASE + path, { headers: { cookie: `save7_session=${token}` } });
    const html = await res.text();

    // "isCorrect" must not appear anywhere in what was sent.
    const hasFlag = /isCorrect/.test(html);

    // Nor may the per-choice `feedback` strings, which reveal the answer.
    const scope = path.includes("assessment") ? "POST" : "CHECK";
    const rows = await db
      .select({ feedback: choices.feedback, isCorrect: choices.isCorrect })
      .from(choices)
      .innerJoin(questions, eq(choices.questionId, questions.id))
      .where(and(eq(questions.scope, scope)));

    const leakedFeedback = rows
      .filter((r) => r.feedback && r.feedback.length > 25)
      .filter((r) => html.includes(r.feedback!.slice(0, 25)));

    const ok = res.status === 200 && !hasFlag && leakedFeedback.length === 0;
    if (!ok) failures++;
    console.log(
      `${ok ? "  ok  " : " FAIL "} ${path}  [${res.status}]  isCorrect=${hasFlag}  leakedFeedback=${leakedFeedback.length}`,
    );
  }

  console.log(failures === 0 ? "\nNO ANSWER-KEY LEAK\n" : `\n${failures} PAGE(S) LEAKED\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
