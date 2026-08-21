/**
 * Remove files Cloudflare Pages will refuse, after the build.
 *
 * Pages caps a single asset at 25 MiB, and `journey-of-a-gift.mp4` is 35 MB. The
 * Workers build kept it out with `public/.assetsignore`; **Pages does not honour
 * that file** — it copies it into the output as just another asset, and then
 * refuses the deploy:
 *
 *   ✘ Error: Pages only supports files up to 25 MiB in size
 *     media/journey-of-a-gift.mp4 is 34.6 MiB in size
 *
 * So the exclusion has to happen after `next-on-pages` has produced the output.
 * The file stays in `/public`, which is what lets local development play the video
 * with no extra setup; in production `src/lib/media.ts` rewrites the path to
 * `MEDIA_BASE_URL`, and where no bucket is configured it drops the path so the
 * player shows its placeholder rather than a dead `<video>`.
 *
 * Deliberately fails loudly on anything else oversized rather than deleting it: a
 * second large file is a decision for a person, not for this script.
 */
import { readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const ROOT = ".vercel/output/static";
const LIMIT = 25 * 1024 * 1024;

/** Files this script is allowed to remove, relative to ROOT. */
const REMOVABLE = [/^media\//];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

let removed = 0;
const refused = [];

for (const path of walk(ROOT)) {
  if (statSync(path).size <= LIMIT) continue;

  const relative = path.slice(ROOT.length + 1);
  if (REMOVABLE.some((pattern) => pattern.test(relative))) {
    unlinkSync(path);
    console.log(`stripped ${relative} — over the 25 MiB Pages limit, served from R2 instead`);
    removed++;
  } else {
    refused.push(relative);
  }
}

if (refused.length > 0) {
  console.error(
    `\n${refused.length} file(s) exceed the 25 MiB Pages limit and are not media:\n` +
      refused.map((f) => `  ${f}`).join("\n") +
      "\n\nPages will refuse the deploy. Decide where these should be served from — " +
      "R2, like the video — rather than adding them to REMOVABLE here.",
  );
  process.exit(1);
}

console.log(`${removed} oversized file(s) stripped; the rest of the output is within limits.`);
