import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  nextCoreWebVitals,
  nextTypescript,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Docs and ADRs, not app code.
    "docs/**",
    // Planning record merged in from the map repo: drafts, diffs and audit
    // scripts kept for reference, not app code.
    "wayfinder/**",
  ]),
]);

export default eslintConfig;
