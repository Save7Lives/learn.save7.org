/**
 * Publish the Stage 3 film (its video, poster and captions) to Supabase Storage.
 *
 *   npm run media:upload
 *
 * The map settled Supabase Storage as the film's home (#23): a public bucket
 * `learn-media`, a one-year cache, and a name that never changes. The app serves
 * the copy in `public/media` until `MEDIA_BASE_URL` is set, and from the bucket
 * after (src/lib/media.ts), so this script is what makes the second state safe.
 *
 * **Needs a Supabase secret key, which is why it is a script you run and not
 * something committed anywhere.** Creating a bucket is not something the anon key
 * can do. Put one in `.env.secrets` (git-ignored):
 *
 *   SUPABASE_SECRET_KEY=sb_secret_...        (preferred)
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...         (legacy, also works)
 *
 * Dashboard -> Settings -> API Keys. Either bypasses row level security entirely,
 * so it belongs in that file and nowhere else: never `.env`, never the Vercel
 * project, never a commit.
 *
 * What it does, in order:
 *   1. refuses to start unless `npm run media:check` passes;
 *   2. creates the bucket if it is missing (public, 50 MB per file, three MIME types);
 *   3. uploads each file under its immutable name, with `cacheControl: 31536000`.
 *      It never overwrites: a name that already exists must hold the same bytes.
 *      `--refresh` re-sends a file that is already there, which is safe because a
 *      name is a hash of its bytes: use it only if a proof below fails on headers;
 *   4. proves, against the public URL, the four things the app depends on:
 *        - the right `content-type` (a <video> fails silently on a wrong one),
 *        - `206` for a range request (seeking and a quick start need it),
 *        - the one-year `cache-control` (#23: the default is one hour, which
 *          roughly halves the egress headroom), and
 *        - `access-control-allow-origin` (captions are fetched cross-origin);
 *   5. prints the `MEDIA_BASE_URL` to set in the Vercel project.
 *
 * It exits non-zero if any proof fails. Do not set `MEDIA_BASE_URL` until it passes.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

import { FILMS, type Film } from "../src/lib/films";
import { loadSecrets } from "./load-secrets.mjs";
import { checkMedia, filmAssets, localPath, type Asset } from "./media-checks";
import { CACHE_SECONDS, verifyPublished } from "./media-verify";

loadSecrets();

// The public project URL, committed in .env.example. SUPABASE_URL overrides it.
const url = (process.env.SUPABASE_URL ?? "https://zbaoziisqroqxfwcnhlb.supabase.co").replace(/\/$/, "");
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
// `learn-media`, not `course-media`: the map settled this name (#23), and
// MEDIA_BASE_URL in .env.example is written for it. A mismatch here uploads the
// film somewhere the app will never look for it.
const BUCKET = process.env.MEDIA_BUCKET ?? "learn-media";

if (!key) {
  console.error(
    "A Supabase secret key is not set.\n\n" +
      "Put one in .env.secrets, which is git-ignored:\n\n" +
      "  SUPABASE_SECRET_KEY=sb_secret_...        (preferred)\n" +
      "  SUPABASE_SERVICE_ROLE_KEY=eyJ...         (legacy, also works)\n\n" +
      "Dashboard -> Settings -> API Keys. The new secret key is on the first tab;\n" +
      "service_role is under Legacy API Keys. Either bypasses row level security,\n" +
      "so it belongs in that file and nowhere else.\n",
  );
  process.exit(1);
}
const secretKey: string = key;
// Re-send files that already exist. Same name means same bytes, so this changes what a
// cache is told about a file, never what the file is.
const refresh = process.argv.includes("--refresh");

async function main() {
  // 1. The files must agree with each other before anything leaves this machine.
  const report = checkMedia();
  if (report.errors.length > 0) {
    for (const error of report.errors) console.error(`ERR ${error}`);
    console.error("\nThe film's files are inconsistent. Fix them (npm run media:check) before uploading.");
    process.exit(1);
  }

  const films = Object.entries(FILMS) as [string, Film][];
  const assets: Asset[] = films.flatMap(([, film]) => filmAssets(film));
  const objectPath = (asset: Asset) => asset.src.replace(/^\//, "");
  const publicBase = `${url}/storage/v1/object/public/${BUCKET}`;

  const supabase = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // 2. The bucket. Public, because a learner's browser fetches the file directly and a
  //    signed URL would be a fresh URL on every view: a cache miss each time (#23).
  const bucketOptions = {
    public: true,
    fileSizeLimit: 52428800,
    allowedMimeTypes: ["video/mp4", "image/jpeg", "text/vtt"],
  };
  const existing = await supabase.storage.getBucket(BUCKET);
  if (existing.data) {
    const { error } = await supabase.storage.updateBucket(BUCKET, bucketOptions);
    if (error) fail(`could not update bucket "${BUCKET}": ${error.message}`);
    console.log(`bucket "${BUCKET}" exists; its settings are as intended`);
  } else {
    const { error } = await supabase.storage.createBucket(BUCKET, bucketOptions);
    if (error) fail(`could not create bucket "${BUCKET}": ${error.message}`);
    console.log(`bucket "${BUCKET}" created (public)`);
  }

  // 3. The files. Never an overwrite: the name is permanent, and the only way a
  //    corrected file ships is under a new one.
  for (const asset of assets) {
    const bytes = readFileSync(localPath(asset.src));
    const path = objectPath(asset);
    process.stdout.write(`uploading ${path} (${(bytes.length / 1048576).toFixed(1)} MiB) ... `);
    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: asset.contentType,
      cacheControl: String(CACHE_SECONDS),
      upsert: refresh,
    });
    if (!error) {
      console.log("done");
      continue;
    }
    if (!/already exists|duplicate/i.test(error.message)) fail(`upload failed: ${error.message}`);

    // Already there. Fine if it is these bytes; a fault if it is not.
    const head = await fetch(`${publicBase}/${path}`, { method: "HEAD" });
    const remoteLength = Number(head.headers.get("content-length"));
    if (remoteLength !== bytes.length) {
      fail(
        `${path} already exists with ${remoteLength} bytes, not the ${bytes.length} here. ` +
          `A name is permanent: ship the corrected file under a new name, never over this one.`,
      );
    }
    console.log("already uploaded (same size)");
  }

  // 4. The proofs, against what a learner's browser will actually get.
  console.log(`\nChecking ${publicBase}/ ...\n`);
  const { problems, lines } = await verifyPublished(publicBase);
  for (const line of lines) console.log(line);

  if (problems.length > 0) {
    console.error("");
    for (const problem of problems) console.error(`FAIL ${problem}`);
    console.error(
      `\n${problems.length} check(s) failed. Do NOT set MEDIA_BASE_URL: the app would point at files that will not play.\n` +
        `If the failures are about headers (cache-control, content-type) on files that were already uploaded,\n` +
        `run \`npm run media:upload -- --refresh\` to send the same bytes again with the right headers.`,
    );
    process.exit(1);
  }

  console.log(`\nAll checks passed. Set this in the Vercel project (Settings -> Environment Variables,`);
  console.log(`Production and Preview), then redeploy, because an environment change reaches the site only after one:\n`);
  console.log(`  MEDIA_BASE_URL=${publicBase}\n`);
}

function fail(message: string): never {
  console.error(`\n${message}`);
  process.exit(1);
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
