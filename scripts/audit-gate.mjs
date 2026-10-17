// CI dependency audit gate (#30). Fails on any advisory at or above THRESHOLD that is
// not in scripts/audit-allowlist.json with an unexpired date. See docs/dependency-advisories.md.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const THRESHOLD = "high";
const RANK = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };

const allow = JSON.parse(
  readFileSync(new URL("./audit-allowlist.json", import.meta.url), "utf8"),
).accepted;
const today = new Date().toISOString().slice(0, 10);

let out;
try {
  out = execFileSync("npm", ["audit", "--json"], { encoding: "utf8" });
} catch (e) {
  out = e.stdout; // npm audit exits non-zero when it finds anything
}
const report = JSON.parse(out);
if (report.error) {
  console.error("npm audit failed:", report.error.summary ?? report.error);
  process.exit(1);
}

const failures = [];
for (const vuln of Object.values(report.vulnerabilities ?? {})) {
  for (const via of vuln.via) {
    if (typeof via === "string") continue; // a dependent of an advisory, not an advisory
    if (RANK[via.severity] < RANK[THRESHOLD]) continue;
    const id = via.url.split("/").pop();
    const entry = allow.find((a) => a.id === id);
    if (entry && entry.expires >= today) continue;
    failures.push(
      `${via.name}: ${via.title} (${id}, ${via.severity})` +
        (entry ? ` - allowlist entry expired ${entry.expires}` : ""),
    );
  }
}

if (failures.length) {
  console.error(`Advisories at or above "${THRESHOLD}" not accepted:`);
  for (const f of new Set(failures)) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`npm audit: no unaccepted advisories at or above "${THRESHOLD}".`);
