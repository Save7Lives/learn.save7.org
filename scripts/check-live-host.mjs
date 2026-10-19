// Live host check (#51). A printed Certificate sends its checker to the address on its
// "Verify at" line, and that address once came out as the Vercel default host because a
// placeholder sat in SITE_URL. This fetches a real public Certificate page from the
// deployed site and fails if that line names anything but the site's own host.
//
//   npm run check:live
//   LIVE_URL=https://<preview>.vercel.app CERT_ID=S7-2026-B-000001 npm run check:live
//
// LIVE_URL is the site under test; the address the page must print is always
// learn.save7.org, so a preview URL is expected to fail until SITE_URL is set for it.
const base = (process.env.LIVE_URL ?? "https://learn.save7.org").replace(/\/$/, "");
const id = process.env.CERT_ID ?? "S7-2026-B-000001";
const want = "learn.save7.org/certificate/";

const res = await fetch(`${base}/certificate/${id}`, { redirect: "follow" });
const html = await res.text();
const problems = [];
if (res.status !== 200) problems.push(`${base}/certificate/${id} returned ${res.status}`);
if (!html.includes("Valid certificate")) problems.push(`the page does not say "Valid certificate"`);
if (!html.includes(want)) problems.push(`the page does not print ${want}`);
if (/vercel\.app/i.test(html.replace(new RegExp(base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), ""))) {
  problems.push("the page names a vercel.app address");
}

if (problems.length) {
  console.error(`Live host check failed:\n${problems.join("\n")}`);
  process.exit(1);
}
console.log(`Live host check passed: ${base}/certificate/${id} prints ${want}${id}.`);
