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
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";

const SCHEMA = "prisma/d1-migrations/0001_init.sql";

function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env.");
    process.exit(1);
  }

  const db = new Database(url.replace(/^file:/, ""));
  const sql = readFileSync(SCHEMA, "utf8");

  let created = 0;
  let skipped = 0;

  // Split on statement boundaries. The file contains no triggers or string
  // literals with semicolons, so this is safe here.
  for (const statement of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
    try {
      db.exec(statement);
      created++;
    } catch (error) {
      if (error instanceof Error && /already exists/.test(error.message)) {
        skipped++;
        continue;
      }
      throw error;
    }
  }

  console.log(`Schema applied: ${created} statements, ${skipped} already present.`);
  db.close();
}

main();
