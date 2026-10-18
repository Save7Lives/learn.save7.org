import "server-only";

import { supabaseServer } from "./supabase/server";
import { COURSE_SLUG, type LevelTier, type ProgressStatus } from "./constants";
import { getProgressRecord, type StageEntry } from "./progress-record";
import type {
  CourseRow,
  LessonRow,
  LevelRow,
  ModuleProgressRow,
  ModuleRow,
} from "@/db/rows";

/**
 * Course structure and learner progress.
 *
 * Everything here is read-only. Progress *writes* live in src/lib/progress.ts so
 * that the read path can be freely reused by pages, and the write path stays in
 * one auditable place.
 *
 * Progress is read from the Progress Record (src/lib/progress-record.ts), which
 * SQL owns: this file lays a learner's record over the Course structure and does
 * not decide what is complete, passed or latest. Where a Stage or Level is
 * complete, the record said so.
 *
 * ── ON `id` BEING THE SLUG ──────────────────────────────────────────────────
 * The database keys levels, modules and lessons by slug; the app was written
 * against a database that keyed them by an opaque id and carried the slug beside
 * it. Rather than rewrite every page that compares ids, the mapping functions
 * below set `id` to the slug. One identifier, two names, and the pages that ask
 * `completedLessonIds.has(lesson.id)` keep working — while what is actually
 * stored is a slug, which is the readable thing to find in a database six months
 * from now.
 */

const levelShape =
  "slug, position, title, tier, strapline, goal, est_min_minutes, est_max_minutes, accent_token, certificate_title, certificate_code, pass_mark_pct";

// levelShape and moduleShape are exactly the columns `anon` may read (save7-os 0131),
// because a signed-out visitor reads the Levels and Stages too: the landing page and the
// course introduction are public. Selecting any other column fails for `anon` with
// "permission denied", so add one only with a migration that grants it. Never add
// `intro_markdown`: it is Stage prose and stays behind sign-in.
const moduleShape =
  "slug, level_slug, position, title, number, core_question, est_minutes, is_mandatory";

function mapLevel(row: LevelRow) {
  return {
    id: row.slug,
    slug: row.slug,
    order: row.position,
    title: row.title,
    tier: row.tier,
    strapline: row.strapline,
    goal: row.goal,
    estMinMinutes: row.est_min_minutes,
    estMaxMinutes: row.est_max_minutes,
    accentToken: row.accent_token,
    certificateTitle: row.certificate_title,
    certificateCode: row.certificate_code,
    passMarkPct: row.pass_mark_pct,
  };
}

function mapModule(row: ModuleRow) {
  return {
    id: row.slug,
    slug: row.slug,
    levelId: row.level_slug,
    order: row.position,
    number: row.number,
    title: row.title,
    coreQuestion: row.core_question,
    estMinutes: row.est_minutes,
    isMandatory: row.is_mandatory,
  };
}

function mapLesson(row: LessonRow) {
  return {
    id: row.slug,
    slug: row.slug,
    moduleId: row.module_slug,
    order: row.position,
    title: row.title,
    kind: row.kind,
    bodyMarkdown: row.body_markdown,
    // The film the lesson opens with, as a registry key (#61). Resolved in code.
    filmKey: row.component_key,
  };
}

export async function getCourse() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("learn_course")
    .select("slug, title, subtitle, description, is_published")
    .eq("slug", COURSE_SLUG)
    .maybeSingle<CourseRow>();

  if (error) throw new Error(`Could not read the course: ${error.message}`);
  if (!data) {
    throw new Error(
      `Course "${COURSE_SLUG}" not found. The course is loaded by ` +
        `save7-os/supabase/migrations/0094_learn_content.sql — apply it with ` +
        `\`supabase db push\`.`,
    );
  }

  return {
    id: data.slug,
    slug: data.slug,
    title: data.title,
    subtitle: data.subtitle,
    description: data.description,
    isPublished: data.is_published,
  };
}

/** The full pathway: levels with their modules, in order. */
export async function getPathway() {
  const supabase = await supabaseServer();
  const course = await getCourse();

  const [levelResult, moduleResult] = await Promise.all([
    supabase.from("learn_levels").select(levelShape).order("position"),
    supabase.from("learn_modules").select(moduleShape).order("position"),
  ]);

  if (levelResult.error) throw new Error(`Could not read levels: ${levelResult.error.message}`);
  if (moduleResult.error) throw new Error(`Could not read modules: ${moduleResult.error.message}`);

  // Two flat reads and a group, rather than a nested select. PostgREST would
  // embed the modules, but the ordering of an embedded resource is applied per
  // parent and reads as if it were global — which is exactly the kind of thing
  // that works until a module is added out of order.
  const modulesByLevel = new Map<string, ReturnType<typeof mapModule>[]>();
  for (const row of (moduleResult.data ?? []) as ModuleRow[]) {
    const list = modulesByLevel.get(row.level_slug) ?? [];
    list.push(mapModule(row));
    modulesByLevel.set(row.level_slug, list);
  }

  const levels = ((levelResult.data ?? []) as LevelRow[]).map((row) => ({
    ...mapLevel(row),
    modules: (modulesByLevel.get(row.slug) ?? []).sort((a, b) => a.order - b.order),
  }));

  return { course, levels };
}

