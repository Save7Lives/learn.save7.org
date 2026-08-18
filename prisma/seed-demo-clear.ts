import "dotenv/config";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { like } from "drizzle-orm";

import * as schema from "../src/db/schema";
import { users } from "../src/db/schema";

/** Removes the synthetic learners created by seed-demo.ts. */
async function main() {
  const sqlite = new Database(process.env.DATABASE_URL!.replace(/^file:/, ""));
  const db = drizzle(sqlite, { schema });

  const removed = await db
    .delete(users)
    .where(like(users.email, "%@example.test"))
    .returning({ id: users.id });

  console.log(`Removed ${removed.length} demo learners (cascades to their progress).`);
  sqlite.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
