import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * Unit tests for the pure TypeScript. No env vars and no database: `server-only` is
 * replaced by an empty module (it throws outside a React server build), and the
 * Supabase server client is mocked in `src/test/setup.ts` so nothing can reach it.
 * The SQL half of the Progress Record's tests is scripts/progress-record/.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": here("./src"),
      "server-only": here("./src/test/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup.ts"],
  },
});
