import { spawn, type ChildProcess } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";

import { authenticatorUrl } from "./database";
import { DATABASE, JWT_SECRET, PORTS, ROOT } from "./config";

/**
 * PostgREST is what Supabase puts in front of Postgres, so running the same program
 * means the app's reads and RPC calls meet the same row level security they meet in
 * production. It connects as `authenticator`, which switches to `anon` or
 * `authenticated` according to the JWT's `role` claim.
 */
export async function startPostgrest(): Promise<ChildProcess> {
  const conf = path.join(ROOT, ".e2e", "postgrest.conf");
  writeFileSync(
    conf,
    [
      `db-uri = "${authenticatorUrl(DATABASE.run)}"`,
      `db-schemas = "public"`,
      `db-anon-role = "anon"`,
      `jwt-secret = "${JWT_SECRET}"`,
      `server-host = "127.0.0.1"`,
      `server-port = ${PORTS.postgrest}`,
      `db-pool = 10`,
      "",
    ].join("\n"),
  );

  const child = spawn(process.env.E2E_POSTGREST_BIN ?? "postgrest", [conf], {
    stdio: ["ignore", "inherit", "inherit"],
  });
  child.on("error", (error) => {
    console.error(
      `[e2e] could not start PostgREST (${error.message}). Install it with \`brew install postgrest\`.`,
    );
    process.exit(1);
  });

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORTS.postgrest}/`);
      if (res.ok) return child;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  child.kill();
  throw new Error("PostgREST did not become ready");
}
