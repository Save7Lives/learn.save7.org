/**
 * The corner blob and the teal-and-pink circle pair (#67, #74).
 *
 * Public pages and the Baseline's before-you-start and results screens carry it;
 * a lesson, a question and every other learner screen never do. It is decoration
 * (`aria-hidden`), drawn behind the page's content: the parent is `relative
 * overflow-hidden`, its content is `relative z-10`, and the parent's top padding
 * keeps every line of text clear of the blob, because coloured text is only legal
 * on white, pink-50 and teal-50, never on teal-100.
 */
export function HeroArt() {
  return (
    <div aria-hidden="true" data-hero-art className="pointer-events-none">
      <span className="absolute -right-[150px] -top-[170px] z-0 size-[300px] rounded-full bg-teal-100 sm:-right-[170px] sm:-top-[210px] sm:size-[460px]" />
      <span className="absolute right-[22px] top-[18px] z-0 h-[54px] w-[70px] sm:right-[72px] sm:top-9 sm:h-[84px] sm:w-[110px]">
        <span className="absolute right-0 top-0 size-[42px] rounded-full bg-teal sm:size-[66px]" />
        <span className="absolute bottom-0 left-0 size-6 rounded-full bg-pink sm:size-9" />
      </span>
    </div>
  );
}
