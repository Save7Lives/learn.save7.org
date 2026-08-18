import "dotenv/config";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "../src/db/schema";
import type { Db } from "../src/lib/db";
import { seedContent } from "./seed-core";

/**
 * CLI entry point for seeding: `npm run db:seed`.
 *
 * All the actual logic lives in seed-core.ts, which has no driver of its own so
 * that the same code can run inside a deployed Worker against D1 — see
 * src/app/api/admin/reseed/route.ts. This file exists only to open the local
 * SQLite file and hand the client over.
 */

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.");
  process.exit(1);
}

const sqlite = new Database(url.replace(/^file:/, ""));
// Cast for the same reason as in src/lib/db.ts: this driver is synchronous while
// the D1 one is async, but Drizzle's builders are thenable so the awaited surface
// is identical.
const db = drizzle(sqlite, { schema }) as unknown as Db;

seedContent(db, { createDevAdmin: true })
  .catch((e) => {
    console.error("\nSeed failed:\n", e);
    process.exit(1);
  })
  .finally(() => {
    sqlite.close();
  });
