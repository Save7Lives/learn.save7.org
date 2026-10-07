# Hosting the Module 5 video

`journey-of-a-gift.mp4` is 34.6 MiB. It ships with the app: it is committed at
`public/media/journey-of-a-gift.mp4`, deployed with the site, and served from the
same origin at `/media/journey-of-a-gift.mp4`. Vercel serves it as `video/mp4` and
answers range requests (checked: HTTP 206), so nothing has to be configured.

**Supabase Storage**, public bucket `learn-media`, is still the intended long-term
home. That was the map's decision (#23), and it stands. Until the file is moved
there, doing so is optional.

Moving between hosts is one variable, `MEDIA_BASE_URL`, and no code change. It is
read on the server at runtime, but on Vercel a changed environment variable takes
effect only after a redeploy.

## The 25 MiB cap was Cloudflare's

The film used to be kept out of the deploy. Cloudflare, on Pages and then on Workers,
refuses any single static asset over 25 MiB, and the film is roughly 10 MiB over, so
production had to fetch it from elsewhere. On Pages that took a post-build strip
script, and on Workers `public/.assetsignore`. Both are gone, because the limit does
not apply on Vercel. Older notes and commits that say the film cannot ship in the
bundle are describing Cloudflare.

The committed copy is also what lets local development serve the film with no setup.

## Moving it to Supabase Storage (optional)

`scripts/upload-media.mjs` creates the bucket, uploads the file, checks the
content type that comes back, and prints the value to put in `MEDIA_BASE_URL`:

```bash
npm run media:upload
```

**It needs a Supabase secret key**, because creating a bucket is not something the
anon key can do. The script reads it from `.env.secrets`, which is git-ignored —
`SUPABASE_SECRET_KEY` (the newer `sb_secret_...` form, preferred) or the legacy
`SUPABASE_SERVICE_ROLE_KEY`. Either bypasses row level security entirely, so it
belongs in that file and nowhere else: never in the Vercel project, never in `.env`,
never in a commit.

The bucket is `learn-media`. That is the script's default, and the bucket the
`MEDIA_BASE_URL` example in `.env.example` is written for. `MEDIA_BUCKET` overrides
it; if you override it, make the variable match what the upload actually created, or
the app will point at a bucket that is not there.

Then set `MEDIA_BASE_URL` in the Vercel project (Settings → Environment Variables,
for Production and Preview) and redeploy. Set it only once the object really answers:
pointing the app at a URL that does not serve is the one way to get a dead `<video>`
instead of the film.

## What any host has to do

Three requirements, and a host that fails the first one fails silently:

- **`content-type: video/mp4`.** Not negotiable — see the trap below.
- **HTTP range requests.** Seeking, and the chapter list beside the player, both
  depend on them. A host that answers `200` to a `Range:` request instead of `206`
  forces a full download before playback.
- **CDN caching.** The audience is South African and mostly on phones; a 35 MB file
  served from a single origin is a poor experience on a mobile connection.

Vercel was checked against the first two: it serves `video/mp4`, and answers a range
request with `206`. The third was not measured.

Confirm all of it before pointing the course at a host. Set `MEDIA_BASE_URL` in your
shell to the host's base (for the copy the app ships with, `https://learn.save7.org`),
then:

```bash
curl -s -o /dev/null -D - -H "Range: bytes=0-1023" "$MEDIA_BASE_URL/media/journey-of-a-gift.mp4" | grep -i "^HTTP\|content-type\|content-range\|accept-ranges"
```

Passing looks like `206`, `content-type: video/mp4` and an `accept-ranges: bytes`
header.

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

A second reason applies once the repository is private, as it has to be before
launch (it is public for now; see HANDOVER.md §6): private raw URLs return 404 to
anyone not signed in. Authenticating from a learner's browser would mean putting a
GitHub token in the page.

## Routes that were considered and are not the plan

Both of these appear in older notes and commits. Neither is current:

- **R2** was the original intention — free egress and a real CDN — but it needs a
  payment method on the Cloudflare account. Superseded, and the course no longer uses
  Cloudflare.
- **GitHub Pages**, from an orphan `media` branch, was the interim route while R2
  was blocked. Superseded. GitHub also asks that Pages not be used as a general
  media CDN, and its documented soft limits (a 1 GB site, roughly 100 GB of
  bandwidth a month) are thin cover for a film that might be linked from social
  media.

Supabase Storage is the intended home because the project already exists, it is the
backend anyway, and a public bucket serves correct content types and ranges. Two
things to check rather than assume: the Supabase project's plan, whose free-tier
monthly egress allowance is modest against a 35 MB file, and what Vercel's Hobby plan
allows in transfer while the film is served from the app. Neither has been checked.
Watch both once the course has learners.

## What one variable fixes

`MEDIA_BASE_URL` is applied by `mediaUrl()` in `src/lib/media.ts`, which joins the
base onto a `/media/...` path. It has two states. With the base set, paths under
`/media/` are rewritten to the bucket. With it unset, which is the case today, the
path is returned unchanged and `public/` serves the file. An unedited
`REPLACE_WITH…` placeholder counts as unset. See the comment at the top of that file.

**Nothing calls `mediaUrl()` yet.** `src/lib/media.ts` currently has no importers, and
there is no `<video>` element in `src/`. The prior build had two places that used it,
the Module 5 `ChapterVideo` player and an "Opens here" resource link, and both were
deleted in wayfinder #60. The Stage 3 film's new player is wayfinder #61. Until a
player exists and goes through `mediaUrl()`, setting `MEDIA_BASE_URL` changes nothing
a learner sees.

## Still outstanding for Module 5

Hosting the file does not finish the module:

- a WebVTT captions track and a text transcript — both accessibility requirements
- chapter timecodes measured against the film, so the chapter list beside the
  player can seek instead of only listing
