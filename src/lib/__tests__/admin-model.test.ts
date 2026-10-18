import { describe, expect, it } from "vitest";
import { levelImprovement, percent } from "@/lib/baseline";
import { heldFlags, indicators, readsEligible, stillNeeded } from "@/lib/admin/model";
import { levelFlag } from "@/lib/admin/flags";
import { CATALOGUE, POOL, day, sitting, student } from "@/lib/__fixtures__/progress-records";

const ana = POOL[0];
const ben = POOL[1];

describe("percent", () => {
  it("rounds, and is 0 when nothing could be scored", () => {
    expect(percent(1, 4)).toBe(25);
    expect(percent(2, 3)).toBe(67);
    expect(percent(0, 0)).toBe(0);
  });
});

describe("levelImprovement", () => {
  it("compares Sitting 1 with the first Sitting after the Level was completed", () => {
    // ana finished Beginner on day 6; Sitting 2 (day 7) is the first after it.
    expect(levelImprovement(ana.sittings, "beginner", ana.levelCompletedAt.beginner)).toEqual({
      beforePct: 25,
      afterPct: 75,
      change: 50,
    });
  });

  it("skips Sittings taken before completion: Intermediate (day 8) is read at Sitting 3, not 2", () => {
    expect(levelImprovement(ana.sittings, "intermediate", ana.levelCompletedAt.intermediate)).toEqual({
      beforePct: 50,
      afterPct: 100,
      change: 50,
    });
  });

  it("can be negative", () => {
    const s = [sitting(1, 1, { beginner: [4, 4] }, [4, 4]), sitting(2, 5, { beginner: [2, 4] }, [2, 4])];
    expect(levelImprovement(s, "beginner", day(3))?.change).toBe(-50);
  });

  it("is null until both ends exist", () => {
    expect(levelImprovement(ana.sittings, "beginner", null)).toBeNull(); // Level not complete
    expect(levelImprovement([], "beginner", day(6))).toBeNull(); // no Sittings
    expect(levelImprovement(ben.sittings, "intermediate", day(30))).toBeNull(); // no Sitting after
    expect(levelImprovement(ana.sittings, "advanced", day(6))).toBeNull(); // no score for that Level
    const noFirst = ana.sittings.filter((s) => s.sittingNo !== 1);
    expect(levelImprovement(noFirst, "beginner", day(6))).toBeNull(); // Sitting 1 is the "before"
  });

  it("does not count Sitting 1 itself as the 'after', even if it follows completion", () => {
    const only1 = [sitting(1, 10, { beginner: [1, 4] }, [1, 4])];
    expect(levelImprovement(only1, "beginner", day(5))).toBeNull();
  });
});

describe("heldFlags / stillNeeded / readsEligible", () => {
  it("holds one flag per completed Level, and none for a Level with a null stamp", () => {
    expect(heldFlags(ana).sort()).toEqual([levelFlag("beginner"), levelFlag("intermediate")].sort());
    expect(heldFlags(student("x", { levelCompletedAt: { beginner: day(1), intermediate: null } }))).toEqual([
      levelFlag("beginner"),
    ]);
  });

  it("lists the required flags a Student does not yet hold", () => {
    const need = [levelFlag("beginner"), levelFlag("intermediate"), levelFlag("advanced")];
    expect(stillNeeded(ana, need)).toEqual([levelFlag("advanced")]);
    expect(stillNeeded(ben, need)).toEqual([levelFlag("intermediate"), levelFlag("advanced")]);
    expect(stillNeeded(ana, [])).toEqual([]);
  });

  it("an empty rule means nobody is eligible, not everybody", () => {
    expect(readsEligible(heldFlags(ana), [])).toBe(false);
    expect(readsEligible([], [])).toBe(false);
  });

  it("is eligible only when every required flag is held", () => {
    expect(readsEligible(heldFlags(ana), [levelFlag("beginner"), levelFlag("intermediate")])).toBe(true);
    expect(readsEligible(heldFlags(ben), [levelFlag("beginner"), levelFlag("intermediate")])).toBe(false);
  });

  it("a flag nobody can hold reads as nobody eligible, without raising", () => {
    expect(readsEligible(heldFlags(ana), ["level_complete:no-such-level"])).toBe(false);
    expect(readsEligible(heldFlags(ana), ["something_else"])).toBe(false);
  });
});

