import "server-only";

import { supabaseServer } from "./supabase/server";
import { COURSE_SLUG, type LevelTier, type ProgressStatus } from "./constants";
import type {
  CertificateRow,
  CourseRow,
  LessonRow,
  LevelProgressRow,
  LevelRow,
  ModuleProgressRow,
  ModuleRow,
  ResourceRow,
} from "@/db/rows";

/**
 * Course structure and learner progress.
 *
 * Everything here is read-only. Progress *writes* live in src/lib/progress.ts so
 * that the read path can be freely reused by pages, and the write path stays in
 * one auditable place.
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

const moduleShape =
  "slug, level_slug, position, title, number, core_question, intro_markdown, est_minutes, is_mandatory";

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
    introMarkdown: row.intro_markdown,
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
    componentKey: row.component_key,
    payloadJson: row.payload === null ? null : JSON.stringify(row.payload),
  };
}

function mapResource(row: ResourceRow) {
  return {
    id: row.slug,
    authoringKey: row.slug,
    moduleId: row.module_slug,
    title: row.title,
    description: row.description,
    type: row.kind,
    isRequired: row.is_required,
    source: row.source,
    author: row.author,
    publishedOn: row.published_on,
    externalUrl: row.external_url,
    filePath: row.file_path,
    licenceNote: row.licence_note,
    isStub: row.is_stub,
    order: row.position,
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

export type LevelProgressSummary = {
  status: ProgressStatus;
  percentComplete: number;
  /** Stages marked read. Drives "resume where you left off", and nothing else. */
  modulesComplete: number;
  modulesTotal: number;
  /** Stages whose Stage Quiz is passed. This is what completes the Level (#16). */
  stagesPassed: number;
  certificatePublicId: string | null;
  /** The module to resume at, or the first module if not started. */
  nextModuleSlug: string | null;
};

export type LevelWithProgress = Awaited<
  ReturnType<typeof getPathway>
>["levels"][number] & {
  /** Null for a signed-out visitor: structure without a learner attached. */
  progress: LevelProgressSummary | null;
};

/**
 * The pathway annotated with one learner's progress.
 *
 * Four batched reads rather than per-level lookups — this drives the landing page
 * and the dashboard, so it runs on almost every request a signed-in learner
 * makes. Row level security scopes each of them to the caller, so there is no
 * `where learner = me` to forget: `learn_module_progress` returns this learner's
 * rows and nobody else's whatever this code asks for.
 */
