import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import * as schema from "@/db/schema";

/**
 * Database access.
 *
 * Two environments, one schema — both SQLite, so production and development run
 * the same dialect:
 *
 *   - Cloudflare Workers → D1, via the `DB` binding
 *   - Local Node         → a SQLite file, via DATABASE_URL
 *
 * Drizzle rather than Prisma because Prisma 7 compiles queries with WebAssembly
 * and Cloudflare Workers refuses to instantiate WASM from a buffer
 * (`Wasm code generation disallowed by embedder`). Drizzle emits SQL directly.
 *
 * The client is built lazily. A Workers binding does not exist at module scope —
 * only inside a request — so it cannot be constructed eagerly at import time.
 */

/**
 * The client type.
 *
 * Deliberately the D1 (async) flavour for both targets. The better-sqlite3 driver
 * is synchronous, but Drizzle's query builders are thenable, so `await` works
 * identically on either — and a union of the two types would make every
 * `db.select(...)` call unresolvable, since TypeScript cannot call a union of
 * signatures. One type, one set of call sites.
 */
export type Db = ReturnType<typeof drizzleD1<typeof schema>>;

type D1Env = { DB?: D1Database };

/** The D1 binding, or undefined when not running on Workers. */
function d1Binding(): D1Database | undefined {
  try {
    return (getCloudflareContext().env as D1Env | undefined)?.DB;
  } catch {
    // Throws outside a Workers request context, which is the normal case for
    // `next dev`, the seed script and the scripts in /scripts.
    return undefined;
  }
}

function createClient(binding: D1Database | undefined): Db {
  if (binding) return drizzleD1(binding, { schema });

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "No database available: neither the Cloudflare D1 binding `DB` nor DATABASE_URL is set. " +
        "For local work, copy .env.example to .env to get the SQLite default.",
    );
  }

  // Required lazily so the Workers bundle never pulls in a native Node module.
  // On Workers this line is unreachable — the binding is always present.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3") as typeof import("better-sqlite3");

  // Cast for the reason given on Db above: sync driver, same awaited surface.
  return drizzleSqlite(new Database(url.replace(/^file:/, "")), {
    schema,
  }) as unknown as Db;
}

/**
 * One client per binding identity.
 *
 * Keying on the binding rather than plain memoisation means a Worker isolate
 * handed a different `DB` object rebuilds instead of holding a stale one. Off
 * Workers the key is `undefined`, so this is a straightforward singleton — which
 * `next dev` needs, since it re-evaluates modules on every edit and would
 * otherwise open a new SQLite handle per reload.
 */
const globalForDb = globalThis as unknown as {
  dbCache?: { key: D1Database | undefined; client: Db };
};

function getClient(): Db {
  const key = d1Binding();
  const cached = globalForDb.dbCache;
  if (cached && cached.key === key) return cached.client;

  const client = createClient(key);
  globalForDb.dbCache = { key, client };
  return client;
}

/**
 * The client, resolved on first use.
 *
 * A proxy rather than a function so call sites read as `db.select()...` instead
 * of `getDb().select()...`, and so the lazy construction stays an implementation
 * detail of this module.
 */
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export { schema };
