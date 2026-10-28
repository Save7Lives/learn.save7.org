import Link from "next/link";
import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/icons";
import { Display } from "@/components/ui/primitives";
import { StepGlyph } from "./CourseArt";

/** Four steps, in the order a learner meets them. Wording is the introduction's own. */
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
 * "How the course works" on the landing page, as a stack (prototype D): each step is a
 * card that sticks a little below the one before as the page scrolls, so the four
 * arrive one at a time and end as a neat pile (globals.css, `.step-stack`). On desktop
 * the heading stays beside them. The full list of eight stays on the introduction.
 */
export function HowItWorks() {
  return (
    <section id="how" className="pb-20 min-[760px]:pb-28">
      <div className="mx-auto grid max-w-[73.75rem] gap-8 px-[1.125rem] min-[760px]:px-6 min-[900px]:grid-cols-[0.8fr_1.2fr] min-[900px]:gap-14">
        <div className="min-[900px]:sticky min-[900px]:top-24 min-[900px]:self-start">
          <Display as="h2" className="text-[1.75rem] font-extrabold leading-[1.1] tracking-tight text-navy min-[760px]:text-[2.75rem]">
            How the course works
          </Display>
          {/* Placeholder wording until the copy is signed off (#86). */}
          <p className="mt-4 text-[1.0625rem] leading-[1.7] text-grey">
            Four things happen in the same order every time, so you always know where you are.{" "}
            <Link href="/course/introduction" className="text-teal-ink underline underline-offset-4">
              Read the full course introduction
            </Link>
          </p>
          <p className="mt-6 flex items-start gap-3 text-[0.9375rem] text-grey">
            <Icon name="refresh" className="mt-0.5 size-5 shrink-0 text-teal-ink" />
            <span>
              <strong className="font-medium text-navy">The same baseline, again.</strong> After each
              level you finish, so you can see what changed. It is optional, and it never affects a
              certificate.
            </span>
          </p>
        </div>

        <ol className="step-stack grid list-none gap-5 p-0">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              style={{ "--i": i } as CSSProperties}
              className="flex min-h-[13rem] gap-5 rounded-[1.75rem] border border-line bg-white p-6 shadow-[0_10px_30px_-12px_rgba(12,23,59,0.18)] min-[760px]:p-8"
            >
              <span className="grid size-16 shrink-0 place-items-center rounded-2xl border border-teal-line bg-teal-50">
                <StepGlyph index={i} className="size-9" />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-teal-ink">Step {i + 1} of 4</p>
                <h3 className="mt-1 font-display text-2xl font-bold leading-tight text-navy">{step.title}</h3>
                <p className="mt-2 text-grey">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
