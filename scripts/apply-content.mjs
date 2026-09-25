/**
 * Apply a generated content migration to the Supabase database.
 *
 * The migration's proper home is `supabase db push` from the save7-os repository.
 * This exists for the case that repository is not to hand: it runs exactly the
 * same SQL against the same database, in one transaction.
 *
 * **The connection string is read from the environment and never printed.** Take
 * it from the Supabase dashboard (Project Settings -> Database -> Connection
 * string -> URI), and prefer the session pooler on port 5432 for a script like
 * this. Run it as:
 *
 *   SUPABASE_DB_URL='postgresql://...' node scripts/apply-content.mjs \
 *     prisma/supabase/0118_learn_gate_content.sql
 *
 * Safe to run more than once: every statement in the generated file is an upsert
 * keyed on the authoring identifier, so re-running updates rows in place rather
 * than duplicating them. It also records the migration in supabase_migrations so
 * a later `supabase db push` does not try to apply it a second time.
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import pg from "pg";
import { loadSecrets } from "./load-secrets.mjs";

loadSecrets();

const url = process.env.SUPABASE_DB_URL;
const file = process.argv[2];

if (!url) {
  console.error(
    "SUPABASE_DB_URL is not set.\n\n" +
      "Put it in .env.secrets, which is git-ignored:\n\n" +
      "  SUPABASE_DB_URL=postgresql://...\n\n" +
      "Supabase dashboard -> Project Settings -> Database -> Connection string ->\n" +
      "URI, session pooler on port 5432. Or export it for one command instead.\n",
  );
  process.exit(1);
}
if (!file) {
  console.error("Usage: node scripts/apply-content.mjs <path-to-migration.sql>");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");
const version = basename(file).slice(0, 4);
const name = basename(file);

console.log(`applying ${name} (${(sql.length / 1024).toFixed(0)} KB)`);

const client = new pg.Client({
  connectionString: url,
  // Supabase terminates TLS at the pooler with a certificate this script has no
  // reason to pin; the connection is still encrypted.
  ssl: { rejectUnauthorized: false },
  // A 768 KB migration with a verification block at the end needs more than the
  // default query timeout.
  statement_timeout: 300_000,
});

try {
  await client.connect();

  // The file carries its own begin/commit, so it is sent as one script.
  await client.query(sql);

  // Record it the way the Supabase CLI would, so `db push` skips it later.
  await client.query(
    `insert into supabase_migrations.schema_migrations (version, name)
     values ($1, $2) on conflict (version) do nothing`,
    [version, name],
  );

  const { rows } = await client.query(
    `select
       (select count(*) from learn_levels)        as levels,
       (select count(*) from learn_modules)       as modules,
       (select count(*) from learn_lessons)       as lessons,
       (select count(*) from learn_questions)     as questions,
       (select count(*) from learn_review_items)  as review,
       (select count(*) from learn_review_items
         where status = 'NEEDS_VERIFICATION')     as outstanding`,
  );
  console.log("applied. row counts now:", rows[0]);
} catch (error) {
  console.error("\nFAILED — nothing was committed.\n");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
