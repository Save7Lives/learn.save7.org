import Link from "next/link";
import { ButtonLink, Display } from "@/components/ui/primitives";
import type { LevelWithPosition } from "@/lib/course";
import { ClosingBand } from "./ClosingBand";
import { CommunityBand } from "./CommunityBand";
import { CourseMap } from "./CourseMap";
import { HowItWorks } from "./HowItWorks";
import { LevelCard } from "./LevelCard";
import { HeroQuote, Lede, PublicHero } from "./PublicHero";

/**
 * The landing page (#73). Takes plain data so the page stays a thin loader and every
 * state (signed out, a new Student, mid-course) can be rendered without a session.
 */
export function LandingView({
  levels,
  currentLevelSlug,
  signedIn,
  baselinePending,
  communityUrl = null,
}: {
  levels: LevelWithPosition[];
  /** The Level the Student is on, from their Course Position; null once all are complete. */
  currentLevelSlug: string | null;
  signedIn: boolean;
  /** Signed in and the first Baseline Sitting not yet done. */
  baselinePending: boolean;
  /** The WhatsApp community invite (T94); null hides the card. */
  communityUrl?: string | null;
}) {
  // Recommend the Level they are on, so the card that carries the pink CTA is always
  // the genuinely useful one. Once every Level is complete, the first.
  const recommendedSlug = currentLevelSlug ?? levels[0]?.slug;

  return (
    <>
      {/* --- Hero: light, on the white page (#73) --------------------------- */}
      <PublicHero
        eyebrow="Organ Donation and Transplantation Awareness Course"
        title={
          <>
            Save7 <span className="text-pink">Learn</span>
          </>
        }
      >
        <Lede>
          Some people join Save7 already understanding the transplant landscape in
          South Africa. Others have never been exposed to the organ donation crisis.
          What everyone has in common is a passion for educating others.
        </Lede>

        <HeroQuote>
          Whether it is for an awareness campaign or a private conversation with family
          and friends, the most important part is simply starting the conversation.
        </HeroQuote>

        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href={signedIn ? "#levels" : "/register"} size="lg" variant="primary">
            {signedIn ? "Choose your level" : "Start the course"}
          </ButtonLink>
          <ButtonLink href="/course/introduction" size="lg" variant="secondary">
            How the course works
          </ButtonLink>
        </div>

        {baselinePending ? (
          <p className="mt-[1.125rem] max-w-[56ch] text-sm text-grey">
            Before your first Stage we&apos;ll ask you 20 quick questions. After each
            level you can answer the same 20 again, so you can see how much you&apos;ve
            learned.
          </p>
        ) : null}
      </PublicHero>

      {/* --- Level chooser: the course map, then the cards ------------------- */}
      <section id="levels" className="scroll-mt-20 pt-14 min-[760px]:pt-[4.75rem]">
        <div className="mx-auto max-w-[73.75rem] px-[1.125rem] min-[760px]:px-6">
          <Display as="h2" className="mb-3 text-[1.5rem] font-bold leading-[1.22] tracking-tight text-navy min-[760px]:text-[1.75rem]">
            Choose your learning level
          </Display>
          <p className="mb-2 max-w-[68ch] text-[1.0625rem] leading-[1.7] text-grey">
            We recommend completing the levels in order, but you can choose where you
            begin based on what you already know.{" "}
            <strong className="font-medium text-navy">
              Each level is a complete achievement with its own certificate.
            </strong>{" "}
            You are not expected to finish all three to be an informed advocate.
          </p>

          <CourseMap levels={levels} recommendedSlug={recommendedSlug} />

          <div className="mt-[1.375rem] grid gap-5 min-[1000px]:grid-cols-3">
            {levels.map((level) => (
              <LevelCard
                key={level.slug}
                level={level}
                position={level.position}
                signedIn={signedIn}
                recommended={level.slug === recommendedSlug}
              />
            ))}
          </div>
        </div>
      </section>

      <HowItWorks />

      {/* --- The ten questions ---------------------------------------------- */}
      <section className="pt-14 min-[760px]:pt-[4.75rem]">
        <div className="mx-auto max-w-[73.75rem] px-[1.125rem] min-[760px]:px-6">
          <Display as="h2" className="text-[1.5rem] font-bold leading-[1.22] tracking-tight text-navy min-[760px]:text-[1.75rem]">
            By the end, you&apos;ll be able to answer
          </Display>
          <ol className="mt-[1.875rem] grid list-none gap-x-10 p-0 min-[760px]:grid-cols-2">
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
            ].map((q, i) => (
              <li key={q} className="flex items-baseline gap-4 border-b border-line py-3.5 font-medium">
                <span className="min-w-[2.375rem] font-display text-2xl leading-none text-pink">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {communityUrl ? <CommunityBand href={communityUrl} /> : null}

      {/* --- Closing band ---------------------------------------------------- */}
      <ClosingBand
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
      </ClosingBand>
    </>
  );
}
