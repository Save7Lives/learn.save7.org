import { drizzle as drizzleD1 } from "drizzle-orm/d1";

import * as schema from "@/db/schema";

/**
 * Database access.
 *
 * Two environments, one schema — both SQLite, so production and development run
 * the same dialect:
 *
 *   - Cloudflare Pages → D1, via the `DB` binding on the request context
 *   - Local Node       → a SQLite file, via DATABASE_URL
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

/**
 * The D1 binding, or undefined when not running on Pages.
 *
 * Read off the global symbol rather than through
 * `getRequestContext()` from `@cloudflare/next-on-pages`, deliberately: that
 * package declares no `.` entry in its `exports` map, so importing it from a
 * Node script fails with ERR_PACKAGE_PATH_NOT_EXPORTED. Webpack resolves it via
 * the legacy `main` field and the Pages build is fine, but `npm run verify` and
 * every script under /scripts import src/lib/auth, which imports this file — one
 * unreachable import here broke all of them.
 *
 * The symbol is what `getRequestContext()` itself reads. Undefined off Pages,
 * which is exactly the signal the callers below want.
 */
const REQUEST_CONTEXT = Symbol.for("__cloudflare-request-context__");

/** Where db-node.ts registers the Node client. See createClient below. */
export const NODE_DB = Symbol.for("transplant-alchemy.node-db");

function d1Binding(): D1Database | undefined {
  const ctx = (globalThis as Record<symbol, unknown>)[REQUEST_CONTEXT] as
    | { env?: D1Env }
    | undefined;
  return ctx?.env?.DB;
}

function createClient(binding: D1Database | undefined): Db {
  if (binding) return drizzleD1(binding, { schema });

  /**
   * A Node client injected by src/lib/db-node.ts, for scripts.
   *
   * The seeds, the journey suite and the verification scripts call the app's own
   * functions — `registerUser`, `getPathwayForUser` — and those read `db` from
   * here. Importing the native driver in this file is what broke the Pages build,
   * so the dependency goes the other way: importing db-node.ts registers its
   * client on the global, and this file uses it if it is there. Nothing under
   * src/app imports db-node.ts, so the edge bundle never sees a driver.
   */
  const injected = (globalThis as Record<symbol, unknown>)[NODE_DB] as Db | undefined;
  if (injected) return injected;

  /**
   * No binding and nothing injected — this module is bundled for the edge.
   *
   * The local SQLite driver used to live here behind a lazy `require`, which
   * webpack resolves statically anyway: `@cloudflare/next-on-pages` refuses the
   * build with `Module not found: fs` out of better-sqlite3's own source. The
   * native driver now lives in db-node.ts, which nothing under src/app imports.
   *
   * So local work runs against a local D1 rather than a file:
   *   npm run pages:preview     — wrangler serves the app with a local D1
   * and the seeds and scripts, which run under tsx in Node, use db-node.ts.
   */
  throw new Error(
    "No D1 binding. On Pages the `DB` binding is always present; locally run " +
      "`npm run pages:preview`, which serves the app with a local D1. Scripts " +
      "and seeds use src/lib/db-node.ts instead.",
  );
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
