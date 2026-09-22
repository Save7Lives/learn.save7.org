/**
 * DEAD — do not run. Kept in place rather than deleted; safe to remove entirely.
 *
 * This one-time import lifted the volunteer portal's two quizzes out of save7-os
 * into `prisma/content/questions-gate.ts`. Both of its sources are gone: save7-os's
 * migration 0103 retired the `submit-quiz` Edge Function (its `key.ts` no longer
 * exists) in favour of a Postgres function that marks quiz passes directly from
 * `learn_questions` rows, and `src-vol/03-quiz.js` is gone from that tree too.
 *
 * Even pointed at an old save7-os checkout, running this again would silently
 * discard every citation and content rewrite added to `questions-gate.ts` since —
 * this generator's output never carried a `verifiedAgainst` field. That file is now
 * the sole hand-authored source for `learn_questions` GATE rows; see its own header.
 *
 * Found while working learn.save7.org-map#38/#42.
 */
throw new Error(
  "import-gate-questions.mjs is dead — see this file's header. Edit prisma/content/questions-gate.ts directly.",
);
