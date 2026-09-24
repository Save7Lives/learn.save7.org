/**
 * Write the course into a Supabase migration.
 *
 * The backend is Supabase now, and Save7 applies schema and content with
 * `supabase db push`. So the course is loaded the same way everything else on that
 * project is: as a migration, reviewable in a pull request and reproducible on any
 * environment — rather than by a script holding a service-role key, which would
 * mean the content of the course depended on who ran what and when.
 *
 * The authoring files stay the source of truth; this reads them and emits SQL, and
 * nothing here decides anything about the course:
 *
 *   - `prisma/content/structure.ts` — Levels, Stages and their lessons (#33)
 *   - `content/<level>/<stage>/*.md` — lesson prose, via `markdown.ts`
 *   - `prisma/content/quiz-*.ts`     — Stage Quiz banks, 15 per Stage (#8)
 *   - `prisma/content/questions-baseline.ts` — the Baseline's twenty items (#50)
 *   - `prisma/content/questions-gate.ts` — the volunteer gate's forty items
 *   - `prisma/content/resources.ts`  — the course-wide reading list
 *
 * **A Stage is emitted only once it is finished** — every prose lesson written and
 * its bank present. Levels are written ahead of their Stages; an unfinished Stage
 * is simply absent, never shipped as a stub. That is what lets the per-Level
 * content tickets land independently: finishing a Stage and re-running this is the
 * whole of publishing it. A Stage with prose but no bank, or a bank but stub prose,
 * is a half-finished state and fails loudly rather than shipping either half.
 *
 * **This generator never deletes.** Every statement is an upsert on the authoring
 * key. A question row deleted and reinserted would take every answer ever recorded
 * against it, and the improvement figures with them. The one-off content reset in
 * #47 (save7-os 0112) was hand-written for exactly that reason: the refusal to
 * delete is a safety property worth keeping here permanently, not a capability to
 * grow for one day's convenience.
 *
 * Run: npx tsx scripts/emit-supabase-content.ts [path-to-save7-os] [filename] [--only=course|baseline|gate]
 *
 *   --only=course    levels, Stages, lessons, Stage Quizzes, reading list
 *   --only=baseline  the twenty Baseline items and their review rows
 *   --only=gate      the forty volunteer-gate items and their review rows
 *   (default)        all three
 */
import { readdirSync, writeFileSync } from "node:fs";

import { loadLesson } from "../prisma/content/markdown";
import { assertBankIsWellFormed, type StageQuizBanks } from "../prisma/content/quiz";
import { beginnerStageQuizBanks } from "../prisma/content/quiz-beginner";
import { intermediateStageQuizBanks } from "../prisma/content/quiz-intermediate";
import { advancedStageQuizBanks } from "../prisma/content/quiz-advanced";
import { assertBaselineIsWellFormed, baselineQuestions } from "../prisma/content/questions-baseline";
import { gateQuestions } from "../prisma/content/questions-gate";
import { resourceSeeds } from "../prisma/content/resources";
import { courseStructure, type LevelStructure, type StageSeed } from "../prisma/content/structure";
import type { ReviewSeed } from "../prisma/content/types";

/** Every Stage Quiz bank written so far. Each Level's content ticket adds its own. */
const stageQuizBanks: StageQuizBanks = {
  ...beginnerStageQuizBanks,
  ...intermediateStageQuizBanks,
  ...advancedStageQuizBanks,
};

const flags = process.argv.slice(2).filter((a) => a.startsWith("--"));
const positional = process.argv.slice(2).filter((a) => !a.startsWith("--"));

const only = flags.find((f) => f.startsWith("--only="))?.slice("--only=".length) ?? "all";
if (!["all", "course", "baseline", "gate"].includes(only)) {
  throw new Error(`--only must be course, baseline or gate, not ${only}`);
}
const emitCourse = only === "all" || only === "course";
const emitBaseline = only === "all" || only === "baseline";
const emitGate = only === "all" || only === "gate";

const OS = positional[0] ?? "../save7-os";

/**
 * Where to write.
 *
 * **A content change after the first deploy needs a new migration, not an edit to
 * the old one.** Supabase records a migration as applied by its version prefix, so
 * rewriting an applied file changes the repository and nothing on the live project
 * — the file is recorded as done and is never re-run. That mistake is silent: the
 * generator reports the right counts, the diff looks substantial, and the database
 * keeps serving the old content.
 *
 * So the default is the next free number in the migrations directory. Pass an
 * explicit filename as the second argument to overwrite a specific one, which is
 * only correct before that migration has been pushed anywhere.
 */
