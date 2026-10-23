import { PortalCard } from "@/components/portal/Portal";
import { Display } from "@/components/ui/primitives";

/**
 * "Join the Save7 community" on the landing page (T94), the only place the invite
 * appears. Shown to everyone, signed in or not: no completion check, no stored flag.
 * The one pink button on the page stays in the closing band, so this one is the
 * navy-outline secondary on a teal-50 card.
 *
 * TEMPORARY: the "Join on WhatsApp" button is removed for now. To restore it, put
 * back the `href` prop and the `ButtonLink` (target="_blank", variant="secondary").
 */
export function CommunityBand() {
  return (
    <section className="pt-14 min-[760px]:pt-[4.75rem]">
      <div className="mx-auto max-w-[73.75rem] px-[1.125rem] min-[760px]:px-6">
        <PortalCard
          plain
          tone="teal"
          className="flex flex-wrap items-center justify-between gap-x-8 gap-y-[1.125rem] rounded-3xl p-6 min-[760px]:px-9 min-[760px]:py-8"
        >
          <div className="max-w-[56ch]">
            <Display as="h2" className="text-[1.375rem] font-bold leading-tight tracking-normal text-navy">
              Join the Save7 community
            </Display>
            <p className="mt-1.5 text-grey">
              Ready to do more than learn? Join the Save7 WhatsApp community to meet
              the people spreading the word about organ donation, and to hear about
              ways to get involved.
            </p>
          </div>
        </PortalCard>
      </div>
    </section>
  );
}
