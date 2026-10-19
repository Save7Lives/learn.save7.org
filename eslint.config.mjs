import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  nextCoreWebVitals,
  nextTypescript,
  // A one-off read of a locator does not wait, so after a streamed page loads it can see
  // nothing. Assert with `expect(locator)`, or wait with `gotoAdmin` (e2e/fixtures.ts)
  // and disable this line with the reason.
  {
    files: ["e2e/tests/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name=/^(count|innerText|textContent|allInnerTexts|allTextContents)$/]",
          message:
            "A one-off read does not wait. Use a web-first assertion (toHaveCount, toHaveText, toContainText), or wait for the page first and disable this line with the reason.",
        },
      ],
    },
  },
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
