import type { ReactNode } from "react";
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
