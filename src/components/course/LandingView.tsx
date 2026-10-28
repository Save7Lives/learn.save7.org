import Link from "next/link";
import { ButtonLink, Display } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/parts";
import type { LevelWithPosition } from "@/lib/course";
import { ClosingCard } from "./ClosingBand";
import { HowItWorks } from "./HowItWorks";
import { LandingHero } from "./LandingHero";
import { LevelRoute } from "./LevelRoute";

/**
 * The landing page (#73), redesigned as prototype D on zubayr-prototypes-ui: a centred
 * hero with the gift drawing, the Levels as one route, the four steps as a stack, the
 * ten questions as a checklist, and a centred closing card. Same sections, same order,
 * same words. Takes plain data so the page stays a thin loader and every state
 * (signed out, a new Student, mid-course) can be rendered without a session.
 */
export function LandingView({
  levels,
  currentLevelSlug,
  signedIn,
  baselinePending,
}: {
  levels: LevelWithPosition[];
  /** The Level the Student is on, from their Course Position; null once all are complete. */
  currentLevelSlug: string | null;
  signedIn: boolean;
  /** Signed in and the first Baseline Sitting not yet done. */
  baselinePending: boolean;
}) {
  // Recommend the Level they are on, so the Level that carries the pink CTA is always
  // the genuinely useful one. Once every Level is complete, the first.
  const recommendedSlug = currentLevelSlug ?? levels[0]?.slug;

  return (
    <>
      <LandingHero
        lede={
          <>
            Some people join Save7 already understanding the transplant landscape in
            South Africa. Others have never been exposed to the organ donation crisis.
            What everyone has in common is a passion for educating others.
          </>
        }
        quote={
          <>
            Whether it is for an awareness campaign or a private conversation with family
            and friends, the most important part is simply starting the conversation.
          </>
        }
      >
        <div className="mt-8 flex w-full flex-col items-stretch gap-3 min-[480px]:w-auto min-[480px]:flex-row min-[480px]:justify-center">
          <ButtonLink href={signedIn ? "#levels" : "/register"} size="lg" variant="primary">
            {signedIn ? "Choose your level" : "Start the course"}
          </ButtonLink>
          <ButtonLink href="/course/introduction" size="lg" variant="secondary">
            How the course works
          </ButtonLink>
        </div>

        {baselinePending ? (
          <p className="mt-[1.125rem] max-w-[52ch] text-sm text-grey">
            Before your first Stage we&apos;ll ask you 20 quick questions. After each
            level you can answer the same 20 again, so you can see how much you&apos;ve
            learned.
          </p>
        ) : null}
      </LandingHero>

      <LevelRoute
        levels={levels}
        recommendedSlug={recommendedSlug}
        signedIn={signedIn}
        intro={
          <p>
            We recommend completing the levels in order, but you can choose where you
            begin based on what you already know.{" "}
            <strong className="font-medium text-navy">
              Each level is a complete achievement with its own certificate.
            </strong>{" "}
            You are not expected to finish all three to be an informed advocate.
          </p>
        }
      />

      <HowItWorks />

      {/* --- The ten questions, as a checklist whose ticks draw in ------------ */}
      <section className="pb-20 min-[760px]:pb-28">
        <div className="mx-auto max-w-[73.75rem] px-[1.125rem] min-[760px]:px-6">
          <Display as="h2" className="text-[1.75rem] font-extrabold leading-[1.1] tracking-tight text-navy min-[760px]:text-[2.75rem]">
            By the end, you&apos;ll be able to answer
          </Display>
          <ul className="mt-8 grid list-none gap-x-10 p-0 min-[760px]:grid-cols-2">
            {[
              "Who needs organs?",
              "Why are organs being lost?",
              "What is brain death?",
              "How does donation work?",
              "Who is involved?",
              "What does South African law say?",
              "Who can donate?",
              "Who decides, and how is consent given?",
              "How do I talk about donation?",
              "How can I become part of the solution?",
            ].map((q) => (
              <Reveal as="li" key={q} className="flex items-center gap-4 border-b border-line py-4 text-lg font-medium text-navy">
                <svg viewBox="0 0 28 28" aria-hidden="true" className="tick-draw size-7 shrink-0">
                  <circle cx="14" cy="14" r="13" className="fill-teal-50 stroke-teal-line" strokeWidth="1" />
                  <path d="m8.5 14.5 3.5 3.5 7.5-8" pathLength={1} fill="none" className="stroke-teal-ink" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {q}
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <ClosingCard
        text={
          signedIn ? (
            "Pick up wherever you left off."
          ) : (
            <>
              Already started?{" "}
              <Link href="/login" className="font-medium text-navy underline underline-offset-2">
                Sign in
              </Link>
            </>
          )
        }
      >
        <ButtonLink href={signedIn ? "#levels" : "/register"} size="lg">
          {signedIn ? "Choose your level" : "Create your account"}
        </ButtonLink>
      </ClosingCard>
    </>
  );
}
