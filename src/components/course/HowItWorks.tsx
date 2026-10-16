import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { PortalCard } from "@/components/portal/Portal";
import { Display, NumberPill } from "@/components/ui/primitives";

/** Four cards, in the order a learner meets them. Wording is the introduction's own. */
const STEPS = [
  {
    title: "A baseline assessment",
    body: "Twenty short questions before you start. This is a baseline, not a test. There is no pass mark and nobody is judged on it.",
  },
  {
    title: "Plain-language lessons",
    body: "Written lessons in plain language, with a table wherever things are easier to compare side by side.",
  },
  {
    title: "A Stage Quiz in every Stage",
    body: "Five questions drawn from a bank of fifteen. Four right passes, and retries are unlimited.",
  },
  {
    title: "A certificate for each level",
    body: "One per level, with a unique ID that can be verified online. Passing every Stage Quiz in a level earns its certificate.",
  },
];

/**
 * "How the course works" on the landing page (#73), replacing "What's included" and
 * the certificate strip. The full list of eight stays on the introduction.
 * Numbered pills alternate pink and teal by position, on a dotted line; two across
 * below 1000px, one on a phone.
 */
export function HowItWorks() {
  return (
    <section id="how" className="pt-14 min-[760px]:pt-[4.75rem]">
      <div className="mx-auto max-w-[73.75rem] px-[1.125rem] min-[760px]:px-6">
        <Display as="h2" className="mb-3 text-[1.5rem] font-bold leading-[1.22] tracking-tight text-navy min-[760px]:text-[1.75rem]">
          How the course works
        </Display>
        {/* Placeholder wording until the copy is signed off (#86). */}
        <p className="mb-2 max-w-[68ch] text-[1.0625rem] leading-[1.7] text-grey">
          Four things happen in the same order every time, so you always know where you are.{" "}
          <Link href="/course/introduction" className="text-teal-ink underline underline-offset-2">
            Read the full course introduction
          </Link>
        </p>

        <ol className="mt-[2.125rem] grid list-none gap-5 p-0 min-[1000px]:grid-cols-4 min-[760px]:grid-cols-2">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className={
                "relative flex flex-col " +
                // The dotted line runs pill to pill, on the four-across layout only.
                (i > 0
                  ? "min-[1000px]:before:absolute min-[1000px]:before:left-[calc(-50%+4px)] min-[1000px]:before:right-[calc(50%+24px)] min-[1000px]:before:top-[15px] min-[1000px]:before:border-t-[3px] min-[1000px]:before:border-dotted min-[1000px]:before:border-line-strong min-[1000px]:before:content-['']"
                  : "")
              }
            >
              <span className="relative mb-3.5 self-center">
                <NumberPill n={i + 1} tone={i % 2 === 0 ? "pink" : "teal"} />
              </span>
              <PortalCard plain className="flex-1 rounded-[1.25rem] p-[1.375rem]">
                <h3 className="font-display text-lg font-bold leading-tight text-navy">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-[0.9375rem] text-grey">{step.body}</p>
              </PortalCard>
            </li>
          ))}
        </ol>

        <p className="mt-[1.375rem] flex max-w-[72ch] items-start gap-2.5 text-[0.9375rem] text-grey">
          <Icon name="clock" className="mt-0.5 size-5 shrink-0 text-teal-ink" />
          <span>
            <strong className="font-medium text-navy">The same baseline, again.</strong> After
            each level you finish, so you can see what changed. It is optional, and it never
            affects a certificate.
          </span>
        </p>
      </div>
    </section>
  );
}
