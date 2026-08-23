# Hosting the Module 5 video

`journey-of-a-gift.mp4` is 35 MB. Cloudflare Pages refuses any single asset over
25 MiB, so the build strips the file out (`scripts/strip-oversized-media.mjs`) and
production fetches it from elsewhere. R2 is the intended long-term home, but it
needs a payment method on the Cloudflare account, so GitHub serves it meanwhile.

Moving between hosts is one environment variable. No code changes.

> Two different products called Pages appear below. **Cloudflare Pages** hosts the
> course. **GitHub Pages** hosts this one video file. They are unrelated.

## Where the file is

The video has been committed to this repository since the first commit, at
`public/media/journey-of-a-gift.mp4` — that is what lets local development play it
with no setup. It is *also* on the orphan **`media` branch**, at
`media/journey-of-a-gift.mp4`, which is the copy GitHub Pages serves. Both point at
the same git blob, so the branch costs no extra space.

The branch is an orphan — no shared history, no source code — because a GitHub
Pages site is public. Publishing from `main` would publish the course's source;
publishing from `media` exposes only the film, which is meant to be seen.

## Turning it on

**Settings → Pages → Build and deployment → Deploy from a branch**, branch
`media`, folder `/ (root)`. First publish takes a minute or two.

**This repository is private, and GitHub Pages on a private repository requires a
paid plan** (Pro, Team or Enterprise). On a free personal account the Pages
settings will refuse. If that is what you see, two ways forward:

- upgrade the account to GitHub Pro, or
- push the `media` branch to a small **public** repository instead and publish
  Pages from there. Same file, same layout, same variable — only the hostname
  changes. The course repository stays private either way.

Then confirm it is really serving video before pointing the course at it:

```
curl -sI https://zzubyr7x.github.io/transplant-alchemy/media/journey-of-a-gift.mp4 \
  | grep -i "content-type\|content-length"
```

It must say `content-type: video/mp4`. `text/html` means Pages has not finished
publishing, or the path is wrong.

Finally, uncomment `MEDIA_BASE_URL` in `wrangler.jsonc` and deploy. It is read at
runtime, so it needs a deploy but not a rebuild.

## Use GitHub Pages, not raw.githubusercontent.com

This matters, because raw is the obvious thing to try and it does not work.
Measured on 23 August 2026:

| Host | Content-Type | Ranges | Plays in `<video>`? |
| ---- | ------------ | ------ | ------------------- |
| `raw.githubusercontent.com` | `application/octet-stream` + `x-content-type-options: nosniff` | yes | **No** |
| GitHub Pages (`*.github.io`) | `video/mp4` | yes | Yes |

`nosniff` tells the browser not to second-guess the declared type, so an
`application/octet-stream` response is treated as a file to download rather than a
video to play. The `<video>` element fails silently — no error, just a dead player.
GitHub Pages serves the same bytes with the correct type.

Raw URLs are unusable for a second reason anyway: this repository is private, and
private raw URLs return 404 to anyone not signed in. Authenticating from a
learner's browser would mean putting a GitHub token in the page.

Two other routes were considered and not used: **release assets** are served with
download semantics rather than inline playback (untested here, so confirm before
relying on it), and **jsDelivr** caps per-file size well below 35 MB and serves
public repositories only.

## What one variable fixes

`MEDIA_BASE_URL` covers both places the file appears:

- the Module 5 player (`ChapterVideo`, from the lesson payload)
- the "Opens here" resource link on the same module

Both resolve through `mediaUrl()` in `src/lib/media.ts`, which joins the base to
the `/media/...` path stored in the lesson content. With the variable unset, that
function deliberately drops the path so the player shows its "not hosted yet" state
instead of a `<video>` that fails — see the comment at the top of that file.

## Honest limits

GitHub asks that Pages not be used as a general media CDN. Its documented soft
limits are a 1 GB site and roughly 100 GB of bandwidth a month — about 2,800
complete plays of a 35 MB file. Comfortable for a course being introduced to a few
hundred learners; not a sound place to be if the film is ever linked from social
media.

Two better homes, when either becomes available:

- **R2**, the original plan: free egress, a real CDN, one variable away.
- **Supabase Storage**, now that Supabase is the backend anyway — a public bucket
  serves correct content types and ranges. Check the project's plan first: the free
  tier's monthly egress allowance is well below GitHub Pages'.

## Still outstanding for Module 5

Hosting the file does not finish the module:

- a WebVTT captions track and a text transcript — both accessibility requirements
- chapter timecodes measured against the film, so the chapter list beside the
  player can seek instead of only listing