function nextMigrationPath(): string {
  const dir = `${OS}/supabase/migrations`;
  const highest = readdirSync(dir)
    .map((f) => Number.parseInt(f.slice(0, 4), 10))
    .filter((n) => Number.isFinite(n))
    .reduce((max, n) => Math.max(max, n), 0);
  const version = String(highest + 1).padStart(4, "0");
  return `${dir}/${version}_learn_content.sql`;
}

const OUT = positional[1] ? `${OS}/supabase/migrations/${positional[1]}` : nextMigrationPath();

// A second copy, committed to this repository.
//
// The migration's home is save7-os, which is where `supabase db push` runs from.
// But whoever edits the course content is working here, and the generated SQL is
// the only artefact that carries a content change to learners — so a copy lives
// here too, and is committed. It makes content changes visible in this
// repository's diffs. Named after whichever migration was emitted, not hardcoded.
const LOCAL_OUT = `prisma/supabase/${OUT.split("/").pop()}`;

/** SQL literal. Never interpolate anything into this file without going through it. */
function q(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return "'" + v.replace(/'/g, "''") + "'";
}

/** Course questions carry no option key of their own; the gate's are historical. */
const LETTERS = "abcdefghij";

// ── which Stages are finished ───────────────────────────────────────────────
assertBankIsWellFormed(stageQuizBanks);

type ReadyStage = { level: LevelStructure; stage: StageSeed; bodies: Map<string, string> };

function readiness(level: LevelStructure, stage: StageSeed): ReadyStage | null {
  const bodies = new Map<string, string>();
  let stubs = 0;
  for (const lesson of stage.lessons) {
    if (!lesson.bodyPath) continue;
    const loaded = loadLesson(lesson.bodyPath);
    if (loaded.frontMatter.slug !== lesson.slug || loaded.frontMatter.stage !== stage.slug) {
      throw new Error(`${lesson.bodyPath}: front matter does not match structure.ts`);
    }
    if (loaded.isStub) stubs++;
    bodies.set(lesson.slug, loaded.bodyMarkdown);
  }
  const hasBank = stage.slug in stageQuizBanks;
  const proseDone = stubs === 0;

  if (proseDone && hasBank) return { level, stage, bodies };
  if (!proseDone && !hasBank) return null;
  throw new Error(
    proseDone
      ? `${stage.slug}: prose is written but it has no Stage Quiz bank`
      : `${stage.slug}: has a Stage Quiz bank but ${stubs} prose lesson(s) are still stubs`,
  );
}

const ready = courseStructure.flatMap((level) =>
  level.stages.map((stage) => readiness(level, stage)).filter((r): r is ReadyStage => r !== null),
);
const readySlugs = new Set(ready.map((r) => r.stage.slug));

const out: string[] = [];
const counts = { levels: 0, stages: 0, lessons: 0, resources: 0, stageQuiz: 0, baseline: 0, gate: 0, choices: 0, review: 0 };
const review: ReviewSeed[] = [];

out.push(`-- The course content, emitted from the authoring files (${only === "all" ? "course, baseline and gate" : only}).
--
-- GENERATED by scripts/emit-supabase-content.ts in the learn.save7.org repo. Do not
-- hand-edit: edit the content there and regenerate, or the next regeneration
-- silently reverts you.
--
-- Every statement is an upsert keyed on the authoring identifier — a level's slug,
-- a Stage's slug, a lesson's (module_slug, slug), a question's authoring key — so
-- this is safe to apply over an existing course: rows are updated in place and
-- nothing is deleted. A question row deleted and reinserted would take every
-- answer ever recorded against it, and the improvement figures with them.${
  emitCourse
    ? `
--
-- Stages are emitted only once finished: ${[...readySlugs].join(", ") || "none yet"}.`
    : ""
}

begin;
`);

// ── levels, Stages, lessons ────────────────────────────────────────────────
if (emitCourse) {
  for (const [levelIndex, level] of courseStructure.entries()) {
    counts.levels++;
    out.push(`insert into learn_levels (
  slug, position, title, tier, strapline, goal, est_min_minutes, est_max_minutes,
  accent_token, certificate_title, certificate_code, pass_mark_pct
) values (
  ${q(level.slug)}, ${levelIndex}, ${q(level.title)}, ${q(level.tier)},
  ${q(level.strapline)}, ${q(level.goal)}, ${level.estMinMinutes}, ${level.estMaxMinutes},
  ${q(level.accentToken)}, ${q(level.certificateTitle)}, ${q(level.certificateCode)},
  ${level.passMarkPct}
) on conflict (slug) do update set
  position = excluded.position, title = excluded.title, tier = excluded.tier,
  strapline = excluded.strapline, goal = excluded.goal,
  est_min_minutes = excluded.est_min_minutes, est_max_minutes = excluded.est_max_minutes,
  accent_token = excluded.accent_token, certificate_title = excluded.certificate_title,
  certificate_code = excluded.certificate_code, pass_mark_pct = excluded.pass_mark_pct,
  updated_at = now();
`);
  }

  // The domain says Stage; the schema says module (#26). The mapping is here only.
  for (const { level, stage, bodies } of ready) {
    counts.stages++;
    out.push(`insert into learn_modules (
  slug, level_slug, position, title, number, core_question, intro_markdown,
  est_minutes, is_mandatory
) values (
  ${q(stage.slug)}, ${q(level.slug)}, ${stage.number - 1}, ${q(stage.title)}, ${stage.number},
  ${q(stage.coreQuestion)}, '', ${stage.estMinutes}, true
) on conflict (slug) do update set
  level_slug = excluded.level_slug, position = excluded.position,
  title = excluded.title, number = excluded.number,
  core_question = excluded.core_question, intro_markdown = excluded.intro_markdown,
  est_minutes = excluded.est_minutes, is_mandatory = excluded.is_mandatory,
  updated_at = now();
`);

    for (const [lessonIndex, lesson] of stage.lessons.entries()) {
      counts.lessons++;
      out.push(`insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  ${q(lesson.slug)}, ${q(stage.slug)}, ${lessonIndex}, ${q(lesson.title)}, ${q(lesson.kind)},
  ${q(bodies.get(lesson.slug))}, NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();
`);
    }
  }

  // ── the reading list ──────────────────────────────────────────────────────
  // Course-wide entries, plus any keyed to a finished Stage. Entries keyed to the
  // prior build's thirteen modules have no Stage to hang off and are not emitted.
  const resources = resourceSeeds.filter((r) => r.moduleSlug === null || readySlugs.has(r.moduleSlug));
  for (const [index, r] of resources.entries()) {
    counts.resources++;
    out.push(`insert into learn_resources (
  slug, module_slug, title, description, kind, is_required, source, author,
  external_url, file_path, licence_note, is_stub, position
) values (
  ${q(r.key)}, ${q(r.moduleSlug)}, ${q(r.title)}, ${q(r.description)}, ${q(r.type)},
  ${q(r.isRequired ?? false)}, ${q(r.source)}, ${q(r.author)}, ${q(r.externalUrl)},
  ${q(r.filePath)}, ${q(r.licenceNote)}, ${q(r.isStub ?? false)}, ${index}
) on conflict (slug) do update set
  module_slug = excluded.module_slug, title = excluded.title,
  description = excluded.description, kind = excluded.kind,
  is_required = excluded.is_required, source = excluded.source,
  author = excluded.author, external_url = excluded.external_url,
  file_path = excluded.file_path, licence_note = excluded.licence_note,
  is_stub = excluded.is_stub, position = excluded.position;
`);
    if (r.isStub || r.verifiedAgainst) {
      review.push({
        entityType: "RESOURCE",
        entityRef: `resource:${r.key}`,
        location: r.moduleSlug ? `Resource · ${r.moduleSlug}` : "Resource · course-wide",
        claim: r.isStub ? `Incomplete citation: "${r.title}"` : `Citation: "${r.title}"`,
        category: "MEDICAL",
        severity: 3,
        status: r.isStub ? "NEEDS_VERIFICATION" : "APPROVED",
        sourceHint: r.verifiedAgainst ?? "Awaiting Save7's reference list.",
        notes: r.verifiedAgainst ? `Checked against: ${r.verifiedAgainst}` : undefined,
      });
    }
  }
}

/** One question and its options, course or gate. */
function emitQuestion(
  key: string,
  fields: {
    scope: string;
    kind: string;
    gate: string | null;
    levelSlug: string | null;
    moduleSlug: string | null;
    prompt: string;
    scenario: string | null;
    explanation: string;
    topicTag: string;
    difficulty: number;
    position: number;
  },
  choices: Array<{ optionKey: string; position: number; text: string; isCorrect: boolean; feedback: string | null }>,
) {
  out.push(`insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  ${q(key)}, ${q(fields.scope)}, ${q(fields.kind)}, ${q(fields.gate)},
  ${q(fields.levelSlug)}, ${q(fields.moduleSlug)}, ${q(fields.prompt)},
  ${q(fields.scenario)}, ${q(fields.explanation)}, ${q(fields.topicTag)},
  ${fields.difficulty}, NULL, ${fields.position}
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();
`);

  for (const c of choices) {
    counts.choices++;
    out.push(`insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, ${q(c.optionKey)}, ${c.position}, ${q(c.text)}, ${q(c.isCorrect)}, ${q(c.feedback)}
  from learn_questions where authoring_key = ${q(key)}
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;
`);
  }
}

// ── Stage Quizzes ──────────────────────────────────────────────────────────
// Scope POST: #26/#41 settled that the two attempt-shaped scopes left are Stage
// Quizzes (POST) and inline checks (CHECK). Both level_slug and module_slug are
// set — the level because learn_attempts is level-keyed today, the Stage because
// the Blueprint draws five of fifteen *per Stage*.
const LEGAL_TOPICS = new Set(["law", "costs", "consent", "determination-of-death"]);

if (emitCourse) {
  for (const { level, stage } of ready) {
    for (const [index, item] of stageQuizBanks[stage.slug].entries()) {
      counts.stageQuiz++;
      emitQuestion(
        item.key,
        {
          scope: "POST",
          kind: "SINGLE",
          gate: null,
          levelSlug: level.slug,
          moduleSlug: stage.slug,
          prompt: item.prompt,
          scenario: item.scenario ?? null,
          explanation: item.explanation,
          topicTag: item.topicTag,
          difficulty: item.difficulty,
          position: index,
        },
        item.choices.map((c, i) => ({
          optionKey: LETTERS[i],
          position: i,
          text: c.text,
          isCorrect: c.isCorrect ?? false,
          feedback: c.feedback ?? null,
        })),
      );
      review.push({
        entityType: "QUESTION",
        entityRef: `question:${item.key}`,
        location: `${level.title} · Stage ${stage.number}, ${stage.title} · Stage Quiz`,
        claim: item.prompt,
        category:
          item.topicTag === "sa-shortage" ? "STATISTIC" : LEGAL_TOPICS.has(item.topicTag) ? "LEGAL" : "MEDICAL",
        severity: 2,
        status: item.verifiedAgainst ? "APPROVED" : "NEEDS_VERIFICATION",
        sourceHint: item.verifiedAgainst ?? "No source is recorded against this item.",
        notes: item.verifiedAgainst ? `Keyed answer and explanation checked against: ${item.verifiedAgainst}` : undefined,
      });
    }
  }
}

// ── the Baseline ───────────────────────────────────────────────────────────
// Scope PRE, level_slug set, module_slug null. learn_submit_baseline_sitting()
// (0110) marks every PRE row and groups the marks by level_slug into the sitting's
// per-Level breakdown, so the Level is load-bearing and the Stage is not. Leaving
// module_slug null also keeps these rows out of anything that selects a Stage's
// questions. Position is the one fixed order every sitting is shown in: the form
// is never shuffled, so four sittings stay comparable.
const BASELINE_LEGAL_TOPICS = new Set([
  "no-trade", "consent-model", "consent-understood", "surrogate-decisions",
  "what-registration-does", "independent-teams", "telling-family",
]);

if (emitBaseline) {
  assertBaselineIsWellFormed(baselineQuestions);
  const levelTitles = new Map(courseStructure.map((l) => [l.slug, l.title]));
  const stages = new Map(courseStructure.flatMap((l) => l.stages.map((s) => [s.slug, s] as const)));

  for (const [index, item] of baselineQuestions.entries()) {
    counts.baseline++;
    emitQuestion(
      item.key,
      {
        scope: "PRE",
        kind: "SINGLE",
        gate: null,
        levelSlug: item.level,
        moduleSlug: null,
        prompt: item.prompt,
        scenario: item.scenario ?? null,
        explanation: item.explanation,
        topicTag: item.topicTag,
        difficulty: item.difficulty,
        position: index,
      },
      item.choices.map((c, i) => ({
        optionKey: LETTERS[i],
        position: i,
        text: c.text,
        isCorrect: c.isCorrect ?? false,
        feedback: c.feedback ?? null,
      })),
    );
    const stage = stages.get(item.stage)!;
    review.push({
      entityType: "QUESTION",
      entityRef: `question:${item.key}`,
      location: `Baseline · ${levelTitles.get(item.level)} · Stage ${stage.number}, ${stage.title}`,
      claim: item.prompt,
      category:
        item.topicTag === "scale-of-impact" ? "STATISTIC" : BASELINE_LEGAL_TOPICS.has(item.topicTag) ? "LEGAL" : "MEDICAL",
      severity: 2,
      status: item.verifiedAgainst ? "APPROVED" : "NEEDS_VERIFICATION",
      sourceHint: item.verifiedAgainst ?? "No source is recorded against this item.",
      notes: item.verifiedAgainst ? `Keyed answer and explanation checked against: ${item.verifiedAgainst}` : undefined,
    });
  }
}

// ── the volunteer gate ─────────────────────────────────────────────────────
// Imported from the portal, with the option keys it has always sent, so historical
// volunteer_quiz_attempts.answers keep resolving against them.
if (emitGate) {
  for (const g of gateQuestions) {
    counts.gate++;
    emitQuestion(
      g.key,
      {
        scope: "GATE",
        kind: g.kind,
        gate: g.gate,
        levelSlug: null,
        moduleSlug: null,
        prompt: g.prompt,
        scenario: null,
        explanation: g.explanation,
        topicTag: g.topicTag,
        difficulty: 1,
        position: g.position,
      },
      g.choices.map((c) => ({
        optionKey: c.optionKey,
        position: c.position,
        text: c.text,
        isCorrect: c.isCorrect ?? false,
        feedback: null,
      })),
    );
    // The clinical items assert figures, so they enter the register. entity_ref is
    // the bare key, unprefixed, to keep matching the rows already live.
    if (g.gate === "clinical") {
      review.push({
        entityType: "QUESTION",
        entityRef: g.key,
        location: `volunteer gate · clinical · question ${g.position}`,
        claim: g.prompt,
        category: "MEDICAL",
        severity: 3,
        status: g.verifiedAgainst ? "APPROVED" : "NEEDS_VERIFICATION",
        sourceHint:
          g.verifiedAgainst ?? "Imported from the volunteer portal's generated quiz. No source was supplied with it.",
        notes: g.verifiedAgainst ? `Keyed answer and explanation checked against: ${g.verifiedAgainst}` : undefined,
      });
    }
  }
}

// ── the content-review register ─────────────────────────────────────────────
for (const item of review) {
  counts.review++;
  out.push(`insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  ${q(item.entityType)}, ${q(item.entityRef)}, ${q(item.location)}, ${q(item.claim)},
  ${q(item.category)}, ${item.severity ?? 1}, ${q(item.status ?? "NEEDS_VERIFICATION")},
  ${q(item.sourceHint)}, ${q(item.notes)}
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;
`);
}

// ── the probe ───────────────────────────────────────────────────────────────
// Counted at generation time and asserted at apply time. A migration that loads
// content silently short is worse than one that fails: the course would simply be
// missing a Stage and nothing would say so.
const probe: string[] = [];
if (emitCourse) {
  const slugList = [...readySlugs].map((s) => q(s)).join(", ");
  probe.push(`  select count(*) into n from learn_levels;
  if n <> ${counts.levels} then raise exception 'expected ${counts.levels} levels, found %', n; end if;

  /* Exactly the finished Stages, and nothing else. A module left over from an
     earlier outline would still be navigable, and still gate its Level's
     certificate, so its presence is a failure rather than a curiosity. */
  select count(*) into n from learn_modules;
  if n <> ${counts.stages} then raise exception 'expected ${counts.stages} Stages, found %', n; end if;
  select count(*) into n from learn_modules where slug not in (${slugList || "''"});
  if n <> 0 then raise exception '% module(s) are not finished Stages', n; end if;

  select count(*) into n from learn_lessons;
  if n <> ${counts.lessons} then raise exception 'expected ${counts.lessons} lessons, found %', n; end if;

  /* No drafting brief and no stub text reaches a learner. markdown.ts strips
     comments before emitting; this is the check that it did. */
  select count(*) into n from learn_lessons
   where strpos(body_markdown, '<!--') > 0 or strpos(body_markdown, '_Not yet written._') > 0;
  if n <> 0 then raise exception '% lesson(s) carry a drafting brief or stub text', n; end if;

  /* Fifteen per Stage, per the Blueprint — and no POST item outside a finished
     Stage, since a level-keyed POST attempt marks every POST row in its level. */
  select count(*) into n from learn_questions where scope = 'POST';
  if n <> ${counts.stageQuiz} then raise exception 'expected ${counts.stageQuiz} Stage Quiz questions, found %', n; end if;
  select count(*) into n from (
    select module_slug from learn_questions where scope = 'POST'
     group by module_slug having count(*) <> 15 or module_slug is null
  ) bad;
  if n <> 0 then raise exception '% Stage Quiz bank(s) do not hold exactly 15 questions', n; end if;`);
}
if (emitBaseline) {
  const perLevel = new Map<string, number>();
  for (const item of baselineQuestions) perLevel.set(item.level, (perLevel.get(item.level) ?? 0) + 1);
  const keyList = baselineQuestions.map((item) => q(item.key)).join(", ");
  const levelChecks = [...perLevel]
    .map(
      ([level, want]) => `  select count(*) into n from learn_questions where scope = 'PRE' and level_slug = ${q(level)};
  if n <> ${want} then raise exception 'expected ${want} ${level} Baseline questions, found %', n; end if;`,
    )
    .join("\n");
  probe.push(`  /* Exactly this bank, and nothing else. learn_submit_baseline_sitting() marks
     every PRE row, so a leftover would silently lengthen every sitting. */
  select count(*) into n from learn_questions where scope = 'PRE';
  if n <> ${counts.baseline} then raise exception 'expected ${counts.baseline} Baseline questions, found %', n; end if;
  select count(*) into n from learn_questions where scope = 'PRE' and authoring_key not in (${keyList});
  if n <> 0 then raise exception '% PRE question(s) are not in the Baseline bank', n; end if;

  /* The per-Level breakdown groups on level_slug: a null one scores into
     'unassigned', which the Blueprint's three numbers have no place for. */
${levelChecks}
  select count(*) into n from learn_questions
   where scope = 'PRE' and (level_slug is null or module_slug is not null or kind <> 'SINGLE');
  if n <> 0 then raise exception '% Baseline question(s) lack a Level, carry a Stage, or are not single-answer', n; end if;

  /* One fixed order, so every sitting is the same paper. */
  select count(distinct position) into n from learn_questions where scope = 'PRE';
  if n <> ${counts.baseline} then raise exception 'Baseline positions are not distinct'; end if;
  select count(*) into n from (
    select question_id from learn_choices c join learn_questions q on q.id = c.question_id
     where q.scope = 'PRE' group by question_id having count(*) <> 4
  ) bad;
  if n <> 0 then raise exception '% Baseline question(s) do not have exactly four options', n; end if;`);
}
if (emitGate) {
  probe.push(`  select count(*) into n from learn_questions where scope = 'GATE';
  if n <> ${counts.gate} then raise exception 'expected ${counts.gate} gate questions, found %', n; end if;`);
}

out.push(`do $$
declare n int;
begin
${probe.join("\n\n")}

  /* Every question must have exactly one right answer, except a MULTI, which has
     more than one. A question with none is unanswerable and a SINGLE with two is
     unmarkable — and learn_submit_attempt() compares sets, so it would simply mark
     everyone wrong rather than fail loudly. */
  select count(*) into n
    from learn_questions q
    left join learn_choices c on c.question_id = q.id and c.is_correct
   where q.kind <> 'MULTI'
   group by q.id having count(c.id) <> 1
   limit 1;
  if n is not null then raise exception 'a non-MULTI question does not have exactly one correct answer'; end if;
end $$;

select verify_learn_isolation();

commit;
`);

const sql = out.join("\n");
writeFileSync(LOCAL_OUT, sql);
try {
  writeFileSync(OUT, sql);
  console.log(`${OUT}`);
} catch {
  // No save7-os checkout here. The committed copy is still written, which is the
  // one that matters for review; applying it needs that repository or database
  // access either way.
  console.log(`${OUT} not writable — skipped (no save7-os checkout)`);
}
console.log(`${LOCAL_OUT}`);
console.log(counts);
