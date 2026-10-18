import { describe, expect, it } from "vitest";
import { coursePosition, currentLevelSlug, type CoursePosition } from "@/lib/course-position";
import { mapLearner } from "@/lib/admin/data";
import { currentLevel } from "@/lib/admin/model";
import { mapProgressRecord, type RawProgressRecord } from "@/lib/progress-record";
import {
  ALL_PASSED,
  CATALOGUE,
  FAIL_THEN_PASS_THEN_FAIL,
  NEW_STUDENT,
  OUT_OF_ORDER,
  READ_MARK_ONLY,
  REVOKED_CERTIFICATE,
  TWO_LEVELS_AFTER_SITTING_2,
  TWO_LEVELS_BETWEEN_SITTINGS,
} from "@/lib/__fixtures__/progress-records";

/**
 * The Course Position, read through its one interface: the catalogue and a Progress
 * Record in, where the Student stands out. The fixtures are the same named cases the
 * SQL scenarios build (scripts/progress-record/scenarios.sql), so SQL decides each
 * rule there and this pins what the pages are told here.
 */

const position = (raw: RawProgressRecord): CoursePosition =>
  coursePosition(CATALOGUE, mapProgressRecord(raw));

const level = (p: CoursePosition, slug: string) => p.levels.find((l) => l.slug === slug)!;
const stage = (p: CoursePosition, slug: string) =>
  p.levels.flatMap((l) => l.stages).find((s) => s.slug === slug)!;
const upNext = (p: CoursePosition) =>
  p.levels.flatMap((l) => l.stages).filter((s) => s.upNext).map((s) => s.slug);

describe("a signed-out visitor", () => {
  const p = coursePosition(CATALOGUE, null);

  it("gets the position of an empty record, in the same shape", () => {
    expect(p.signedIn).toBe(false);
    expect(p.contentOpen).toBe(false);
    expect(p.levels.map((l) => l.slug)).toEqual(["beginner", "intermediate", "advanced"]);
    expect(p.levels.every((l) => l.status === "NOT_STARTED" && !l.complete && l.stagesPassed === 0)).toBe(true);
    expect(p.certificates).toEqual([]);
  });

  it("counts each Level's Stages from the catalogue, and resumes each at its first", () => {
    expect(p.levels.map((l) => [l.stagesTotal, l.resumeStageSlug])).toEqual([
      [2, "stage-1"],
      [1, "stage-3"],
      [1, "stage-4"],
    ]);
  });

  it("matches a new Student's position, but for being signed in", () => {
    expect({ ...position(NEW_STUDENT), signedIn: false }).toEqual(p);
  });
});

describe("a new Student", () => {
  const p = position(NEW_STUDENT);

  it("has content closed until Sitting 1 is in", () => {
    expect(p.signedIn).toBe(true);
    expect(p.contentOpen).toBe(false);
  });

  it("is on the first Level, with its first Stage next", () => {
    expect(p.currentLevelSlug).toBe("beginner");
    expect(p.nextStage).toEqual({ levelSlug: "beginner", stageSlug: "stage-1" });
  });

  it("has each Level's first Stage up next", () => {
    expect(upNext(p)).toEqual(["stage-1", "stage-3", "stage-4"]);
  });
});

describe("the Read Mark", () => {
  it("reads as read and started, never as passed", () => {
    const p = position(READ_MARK_ONLY);
    expect(stage(p, "stage-1")).toMatchObject({
      state: "STARTED",
      read: true,
      lastLessonSlug: "lesson-1",
      quizTried: false,
      upNext: true,
    });
    expect(level(p, "beginner")).toMatchObject({ complete: false, stagesPassed: 0 });
  });
});

describe("a Stage Quiz passed, then failed in practice", () => {
  const p = position(FAIL_THEN_PASS_THEN_FAIL);

  it("stays passed, and is not 'tried and not passed'", () => {
    expect(stage(p, "stage-1")).toMatchObject({ state: "PASSED", quizTried: false, upNext: false });
  });

  it("moves the Level's up-next Stage to the record's resume Stage", () => {
    expect(level(p, "beginner").upNextStageSlug).toBe("stage-2");
    expect(p.nextStage).toEqual({ levelSlug: "beginner", stageSlug: "stage-2" });
  });
});

