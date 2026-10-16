import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getBaselineState } from "@/lib/baseline";
import { getPathway } from "@/lib/course";
import {
  Badge,
  ButtonLink,
  Card,
  Display,
  Eyebrow,
  TIER_META,
  cx,
} from "@/components/ui/primitives";
import type { LevelTier } from "@/lib/constants";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Course introduction",
  description:
    "How Save7 Learn works: three levels, what's included, and how your learning is measured.",
};

export default async function IntroductionPage() {
  const session = await getSession();
  const { levels } = await getPathway();
  const baseline = session ? await getBaselineState(session.id) : null;

  return (
    <article>
      {/* --- Header -------------------------------------------------------- */}
      <header className="border-b border-line bg-white">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
          <Eyebrow>Course introduction</Eyebrow>
          <Display as="h1" className="mt-5 text-display text-navy">
            Before you begin
          </Display>
          <p className="mt-6 text-lg text-grey">
            Some people join Save7 already understanding the transplant landscape in South
            Africa. Others have never been exposed to the organ donation crisis. What
            everyone has in common is a passion for educating others about organ donation
            and transplantation.
          </p>
          <p className="mt-4 text-lg text-grey">
            This course gives you the knowledge to speak about it confidently.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        {/* --- Philosophy -------------------------------------------------- */}
        <section>
          <Display as="h2" className="text-title text-navy">
            The Save7 position
          </Display>
          <blockquote className="mt-5 border-l-3 border-teal-ink bg-teal-50 py-5 pl-6 pr-5">
            <p className="text-lg font-medium text-navy">
              Whether it is for awareness campaigns or a private conversation with family
              and friends, the most important part is simply starting the conversation.
            </p>
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
        </section>

        {/* --- Three levels ------------------------------------------------ */}
        <section className="mt-16">
          <Display as="h2" className="text-title text-navy">
            Three levels, three achievements
          </Display>
          <p className="mt-4 text-grey">
            The course is a pathway, not a single block. We recommend the levels in order,
            but you can start wherever suits what you already know, and stopping after any
            level is a complete outcome, not an abandoned one.
          </p>

          <ol className="mt-8 space-y-4">
            {levels.map((level, i) => {
              const tier = level.tier as LevelTier;
              const meta = TIER_META[tier];
              return (
                <Card as="li" key={level.slug} className="p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={cx(
                        "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white",
                        meta.dotClass,
                      )}
                    >
                      {i + 1}
                    </span>
                    <Display as="h3" className="text-xl text-navy">
                      {level.title}
                    </Display>
                    <Badge
                      tone="neutral"
                      className={cx(meta.softClass, meta.textClass, "border-transparent")}
                    >
                      {meta.label}
                    </Badge>
                    <span className="text-sm text-grey">
                      {level.estMinMinutes}–{level.estMaxMinutes} min
                    </span>
                  </div>
                  <p className="mt-3 text-grey">{level.goal}</p>
                  <p className="mt-3 text-sm text-grey">
                    Stages: {level.modules.map((m) => m.title).join(" · ")}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-navy">
                    Earns the &ldquo;{level.certificateTitle}&rdquo; certificate.
                  </p>
                </Card>
              );
            })}
          </ol>
        </section>

        {/* --- What's included --------------------------------------------- */}
        <section className="mt-16">
          <Display as="h2" className="text-title text-navy">
            What the course includes
          </Display>
          <dl className="mt-6 space-y-5">
            {[
              [
                "Plain-language lessons",
                "Written lessons in plain language, with a table wherever things are easier to compare side by side. Beginner Stage 3 opens with a short film, with captions and a transcript.",
              ],
              [
                "Questions that explain",
                "Once you submit a Stage Quiz, every question comes with an explanation, including an explanation of why a tempting wrong answer is tempting.",
              ],
              [
                "Study material",
                "A written summary of each Stage, to come back to.",
              ],
              [
                "Optional deeper reading",
                "The laws, guidelines and studies each Stage draws on, for anyone who wants them. The course is complete without opening a single one.",
              ],
              [
                "A baseline assessment",
                "Twenty short questions before you start. This is a baseline, not a test. There is no pass mark and nobody is judged on it.",
              ],
              [
                "The same baseline, again",
                "After each level you finish, so you can see what changed. It is optional, and it never affects a certificate.",
              ],
              [
                "A Stage Quiz in every Stage",
                "Five questions drawn from a bank of fifteen. Four right passes, and retries are unlimited. Passing every Stage Quiz in a level earns its certificate.",
              ],
              [
                "A certificate of completion",
                "One per level, with a unique ID that can be verified online.",
              ],
            ].map(([title, body]) => (
              <div key={title} className="border-b border-line pb-5">
                <dt className="font-bold text-navy">{title}</dt>
                <dd className="mt-1 text-grey">{body}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* --- How each module works ---------------------------------------- */}
        <section className="mt-16">
          <Display as="h2" className="text-title text-navy">
            How each Stage works
          </Display>
          <p className="mt-4 text-grey">
            Every Stage follows the same shape, so you always know where you are.
          </p>
          <ol className="mt-6 space-y-3">
            {[
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
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-4">
                <span className="font-display text-xl text-pink">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong className="text-navy">{title}</strong>
                  <span className="text-grey">: {body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* --- Next step ---------------------------------------------------- */}
        <section className="mt-16">
          <Display as="h2" className="text-title text-navy">
            Ready?
          </Display>
          {session ? (
            baseline?.completed ? (
              <>
                <p className="mt-4 text-grey">
                  You have already completed the baseline assessment. Pick up wherever you
                  left off.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink href="/dashboard" size="lg">
                    Go to my progress
                  </ButtonLink>
                  <ButtonLink href="/#levels" size="lg" variant="outline">
                    Choose a level
                  </ButtonLink>
                </div>
              </>
            ) : (
              <>
                <p className="mt-4 text-grey">
                  Start with the baseline assessment. Twenty questions, no pass mark, and
                  it is what makes your knowledge improvement measurable. The levels open
                  as soon as it&apos;s done.
                </p>
                <div className="mt-6">
                  <ButtonLink href="/assessment/pre" size="lg">
                    Start the baseline assessment
                  </ButtonLink>
                </div>
              </>
            )
          ) : (
            <>
              <p className="mt-4 text-grey">
                Create an account so your progress, scores and certificate can be saved.
                It takes a name and an email.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/register" size="lg">
                  Create your account
                </ButtonLink>
                <ButtonLink href="/login" size="lg" variant="outline">
                  Sign in
                </ButtonLink>
              </div>
            </>
          )}
          <p className="mt-6 text-sm text-grey">
            <Link href="/privacy" className="underline">
              What we do with your information
            </Link>
          </p>
        </section>
      </div>
    </article>
  );
}