export type StageState = "PASSED" | "STARTED" | "NOT_STARTED";

export type LevelProgressSummary = {
  status: ProgressStatus;
  percentComplete: number;
  /** Stages with a Read Mark. Drives "resume where you left off", and nothing else. */
  stagesRead: number;
  modulesTotal: number;
  /** Stages whose Stage Quiz is passed. This is what completes the Level (#16). */
  stagesPassed: number;
  /** Where each Stage stands, by Stage slug: quiz passed, opened but not passed, or untouched. */
  stageStates: Record<string, StageState>;
  certificatePublicId: string | null;
  /** The module to resume at: the first Stage Quiz not yet passed, else the last Stage. */
  nextModuleSlug: string | null;
};

type PathwayLevel = Awaited<ReturnType<typeof getPathway>>["levels"][number];

export type ModuleWithProgress = PathwayLevel["modules"][number] & {
  /** This learner's entry for the Stage; null for a signed-out visitor. */
  progress: StageEntry | null;
};

export type LevelWithProgress = Omit<PathwayLevel, "modules"> & {
  modules: ModuleWithProgress[];
  /** Null for a signed-out visitor: structure without a learner attached. */
  progress: LevelProgressSummary | null;
};

/**
 * The pathway annotated with one learner's progress.
 *
 * One read, the learner's Progress Record, laid over the structure. Row level
 * security and the record's own check scope it to the caller, so there is no
 * `where learner = me` to forget.
 */
export async function getPathwayForUser(userId: string | null) {
  const { course, levels: pathwayLevels } = await getPathway();

  // Signed out: return the structure with no learner attached, so callers have
  // one shape to render rather than a union.
  if (!userId) {
    return {
      course,
      levels: pathwayLevels.map((level) => ({
        ...level,
        modules: level.modules.map((m) => ({ ...m, progress: null })),
        progress: null,
      })) as LevelWithProgress[],
    };
  }

  const record = await getProgressRecord(userId);
  const stageBySlug = new Map((record?.stages ?? []).map((s) => [s.slug, s]));
  const levelBySlug = new Map((record?.levels ?? []).map((l) => [l.slug, l]));

  const annotated: LevelWithProgress[] = pathwayLevels.map((level) => {
    const modules = level.modules.map((m) => ({ ...m, progress: stageBySlug.get(m.id) ?? null }));
    const stageStates = Object.fromEntries(
      modules.map((m): [string, StageState] => [
        m.slug,
        m.progress?.complete ? "PASSED" : m.progress?.started ? "STARTED" : "NOT_STARTED",
      ]),
    );
    const entry = levelBySlug.get(level.id);
    const mandatory = level.modules.filter((m) => m.isMandatory);

    const progress: LevelProgressSummary = entry
      ? {
          status: entry.status,
          percentComplete: entry.percentComplete,
          stagesRead: entry.stagesRead,
          modulesTotal: entry.stagesTotal,
          stagesPassed: entry.stagesPassed,
          stageStates,
          certificatePublicId: entry.certificate?.code ?? null,
          nextModuleSlug: entry.resumeStageSlug,
        }
      : // No record at all (no Student row): the empty one, so a page never branches on it.
        {
          status: "NOT_STARTED",
          percentComplete: 0,
          stagesRead: 0,
          modulesTotal: mandatory.length,
          stagesPassed: 0,
          stageStates,
          certificatePublicId: null,
          nextModuleSlug: mandatory[0]?.slug ?? null,
        };

    return { ...level, modules, progress };
  });

  return { course, levels: annotated };
}

