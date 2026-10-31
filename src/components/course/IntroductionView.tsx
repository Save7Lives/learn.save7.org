import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icons";
import { ButtonLink, Display, cx } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/parts";
import type { LevelWithPosition } from "@/lib/course";
import { ClosingCard } from "./ClosingBand";
import { QuoteMark } from "./CourseArt";
import { LevelRoute } from "./LevelRoute";

/** The landing page's section heading, so the two pages read as one site. */
const H2 = "text-[1.75rem] font-extrabold leading-[1.1] tracking-tight text-navy min-[760px]:text-[2.75rem]";
const WRAP = "mx-auto max-w-[73.75rem] px-[1.125rem] min-[760px]:px-6";
const SECTION = "pb-20 min-[760px]:pb-28";

/** What the course includes, with the icon for each. Wording as the introduction has always had it. */
const INCLUDES: Array<[title: string, body: string, icon: IconName]> = [
  [
    "Plain-language lessons",
    "Written lessons in plain language, with a table wherever things are easier to compare side by side. Beginner Stage 3 opens with a short film, with captions and a transcript.",
    "book",
  ],
  [
    "Questions that explain",
    "Once you submit a Stage Quiz, every question comes with an explanation, including an explanation of why a tempting wrong answer is tempting.",
    "quiz",
  ],
  ["Study material", "A written summary of each Stage, to come back to.", "file"],
  [
    "Optional deeper reading",
    "The laws, guidelines and studies each Stage draws on, for anyone who wants them. The course is complete without opening a single one.",
    "search",
  ],
  [
    "A baseline assessment",
    "Twenty short questions before you start. This is a baseline, not a test. There is no pass mark and nobody is judged on it.",
    "flag",
  ],
  [
    "The same baseline, again",
    "After each level you finish, so you can see what changed. It is optional, and it never affects a certificate.",
    "chart",
  ],
  [
    "A Stage Quiz in every Stage",
    "Five questions drawn from a bank of fifteen. Four right passes, and retries are unlimited. Passing every Stage Quiz in a level earns its certificate.",
    "quiz",
  ],
  [
    "A certificate of completion",
    "One per level, with a unique ID that can be verified online.",
    "award",
  ],
];

const STAGE_STEPS: Array<[title: string, body: string]> = [
  ["Why this matters", "A short explanation of why the topic is worth your time."],
  ["Learn", "The main lesson, in plain language."],
  ["Key takeaways", "The points worth remembering, in one list."],
  ["Check your understanding", "The Stage Quiz, five questions with explanations once you submit."],
  ["Study guide", "The written summary."],
  ["Further reading", "Optional, always."],
  [
    "Complete Stage",
    "Marking it done records that you have read the Stage, so you can stop and pick up later. Only passing its Stage Quiz counts towards your certificate.",
  ],
];

/**
 * A section with its heading beside the content on a wide screen, where the heading
 * stays in view while the content scrolls (the landing page's "How the course works").
 * Stacked on a phone.
 */
