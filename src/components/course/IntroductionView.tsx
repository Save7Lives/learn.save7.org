import Link from "next/link";
import { type IconName } from "@/components/ui/icons";
import { ButtonLink, Display, NumberPill } from "@/components/ui/primitives";
import type { LevelWithPosition } from "@/lib/course";
import { ClosingBand } from "./ClosingBand";
import { IconCircle } from "./IconCircle";
import { CourseMap } from "./CourseMap";
import { LevelCard } from "./LevelCard";
import { Lede, PublicHero } from "./PublicHero";

const H2 =
  "text-[1.5rem] font-bold leading-[1.22] tracking-tight text-navy min-[760px]:text-[1.75rem]";
const WRAP = "mx-auto max-w-[73.75rem] px-[1.125rem] min-[760px]:px-6";
const SECTION = "pt-14 min-[760px]:pt-[4.75rem]";

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


/** The course introduction (#73). Takes plain data so every state can be rendered without a session. */
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
      {/* --- Hero: the same treatment as the landing page ------------------ */}
      <PublicHero eyebrow="Course introduction" title="Before you begin">
        <Lede>
          Some people join Save7 already understanding the transplant landscape in South
          Africa. Others have never been exposed to the organ donation crisis. What
          everyone has in common is a passion for educating others about organ donation
          and transplantation.
        </Lede>
        <Lede className="mb-0">
          This course gives you the knowledge to speak about it confidently.
        </Lede>
      </PublicHero>

      {/* --- Philosophy ---------------------------------------------------- */}
      <section className={SECTION}>
        <div className={WRAP}>
          <div className="max-w-[47.5rem]">
            <Display as="h2" className={H2}>
              The Save7 position
            </Display>
            <blockquote className="mt-[1.125rem] rounded-r-[0.875rem] border-l-4 border-teal bg-teal-50 px-5 py-4 text-[1.0625rem] font-medium leading-[1.6] text-navy">
              Whether it is for awareness campaigns or a private conversation with family
              and friends, the most important part is simply starting the conversation.
            </blockquote>
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
          </div>
        </div>
      </section>

      {/* --- Three levels: the course map, then the cards ------------------- */}
      <section id="levels" className={`${SECTION} scroll-mt-20`}>
        <div className={WRAP}>
          <Display as="h2" className={`mb-3 ${H2}`}>
            Three levels, three achievements
          </Display>
          <p className="mb-2 max-w-[68ch] text-[1.0625rem] leading-[1.7] text-grey">
            The course is a pathway, not a single block. We recommend the levels in order,
            but you can start wherever suits what you already know, and stopping after any
            level is a complete outcome, not an abandoned one.
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

      {/* --- What's included ----------------------------------------------- */}
      <section className={SECTION}>
        <div className={WRAP}>
          <Display as="h2" className={H2}>
            What the course includes
          </Display>
          <ul className="mt-[1.875rem] grid list-none gap-x-8 gap-y-[1.625rem] p-0 min-[760px]:grid-cols-2">
            {INCLUDES.map(([title, body, icon], i) => (
              <li key={title} className="flex items-start gap-3.5">
                <IconCircle name={icon} tone={i % 2 ? "teal" : "pink"} />
                <div>
                  <h3 className="font-display text-lg font-bold leading-tight text-navy">
                    {title}
                  </h3>
                  <p className="mt-1 text-[0.9375rem] text-grey">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --- How each Stage works ------------------------------------------ */}
      <section className={SECTION}>
        <div className={WRAP}>
          <div className="max-w-[47.5rem]">
            <Display as="h2" className={H2}>
              How each Stage works
            </Display>
            <p className="mt-3 max-w-[68ch] text-[1.0625rem] leading-[1.7] text-grey">
              Every Stage follows the same shape, so you always know where you are.
            </p>
            <ol className="mt-[1.625rem] list-none p-0">
              {STAGE_STEPS.map(([title, body], i) => (
                <li
                  key={title}
                  className={
                    "relative grid grid-cols-[2rem_1fr] gap-x-[1.125rem] pb-[1.375rem] " +
                    (i < STAGE_STEPS.length - 1
                      ? "before:absolute before:bottom-1.5 before:left-[15px] before:top-[38px] before:border-l-[3px] before:border-dotted before:border-line-strong before:content-['']"
                      : "")
                  }
                >
                  <NumberPill n={i + 1} tone={i % 2 ? "teal" : "pink"} />
                  <div>
                    <div className="pt-1 font-bold">{title}</div>
                    <p className="mt-0.5 text-grey">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* --- Next step ----------------------------------------------------- */}
      {signedIn ? (
        baselineCompleted ? (
          <ClosingBand text="You have already completed the baseline assessment. Pick up wherever you left off.">
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/dashboard" size="lg">
                Go to my progress
              </ButtonLink>
              <ButtonLink href="/#levels" size="lg" variant="secondary">
                Choose a level
              </ButtonLink>
            </div>
          </ClosingBand>
        ) : (
          <ClosingBand text="Start with the baseline assessment. Twenty questions, no pass mark, and it is what makes your knowledge improvement measurable. The levels open as soon as it's done.">
            <ButtonLink href="/assessment/pre" size="lg">
              Start the baseline assessment
            </ButtonLink>
          </ClosingBand>
        )
      ) : (
        <ClosingBand text="Create an account so your progress, scores and certificate can be saved. It takes a name and an email.">
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/register" size="lg">
              Create your account
            </ButtonLink>
            <ButtonLink href="/login" size="lg" variant="secondary">
              Sign in
            </ButtonLink>
          </div>
        </ClosingBand>
      )}

      <div className={`${WRAP} pt-6`}>
        <p className="text-sm text-grey">
          <Link href="/privacy" className="underline">
            What we do with your information
          </Link>
        </p>
      </div>
    </article>
  );
}
