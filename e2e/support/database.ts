import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

import { DATABASE, PORTS, ROOT } from "./config";
import { learnMigrations } from "./save7-os";

/**
 * A disposable Postgres 17 holding the real Learn schema.
 *
 * There is no Docker or Supabase CLI requirement. Homebrew's Postgres runs a private
 * cluster under `.e2e/` (loopback only, its own port, trust auth), and the Save7 OS
 * migrations are replayed onto a few stubs for the Supabase pieces (`auth.users` and
 * the `anon`, `authenticated` and `service_role` roles). Row level security, the
 * security-definer marking functions and the sign-in triggers are therefore the real
 * ones, which is the point: the suite exercises the database's rules, not a mock of
 * them.
 *
 * The migrations are replayed once into a template database, keyed by a hash of the
 * migrations, so a run costs a file copy rather than a replay.
 */

const PG_BIN_CANDIDATES = [
  process.env.E2E_PG_BIN,
  "/opt/homebrew/opt/postgresql@17/bin",
  "/usr/local/opt/postgresql@17/bin",
  "/usr/lib/postgresql/17/bin",
].filter((p): p is string => Boolean(p));

function pgBin(name: string): string {
  for (const dir of PG_BIN_CANDIDATES) {
    const candidate = path.join(dir, name);
    if (existsSync(candidate)) return candidate;
  }
  return name; // fall back to PATH
}

// `LC_ALL=C` because Postgres refuses to start on macOS otherwise ("postmaster became
// multithreaded during startup").
const ENV = { ...process.env, LC_ALL: "C" };
const stateDir = path.join(ROOT, ".e2e");

function run(bin: string, args: string[]) {
  return execFileSync(pgBin(bin), args, { env: ENV, stdio: ["ignore", "pipe", "pipe"] }).toString();
}

export function connectionString(database: string) {
  return `postgres://postgres@${DATABASE.host}:${PORTS.postgres}/${database}`;
}

export function authenticatorUrl(database: string) {
  return `postgres://authenticator@${DATABASE.host}:${PORTS.postgres}/${database}`;
}

async function connect(database: string) {
  const client = new Client({ connectionString: connectionString(database) });
  await client.connect();
  return client;
}

function clusterRunning(): boolean {
  try {
    run("pg_ctl", ["-D", DATABASE.cluster, "status"]);
    return true;
  } catch {
    return false;
  }
}

export function startCluster() {
  mkdirSync(stateDir, { recursive: true });
  if (!existsSync(path.join(DATABASE.cluster, "PG_VERSION"))) {
    run("initdb", ["-D", DATABASE.cluster, "-U", "postgres", "-A", "trust"]);
  }
  if (clusterRunning()) return;
  // `-k ''` keeps Postgres TCP-only: a deep checkout path makes the Unix socket path
  // longer than the 103 bytes the OS allows.
  run("pg_ctl", [
    "-D", DATABASE.cluster,
    "-o", `-p ${PORTS.postgres} -k '' -c listen_addresses=${DATABASE.host} -c fsync=off`,
    "-l", path.join(stateDir, "postgres.log"),
    "-w", "start",
  ]);
}

export function stopCluster() {
  if (clusterRunning()) run("pg_ctl", ["-D", DATABASE.cluster, "-m", "fast", "stop"]);
}

function templateFingerprint(): string {
  const hash = createHash("sha256");
  hash.update(readFileSync(path.join(__dirname, "stubs.sql")));
  for (const m of learnMigrations()) hash.update(m.name).update(m.sql);
  return hash.digest("hex");
}

async function databaseExists(admin: Client, name: string) {
  const { rowCount } = await admin.query("select 1 from pg_database where datname = $1", [name]);
  return (rowCount ?? 0) > 0;
}

/** Replay the stubs and every Learn migration into the template, unless it is current. */
async function ensureTemplate(admin: Client) {
  const fingerprint = templateFingerprint();
  const marker = path.join(stateDir, "template.sha256");
  const current =
    (await databaseExists(admin, DATABASE.template)) &&
    existsSync(marker) &&
    readFileSync(marker, "utf8") === fingerprint;
  if (current) return;

  console.log("[e2e] replaying the Learn migrations into a fresh template database…");
  await admin.query(`drop database if exists ${DATABASE.template} with (force)`);
  await admin.query(`create database ${DATABASE.template}`);

  const db = await connect(DATABASE.template);
  try {
    await db.query(readFileSync(path.join(__dirname, "stubs.sql"), "utf8"));
    for (const { name, sql } of learnMigrations()) {
      try {
        await db.query(sql);
      } catch (error) {
        await db.end();
        await admin.query(`drop database if exists ${DATABASE.template} with (force)`);
        throw new Error(`Migration ${name} failed to replay: ${(error as Error).message}`);
      }
    }
  } finally {
    await db.end().catch(() => {});
  }
  writeFileSync(marker, fingerprint);
}

/**
 * Start the cluster, make sure the template is current, and give this run a database
 * of its own. Safe to call repeatedly: the run database is dropped and recreated.
 */
export async function prepareDatabase() {
  startCluster();
  const admin = await connect("postgres");
  try {
    await ensureTemplate(admin);
    await admin.query(`drop database if exists ${DATABASE.run} with (force)`);
    await admin.query(`create database ${DATABASE.run} template ${DATABASE.template}`);
  } finally {
    await admin.end();
  }
}

/** A superuser connection to the run database, for arranging and inspecting state in tests. */
export function openRunDatabase() {
  return connect(DATABASE.run);
}
