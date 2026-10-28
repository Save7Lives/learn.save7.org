import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/parts";
import { PortalCard } from "@/components/portal/Portal";
import { Display } from "@/components/ui/primitives";

/** The closing "Ready?" band, on `pink-50`. `children` is the action: the page's one pink button. */
export function ClosingBand({ text, children }: { text: ReactNode; children: ReactNode }) {
  return (
    <section className="pt-14 min-[760px]:pt-[4.75rem]">
      <div className="mx-auto max-w-[73.75rem] px-[1.125rem] min-[760px]:px-6">
        <PortalCard
          plain
          tone="pink"
          className="flex flex-wrap items-center justify-between gap-x-8 gap-y-[1.125rem] rounded-3xl p-6 min-[760px]:px-9 min-[760px]:py-8"
        >
          <div>
            <Display as="h2" className="text-[1.375rem] font-bold leading-tight tracking-normal text-navy">
              Ready?
            </Display>
            <div className="mt-1.5 text-grey">{text}</div>
          </div>
          {children}
        </PortalCard>
      </div>
    </section>
  );
}

/**
 * The landing page's close (prototype D): the same "Ready?" on `pink-50`, as a centred
 * card under the hero pair of circles, with the action below the words.
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
