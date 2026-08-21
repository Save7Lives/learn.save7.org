# Hosting the Module 5 video on GitHub Pages

`journey-of-a-gift.mp4` is 35 MB. Cloudflare Pages refuses any single asset over
25 MiB, so the build strips the file out (`scripts/strip-oversized-media.mjs`) and
production has to fetch it from somewhere else. R2 is the intended long-term home,
but it needs a payment method on the Cloudflare account, so GitHub serves the file
in the meantime.

Moving between hosts is one environment variable. No code changes.

> Two different products called Pages appear below. **Cloudflare Pages** hosts the
> course. **GitHub Pages** hosts this one video file. They are unrelated.

## Use GitHub Pages, not raw.githubusercontent.com

This matters, because raw is the obvious thing to try and it does not work.
Measured on 21 August 2026:

| Host | Content-Type | Ranges | Plays in `<video>`? |
| ---- | ------------ | ------ | ------------------- |
| `raw.githubusercontent.com` | `application/octet-stream` + `x-content-type-options: nosniff` | yes | **No** |
| GitHub Pages (`*.github.io`) | `video/mp4` | yes | Yes |

`nosniff` tells the browser not to second-guess the declared type, so an
`application/octet-stream` response is treated as a file to download rather than a
video to play. The `<video>` element fails silently — no error, just a dead player.
GitHub Pages serves the same bytes with the correct type.

Two other routes were considered and not used: **release assets** are served with
download semantics rather than inline playback (untested here, so confirm before
relying on it), and **jsDelivr** caps per-file size well below 35 MB and only
serves public repositories.

## The repository must be public

The course repository is private, and private repositories return 404 to anyone not
signed in — verified against this repo's own raw URL. The only way to authenticate
such a request from a learner's browser would be to put a GitHub token in the page,
which is not an option.

So the video goes in a **separate, public, media-only repository**. The course code
stays private; the only thing published is a film that is meant to be seen.

## Setting it up

1. Create a new **public** repository on GitHub — `save7-media` below. It contains
   no code, so it needs no description and no licence.

2. Push the video into it at the path `media/journey-of-a-gift.mp4`. The path
   matters: `MEDIA_BASE_URL` is joined to the `/media/...` path already stored in
   the lesson content, so the file has to sit under `media/`.

   Note that GitHub's *web* uploader rejects files over 25 MB, so this has to be a
   `git push`, not a drag-and-drop.

3. In that repository: **Settings → Pages → Build and deployment → Deploy from a
   branch**, branch `main`, folder `/ (root)`. The first publish takes a minute or
   two.

4. Confirm it is really serving video before pointing the course at it:

   ```
   curl -sI https://<owner>.github.io/save7-media/media/journey-of-a-gift.mp4 \
     | grep -i "content-type\|content-length"
   ```

   It must say `content-type: video/mp4`. If it says `text/html`, Pages has not
   finished publishing, or the path is wrong.

5. Then set the variable in `wrangler.jsonc` under `vars` and deploy:

   ```
   "MEDIA_BASE_URL": "https://<owner>.github.io/save7-media"
   ```

   No trailing slash. Add it to `env.preview.vars` too if preview deployments
   should show the video; without it, previews render the placeholder.

A `.nojekyll` file in the media repository root is harmless and skips Jekyll
processing, which the site does not need.

## What this fixes

One variable covers both places the file appears:

- the Module 5 player (`ChapterVideo`, from the lesson payload)
- the "Opens here" resource link on the same module

Both resolve through `mediaUrl()` in `src/lib/media.ts`. With the variable unset,
that function deliberately drops the path so the player shows its "not hosted yet"
state instead of a `<video>` that fails — see the comment at the top of that file.

## Honest limits

GitHub Pages is documented as a host for project sites, and GitHub asks that it not
be used as a general media CDN. Its documented soft limits are a 1 GB site and
roughly 100 GB of bandwidth a month — about 2,800 complete plays of a 35 MB file.
That is comfortable for a course being introduced to a few hundred learners, and
not a sound place to be if the film is ever linked from social media.

Two better homes, when either becomes available:

- **R2**, the original plan: free egress, a real CDN, one variable away.
- **Supabase Storage**, now that Supabase is the backend anyway — a public bucket
  serves correct content types and ranges. Check the project's plan first: the free
  tier's monthly egress allowance is well below GitHub Pages'.

Treat GitHub Pages as the arrangement that gets Module 5 working now.

## Still outstanding for Module 5

Hosting the file does not finish the module. Recorded in the course content and
unchanged by this:

- a WebVTT captions track and a text transcript — both accessibility requirements
- chapter timecodes measured against the film, so the chapter list beside the
  player can seek instead of only listing
