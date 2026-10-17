// Test-session hook for the signed-in pages.
//
// Contract (what #28's end-to-end suite is expected to provide, or what this file
// should import from it): a module whose default export is
//
//   async function applyTestSession(context, { baseUrl, role })   // role: "student" | "admin"
//
// that puts the cookies of a signed-in test user on a Playwright BrowserContext.
// Point A11Y_SESSION_HELPER at it (a path, relative to the repository root), or put
// it at one of the default locations below. With neither, signed-in pages are skipped.
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULTS = ["e2e/support/test-session.ts", "e2e/support/test-session.mjs", "e2e/support/session.ts", "e2e/support/session.mjs"];

export async function loadSessionHelper(root = process.cwd()) {
  const candidates = process.env.A11Y_SESSION_HELPER ? [process.env.A11Y_SESSION_HELPER] : DEFAULTS;
  for (const c of candidates) {
    const file = resolve(root, c);
    if (!existsSync(file)) continue;
    const mod = await import(pathToFileURL(file).href);
    if (typeof mod.default === "function") return mod.default;
    throw new Error(`${c} has no default export function (see scripts/a11y/session.mjs).`);
  }
  return null;
}
