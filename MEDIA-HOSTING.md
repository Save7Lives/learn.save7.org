# The Stage 3 film: its files, where it is served from, and its captions

*The Journey of a Gift* (6:59, 36 MB) opens Beginner Stage 3. This file is the
reference for how it gets there. The decisions behind it are wayfinder #23 (hosting)
and #58 (placement, captions and the note), and #61 built them.

## What a learner sees

At the top of Stage 3's first lesson, above its prose: the player, with its captions
on; the film's length and size, so that 36 MB is a choice on a metered connection
(nothing downloads until play is pressed); a note on the three places where the film
contradicts the course; and the transcript, word for word.

The three places are *over 65* tissue lives (the course says up to fifty), a *state
pathologist* signing off an accidental death (the Forensic Pathology Service
authorises it), and *by law* there is no cost to the family (no cost in practice:
neither the National Health Act nor its regulations says who pays). The first two are
Stage Quiz items the film would answer wrongly.

## How the film gets from a file to a page

1. **`content/beginner/how-donation-works/intro.md`** has `video: journey-of-a-gift`
   in its front matter.
2. **`loadLesson()`** accepts only a key that is registered in `src/lib/films.ts`.
   A URL, a path or an unknown name fails the content build, so content can't name a
   URL.
3. **`emit-supabase-content.ts`** writes the key to `learn_lessons.component_key`,
   the one use that column has had since #58 retired the interactive components. Its
   probe asserts that exactly the registered keys are present.
4. **`LessonFilm`** reads the key from the lesson row and looks it up in the registry.
   A missing or unregistered key renders no film and never fails the Stage.

Everything the page shows lives in the registry, in typed code: the three file paths,
the title, length and size, the captions track, the transcript and the corrections.

## The files, and why their names are permanent

```
public/media/journey-of-a-gift.5e5b3bab.mp4       the film, unedited (36,239,535 bytes)
public/media/journey-of-a-gift.91c4e4f6.jpg       the title card at one second, the poster
public/media/journey-of-a-gift.en.9cfe81c6.vtt    the captions (WebVTT)
```

