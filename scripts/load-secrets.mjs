/**
 * Load credentials from a git-ignored local file.
 *
 * The alternative is exporting them in a shell, where a connection string with a
 * `?` or a `&` in it gets mangled by quoting mistakes and the failure looks like a
 * wrong password. Reading the file directly avoids that entirely.
 *
 * Values already present in the environment win, so CI and one-off overrides
 * still work. Nothing here is ever printed.
 */
import { existsSync, readFileSync } from "node:fs";

const FILE = ".env.secrets";

export function loadSecrets(file = FILE) {
  if (!existsSync(file)) return;

  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Strip one layer of matching quotes, so both styles work.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value && process.env[key] === undefined) process.env[key] = value;
  }
}
