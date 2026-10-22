// Content check. Two things a reviewer should not have to spot by eye in a question bank:
//
//   1. A pictograph (emoji) in a prompt, scenario, option, feedback or explanation. One
//      reached production in an Advanced Stage Quiz stem (#51). Lesson Markdown is not
//      scanned: it uses a pin deliberately.
//   2. A `reviewBy` date that has passed. An item whose answer rests on something dated
//      (draft regulations, a pending Act) carries one, so it cannot go stale unnoticed.
//   3. Lesson Markdown the app cannot render, including a malformed interactive block
//      (`:::compare` and the rest). loadLesson() refuses these, but only the emitter
//      called it, so a broken block would pass CI and fail on the day of the emit.
//
//   npm run content:check
import { baselineQuestions } from "../prisma/content/questions-baseline";
import { gateQuestions } from "../prisma/content/questions-gate";
import { beginnerStageQuizBanks } from "../prisma/content/quiz-beginner";
import { intermediateStageQuizBanks } from "../prisma/content/quiz-intermediate";
import { advancedStageQuizBanks } from "../prisma/content/quiz-advanced";
import { loadCourseProse } from "../prisma/content/markdown";

type Item = {
  key: string;
  scenario?: string;
  prompt: string;
  explanation: string;
  reviewBy?: string;
  choices: Array<{ text: string; feedback?: string }>;
};

const items: Item[] = [
  ...[beginnerStageQuizBanks, intermediateStageQuizBanks, advancedStageQuizBanks].flatMap((banks) => Object.values(banks).flat()),
  ...baselineQuestions,
  ...gateQuestions,
];

const PICTOGRAPH = /\p{Extended_Pictographic}/u;
const today = new Date().toISOString().slice(0, 10);
const problems: string[] = [];

for (const q of items) {
  const texts = [q.scenario, q.prompt, q.explanation, ...q.choices.flatMap((c) => [c.text, c.feedback])];
  for (const t of texts) {
    if (t && PICTOGRAPH.test(t)) problems.push(`${q.key}: pictograph in "${t.slice(0, 60)}"`);
  }
  if (q.reviewBy !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(q.reviewBy)) problems.push(`${q.key}: reviewBy "${q.reviewBy}" is not YYYY-MM-DD`);
    else if (q.reviewBy < today) problems.push(`${q.key}: reviewBy ${q.reviewBy} has passed; re-check the answer against its source, then move the date or drop it`);
  }
}

let lessons = 0;
try {
  lessons = loadCourseProse().length;
} catch (error) {
  problems.push((error as Error).message);
}

if (problems.length) {
  console.error(`Content check failed:\n${problems.join("\n")}`);
  process.exit(1);
}
console.log(
  `Content check passed: ${items.length} questions, no pictographs, no review date passed; ${lessons} lessons render.`,
);
