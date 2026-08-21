import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

import * as schema from "@/db/schema";
import { NODE_DB, type Db } from "./db";

/**
 * The Node-only database client, for scripts.
 *
 * **Nothing under `src/app` may import this file.** It pulls in better-sqlite3,
 * a native module, and every route on Cloudflare Pages runs on the edge runtime —
 * a single import from a route is enough to fail the build with `Module not found:
 * fs`, which is exactly how this split came to exist.
 *
 * The seeds, the journey suite and the verification scripts all run under `tsx`
 * in Node against the SQLite file named by DATABASE_URL, so they use this. The app
 * uses `db` from ./db, which is D1 only.
 */
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set. Scripts read the local SQLite file from it.");
}

// Cast for the reason given on Db: a synchronous driver with the same awaited
// surface, so one type serves both and call sites do not fork.
export const dbNode = drizzle(new Database(url.replace(/^file:/, "")), {
  schema,
}) as unknown as Db;

/**
 * Registered on the global as a side effect of importing this file.
 *
 * The app's own functions read `db` from ./db, which has no driver of its own off
 * Pages. A script that imports this module gets those functions working against
 * the local SQLite file without any of them taking a database argument — and the
 * edge bundle stays clean, because nothing under src/app imports this file.
 */
(globalThis as Record<symbol, unknown>)[NODE_DB] = dbNode;
