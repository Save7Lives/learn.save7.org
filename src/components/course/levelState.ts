import type { LevelWithProgress } from "@/lib/course";

/**
 * Where a learner stands in one Level, read from `getPathwayForUser()`.
 *
 * "Passed" is the Stage Quiz, which is what completes a Level (#16), not "read".
 * `next` is the first Stage not yet passed, or -1 when every Stage is. A signed-out
 * visitor has no progress, so every Stage is not started and `next` is the first.
 */
export function levelState(level: LevelWithProgress) {
  const states = level.progress?.stageStates ?? {};
  const passed = level.modules.map((m) => states[m.slug] === "PASSED");
  const next = passed.indexOf(false);
  return {
    passed,
    next,
    passedCount: passed.filter(Boolean).length,
    started: level.progress != null && level.progress.status !== "NOT_STARTED",
    complete: level.progress?.status === "COMPLETE",
    certificatePublicId: level.progress?.certificatePublicId ?? null,
  };
}

/** The first Level the learner has not finished: the one that carries the pink button. */
export function recommendedLevelSlug(levels: LevelWithProgress[]): string | undefined {
  return levels.find((l) => l.progress?.status !== "COMPLETE")?.slug ?? levels[0]?.slug;
}

export function stageWord(passed: boolean, isNext: boolean): string {
  return passed ? "quiz passed" : isNext ? "up next" : "not started";
}
