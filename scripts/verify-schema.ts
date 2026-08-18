/**
 * Dev-only: proves the Drizzle schema reads the existing database correctly.
 *
 * The Drizzle definitions were written to match the SQL that Prisma generated,
 * so this reads real rows through every table and checks the values that could
 * silently differ: ISO timestamps, 0/1 booleans, and JSON text columns.
 */
import "dotenv/config";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, is, sql } from "drizzle-orm";
import { SQLiteTable } from "drizzle-orm/sqlite-core";
import * as schema from "../src/db/schema";

const file = process.env.DATABASE_URL!.replace(/^file:/, "");
const db = drizzle(new Database(file), { schema });

async function main() {
  // Row counts, straight through the table definitions.
  const counts: Record<string, number> = {};
  for (const [name, table] of Object.entries(schema)) {
    if (!is(table, SQLiteTable)) continue;
    const [row] = await db.select({ n: sql<number>`count(*)` }).from(table);
    counts[name] = Number(row.n);
  }
  console.log("row counts:", counts);

  const course = await db.query.courses.findFirst({ with: { levels: true } });
  console.log("\ncourse:", course?.title, "| slug:", course?.slug);
  console.log("isPublished:", course?.isPublished, `(${typeof course?.isPublished})`);
  console.log("createdAt:", course?.createdAt, `(${course?.createdAt?.constructor.name})`);
  console.log("levels:", course?.levels.length);

  const lesson = await db.query.lessons.findFirst({
    where: eq(schema.lessons.componentKey, "PathwayJourney"),
  });
  console.log("\nlesson payload parses:", Boolean(JSON.parse(lesson!.payloadJson!)));

  const choice = await db.query.choices.findFirst({
    where: eq(schema.choices.isCorrect, true),
  });
  console.log("correct choice isCorrect:", choice?.isCorrect, `(${typeof choice?.isCorrect})`);

  const q = await db.query.questions.findFirst({ with: { choices: true } });
  console.log("question with choices:", q?.choices.length);

  // A write, then read it back, to confirm the timestamp format round-trips.
  const before = new Date();
  const [inserted] = await db
    .insert(schema.eventLogs)
    .values({ sessionKey: "schema-verify", type: "SCHEMA_VERIFY" })
    .returning();
  const raw = new Database(file)
    .prepare("SELECT createdAt FROM EventLog WHERE id = ?")
    .get(inserted.id) as { createdAt: string };
  console.log("\nwrote timestamp as:", raw.createdAt);
  console.log("read back as Date:", inserted.createdAt instanceof Date);
  console.log("round-trip accurate:", Math.abs(inserted.createdAt.getTime() - before.getTime()) < 2000);
  await db.delete(schema.eventLogs).where(eq(schema.eventLogs.id, inserted.id));
  console.log("cleaned up.");
}

main();
