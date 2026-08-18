"use client";

import { useRef, useState } from "react";
import { Badge, Card, cx } from "@/components/ui/primitives";
import type { ChapterVideoPayload } from "@/lib/lesson-payloads";

/**
 * The Journey of a Gift, with chapter markers.
 *
 * The brief is explicit that the video must not be "embedded as an isolated
 * resource", so the chapters are a first-class navigation list beside the player:
 * the film becomes the spine of the module rather than an attachment to it.
 *
 * Save7 has not supplied the file yet. Rather than a broken player, the component
 * renders an honest placeholder that still shows the chapter structure, so the
 * module is reviewable now and the asset drops in later with no code change. The
 * captions and transcript requirements are stated on screen because they are
 * accessibility blockers, not nice-to-haves.
 */
export function ChapterVideo({ payload }: { payload: ChapterVideoPayload }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const hasVideo = Boolean(payload.src) && !payload.awaitingAsset;
  // Every chapter start is 0 until Save7 supplies real timecodes; seeking would be
  // misleading, so chapter clicks only highlight until then.
  const hasTimecodes = (payload.chapters ?? []).some((c) => c.startSeconds > 0);

  function jumpTo(chapterId: string, seconds: number) {
    setActiveChapter(chapterId);
    if (hasVideo && hasTimecodes && videoRef.current) {
      videoRef.current.currentTime = seconds;
      void videoRef.current.play();
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div>
        {hasVideo ? (
          <video
            ref={videoRef}
            controls
            playsInline
            poster={payload.poster}
            className="aspect-video w-full rounded-card bg-ink"
          >
            <source src={payload.src} />
            {payload.captionsSrc ? (
              <track
                kind="captions"
                src={payload.captionsSrc}
                srcLang="en"
                label="English"
                default
              />
            ) : null}
            Your browser cannot play this video.
          </video>
        ) : (
          <div className="grid aspect-video w-full place-items-center rounded-card border-2 border-dashed border-sand-300 bg-ink/95 p-6 text-center">
            <div>
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
                className="mx-auto text-teal"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
              </svg>
              <p className="mt-4 font-display text-2xl text-cream">{payload.title}</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-cream/60">
                Save7&apos;s video has not been supplied yet. The chapter structure
                beside this player is what the module is built around, and the film
                drops straight in when it arrives.
              </p>
            </div>
          </div>
        )}

        {!hasVideo ? (
          <Card className="mt-4 border-review/30 bg-review-soft p-4">
            <Badge tone="review">Needed before launch</Badge>
            <ul className="mt-3 space-y-1.5 text-sm text-sand-700">
              <li>· The video file, or a hosted URL</li>
              <li>· A WebVTT captions track — required for accessibility</li>
              <li>· A text transcript, for anyone who cannot use video at all</li>
              <li>· Chapter timecodes, to make the list beside this player seekable</li>
            </ul>
          </Card>
        ) : null}

        {payload.transcript ? (
          <div className="mt-4">
            <button
              type="button"
              aria-expanded={showTranscript}
              aria-controls="video-transcript"
              onClick={() => setShowTranscript((v) => !v)}
              className="text-sm font-semibold text-pink-600 underline"
            >
              {showTranscript ? "Hide transcript" : "Read the transcript"}
            </button>
            <div
              id="video-transcript"
              hidden={!showTranscript}
              className="prose-save7 mt-3 max-h-96 overflow-y-auto rounded-xl border border-sand-200 bg-white p-4 text-sm"
            >
              {payload.transcript}
            </div>
          </div>
        ) : null}
      </div>

      {payload.chapters?.length ? (
        <nav aria-label="Video chapters">
          <h3 className="text-xs font-bold uppercase tracking-wider text-sand-500">
            The journey, chapter by chapter
          </h3>
          <ol className="mt-3 space-y-1">
            {payload.chapters.map((chapter, i) => {
              const isActive = activeChapter === chapter.id;
              return (
                <li key={chapter.id}>
                  <button
                    type="button"
                    onClick={() => jumpTo(chapter.id, chapter.startSeconds)}
                    aria-current={isActive ? "true" : undefined}
                    className={cx(
                      "flex min-h-11 w-full items-baseline gap-3 rounded-lg px-3 py-2 text-left transition",
                      isActive ? "bg-pink-50 text-ink" : "hover:bg-sand-100",
                    )}
                  >
                    <span className="font-display text-sm text-pink-300">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1">
                      <span
                        className={cx(
                          "block text-sm",
                          isActive ? "font-bold text-ink" : "font-medium text-sand-700",
                        )}
                      >
                        {chapter.label}
                      </span>
                      {chapter.summary ? (
                        <span className="mt-0.5 block text-xs text-sand-500">
                          {chapter.summary}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          {!hasTimecodes ? (
            <p className="mt-3 px-3 text-xs italic text-sand-400">
              Chapters become seekable once Save7 supplies timecodes.
            </p>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
