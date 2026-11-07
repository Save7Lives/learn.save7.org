import type { ReactNode } from "react";
import { Display } from "@/components/ui/primitives";
import { GiftCircles, QuoteMark } from "./CourseArt";

/**
 * The landing page's hero (prototype D): centred on the white page, with the gift
 * drawing as its focal point and no blobs. The course's full name sits under the title
 * rather than above it as an eyebrow.
 *
 * It arrives with the drawing gathering in (GiftCircles), then the two words of the
 * title rise out of a blur one after the other, then the rest rises (prototype A,
 * zubayr-prototypes-hero). All CSS (globals.css, `.gift-*`), so it plays on first
 * paint before any JavaScript, and none of it runs for reduced motion. Screen readers
 * get the title whole; the split words are hidden from them.
 */
export function LandingHero({
  lede,
  quote,
  children,
}: {
  lede: ReactNode;
  quote: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto flex max-w-[73.75rem] flex-col items-center overflow-x-clip px-[1.125rem] pb-16 pt-10 text-center min-[760px]:px-6 min-[760px]:pb-24 min-[760px]:pt-14">
      <GiftCircles className="h-auto w-[min(70vw,17rem)] min-[760px]:w-[20rem]" />
      <Display as="h1" className="mt-6 text-hero text-navy">
        <span className="sr-only">Save7 Learn</span>
        <span aria-hidden="true">
          <span className="gift-word inline-block [--w:0]">Save7</span>{" "}
          <span className="gift-word inline-block text-pink [--w:1]">Learn</span>
        </span>
      </Display>
      <p className="gift-rise mt-4 font-display text-lg font-bold text-navy [--rise:1.3s]">
        Organ donation and transplantation awareness course
      </p>
      <div className="gift-rise flex flex-col items-center [--rise:1.45s]">
        <p className="mt-5 max-w-[52ch] text-lg leading-[1.7] text-grey">{lede}</p>
        <figure className="mt-7 flex max-w-[48ch] flex-col items-center gap-3">
          <QuoteMark className="h-6 w-8" />
          <blockquote className="text-[1.1875rem] font-medium leading-[1.55] text-navy">{quote}</blockquote>
        </figure>
        {children}
      </div>
    </section>
  );
}

