/**
 * What a learner's browser will actually get from the host that serves the film.
 *
 * `upload-media.ts` runs this against the bucket straight after uploading, and
 * `npm run media:verify` runs it on its own: before setting `MEDIA_BASE_URL`, and
 * any time later that the film seems not to be playing.
 *
 * The four things the app depends on, each of which fails without a sound:
 *   - the right `content-type`: a <video> on a wrong one shows a dead player;
 *   - `206` for a range request: seeking and a quick start both need it;
 *   - the one-year `cache-control` (#23): the project's default is one hour, which
 *     on a 36 MB file turns nearly every view into an origin pull;
 *   - `access-control-allow-origin`: the captions are fetched cross-origin, and a
 *     track the browser may not read simply never appears.
 * Plus: the bytes served are the bytes committed.
 */
import { readFileSync } from "node:fs";

import { FILMS, type Film } from "../src/lib/films";
import { filmAssets, localPath, sha8, type Asset } from "./media-checks";

export const CACHE_SECONDS = 31536000;
export const SITE_ORIGIN = "https://learn.save7.org";

export type Verification = { problems: string[]; lines: string[] };

export async function verifyPublished(base: string): Promise<Verification> {
  const problems: string[] = [];
  const lines: string[] = [];
  const assets: Asset[] = (Object.values(FILMS) as Film[]).flatMap((film) => filmAssets(film));

  for (const asset of assets) {
    const path = asset.src.replace(/^\//, "");
    const local = readFileSync(localPath(asset.src));
    const target = `${base.replace(/\/$/, "")}/${path}`;
    const bad = (message: string) => problems.push(`${path}: ${message}`);
    const facts: string[] = [];

    // A ranged GET is what a player sends, and it carries the headers worth reading.
    let ranged: Response;
    try {
      ranged = await fetch(target, { headers: { Range: "bytes=0-1023", Origin: SITE_ORIGIN } });
    } catch (e) {
      bad(`could not be fetched: ${(e as Error).message}`);
      continue;
    }
    const body = Buffer.from(await ranged.arrayBuffer());

    if (ranged.status !== 206) {
      bad(`a range request answered ${ranged.status}, expected 206${ranged.status === 404 ? " (not uploaded?)" : ""}`);
    }
    facts.push(`range ${ranged.status}`);
    if (ranged.status === 206 && !ranged.headers.get("content-range")) bad("no content-range on the range response");

    const type = (ranged.headers.get("content-type") ?? "").split(";")[0].trim();
    if (type !== asset.contentType) bad(`content-type is "${type}", expected ${asset.contentType}`);
    facts.push(`content-type ${type}`);

    const cache = ranged.headers.get("cache-control") ?? "";
    if (!new RegExp(`max-age=${CACHE_SECONDS}(?!\\d)`).test(cache)) {
      bad(`cache-control is "${cache}", expected max-age=${CACHE_SECONDS}`);
    }
    facts.push(`cache-control ${cache || "(none)"}`);

    const cors = ranged.headers.get("access-control-allow-origin");
    if (cors !== "*" && cors !== SITE_ORIGIN) {
      bad(`access-control-allow-origin is ${JSON.stringify(cors)}; the captions cannot load without it`);
    }
    facts.push(`cors ${cors ?? "(none)"}`);

    if (ranged.status === 206 && !body.equals(local.subarray(0, body.length))) {
      bad(`the first ${body.length} bytes served are not the bytes committed`);
    }

    // Small files can be checked whole, against the hash in their own name.
    if (local.length < 1048576 && ranged.status < 400) {
      const whole = Buffer.from(await (await fetch(target)).arrayBuffer());
      const named = /\.([0-9a-f]{8})\.[a-z0-9]+$/.exec(asset.src)?.[1];
      if (sha8(whole) !== named) bad("the whole file served does not match the hash in its name");
    }

    lines.push(`  ${path}\n    ${facts.join("  |  ")}`);
  }

  return { problems, lines };
}