export async function getPathwayForUser(userId: string | null) {
  const { course, levels: pathwayLevels } = await getPathway();

  // Signed out: return the structure with no learner attached, so callers have
  // one shape to render rather than a union.
  if (!userId) {
    return {
      course,
      levels: pathwayLevels.map((level) => ({ ...level, progress: null })) as LevelWithProgress[],
    };
  }

  const supabase = await supabaseServer();
  const [moduleRows, levelRows, certificateRows] = await Promise.all([
    supabase
      .from("learn_module_progress")
      .select("module_slug, status, quiz_passed_at, updated_at")
      .eq("learner_id", userId),

    supabase
      .from("learn_level_progress")
      .select("level_slug, status, percent_complete")
      .eq("learner_id", userId),

    supabase
      .from("learn_certificates")
      .select("level_slug, code")
      .eq("learner_id", userId)
      .is("revoked_at", null),
  ]);

  const progressRows = (moduleRows.data ?? []) as Pick<
    ModuleProgressRow,
    "module_slug" | "status" | "quiz_passed_at" | "updated_at"
  >[];
  const levelProgressRows = (levelRows.data ?? []) as Pick<
    LevelProgressRow,
    "level_slug" | "status" | "percent_complete"
  >[];
  const certs = (certificateRows.data ?? []) as Pick<CertificateRow, "level_slug" | "code">[];

  const completeModuleIds = new Set(
    progressRows.filter((m) => m.status === "COMPLETE").map((m) => m.module_slug),
  );
  const passedModuleIds = new Set(
    progressRows.filter((m) => m.quiz_passed_at !== null).map((m) => m.module_slug),
  );
  const startedModuleIds = new Set(progressRows.map((m) => m.module_slug));
  const levelProgressByLevel = new Map(levelProgressRows.map((l) => [l.level_slug, l]));
  const certByLevel = new Map(certs.map((c) => [c.level_slug, c.code]));

  const annotated: LevelWithProgress[] = pathwayLevels.map((level) => {
    const mandatory = level.modules.filter((m) => m.isMandatory);
    const modulesTotal = mandatory.length;
    const modulesComplete = mandatory.filter((m) => completeModuleIds.has(m.id)).length;
    const stagesPassed = mandatory.filter((m) => passedModuleIds.has(m.id)).length;

    // Stage Quizzes passed, not Stages read: that is what completes a Level, and
    // learn_refresh_progress() (0113) stores the same figure. Computed here too
    // for a learner with no level row yet.
    const lp = levelProgressByLevel.get(level.id);
    const percentComplete =
      modulesTotal === 0 ? 0 : Math.round((stagesPassed / modulesTotal) * 100);

    // Resume at the first incomplete module; if all are done, stay on the last.
    const firstIncomplete = level.modules.find((m) => !completeModuleIds.has(m.id));
    const nextModuleSlug =
      firstIncomplete?.slug ?? level.modules[level.modules.length - 1]?.slug ?? null;

    // A failed Stage Quiz writes no Stage row, only the Level's, so either counts.
    const started = level.modules.some((m) => startedModuleIds.has(m.id)) || lp !== undefined;
    const status: ProgressStatus =
      modulesTotal > 0 && stagesPassed === modulesTotal
        ? "COMPLETE"
        : started
          ? "IN_PROGRESS"
          : "NOT_STARTED";

    return {
      ...level,
      progress: {
        status,
        percentComplete: lp?.percent_complete ?? percentComplete,
        modulesComplete,
        modulesTotal,
        stagesPassed,
        certificatePublicId: certByLevel.get(level.id) ?? null,
        nextModuleSlug,
      },
    };
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

  const [lessonResult, resourceResult, siblingResult, progressResult] = await Promise.all([
    supabase
      .from("learn_lessons")
      .select("slug, module_slug, position, title, kind, body_markdown, component_key, payload")
      .eq("module_slug", moduleSlug)
      .order("position"),

    supabase
      .from("learn_resources")
      .select(
        "slug, module_slug, title, description, kind, is_required, source, author, published_on, external_url, file_path, licence_note, is_stub, position",
      )
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
      resources: ((resourceResult.data ?? []) as ResourceRow[]).map(mapResource),
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

  const [certResult, levelResult] = await Promise.all([
    supabase
      .from("learn_certificates")
      .select("code, level_slug, issued_name, award_title, score_pct, issued_at, revoked_at")
      .eq("learner_id", userId)
      .is("revoked_at", null)
      .order("issued_at", { ascending: false }),
    supabase.from("learn_levels").select("slug, title"),
  ]);

  const titles = new Map(
    ((levelResult.data ?? []) as unknown as Array<{ slug: string; title: string }>).map((l) => [
      l.slug,
      l.title,
    ]),
  );

  return ((certResult.data ?? []) as unknown as Array<{
    code: string;
    level_slug: string | null;
    issued_name: string;
    award_title: string | null;
    score_pct: number | null;
    issued_at: string;
    revoked_at: string | null;
  }>).map((c) => ({
    publicId: c.code,
    levelId: c.level_slug,
    levelSlug: c.level_slug,
    levelTitle: c.level_slug ? (titles.get(c.level_slug) ?? "") : "",
    learnerNameSnapshot: c.issued_name,
    awardTitleSnapshot: c.award_title ?? "",
    scorePct: c.score_pct ?? 0,
    issuedAt: new Date(c.issued_at),
    revokedAt: c.revoked_at ? new Date(c.revoked_at) : null,
  }));
}

/**
 * Completion status per module, for a set of modules.
 *
 * Returned as a map because every caller is asking "is this one done" per row
 * while rendering a list. Row level security scopes it to the caller.
 */
export async function getModuleStatuses(
  userId: string,
  moduleSlugs: string[],
): Promise<Map<string, ProgressStatus>> {
  if (moduleSlugs.length === 0) return new Map();

  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("learn_module_progress")
    .select("module_slug, status")
    .eq("learner_id", userId)
    .in("module_slug", moduleSlugs);

  return new Map(
    ((data ?? []) as unknown as Array<{ module_slug: string; status: ProgressStatus }>).map((r) => [
      r.module_slug,
      r.status,
    ]),
  );
}

export function tierOf(level: { tier: string }): LevelTier {
  return level.tier as LevelTier;
}