describe("Levels completed in Course order", () => {
  const p = position(TWO_LEVELS_BETWEEN_SITTINGS);

  it("opens content once Sitting 1 is in", () => {
    expect(p.contentOpen).toBe(true);
  });

  it("puts the Student on the first Level not complete", () => {
    expect(p.currentLevelSlug).toBe("advanced");
    expect(p.nextStage).toEqual({ levelSlug: "advanced", stageSlug: "stage-4" });
  });

  it("keeps a complete Level's resume Stage, its last, but nothing up next in it", () => {
    expect(level(p, "beginner")).toMatchObject({
      complete: true,
      status: "COMPLETE",
      resumeStageSlug: "stage-2",
      upNextStageSlug: null,
    });
    expect(upNext(p)).toEqual(["stage-4"]);
  });

  it("does not depend on which Sittings were taken since", () => {
    const q = position(TWO_LEVELS_AFTER_SITTING_2);
    expect([q.contentOpen, q.currentLevelSlug, q.nextStage]).toEqual([p.contentOpen, p.currentLevelSlug, p.nextStage]);
  });
});

describe("a Student who started out of Course order", () => {
  const p = position(OUT_OF_ORDER);

  it("is on the Level they started, not the first one they never opened", () => {
    expect(p.currentLevelSlug).toBe("advanced");
    expect(p.nextStage).toEqual({ levelSlug: "advanced", stageSlug: "stage-4" });
  });

  it("leaves the unopened Level untouched", () => {
    expect(level(p, "beginner")).toMatchObject({ status: "NOT_STARTED", complete: false, upNextStageSlug: "stage-1" });
    expect(stage(p, "stage-1").state).toBe("NOT_STARTED");
  });

  it("resumes the started Stage at the lesson last opened", () => {
    expect(stage(p, "stage-4")).toMatchObject({ state: "STARTED", read: true, lastLessonSlug: "lesson-2" });
  });
});

describe("every Stage Quiz passed", () => {
  const p = position(ALL_PASSED);

  it("has no current Level and nothing next", () => {
    expect(p.currentLevelSlug).toBeNull();
    expect(p.nextStage).toBeNull();
    expect(upNext(p)).toEqual([]);
  });

  it("resumes each Level at its last Stage", () => {
    expect(p.levels.map((l) => [l.slug, l.complete, l.resumeStageSlug])).toEqual([
      ["beginner", true, "stage-2"],
      ["intermediate", true, "stage-3"],
      ["advanced", true, "stage-4"],
    ]);
  });
});

describe("Certificates", () => {
  const p = position(REVOKED_CERTIFICATE);

  it("lists only the live ones, with their Level's title", () => {
    expect(p.certificates).toEqual([
      expect.objectContaining({ code: "ZZPROBE-0001", levelSlug: "beginner", levelTitle: "Beginner" }),
    ]);
  });

  it("puts the live one on its Level, and none on the Level whose one was revoked", () => {
    expect(level(p, "beginner").certificateCode).toBe("ZZPROBE-0001");
    expect(level(p, "intermediate").certificateCode).toBeNull();
  });
});

describe("currentLevelSlug", () => {
  const none = () => false;

  it("takes the first started Level in Course order when two are started", () => {
    expect(currentLevelSlug(CATALOGUE, none, (s) => s === "stage-3" || s === "stage-4")).toBe("intermediate");
  });

  it("passes over a complete Level even if it was started", () => {
    expect(currentLevelSlug(CATALOGUE, (l) => l === "beginner", (s) => s === "stage-1")).toBe("intermediate");
  });
});

describe("the Admin names the same Level as the Student's own pages", () => {
  const cases = {
    NEW_STUDENT,
    READ_MARK_ONLY,
    FAIL_THEN_PASS_THEN_FAIL,
    TWO_LEVELS_BETWEEN_SITTINGS,
    TWO_LEVELS_AFTER_SITTING_2,
    REVOKED_CERTIFICATE,
    OUT_OF_ORDER,
    ALL_PASSED,
  };

  for (const [name, raw] of Object.entries(cases)) {
    it(name, () => {
      const record = mapProgressRecord(raw);
      const p = coursePosition(CATALOGUE, record);
      const admin = currentLevel(mapLearner(record, null, CATALOGUE), CATALOGUE);
      const expected = !p.contentOpen
        ? { kind: "awaiting" }
        : p.currentLevelSlug === null
          ? { kind: "complete" }
          : { kind: "level", slug: p.currentLevelSlug };
      expect(admin).toMatchObject(expected);
    });
  }
});
