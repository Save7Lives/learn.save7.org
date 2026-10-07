import { CaptionedVideo } from "@/components/lesson/CaptionedVideo";
import { filmFor } from "@/lib/films";
import { mediaUrl } from "@/lib/media";

/**
 * A lesson's film: the player, the note on where the film and the course differ,
 * and the transcript.
 *
 * The lesson names the film by registry key (`learn_lessons.component_key`, from
 * the `video:` front-matter field). The key is resolved through `src/lib/films.ts`
 * and nothing else, so content can't name a URL, and a key that is not registered
 * renders nothing rather than failing the Stage.
 *
 * Why the note is here and not in the lesson's prose (#58): it is a set of facts
 * about this film. Two of the three would make a learner answer a Stage Quiz item
 * wrongly, and the transcript is shown exactly as spoken, errors included, because
 * the note covers them.
 */
export function LessonFilm({ filmKey }: { filmKey: string | null | undefined }) {
  const film = filmFor(filmKey);
  if (!film) return null;

  const video = mediaUrl(film.video.src);
  const poster = mediaUrl(film.poster.src);
  const captions = mediaUrl(film.captions.src);
  if (!video || !poster || !captions) return null;

  const minutes = Math.round(film.durationSeconds / 60);
  // Decimal megabytes: it is what a mobile data bundle counts in.
  const megabytes = Math.round(film.sizeBytes / 1_000_000);

  return (
    <figure className="mb-8 overflow-hidden rounded-card border border-sand-200 bg-white">
      <CaptionedVideo
        src={video}
        type={film.video.type}
        poster={poster}
        captionsSrc={captions}
        captionsLang={film.captions.srclang}
        captionsLabel={film.captions.label}
        title={film.title}
      />

      <figcaption className="p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-sand-600">
          Watch · {minutes} minutes · {megabytes} MB
        </p>
        <p className="mt-1 font-bold text-ink">{film.title}</p>
        <p className="mt-1 text-sm text-sand-600">
          It downloads only when you press play, and captions are on. The film
          reinforces all three Stages in this Level.
        </p>

        <div role="note" className="mt-4 rounded-xl border border-review/30 bg-review-soft p-4">
          <h3 className="text-sm font-bold text-ink">Where the film and this course differ</h3>
          <p className="mt-1 text-sm text-sand-700">
            Three details in the film don&apos;t match what this course teaches. Go with
            the course: it follows the sources, and so does the Stage Quiz.
          </p>
          <ul className="mt-3 space-y-2">
            {film.corrections.map((c) => (
              <li key={c.course} className="text-sm text-sand-700">
                The film says <em>{c.film}</em>. The course says{" "}
                <strong className="text-ink">{c.course}</strong>. {c.why}
              </li>
            ))}
          </ul>
        </div>

        <details className="mt-4">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-pink-600 underline">
            Read the transcript
          </summary>
          <div
            role="region"
            aria-label={`Transcript of ${film.title}`}
            tabIndex={0}
            className="prose-save7 mt-2 max-h-96 overflow-y-auto rounded-xl border border-sand-200 p-4 text-sm"
          >
            {film.transcript.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </details>
      </figcaption>
    </figure>
  );
}
