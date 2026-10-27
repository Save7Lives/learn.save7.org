import { existsSync, readdirSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { ROOT } from "./config";

/**
 * The Save7 OS repository, where the schema and the registration function live.
 *
 * The migrations are the single source of truth for the database (CLAUDE.md), so the
 * suite replays them rather than keeping a copy that could drift. Point
 * `SAVE7_OS_DIR` at a checkout; otherwise the sibling `../save7-os` is tried, then
 * the usual place on the maintainer's machine.
 */
export function save7OsDir(): string {
  const candidates = [
    process.env.SAVE7_OS_DIR,
    path.resolve(ROOT, "..", "save7-os"),
    path.join(os.homedir(), "Desktop", "Save7 Course", "save7-os"),
  ].filter((p): p is string => Boolean(p));

  for (const dir of candidates) {
    if (existsSync(path.join(dir, "supabase", "migrations"))) return dir;
  }
  throw new Error(
    "Cannot find the Save7 OS repository. Set SAVE7_OS_DIR to a checkout of it " +
      `(looked in: ${candidates.join(", ")}).`,
  );
}

/**
 * The Learn migrations, in order.
 *
 * The OS history is shared with Save7's finance and volunteer tooling. Migrations
 * before 0091 predate Learn, and the numbers below need ops tables that are not
 * replayed here (the vetting rules, the research tracker, fuel, the ledger). Anything
 * else replays, so a new Learn migration is picked up with no edit. If a new
 * migration needs an ops table, the replay stops at it with the file's name; add the
 * number here and, if Learn needs the table, a stub to `stubs.sql`.
 */
const SKIPPED = new Set([
  "0099", "0100", "0102", "0103", "0104", "0105", "0106", "0107", "0108", "0123", "0124", "0125",
  "0140", "0141", "0142", "0143",
]);

export function learnMigrations(): { name: string; sql: string }[] {
  const dir = path.join(save7OsDir(), "supabase", "migrations");
  return readdirSync(dir)
    .filter((f) => /^\d{4}_.*\.sql$/.test(f))
    .filter((f) => Number(f.slice(0, 4)) >= 91 && !SKIPPED.has(f.slice(0, 4)))
    .sort()
    .map((name) => ({
      name,
      // The OS-wide verifier needs the OS's own views, which are not replayed.
      sql: readFileSync(path.join(dir, name), "utf8").replace(
        /^[ \t]*select verify_vol_views\(\);/gm,
        "",
      ),
    }));
}

export function registerLearnerSource(): string {
  return readFileSync(
    path.join(save7OsDir(), "supabase", "functions", "register-learner", "index.ts"),
    "utf8",
  );
}
