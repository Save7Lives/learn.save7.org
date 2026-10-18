import { describe, expect, it } from "vitest";
import { baselineStateFrom, sittingLabel, sittingName, sittingSlots, type BaselineLevel } from "@/lib/baseline";
import { mapLearner } from "@/lib/admin/data";
import { sittingContext } from "@/lib/admin/model";
import { mapProgressRecord, type RawProgressRecord } from "@/lib/progress-record";
import {
  CATALOGUE,
  NEW_STUDENT,
  TWO_LEVELS_AFTER_SITTING_2,
  TWO_LEVELS_BETWEEN_SITTINGS,
  iso,
  rawRecord,
  sittingRow,
} from "@/lib/__fixtures__/progress-records";

/**
 * One Student's Sittings carry one label, whether the Student reads it on My progress
 * or an Admin reads it on the Student's page: both are built from the same Progress
 * Record and labelled by `sittingLabel()`.
 */

const LEVELS: BaselineLevel[] = [
  { slug: "beginner", title: "Beginner", tier: "BEGINNER" },
  { slug: "intermediate", title: "Intermediate", tier: "INTERMEDIATE" },
  { slug: "advanced", title: "Advanced", tier: "ADVANCED" },
];

const done = (at: number) => ({ complete: true, completed_at: iso(at), status: "COMPLETE" as const });

/** The 2026-10-18 live case: Sitting 3 taken after finishing Intermediate and then Advanced. */
const TWO_LEVELS_BEFORE_SITTING_3: RawProgressRecord = rawRecord({
  sittings: [
    sittingRow(1, iso(1), { beginner: [1, 4] }, [3, 20]),
    sittingRow(2, iso(7), { beginner: [3, 4] }, [8, 20]),
    sittingRow(3, iso(12), { beginner: [4, 4] }, [15, 20]),
  ],
  sitting_due: null,
  levels: { beginner: done(6), intermediate: done(9), advanced: done(11) },
});

const ALL_LEVELS_BEFORE_SITTING_2: RawProgressRecord = rawRecord({
  sittings: [sittingRow(1, iso(1), {}, [3, 20]), sittingRow(2, iso(12), {}, [15, 20])],
  sitting_due: null,
  levels: { beginner: done(6), intermediate: done(9), advanced: done(11) },
});

/** Every Sitting's label, as My progress shows it and as the Admin's Student page shows it. */
function bothSurfaces(raw: RawProgressRecord) {
  const record = mapProgressRecord(raw);
  const dashboard = baselineStateFrom(record, LEVELS);
  const admin = sittingContext(mapLearner(record, null, CATALOGUE), CATALOGUE);
  return {
    dashboard: dashboard.sittings.map((s) => sittingLabel(dashboard, s)),
    admin: admin.sittings.map((s) => sittingLabel(admin, s)),
  };
}

describe("sittingLabel, on My progress and in the Admin", () => {
  it("TWO_LEVELS_AFTER_SITTING_2: Sitting 2 follows both Levels, on both surfaces", () => {
    const { dashboard, admin } = bothSurfaces(TWO_LEVELS_AFTER_SITTING_2);
    expect(dashboard).toEqual(["At signup", "After Beginner and Intermediate"]);
    expect(admin).toEqual(dashboard);
  });

  it("TWO_LEVELS_BETWEEN_SITTINGS: only Sitting 1 is taken, and it is the one at signup", () => {
    const { dashboard, admin } = bothSurfaces(TWO_LEVELS_BETWEEN_SITTINGS);
    expect(dashboard).toEqual(["At signup"]);
    expect(admin).toEqual(dashboard);
  });

  it("names Sitting 3 after Intermediate and Advanced, not after the third slot", () => {
    const { dashboard, admin } = bothSurfaces(TWO_LEVELS_BEFORE_SITTING_3);
    expect(dashboard).toEqual(["At signup", "After Beginner", "After Intermediate and Advanced"]);
    expect(admin).toEqual(dashboard);
  });

  it("lists three Levels with commas", () => {
    const { dashboard, admin } = bothSurfaces(ALL_LEVELS_BEFORE_SITTING_2);
    expect(dashboard[1]).toBe("After Beginner, Intermediate and Advanced");
    expect(admin).toEqual(dashboard);
  });

  it("falls back to the number when no Level was completed between two Sittings", () => {
    const raw = rawRecord({
      sittings: [sittingRow(1, iso(1), {}, [3, 20]), sittingRow(2, iso(2), {}, [4, 20])],
      sitting_due: null,
    });
    expect(bothSurfaces(raw).dashboard).toEqual(["At signup", "Sitting 2"]);
  });

  it("names an untaken later slot by its number only", () => {
    const state = baselineStateFrom(mapProgressRecord(TWO_LEVELS_AFTER_SITTING_2), LEVELS);
    expect([1, 2, 3, 4].map((n) => sittingName(state, n))).toEqual([
      "At signup",
      "After Beginner and Intermediate",
      "Sitting 3",
      "Sitting 4",
    ]);
  });
});

describe("sittingSlots, the four slots on My progress", () => {
  const slots = (raw: RawProgressRecord | null) =>
    sittingSlots(baselineStateFrom(raw && mapProgressRecord(raw), LEVELS));

  it("NEW_STUDENT: Sitting 1 is owed and comes first", () => {
    const [first, ...rest] = slots(NEW_STUDENT);
    expect(first).toMatchObject({ name: "At signup", status: "Do this first", offered: true, taken: false });
    expect(rest.every((s) => !s.offered && s.status === "After another Level")).toBe(true);
  });

  it("no record at all reads as Sitting 1 owed", () => {
    expect(slots(null)[0]).toMatchObject({ status: "Do this first", offered: true });
  });

  it("TWO_LEVELS_BETWEEN_SITTINGS: Sitting 2 is offered once, and Sitting 3 is not", () => {
    expect(slots(TWO_LEVELS_BETWEEN_SITTINGS).map((s) => [s.name, s.status, s.offered])).toEqual([
      ["At signup", "3 of 20", false],
      ["Sitting 2", "Offered now", true],
      ["Sitting 3", "After another Level", false],
      ["Sitting 4", "After another Level", false],
    ]);
  });

  it("TWO_LEVELS_AFTER_SITTING_2: with nothing due, no slot is offered or named after a Level", () => {
    const all = slots(TWO_LEVELS_AFTER_SITTING_2);
    expect(all.some((s) => s.offered)).toBe(false);
    expect(all.map((s) => [s.name, s.status])).toEqual([
      ["At signup", "3 of 20"],
      ["After Beginner and Intermediate", "12 of 20"],
      ["Sitting 3", "After another Level"],
      ["Sitting 4", "After another Level"],
    ]);
  });

  it("every Level complete and nothing due: the slot left says it is not owed", () => {
    const fourth = slots(TWO_LEVELS_BEFORE_SITTING_3)[3];
    expect(fourth).toMatchObject({ name: "Sitting 4", status: "Not owed", offered: false, taken: false });
  });
});

describe("the Admin's StudentRecord", () => {
  it("carries the Sitting owed as the Progress Record decides it", () => {
    const owed = (raw: RawProgressRecord) => mapLearner(mapProgressRecord(raw), null, CATALOGUE).sittingDue;
    expect(owed(TWO_LEVELS_BETWEEN_SITTINGS)).toBe(2);
    expect(owed(TWO_LEVELS_AFTER_SITTING_2)).toBeNull();
  });
});
