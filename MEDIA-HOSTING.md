# Hosting the Module 5 video

`journey-of-a-gift.mp4` is 34.6 MiB. A Cloudflare Worker refuses any single static
asset over 25 MiB, so the film cannot ship inside the deploy and production fetches
it from elsewhere. Its home is **Supabase Storage**, public bucket `learn-media`,
named to the app by the `MEDIA_BASE_URL` var.

Moving between hosts is that one variable. No code changes, and no rebuild — it is
read at runtime.

## The cap did not change when the platform did

The app was on Cloudflare Pages for a period and is now a Worker. The 25 MiB
per-file asset cap is **the same on Workers as it was on Pages** — checked against
Cloudflare's limits page during the port rather than assumed to have improved. The
file is still too big by roughly 10 MiB.

What *did* change is the mechanism for keeping it out:

| | Pages | Workers |
| --- | --- | --- |
| `public/.assetsignore` | ignored | **honoured** |
| Keeping the video out of the upload | a post-build strip script | that one file |

`scripts/strip-oversized-media.mjs` existed only because Pages ignored the ignore
file. It is deleted. The Workers behaviour was verified rather than trusted: the
built output was served and `/media/journey-of-a-gift.mp4` returned 404 while
`/favicon.ico` returned 200.

The video stays committed at `public/media/journey-of-a-gift.mp4`, which is what
lets local development play it with no setup.

## Uploading it

`scripts/upload-media.mjs` creates the bucket, uploads the file, checks the
content type that comes back, and prints the value to put in `MEDIA_BASE_URL`:

```bash
npm run media:upload
```

**It needs a Supabase secret key**, because creating a bucket is not something the
anon key can do. The script reads it from `.env.secrets`, which is git-ignored —
`SUPABASE_SECRET_KEY` (the newer `sb_secret_...` form, preferred) or the legacy
`SUPABASE_SERVICE_ROLE_KEY`. Either bypasses row level security entirely, so it
belongs in that file and nowhere else: never in `wrangler.jsonc`, never in `.env`,
never in a commit.

Note the bucket name before you run it. `wrangler.jsonc` is written for
`learn-media`; the script's own default is `course-media`, overridable with
`MEDIA_BUCKET`. **These two have not been reconciled** — pick one deliberately and
make the var match what the upload actually created, or the player will point at a
bucket that is not there.

Then uncomment `MEDIA_BASE_URL` in `wrangler.jsonc` and `npm run deploy`. Set it
only once the object really answers: pointing the player at a URL that does not
serve is the one way to get a dead `<video>` instead of the honest placeholder.

## What any host has to do

Three requirements, and a host that fails the first one fails silently:

- **`content-type: video/mp4`.** Not negotiable — see the trap below.
- **HTTP range requests.** Seeking, and the chapter list beside the player, both
  depend on them. A host that answers `200` to a `Range:` request instead of `206`
  forces a full download before playback.
- **CDN caching.** The audience is South African and mostly on phones; a 35 MB file
  served from a single origin is a poor experience on a mobile connection.

Confirm all of it before pointing the course at a host:

```bash
curl -sI "$MEDIA_BASE_URL/media/journey-of-a-gift.mp4" | grep -i "content-type\|content-length\|accept-ranges"
```

## `raw.githubusercontent.com` is not a valid host

This is worth stating because raw URLs are the obvious thing to reach for and they
do not work. Measured on 23 August 2026:

| Host | Content-Type | Ranges | Plays in `<video>`? |
| ---- | ------------ | ------ | ------------------- |
| `raw.githubusercontent.com` | `application/octet-stream` + `x-content-type-options: nosniff` | yes | **No** |

`nosniff` tells the browser not to second-guess the declared type, so an
`application/octet-stream` response is treated as a file to download rather than a
video to play. The `<video>` element fails silently — no error, just a dead player.
That failure mode is the reason this section exists: the bytes arrive, the range
requests work, and nothing plays.

A second reason applies regardless: this repository is private, and private raw
URLs return 404 to anyone not signed in. Authenticating from a learner's browser
would mean putting a GitHub token in the page.

## Routes that were considered and are not the plan

Both of these appear in older notes and commits. Neither is current:

- **R2** was the original intention — free egress and a real CDN — but it needs a
  payment method on the Cloudflare account. Superseded.
- **GitHub Pages**, from an orphan `media` branch, was the interim route while R2
  was blocked. Superseded. GitHub also asks that Pages not be used as a general
  media CDN, and its documented soft limits (a 1 GB site, roughly 100 GB of
  bandwidth a month) are thin cover for a film that might be linked from social
  media.

Supabase Storage won because the project already exists, it is the backend anyway,
and a public bucket serves correct content types and ranges. One thing to check
rather than assume: the project's plan. The free tier's monthly egress allowance is
modest against a 35 MB file, so watch it once the course has learners.

## What one variable fixes

`MEDIA_BASE_URL` covers every place the file appears. The prior build had two, the
Module 5 `ChapterVideo` player and an "Opens here" resource link, and both were
deleted in wayfinder #60. The Stage 3 film's new player is wayfinder #61.

Media paths resolve through `mediaUrl()` in `src/lib/media.ts`, which joins the
base to the `/media/...` path. It handles three states,
including "deployed with no bucket configured" — where it deliberately drops the
path, so the player shows its "not hosted yet" state instead of a `<video>` that
fails without saying so. See the comment at the top of that file.

## Still outstanding for Module 5

Hosting the file does not finish the module:

- a WebVTT captions track and a text transcript — both accessibility requirements
- chapter timecodes measured against the film, so the chapter list beside the
  player can seek instead of only listing
