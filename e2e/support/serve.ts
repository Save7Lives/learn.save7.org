/**
 * Brings the whole backend up and keeps it up: the private Postgres with the Learn
 * schema, PostgREST, and the Supabase-shaped gateway. Playwright starts this as a web
 * server (see playwright.config.ts) and stops it when the run ends.
 *
 * Refuses to run if anything in the environment points at a hosted Supabase project.
 */
import { DATABASE, GATEWAY_URL, PORTS } from "./config";
import { prepareDatabase, stopCluster } from "./database";
import { startGateway } from "./gateway";
import { startPostgrest } from "./postgrest";

async function main() {
  for (const [name, value] of Object.entries(process.env)) {
    if (/supabase\.co|supabase\.in/i.test(value ?? "")) {
      throw new Error(`${name} names a hosted Supabase project. The e2e suite never touches one.`);
    }
  }

  await prepareDatabase();
  const postgrest = await startPostgrest();
  const gateway = await startGateway();
  console.log(
    `[e2e] backend ready: Postgres :${PORTS.postgres} (${DATABASE.run}), PostgREST :${PORTS.postgrest}, gateway ${GATEWAY_URL}`,
  );

  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    postgrest.kill();
    await gateway.close();
    stopCluster();
    process.exit(0);
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
  postgrest.on("exit", () => void stop());
}

main().catch((error) => {
  console.error(error);
  stopCluster();
  process.exit(1);
});
