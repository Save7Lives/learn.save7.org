import { Eyebrow } from "@/components/ui/primitives";
import { CaptionedVideo } from "@/components/lesson/CaptionedVideo";
import { filmFor } from "@/lib/films";
import { mediaUrl } from "@/lib/media";

/**
 * A lesson's film: the player, its caption and the transcript.
 *
 * The lesson names the film by registry key (`learn_lessons.component_key`, from
 * the `video:` front-matter field). The key is resolved through `src/lib/films.ts`
 * and nothing else, so content can't name a URL, and a key that is not registered
 * renders nothing rather than failing the Stage.
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
    // Full width on a phone: no card border or radius, and the page gutter is
    // taken back so the player runs edge to edge (#74). From 40rem it is a card.
    <figure className="-mx-5 mb-7 bg-white sm:mx-0 sm:overflow-hidden sm:rounded-[18px] sm:border sm:border-line">
      <CaptionedVideo
        src={video}
        type={film.video.type}
        poster={poster}
        captionsSrc={captions}
        captionsLang={film.captions.srclang}
        captionsLabel={film.captions.label}
        title={film.title}
      />

      <figcaption className="px-5 pt-4 sm:p-[18px]">
        <Eyebrow className="text-teal-ink">
          Watch · {minutes} minutes · {megabytes} MB
        </Eyebrow>
        <p className="t-h3 mt-1 text-navy">{film.title}</p>
        <p className="mt-1 text-sm text-grey">
          It downloads only when you press play, and captions are on. The film
          reinforces all three Stages in this Level.
        </p>

        <details className="mt-4">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-pink underline">
            Read the transcript
          </summary>
          <div
            role="region"
            aria-label={`Transcript of ${film.title}`}
            tabIndex={0}
            className="prose-save7 mt-2 max-h-96 overflow-y-auto rounded-xl border border-line p-4 text-sm"
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
