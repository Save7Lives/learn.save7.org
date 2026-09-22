/**
 * Publish the Module 5 video to Supabase Storage.
 *
 * The film is 35 MB. Cloudflare caps a static asset at 25 MiB — the same on Workers
 * as it was on Pages — so public/.assetsignore keeps it out of the upload and the
 * player fetches it from the host named by MEDIA_BASE_URL.
 * Supabase Storage is that host: it serves the correct content type, supports the
 * range requests seeking needs, and the project already exists.
 *
 * **Needs the service-role key, which is why this is a script you run and not
 * something committed anywhere.** Creating a bucket is not something the anon key
 * can do. Take the key from the Supabase dashboard (Project Settings -> API ->
 * service_role) and pass it in the environment:
 *
 *   SUPABASE_URL='https://<ref>.supabase.co' \
 *   SUPABASE_SERVICE_ROLE_KEY='eyJ...' \
 *   node scripts/upload-media.mjs
 *
 * Never put that key in wrangler.jsonc, .env or a commit. It bypasses row level
 * security entirely.
 *
 * Creates a public bucket, uploads the file, verifies the content type that comes
 * back, and prints the value to put in MEDIA_BASE_URL.
 */
import { readFileSync, statSync } from "node:fs";
import { loadSecrets } from "./load-secrets.mjs";

loadSecrets();

const url = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
// Either key works for Storage. The newer `sb_secret_...` key is preferred: it is
// rejected outright if it ever appears in a browser, where the legacy service_role
// JWT would happily work and leak everything.
const key =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
// `learn-media`, not `course-media`: the map settled this bucket name, and
// wrangler.jsonc's MEDIA_BASE_URL is written for it. A mismatch here uploads the
// file somewhere the app will never look for it.
const BUCKET = process.env.MEDIA_BUCKET ?? "learn-media";
const LOCAL = "public/media/journey-of-a-gift.mp4";
const REMOTE = "media/journey-of-a-gift.mp4";

if (!url || !key) {
  console.error(
    "A Supabase secret key is not set.\n\n" +
      "Put one in .env.secrets, which is git-ignored:\n\n" +
      "  SUPABASE_SECRET_KEY=sb_secret_...        (preferred)\n" +
      "  SUPABASE_SERVICE_ROLE_KEY=eyJ...        (legacy, also works)\n\n" +
      "Dashboard -> Settings -> API Keys. The new secret key is on the first tab;\n" +
      "service_role is under Legacy API Keys. Either bypasses row level security,\n" +
      "so it belongs in that file and nowhere else.\n",
  );
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };
const size = statSync(LOCAL).size;
console.log(`${LOCAL} — ${(size / 1024 / 1024).toFixed(1)} MB`);

// 1. The bucket. Public, because a learner's browser fetches the file directly
//    and a signed URL would expire mid-course.
const made = await fetch(`${url}/storage/v1/bucket`, {
  method: "POST",
  headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify({
    id: BUCKET,
    name: BUCKET,
    public: true,
    file_size_limit: 104857600,
    allowed_mime_types: ["video/mp4", "text/vtt"],
  }),
});
if (made.ok) console.log(`bucket "${BUCKET}" created (public)`);
else {
  const body = await made.text();
  if (/already exists|Duplicate/i.test(body)) console.log(`bucket "${BUCKET}" already exists`);
  else {
    console.error(`could not create the bucket: ${made.status} ${body}`);
    process.exit(1);
  }
}

// 2. The file. upsert so a re-run replaces rather than failing.
console.log("uploading…");
const put = await fetch(`${url}/storage/v1/object/${BUCKET}/${REMOTE}`, {
  method: "POST",
  headers: { ...headers, "Content-Type": "video/mp4", "x-upsert": "true" },
  body: readFileSync(LOCAL),
});
if (!put.ok) {
  console.error(`upload failed: ${put.status} ${await put.text()}`);
  process.exit(1);
}

// 3. Prove it serves as video, because a player fails silently if it does not.
const base = `${url}/storage/v1/object/public/${BUCKET}`;
const head = await fetch(`${base}/${REMOTE}`, { method: "HEAD" });
const type = head.headers.get("content-type");
const length = head.headers.get("content-length");
console.log(`\nserved: ${head.status}  content-type: ${type}  bytes: ${length}`);

if (type !== "video/mp4") {
  console.error(`\nWrong content type (${type}). A <video> element will not play this.`);
  process.exitCode = 1;
} else {
  console.log(`\nDone. Put this in wrangler.jsonc under vars:\n\n  "MEDIA_BASE_URL": "${base}"\n`);
  console.log("The stored path is media/journey-of-a-gift.mp4, which is what the");
  console.log("lesson content already points at, so nothing else needs changing.");
}