/** A single module with its lessons, plus this learner's position in it. */
export async function getModuleForUser(
  userId: string | null,
  levelSlug: string,
  moduleSlug: string,
) {
  const supabase = await supabaseServer();
  const course = await getCourse();

  const { data: levelRow } = await supabase
    .from("learn_levels")
    .select(levelShape)
    .eq("slug", levelSlug)
    .maybeSingle<LevelRow>();
  if (!levelRow) return null;

  const { data: moduleRow } = await supabase
    .from("learn_modules")
    .select(moduleShape)
    .eq("slug", moduleSlug)
    .eq("level_slug", levelSlug)
    .maybeSingle<ModuleRow>();
  if (!moduleRow) return null;

  const [lessonResult, siblingResult, progressResult] = await Promise.all([
    supabase
      .from("learn_lessons")
      .select("slug, module_slug, position, title, kind, body_markdown, component_key")
      .eq("module_slug", moduleSlug)
      .order("position"),

    // Sibling modules, for prev/next navigation within the level.
    supabase
      .from("learn_modules")
      .select("slug, position, title")
      .eq("level_slug", levelSlug)
      .order("position"),

    userId
      ? supabase
          .from("learn_module_progress")
          .select(
            "learner_id, module_slug, status, completed_lessons, last_lesson_slug, seconds_spent, started_at, updated_at, completed_at",
          )
          .eq("learner_id", userId)
          .eq("module_slug", moduleSlug)
          .maybeSingle<ModuleProgressRow>()
      : Promise.resolve({ data: null }),
  ]);

  const progressRow = (progressResult.data ?? null) as ModuleProgressRow | null;

  const progress = progressRow
    ? {
        userId: progressRow.learner_id,
        moduleId: progressRow.module_slug,
        status: progressRow.status,
        completedLessonsJson: JSON.stringify(progressRow.completed_lessons ?? []),
        secondsSpent: progressRow.seconds_spent,
        lastLessonId: progressRow.last_lesson_slug,
        startedAt: progressRow.started_at,
        updatedAt: progressRow.updated_at,
        completedAt: progressRow.completed_at,
      }
    : null;

  return {
    course,
    level: mapLevel(levelRow),
    module: {
      ...mapModule(moduleRow),
      lessons: ((lessonResult.data ?? []) as LessonRow[]).map(mapLesson),
    },
    siblings: ((siblingResult.data ?? []) as Pick<ModuleRow, "slug" | "position" | "title">[]).map(
      (row) => ({ slug: row.slug, order: row.position, title: row.title }),
    ),
    progress,
    completedLessonIds: new Set(progressRow?.completed_lessons ?? []),
  };
}

/**
 * One level, by slug.
 *
 * Several pages need a level's titles and pass mark without wanting the whole
 * pathway. Since the database keys levels by slug, this is also the lookup that
 * decides whether a URL is real — the pages call it and 404 on null.
 */
export async function getLevelBySlug(slug: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("learn_levels")
    .select(levelShape)
    .eq("slug", slug)
    .maybeSingle<LevelRow>();

  return data ? mapLevel(data) : null;
}

/**
 * The module after this one in the same level, or null when it was the last.
 *
 * Ordered by `position`, not by slug: the display order is the thing being asked
 * about, and slugs sort alphabetically by accident.
 */
export async function getNextModuleSlug(
  levelSlug: string,
  afterModuleSlug: string,
): Promise<string | null> {
  const supabase = await supabaseServer();

  const { data: current } = await supabase
    .from("learn_modules")
    .select("position")
    .eq("slug", afterModuleSlug)
    .maybeSingle();
  const position = (current as { position: number } | null)?.position;
  if (position === undefined) return null;

  const { data } = await supabase
    .from("learn_modules")
    .select("slug")
    .eq("level_slug", levelSlug)
    .gt("position", position)
    .order("position")
    .limit(1);

  return ((data ?? []) as unknown as Array<{ slug: string }>)[0]?.slug ?? null;
}

/** A learner's own certificates, newest first, with the level they are for. */
export async function getLearnerCertificates(userId: string) {
  const supabase = await supabaseServer();

  const [record, levelResult] = await Promise.all([
    getProgressRecord(userId),
    supabase.from("learn_levels").select("slug, title"),
  ]);

  const titles = new Map(
    ((levelResult.data ?? []) as unknown as Array<{ slug: string; title: string }>).map((l) => [
      l.slug,
      l.title,
    ]),
  );

  // The record lists every Certificate, revoked ones included, newest first.
  return (record?.certificates ?? [])
    .filter((c) => c.revokedAt === null)
    .map((c) => ({
      publicId: c.code,
      levelId: c.levelSlug,
      levelSlug: c.levelSlug,
      levelTitle: c.levelSlug ? (titles.get(c.levelSlug) ?? "") : "",
      learnerNameSnapshot: c.issuedName,
      awardTitleSnapshot: c.awardTitle ?? "",
      scorePct: c.scorePct ?? 0,
      issuedAt: c.issuedAt,
      revokedAt: c.revokedAt,
    }));
}

export function tierOf(level: { tier: string }): LevelTier {
  return level.tier as LevelTier;
}