**Each name carries the first eight hex characters of the SHA-256 of its bytes.** The
files are served with a one-year cache (#23), so a corrected file that kept its name
would be served stale from every cache that held it. `npm run media:check` fails if a
name and its contents disagree, and CI runs it. It also checks that the registry's
size and duration are the file's, that the cues are in order and inside the film, and
that **the captions' words are the transcript's words, in order**.

**To change any file:** put the new one in `public/media/` under its new hash, point
`src/lib/films.ts` at it, and run `npm run media:check`. Never edit a file and keep
its name. Upload the new file with `npm run media:upload`. The old object can stay in
the bucket, because a deployed page may still be pointing at it.

## Where it is served from

`src/lib/media.ts` has two states, and `mediaUrl()` is the only thing that chooses:

| `MEDIA_BASE_URL` | The film is served from |
| --- | --- |
| unset | the app itself, from `public/media`, same origin. Vercel serves it as `video/mp4` and answers range requests |
| set | the Supabase Storage bucket `learn-media`, at `<base>/media/<file>` |

The map settled the bucket as the long-term home (#23), and the same-origin copy is
what works before it exists and in local development. Nothing about the page changes
between the two.

### Moving it to the bucket

**1. Upload.** This needs a Supabase secret key, so it is a command you run:

```bash
cd "/Users/zubayrparak/Desktop/Save7 Course/transplant-alchemy" && npm run media:upload
```

The key goes in `.env.secrets` (git-ignored) as `SUPABASE_SECRET_KEY=sb_secret_...`
or the legacy `SUPABASE_SERVICE_ROLE_KEY=eyJ...`, from the dashboard's *Settings → API
Keys*. It bypasses row level security entirely: never in `.env`, never in the Vercel
project, never in a commit.

The script:

- refuses to start unless `media:check` passes;
- creates the public bucket `learn-media` if it is missing (50 MB per file, MIME types
  `video/mp4`, `image/jpeg` and `text/vtt`), and leaves the other two buckets alone;
- uploads each file with **`cacheControl: 31536000`** and never overwrites. A name
  that exists must hold the same bytes, or it stops;
- then **proves, against the public URL, what the app depends on**, and exits
  non-zero if any of it fails (the same proofs as `npm run media:verify`).

If a proof about *headers* fails on files that were already there, `npm run
media:upload -- --refresh` sends the same bytes again. That is safe because a name is
the hash of its bytes: it changes what a cache is told about a file, never what the
file is.

**2. What it proves, and why each one matters.** Each of these fails without a sound.

- **`content-type: video/mp4`** (and `image/jpeg`, `text/vtt`). A `<video>` on a wrong
  type shows a dead player with no error.
- **`206` for a range request.** Seeking, and a quick start, both depend on it. A host
  that answers `200` forces a full download first.
- **`cache-control: max-age=31536000`.** The project's default is one hour, which on
  a 36 MB file turns nearly every view into an origin pull and wastes the second 5 GB
  of cached egress (#23). The egress quota is per organisation, shared with Save7 OS's
  own traffic, so there is no headroom to give away.
- **`access-control-allow-origin`.** The captions are fetched cross-origin when the
  film is on the bucket, and a text track the browser may not read never appears. The
  player sets `crossorigin="anonymous"`, so the video needs the header too.

**3. Point the app at it.** The script prints the line. In the Vercel project
(*Settings → Environment Variables*), add it for **Production and Preview**:

```
MEDIA_BASE_URL=https://zbaoziisqroqxfwcnhlb.supabase.co/storage/v1/object/public/learn-media
```

Then **redeploy**: a changed variable reaches a running deployment only that way. Set
it only after step 1 passes. Pointing the app at files that are not there is the one
way to get a dead player where the same-origin copy would have worked.

**4. Check it later.** `npm run media:verify` reads nothing secret and can be run by
anyone, any time the film seems not to play. Pass a base URL to check another host.

## The captions

The words are the transcript in
[T04](https://github.com/Save7Lives/learn.save7.org-map/blob/main/wayfinder/research/T04-video-review-findings.md),
which the user supplied after watching the film. **No wording was written for the
captions.** What was built is the timing, and it was built on 7 October 2026:

1. The audio's word times came from macOS 26's on-device `SpeechAnalyzer`, run over
   the film as committed. The transcript and the recognised words agree on 99.0% of
   tokens (1,267 of 1,280). The 12 places that differ are recogniser errors or
   spelling (`2nd` for *second*, `corneous` for *corneas*, and so on), and the user's
   text was kept every time.
2. The transcript was aligned to those words, and cut at sentence and clause breaks
   into 132 cues of at most two lines of 42 characters, each held about 17 characters
   a second where the next cue allows. The narrator is fast, so 29 cues are shorter
   than that.
3. As a consistency check, each cue's own audio window was recognised again on its
   own. It produced the cue's words, apart from words clipped at the edge of a window and
   the occasional recogniser slip.

That makes the timing good to a few tenths of a second. It is **not the same as a
person listening**, so the captions should be spot-checked against playback by someone
who can hear them. Two spots are worth a listen, where the transcript and the
recogniser disagreed on a real word and nothing could settle it: *"…and I mean
everything that's essential…"* at about **2:15**, where the recogniser heard *in* for
*and*, and *"…the family has given consent"* at about **4:48**, where it heard *is
giving*.

To re-time a new cut: run a recogniser over its audio for word times, align the
transcript to them, regenerate the cues, name the new files for their hashes, and run
`npm run media:check`, which proves the words still match.

### What the captions do not cover

They are what is **said**. The film also shows on-screen text, diagrams and a quote
that the narrator points at (*"this image right here"*, *"this quote"*, *"this
chart"*), and none of that is described anywhere on the page. WCAG 2.x SC 1.2.2
(captions) is met. SC 1.2.3 (Level A), an audio description or a full text alternative
that includes what the pictures show, is not, and nothing has decided it is not
needed. It is an open question for Save7, not something this build settled.

## What any host has to do

Three requirements, and a host that fails the first one fails silently:

- **`content-type: video/mp4`.** Not negotiable.
- **HTTP range requests.**
- **CDN caching.** The audience is South African and mostly on phones.

### `raw.githubusercontent.com` is not a valid host

Measured on 23 August 2026: it serves `.mp4` as `application/octet-stream` with
`x-content-type-options: nosniff`, so the bytes arrive, range requests work, and
nothing plays. Once the repository is private it also returns 404 to anyone not signed
in to GitHub.

### Routes that were considered and are not the plan

- **Cloudflare R2** was the original intention (free egress, a real CDN) but needs a
  payment method on the Cloudflare account, and the course no longer uses Cloudflare.
- **GitHub Pages**, from an orphan `media` branch, was the interim route while R2 was
  blocked. GitHub asks that Pages not be used as a general media CDN, and its soft
  limits are thin cover for a film that might be linked from social media.
- **Cloudflare's 25 MiB per-asset cap** is why the film used to be kept out of the
  deploy. That was Cloudflare's limit, and Vercel has no such cap, which is why the
  film now ships in `public/media`.

Two things were never measured and are worth watching once the course has learners:
the Supabase project's monthly egress against a 36 MB file, and what Vercel's Hobby
plan allows in transfer while the film is served from the app.
