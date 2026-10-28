import type { ReactNode } from "react";
import { Display } from "@/components/ui/primitives";
import { GiftCircles, QuoteMark } from "./CourseArt";

/**
 * The landing page's hero (prototype D): centred on the white page, with the gift
 * drawing as its focal point and no blobs. The course's full name sits under the title
 * rather than above it as an eyebrow. The introduction keeps PublicHero.
 *
 * The drawing, the title and the rest rise in one after another. That is CSS, so it
 * plays on first paint, before any JavaScript, and never hides anything from the server.
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
    <section className="mx-auto flex max-w-[73.75rem] flex-col items-center px-[1.125rem] pb-16 pt-10 text-center min-[760px]:px-6 min-[760px]:pb-24 min-[760px]:pt-14">
      <GiftCircles className="animate-rise h-auto w-[min(70vw,17rem)] min-[760px]:w-[20rem]" />
      <Display as="h1" className="animate-rise mt-6 text-hero text-navy [animation-delay:90ms]">
        Save7 <span className="text-pink">Learn</span>
      </Display>
      <p className="animate-rise mt-4 font-display text-lg font-bold text-navy [animation-delay:150ms]">
        Organ donation and transplantation awareness course
      </p>
      <div className="animate-rise flex flex-col items-center [animation-delay:220ms]">
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
