# Course media

This branch exists to serve one file over GitHub Pages:

    media/journey-of-a-gift.mp4

*The Journey of a Gift* is 35 MB. Cloudflare Pages refuses any single asset over
25 MiB, so the course build strips it out (`scripts/strip-oversized-media.mjs` on
`main`) and the player fetches it from here instead. The app joins the Pages URL
to the `/media/...` path stored in the lesson content, via `MEDIA_BASE_URL`.

**Do not delete or rename this branch or that path** — the live course reads it.

It is an orphan branch: it shares no history with `main` and contains no source
code. That is deliberate. A GitHub Pages site is public, so publishing from `main`
would publish the course's source; publishing from here exposes only the film,
which is meant to be seen.

R2 remains the intended long-term home. See MEDIA-HOSTING.md on `main`.
