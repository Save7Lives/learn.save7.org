import { defineConfig } from "@playwright/test";

import { APP_URL, GATEWAY_URL, PORTS, appEnv } from "./e2e/support/config";

/**
 * The end-to-end suite (T28). Run it with `npm run e2e`; see "End-to-end tests" in
 * README.md for what it needs and how it keeps away from production.
 *
 * Two servers are started for the run and stopped after it:
 *
 *   1. the backend: a private Postgres holding the real Learn schema, PostgREST, and
 *      a Supabase-shaped gateway that stands in for Google at the auth boundary;
 *   2. the app itself, built and started with its Supabase URL pointed at that gateway.
 *
 * Set E2E_REUSE_SERVERS=1 to attach to servers you already started (faster when
 * iterating). That is opt-in because a stale server on one of these ports could be
 * pointed somewhere else.
 */
const reuseExistingServer = process.env.E2E_REUSE_SERVERS === "1";

export default defineConfig({
  testDir: "./e2e/tests",
  outputDir: "./.e2e/results",
  // A journey takes a full course's worth of clicks; give it room, and fail loudly.
  timeout: 180_000,
  expect: { timeout: 15_000 },
  // Tests share one database but each uses its own accounts, so they may run in
  // parallel. The journey is one long test, so there is nothing to gain yet.
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL: APP_URL,
    acceptDownloads: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium", viewport: { width: 1024, height: 900 } } }],
  webServer: [
    {
      command: "node node_modules/tsx/dist/cli.mjs e2e/support/serve.ts",
      url: `${GATEWAY_URL}/__e2e/health`,
      timeout: 180_000,
      reuseExistingServer,
      stdout: "pipe",
      stderr: "pipe",
      gracefulShutdown: { signal: "SIGTERM", timeout: 15_000 },
    },
    {
      command: `npm run build && npm run start -- -p ${PORTS.app}`,
      url: `${APP_URL}/login`,
      timeout: 360_000,
      reuseExistingServer,
      stdout: "pipe",
      stderr: "pipe",
      env: appEnv(),
    },
  ],
});
