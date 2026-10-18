import type { ProgressStatus } from "./constants";
import type { ProgressRecord } from "./progress-record";

/**
 * Course Position (CONTEXT.md): where a Student stands in the Course, read off their
 * Progress Record at read time and never stored.
 *
 * The record decides every rule (ADR 0001): whether a Stage or a Level is complete,
 * which Stage a Level resumes at, which Sitting is owed. This module only puts those
 * decisions beside the catalogue and answers the questions every page asks of them:
 * which Stage is up next, which Level the Student is on, and whether Stage content
 * is open yet. Pages and the Admin present what it returns; none of them works any
 * of it out again.
 *
 * Pure: no database, no session. A signed-out visitor gets the position of an empty
 * record, so every caller renders one shape.
 */

export type CatalogueStage = { slug: string; title: string; position: number };
export type CatalogueLevel = { slug: string; title: string; stages: CatalogueStage[] };
/** The Levels in Course order, each with its Stages in order. */
export type Catalogue = CatalogueLevel[];

/** A Stage's Quiz passed, the Stage opened but not passed, or untouched. */
export type StageState = "PASSED" | "STARTED" | "NOT_STARTED";

export type StagePosition = {
  slug: string;
  state: StageState;
  /** The Read Mark: decides where the Stage resumes, and nothing else. Never completion. */
  read: boolean;
  lastLessonSlug: string | null;
  /** Its Stage Quiz has been sat and is not passed. */
  quizTried: boolean;
  /** The Stage the Level resumes at, while the Level is not complete. */
  upNext: boolean;
};

export type LevelPosition = {
  slug: string;
  title: string;
  status: ProgressStatus;
  /** Every Stage Quiz in the Level passed, as the record decides it. */
  complete: boolean;
  stagesTotal: number;
  stagesPassed: number;
  percentComplete: number;
  /** The record's resume Stage: the first not passed, else the last. Where "Continue" goes. */
  resumeStageSlug: string | null;
  /** The resume Stage while the Level is not complete; null once it is. */
  upNextStageSlug: string | null;
  /** The live Certificate's public ID, or null. */
  certificateCode: string | null;
  stages: StagePosition[];
};

export type PositionCertificate = {
  code: string;
  levelSlug: string | null;
  levelTitle: string;
  issuedName: string;
  awardTitle: string;
  scorePct: number;
  issuedAt: Date;
};

export type CoursePosition = {
  signedIn: boolean;
  /** Sitting 1 is in, so Stage content is open (#54). */
  contentOpen: boolean;
  /** The Level the Student is on (see `currentLevelSlug`); null once every Level is complete. */
  currentLevelSlug: string | null;
  /** The current Level's up-next Stage: the one place "pick up where you left off" points. */
  nextStage: { levelSlug: string; stageSlug: string } | null;
  /** Every Level, in Course order. */
  levels: LevelPosition[];
  /** The live Certificates, newest first. Revoked ones are history, not shown here. */
  certificates: PositionCertificate[];
};

/** Stage content opens once Sitting 1 is submitted: a "before" taken after reading is not a before. */
export function isContentOpen(sittings: ReadonlyArray<{ sittingNo: number }>): boolean {
  return sittings.some((s) => s.sittingNo === 1);
}

/**
 * The Level a Student is on: the first, in Course order, that they have started and not
 * completed; else the first not completed; null once every Level is. A Student may
 * start at any Level, so one halfway through Advanced is on Advanced, not on the
 * Beginner Level they never opened. The Student's pages and the Admin both ask this.
 */
export function currentLevelSlug(
  catalogue: Catalogue,
  isLevelComplete: (levelSlug: string) => boolean,
  isStageStarted: (stageSlug: string) => boolean,
): string | null {
  const open = catalogue.filter((level) => !isLevelComplete(level.slug));
  const started = open.find((level) => level.stages.some((stage) => isStageStarted(stage.slug)));
  return (started ?? open[0])?.slug ?? null;
}

/**
 * One Student's Course Position, from the catalogue and their Progress Record. With no
 * record (signed out, or no Student row) it is the position of an empty one: nothing
 * started, content closed, each Level resuming at its first Stage.
 */
export function coursePosition(
  catalogue: Catalogue,
  record: ProgressRecord | null,
  { signedIn = record !== null }: { signedIn?: boolean } = {},
): CoursePosition {
  const stageEntry = new Map((record?.stages ?? []).map((s) => [s.slug, s]));
  const levelEntry = new Map((record?.levels ?? []).map((l) => [l.slug, l]));

  const levels: LevelPosition[] = catalogue.map((level) => {
    const entry = levelEntry.get(level.slug);
    const complete = entry?.complete ?? false;
    const resumeStageSlug = entry ? entry.resumeStageSlug : (level.stages[0]?.slug ?? null);
    const upNextStageSlug = complete ? null : resumeStageSlug;

    const stages: StagePosition[] = level.stages.map((stage) => {
      const s = stageEntry.get(stage.slug);
      return {
        slug: stage.slug,
        state: s?.complete ? "PASSED" : s?.started ? "STARTED" : "NOT_STARTED",
        read: s?.read ?? false,
        lastLessonSlug: s?.lastLessonSlug ?? null,
        quizTried: !s?.complete && s?.quiz.latest != null,
        upNext: stage.slug === upNextStageSlug,
      };
    });

    return {
      slug: level.slug,
      title: level.title,
      status: entry?.status ?? "NOT_STARTED",
      complete,
      stagesTotal: entry?.stagesTotal ?? level.stages.length,
      stagesPassed: entry?.stagesPassed ?? 0,
      percentComplete: entry?.percentComplete ?? 0,
      resumeStageSlug,
      upNextStageSlug,
      certificateCode: entry?.certificate?.code ?? null,
      stages,
    };
  });

  const current = currentLevelSlug(
    catalogue,
    (slug) => levelEntry.get(slug)?.complete ?? false,
    (slug) => {
      const s = stageEntry.get(slug);
      return s ? s.started || s.complete : false;
    },
  );
  const currentLevel = levels.find((l) => l.slug === current);

  const titles = new Map(catalogue.map((l) => [l.slug, l.title]));
  const certificates = (record?.certificates ?? [])
    .filter((c) => c.revokedAt === null)
    .map((c) => ({
      code: c.code,
      levelSlug: c.levelSlug,
      levelTitle: c.levelSlug ? (titles.get(c.levelSlug) ?? "") : "",
      issuedName: c.issuedName,
      awardTitle: c.awardTitle ?? "",
      scorePct: c.scorePct ?? 0,
      issuedAt: c.issuedAt,
    }));

  return {
    signedIn,
    contentOpen: isContentOpen(record?.baseline.sittings ?? []),
    currentLevelSlug: current,
    nextStage:
      currentLevel?.upNextStageSlug != null
        ? { levelSlug: currentLevel.slug, stageSlug: currentLevel.upNextStageSlug }
        : null,
    levels,
    certificates,
  };
}
