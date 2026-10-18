import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ supabaseServer: async () => ({ rpc }) }));

import { getProgressRecord, getProgressRecords, mapProgressRecord } from "@/lib/progress-record";
import {
  FAIL_THEN_PASS_THEN_FAIL,
  NEW_STUDENT,
  READ_MARK_ONLY,
  REVOKED_CERTIFICATE,
  TWO_LEVELS_AFTER_SITTING_2,
  TWO_LEVELS_BETWEEN_SITTINGS,
  iso,
} from "@/lib/__fixtures__/progress-records";

const stage = (r: ReturnType<typeof mapProgressRecord>, slug: string) => r.stages.find((s) => s.slug === slug)!;
const level = (r: ReturnType<typeof mapProgressRecord>, slug: string) => r.levels.find((l) => l.slug === slug)!;

describe("mapProgressRecord", () => {
  it("NEW_STUDENT: no Sittings, Sitting 1 owed, every Level and Stage listed and untouched", () => {
    const r = mapProgressRecord(NEW_STUDENT);
    expect(r.baseline).toEqual({ sittings: [], sittingDue: 1 });
    expect(r.stages).toHaveLength(4);
    expect(r.levels).toHaveLength(3);
    expect(r.levels.every((l) => l.status === "NOT_STARTED" && !l.complete && l.completedAt === null)).toBe(true);
    expect(r.stages.every((s) => !s.read && !s.complete && !s.started && s.quiz.latest === null)).toBe(true);
    expect(r.certificates).toEqual([]);
    expect(r.learner.signedUpAt).toEqual(new Date(NEW_STUDENT.learner.signed_up_at));
  });

  it("maps snake_case to the app's names and strings to Dates", () => {
    const r = mapProgressRecord(NEW_STUDENT);
    expect(r.learner).toEqual({
      id: NEW_STUDENT.learner.id,
      name: "Probe Student A",
      signedUpAt: new Date(iso(0)),
      lastActiveAt: new Date(iso(0)),
    });
    expect(stage(r, "stage-2")).toMatchObject({ levelSlug: "beginner", order: 2, isMandatory: true });
    expect(level(r, "beginner")).toMatchObject({ order: 1, stagesTotal: 2, resumeStageSlug: "stage-1" });
  });

  it("READ_MARK_ONLY: read, never complete", () => {
    const r = mapProgressRecord(READ_MARK_ONLY);
    const s = stage(r, "stage-1");
    expect(s.read).toBe(true);
    expect(s.readAt).toEqual(new Date(iso(1)));
    expect(s.complete).toBe(false);
    expect(s.completedAt).toBeNull();
    expect(level(r, "beginner")).toMatchObject({ complete: false, stagesPassed: 0, stagesRead: 1, status: "IN_PROGRESS" });
  });

  it("FAIL_THEN_PASS_THEN_FAIL: complete at the first pass, the latest attempt is the failed third", () => {
    const r = mapProgressRecord(FAIL_THEN_PASS_THEN_FAIL);
    const s = stage(r, "stage-1");
    expect(s.complete).toBe(true);
    expect(s.completedAt).toEqual(new Date(iso(2)));
    expect(s.read).toBe(true);
    expect(s.quiz.attempts).toBe(3);
    expect(s.quiz.latest).toMatchObject({ attemptNo: 3, scoreRaw: 0, scoreMax: 5, scorePct: 0, passed: false });
    expect(s.quiz.latest!.submittedAt).toEqual(new Date(iso(4)));
    // One Stage of two passed: the Level is started, not complete.
    expect(level(r, "beginner")).toMatchObject({ complete: false, stagesPassed: 1, percentComplete: 50, resumeStageSlug: "stage-2" });
  });

  it("reads a missing or non-true `passed` as not passed", () => {
    const raw = structuredClone(FAIL_THEN_PASS_THEN_FAIL);
    (raw.stages[0].quiz.latest as unknown as { passed: unknown }).passed = null;
    expect(stage(mapProgressRecord(raw), "stage-1").quiz.latest!.passed).toBe(false);
  });

  it("TWO_LEVELS_BETWEEN_SITTINGS: Sitting 2 is owed, once", () => {
    const r = mapProgressRecord(TWO_LEVELS_BETWEEN_SITTINGS);
    expect(level(r, "beginner").complete).toBe(true);
    expect(level(r, "intermediate").complete).toBe(true);
    expect(level(r, "advanced").complete).toBe(false);
    expect(r.baseline.sittings.map((s) => s.sittingNo)).toEqual([1]);
    expect(r.baseline.sittingDue).toBe(2);
  });

  it("TWO_LEVELS_AFTER_SITTING_2: nothing is owed, and Sittings stay oldest first with their percentages", () => {
    const r = mapProgressRecord(TWO_LEVELS_AFTER_SITTING_2);
    expect(r.baseline.sittingDue).toBeNull();
    expect(r.baseline.sittings.map((s) => s.sittingNo)).toEqual([1, 2]);
    expect(r.baseline.sittings[0]).toMatchObject({ totalScore: 3, totalMax: 20, totalPct: 15 });
    expect(r.baseline.sittings[1].levelScores).toEqual({
      beginner: { score: 3, max: 4 },
      intermediate: { score: 3, max: 4 },
    });
  });

  it("maps a Sitting with no level_scores to an empty map, and a zero max to 0%", () => {
    const raw = structuredClone(NEW_STUDENT);
    raw.baseline.sittings = [
      { sitting_no: 1, submitted_at: iso(1), level_scores: null, total_score: 0, total_max: 0 },
    ];
    const [s] = mapProgressRecord(raw).baseline.sittings;
    expect(s.levelScores).toEqual({});
    expect(s.totalPct).toBe(0);
  });

  it("REVOKED_CERTIFICATE: every Certificate is listed, but a Level carries only its live one", () => {
    const r = mapProgressRecord(REVOKED_CERTIFICATE);
    expect(r.certificates.map((c) => c.code)).toEqual(["ZZPROBE-0002", "ZZPROBE-0001"]);
    expect(r.certificates[0].revokedAt).toEqual(new Date(iso(10)));
    expect(r.certificates[1].revokedAt).toBeNull();
    expect(level(r, "beginner").certificate).toEqual({ code: "ZZPROBE-0001", issuedAt: new Date(iso(7)) });
    expect(level(r, "intermediate").certificate).toBeNull();
  });
});

