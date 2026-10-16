import type { ReactNode } from "react";
import { Display, Eyebrow } from "@/components/ui/primitives";
import { HeroDecoration } from "./HeroDecoration";

/**
 * The hero of a public page (#73): light, on the white page, with the blobs and the
 * circle pair behind it. No navy surface. The copy is held to 58% of the width on
 * desktop so no text ever sits on a blob, and runs full width on a phone, where the
 * big blob and the pair are hidden.
 */
export function PublicHero({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-white pb-[3.25rem] pt-11 min-[760px]:pb-[5.25rem] min-[760px]:pt-[4.75rem]">
      <HeroDecoration />
      <div className="relative z-10 mx-auto max-w-[73.75rem] px-[1.125rem] min-[760px]:px-6">
        <div className="max-w-none min-[760px]:max-w-[min(620px,58%)]">
          <Eyebrow className="text-pink">{eyebrow}</Eyebrow>
          <Display as="h1" className="mb-[1.375rem] mt-3.5 text-display text-navy">
            {title}
          </Display>
          {children}
        </div>
      </div>
    </section>
  );
}

/** The lede under a hero title. */
export function Lede({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={`mb-[1.125rem] max-w-[56ch] text-lg leading-[1.7] text-grey ${className ?? ""}`}>
      {children}
    </p>
  );
}

/** The Save7 quote: on `teal-50` with a 4px teal bar. */
export function HeroQuote({ children }: { children: ReactNode }) {
  return (
    <blockquote className="mb-7 max-w-[56ch] rounded-r-[0.875rem] border-l-4 border-teal bg-teal-50 px-5 py-4 text-[1.0625rem] font-medium leading-[1.6] text-navy">
      {children}
    </blockquote>
  );
}