describe("indicators", () => {
  const now = day(55);
  const i = indicators(POOL, CATALOGUE, now);

  it("counts the cohort and who signed up in the last 30 days", () => {
    expect(i.students).toBe(3);
    expect(i.signedUpLast30).toBe(1); // cleo, day 50
  });

  it("completion rate per Level is Students who completed it over the whole cohort", () => {
    expect(i.completion.map((c) => [c.slug, c.done, c.of])).toEqual([
      ["beginner", 2, 3],
      ["intermediate", 1, 3],
      ["advanced", 0, 3],
    ]);
    expect(i.completion[0].pct).toBeCloseTo(66.667, 2);
    expect(i.completion[2].pct).toBe(0);
  });

  it("the Baseline trend is four points, each the mean of the Students who sat that Sitting", () => {
    expect(i.trend).toEqual([
      { slot: 1, students: 2, meanPct: 20 }, // 15 and 25
      { slot: 2, students: 2, meanPct: 45 }, // 50 and 40
      { slot: 3, students: 1, meanPct: 80 },
      { slot: 4, students: 0, meanPct: null },
    ]);
  });

  it("average Improvement per Level is the mean of each Student's own change, skipping those without one", () => {
    expect(i.improvement).toEqual([
      { slug: "beginner", title: "Beginner", students: 2, meanChange: 37.5 }, // +50 and +25
      { slug: "intermediate", title: "Intermediate", students: 1, meanChange: 50 }, // ben has no later Sitting
      { slug: "advanced", title: "Advanced", students: 0, meanChange: null },
    ]);
  });

  it("Stage Quiz pass rate is passes over Students who attempted, never over those who only opened it", () => {
    const stages = Object.fromEntries(i.stageQuiz.flatMap((l) => l.stages).map((s) => [s.slug, s]));
    expect(stages["stage-1"]).toMatchObject({ attempted: 2, passed: 2, passPct: 100, started: 3, notPassed: 1 });
    expect(stages["stage-2"]).toMatchObject({ attempted: 2, passed: 2, passPct: 100, started: 2, notPassed: 0 });
    expect(stages["stage-3"]).toMatchObject({ attempted: 2, passed: 1, passPct: 50, started: 2, notPassed: 1 });
    expect(stages["stage-4"]).toMatchObject({ attempted: 0, passed: 0, passPct: null, started: 0, notPassed: 0 });
  });

  it("counts a pass as an attempt even when its attempt row is missing", () => {
    const only = student("p", { stages: { "stage-1": { passedAt: day(2), started: false, attempts: 0, latest: null } } });
    const s = indicators([only], CATALOGUE, now).stageQuiz[0].stages[0];
    expect(s).toMatchObject({ attempted: 1, passed: 1, passPct: 100, started: 1, notPassed: 0 });
  });

  it("an empty pool has no rates, not zero rates or a crash", () => {
    const e = indicators([], CATALOGUE, now);
    expect(e.students).toBe(0);
    expect(e.signedUpLast30).toBe(0);
    expect(e.completion.every((c) => c.done === 0 && c.of === 0 && c.pct === null)).toBe(true);
    expect(e.trend.every((t) => t.students === 0 && t.meanPct === null)).toBe(true);
    expect(e.improvement.every((x) => x.students === 0 && x.meanChange === null)).toBe(true);
    expect(e.stageQuiz.flatMap((l) => l.stages).every((s) => s.passPct === null && s.attempted === 0)).toBe(true);
  });

  it("a Student with no Sittings counts in the cohort and completion, and nowhere in the trend or Improvement", () => {
    const lone = student("lone", { levelCompletedAt: { beginner: day(3) } });
    const r = indicators([lone], CATALOGUE, now);
    expect(r.students).toBe(1);
    expect(r.completion[0]).toMatchObject({ done: 1, of: 1, pct: 100 });
    expect(r.trend.every((t) => t.students === 0 && t.meanPct === null)).toBe(true);
    expect(r.improvement[0]).toMatchObject({ students: 0, meanChange: null });
  });
});