function Beside({ title, lede, children }: { title: string; lede?: ReactNode; children: ReactNode }) {
  return (
    <section className={SECTION}>
      <div className={cx(WRAP, "grid gap-8 min-[900px]:grid-cols-[0.8fr_1.2fr] min-[900px]:gap-14")}>
        <div className="min-[900px]:sticky min-[900px]:top-24 min-[900px]:self-start">
          <Display as="h2" className={H2}>
            {title}
          </Display>
          {lede ? <p className="mt-4 text-[1.0625rem] leading-[1.7] text-grey">{lede}</p> : null}
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

/**
 * The course introduction (#73), in the landing page's design (prototype D): a centred
 * hero, headings beside their content on a wide screen, the Levels as the same route,
 * and the same centred closing card. Same sections, same order, same words. Takes
 * plain data so every state can be rendered without a session.
 */
export function IntroductionView({
  levels,
  currentLevelSlug,
  signedIn,
  baselineCompleted,
}: {
  levels: LevelWithPosition[];
  /** The Level the Student is on, from their Course Position; null once all are complete. */
  currentLevelSlug: string | null;
  signedIn: boolean;
  baselineCompleted: boolean;
}) {
  const recommendedSlug = currentLevelSlug ?? levels[0]?.slug;

  return (
    <article>
      {/* --- Hero: centred like the landing page's, under the hero pair of circles.
          The title's words rise in one after the other, then the rest (globals.css,
          `.gift-word` and `.gift-rise`), sooner than on the landing page because
          there is no drawing to wait for. */}
      <section className={cx(WRAP, "flex flex-col items-center pb-16 pt-10 text-center min-[760px]:pb-24 min-[760px]:pt-14")}>
        <div aria-hidden="true" className="gift-rise relative h-14 w-20 [--rise:0s]">
          <i className="absolute right-0 top-0 size-12 rounded-full bg-teal" />
          <i className="absolute bottom-0 left-0 size-7 rounded-full bg-pink" />
        </div>
        <Display as="h1" className="mt-6 text-hero text-navy">
          <span className="sr-only">Before you begin</span>
          <span aria-hidden="true">
            <span className="gift-word inline-block [animation-delay:0.1s]">Before you</span>{" "}
            <span className="gift-word inline-block text-pink [animation-delay:0.28s]">begin</span>
          </span>
        </Display>
        <div className="gift-rise flex flex-col items-center [--rise:0.55s]">
          <p className="mt-6 max-w-[52ch] text-lg leading-[1.7] text-grey">
            Some people join Save7 already understanding the transplant landscape in South
            Africa. Others have never been exposed to the organ donation crisis. What
            everyone has in common is a passion for educating others about organ donation
            and transplantation.
          </p>
          <p className="mt-4 max-w-[52ch] text-lg font-medium leading-[1.7] text-navy">
            This course gives you the knowledge to speak about it confidently.
          </p>
        </div>
      </section>

      {/* --- Philosophy: the quote in the landing hero's treatment ------------ */}
      <Beside title="The Save7 position">
        <figure className="flex flex-col gap-3">
          <QuoteMark className="h-6 w-8" />
          <blockquote className="text-[1.1875rem] font-medium leading-[1.55] text-navy min-[760px]:text-[1.375rem]">
            Whether it is for awareness campaigns or a private conversation with family
            and friends, the most important part is simply starting the conversation.
          </blockquote>
        </figure>
        <div className="prose-save7 mt-6">
          <p>
            That is worth taking literally. The goal of this course is not to turn you
            into a clinician, and it is not to teach you to win arguments. It is to make
            you someone people are willing to talk to about organ donation, and who
            knows enough to be useful when they do.
          </p>
          <p>
            A great deal follows from that. You will spend more time on how to respond
            to a frightened family member than on transplant immunology. And you will
            learn that someone who decides <em>against</em> donation but tells their
            family clearly is a success, not a failure.
          </p>
        </div>
      </Beside>

      {/* --- Three levels: the landing page's route, which is the course map -- */}
      <LevelRoute
        title="Three levels, three achievements"
        levels={levels}
        recommendedSlug={recommendedSlug}
        signedIn={signedIn}
        intro={
          <p>
            The course is a pathway, not a single block. We recommend the levels in order,
            but you can start wherever suits what you already know, and stopping after any
            level is a complete outcome, not an abandoned one.
          </p>
        }
      />

      {/* --- What's included: rows, like the landing page's checklist --------- */}
      <Beside title="What the course includes">
        <ul className="m-0 list-none border-t border-line p-0">
          {INCLUDES.map(([title, body, icon]) => (
            <Reveal as="li" key={title} className="flex items-start gap-4 border-b border-line py-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-teal-line bg-teal-50 text-teal-ink">
                <Icon name={icon} className="size-6 stroke-[1.75]" />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold leading-tight text-navy">{title}</h3>
                <p className="mt-1 text-grey">{body}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </Beside>

      {/* --- How each Stage works: stops on a dotted line, like the route ----- */}
      <Beside
        title="How each Stage works"
        lede="Every Stage follows the same shape, so you always know where you are."
      >
        <ol className="m-0 list-none p-0">
          {STAGE_STEPS.map(([title, body], i) => (
            <li
              key={title}
              className={cx(
                "relative grid grid-cols-[2.25rem_1fr] gap-x-4 pb-6",
                i < STAGE_STEPS.length - 1 &&
                  "before:absolute before:bottom-1 before:left-[1.0625rem] before:top-11 before:border-l-[3px] before:border-dotted before:border-line-strong before:content-['']",
              )}
            >
              <Reveal
                as="span"
                from="pop"
                className="relative z-10 grid size-9 place-items-center rounded-full bg-teal font-display text-sm font-bold text-navy"
              >
                {i + 1}
              </Reveal>
              <div className="pt-1">
                <h3 className="font-display text-lg font-bold leading-tight text-navy">{title}</h3>
                <p className="mt-1 text-grey">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Beside>

      {/* --- Next step: the landing page's centred card ----------------------- */}
      {signedIn ? (
        baselineCompleted ? (
          <ClosingCard text="You have already completed the baseline assessment. Pick up wherever you left off.">
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href="/dashboard" size="lg">
                Go to my progress
              </ButtonLink>
              <ButtonLink href="/#levels" size="lg" variant="secondary">
                Choose a level
              </ButtonLink>
            </div>
          </ClosingCard>
        ) : (
          <ClosingCard text="Start with the baseline assessment. Twenty questions, no pass mark, and it is what makes your knowledge improvement measurable. The levels open as soon as it's done.">
            <ButtonLink href="/assessment/pre" size="lg">
              Start the baseline assessment
            </ButtonLink>
          </ClosingCard>
        )
      ) : (
        <ClosingCard text="Create an account so your progress, scores and certificate can be saved. It takes a name and an email.">
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/register" size="lg">
              Create your account
            </ButtonLink>
            <ButtonLink href="/login" size="lg" variant="secondary">
              Sign in
            </ButtonLink>
          </div>
        </ClosingCard>
      )}

      <p className={cx(WRAP, "-mt-12 pb-10 text-center text-sm text-grey min-[760px]:-mt-20")}>
        <Link href="/privacy" className="underline underline-offset-2">
          What we do with your information
        </Link>
      </p>
    </article>
  );
}
