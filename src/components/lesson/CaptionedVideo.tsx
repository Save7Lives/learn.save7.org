"use client";

import { useEffect, useRef } from "react";

/**
 * The film's `<video>`, with its captions switched on.
 *
 * This is a client component for one reason: `<track default>` is a hint, and
 * browsers differ in whether they honour it, so the track's mode is set directly
 * once the element exists. Captions are on by default (#58): WCAG 2.x SC 1.2.2
 * (Level A) requires them on prerecorded video, and a transcript alone does not
 * meet it. A learner can still turn them off from the player's own controls.
 *
 * Every URL arrives resolved from the server (`mediaUrl()`), so `MEDIA_BASE_URL`
 * is read per request and is never baked into the client bundle.
 *
 * `preload="none"` plus a poster means nothing of the 36 MB is fetched until the
 * learner presses play. Much of this audience is on metered mobile data, so
 * downloading the film should be a choice (#23).
 *
 * `crossOrigin` is required for the captions: a text track is always fetched in
 * CORS mode, and when the bucket host is another origin it must answer with
 * `access-control-allow-origin`. `npm run media:upload` checks that it does.
 */
export function CaptionedVideo({
  src,
  type,
  poster,
  captionsSrc,
  captionsLang,
  captionsLabel,
  title,
}: {
  src: string;
  type: string;
  poster: string;
  captionsSrc: string;
  captionsLang: string;
  captionsLabel: string;
  title: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const showCaptions = () => {
      for (const track of Array.from(video.textTracks)) {
        if (track.kind === "captions") track.mode = "showing";
      }
    };

    showCaptions();
    video.textTracks.addEventListener("addtrack", showCaptions);
    return () => video.textTracks.removeEventListener("addtrack", showCaptions);
  }, []);

  return (
    <video
      ref={ref}
      controls
      playsInline
      preload="none"
      crossOrigin="anonymous"
      poster={poster}
      title={title}
      className="aspect-video w-full bg-ink"
    >
      <source src={src} type={type} />
      <track
        kind="captions"
        src={captionsSrc}
        srcLang={captionsLang}
        label={captionsLabel}
        default
      />
      Your browser cannot play this video. The transcript below has everything it says.
    </video>
  );
}
