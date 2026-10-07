/**
 * `npm run media:verify [base-url]`: does the host serve the film the way the app needs?
 *
 * The base defaults to the one `npm run media:upload` prints, the public URL of the
 * Supabase Storage bucket `learn-media`. Pass another to check another host.
 * Reads nothing secret and writes nothing, so anyone can run it. See media-verify.ts.
 */
import { verifyPublished } from "./media-verify";

const base =
  process.argv[2] ??
  process.env.MEDIA_BASE_URL ??
  "https://zbaoziisqroqxfwcnhlb.supabase.co/storage/v1/object/public/learn-media";

async function main() {
  console.log(`Checking ${base}/ ...\n`);
  const { problems, lines } = await verifyPublished(base);
  for (const line of lines) console.log(line);

  if (problems.length > 0) {
    console.error("");
    for (const problem of problems) console.error(`FAIL ${problem}`);
    console.error(`\n${problems.length} check(s) failed. Do not set MEDIA_BASE_URL to this host.`);
    process.exit(1);
  }
  console.log("\nEvery file answers as the app needs: content type, range requests, one-year cache, CORS.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
