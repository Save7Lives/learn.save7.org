/**
 * PROTOTYPE (T58), throwaway. The one media primitive variants A and B share.
 *
 * A plain first-party <video>, as #23 settled, with two things beside it that any
 * variant needs before the film can ship:
 *
 * - the three places the film says something the course has corrected, because
 *   two of them are Stage Quiz items it would answer wrongly;
 * - a transcript, because there is no captions track yet.
 *
 * Server component: the transcript is a <details>, so nothing here needs client JS.
 */
import { mediaUrl } from "@/lib/media";
import { FILM, FILM_CORRECTIONS, TRANSCRIPT } from "./film";

export function LessonVideo({ lead }: { lead?: string }) {
  const src = mediaUrl(FILM.src);

  return (
    <figure className="overflow-hidden rounded-card border border-sand-200 bg-white">
      {src ? (
        <video
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full bg-ink"
          src={src}
        >
          Your browser cannot play this video.
        </video>
      ) : (
        <div className="grid aspect-video w-full place-items-center bg-ink text-sm text-cream/70">
          Not hosted yet
        </div>
      )}

      <figcaption className="p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-sand-500">
          Watch · 7 minutes
        </p>
        <p className="mt-1 font-bold text-ink">{FILM.title}</p>
        {lead ? <p className="mt-1 text-sm text-sand-600">{lead}</p> : null}

        <div className="mt-4 rounded-xl border border-review/30 bg-review-soft p-4">
          <p className="text-sm font-bold text-ink">Where the film and this course differ</p>
          <p className="mt-1 text-sm text-sand-600">
            Three details in the film don&apos;t match what this course teaches.
            Go with the course: it follows the sources, and so does the Stage Quiz.
          </p>
          <ul className="mt-3 space-y-2">
            {FILM_CORRECTIONS.map((c) => (
              <li key={c.course} className="text-sm text-sand-700">
                The film says <em>{c.film}</em>. The course says{" "}
                <strong className="text-ink">{c.course}</strong>. {c.why}
              </li>
            ))}
          </ul>
        </div>

        <details className="mt-4 group">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-pink-600 underline">
            Read the transcript
          </summary>
          <div className="prose-save7 mt-2 max-h-96 overflow-y-auto rounded-xl border border-sand-200 p-4 text-sm">
            {TRANSCRIPT.split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </details>
      </figcaption>
    </figure>
  );
}
