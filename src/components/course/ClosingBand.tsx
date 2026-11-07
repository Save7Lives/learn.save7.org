import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/parts";
import { Display } from "@/components/ui/primitives";

/**
 * The close of the landing page and the course introduction (prototype D): "Ready?" on
 * `pink-50`, as a centred card under the hero pair of circles, with the action below
 * the words.
 */
export function ClosingCard({ text, children }: { text: ReactNode; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-[73.75rem] px-[1.125rem] pb-20 min-[760px]:px-6 min-[760px]:pb-28">
      <Reveal className="mx-auto flex max-w-[36rem] flex-col items-center rounded-[2rem] border border-pink-line bg-pink-50 px-6 py-10 text-center">
        <div aria-hidden="true" className="relative mb-5 h-14 w-20">
          <i className="absolute right-0 top-0 size-12 rounded-full bg-teal" />
          <i className="absolute bottom-0 left-0 size-7 rounded-full bg-pink" />
        </div>
        <Display as="h2" className="text-title font-extrabold text-navy">
          Ready?
        </Display>
        <div className="mt-2 text-grey">{text}</div>
        <div className="mt-6">{children}</div>
      </Reveal>
    </section>
  );
}
