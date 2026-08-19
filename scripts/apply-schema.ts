/**
 * Create the schema in the local SQLite database.
 *
 * Replaces `prisma migrate`. The single source of truth for the schema is now
 * prisma/d1-migrations/0001_init.sql, which is also what `wrangler d1 migrations
 * apply` runs against D1 — so local and production are created from exactly the
 * same SQL rather than from two generators that could drift.
 *
 * Idempotent: every statement is CREATE TABLE / CREATE INDEX, and existing objects
 * are skipped.
 */
import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import Database from "better-sqlite3";

/**
 * Every migration, in filename order — the same files, in the same order, that
 * `wrangler d1 migrations apply` runs against D1.
 */
const MIGRATIONS_DIR = "prisma/d1-migrations";

function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env.");
    process.exit(1);
  }

  const db = new Database(url.replace(/^file:/, ""));
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const sql = files.map((f) => readFileSync(`${MIGRATIONS_DIR}/${f}`, "utf8")).join(";\n");

  let created = 0;
  let skipped = 0;

  // Split on statement boundaries. The file contains no triggers or string
  // literals with semicolons, so this is safe here.
  for (const statement of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
    try {
      db.exec(statement);
      created++;
    } catch (error) {
      if (
        error instanceof Error &&
        /already exists|duplicate column name/.test(error.message)
      ) {
        skipped++;
        continue;
      }
      throw error;
    }
  }

  console.log(
    `Schema applied from ${files.length} migration(s): ` +
      `${created} statements, ${skipped} already present.`,
  );
  db.close();
}

main();