describe("getProgressRecord", () => {
  beforeEach(() => rpc.mockReset());

  it("reads the caller's own record with no argument", async () => {
    rpc.mockResolvedValue({ data: NEW_STUDENT, error: null });
    const r = await getProgressRecord();
    expect(rpc).toHaveBeenCalledWith("learn_progress_record", {});
    expect(r?.learner.name).toBe("Probe Student A");
  });

  it("names the Student when asked for one", async () => {
    rpc.mockResolvedValue({ data: NEW_STUDENT, error: null });
    await getProgressRecord("student-x");
    expect(rpc).toHaveBeenCalledWith("learn_progress_record", { p_learner: "student-x" });
  });

  it("ANOTHER_STUDENTS_RECORD: the database answers null and so does the app", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    expect(await getProgressRecord("someone-else")).toBeNull();
  });

  it("throws, rather than showing an empty record, when the read fails", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(getProgressRecord("another-id")).rejects.toThrow("Could not read the Progress Record: boom");
  });
});

describe("getProgressRecords", () => {
  beforeEach(() => rpc.mockReset());

  it("pages the pool and unwraps each row's record", async () => {
    rpc.mockResolvedValue({
      data: [
        { learner_id: "a", record: NEW_STUDENT },
        { learner_id: "b", record: TWO_LEVELS_BETWEEN_SITTINGS },
      ],
      error: null,
    });
    const records = await getProgressRecords(50, 100);
    expect(rpc).toHaveBeenCalledWith("learn_progress_records", { p_limit: 50, p_offset: 100 });
    expect(records.map((r) => r.baseline.sittingDue)).toEqual([1, 2]);
  });

  it("is an empty list when there is nobody to show", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    expect(await getProgressRecords(10, 0)).toEqual([]);
  });
});
