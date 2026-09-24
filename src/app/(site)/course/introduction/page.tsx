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
// (Supabase URL and key, SITE_URL) which Cloudflare applies at deploy time. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Course introduction",
  description:
    "How Transplant Alchemy 101 works: three levels, what's included, and how your learning is measured.",
};

export default async function IntroductionPage() {
  const session = await getSession();
  const { levels } = await getPathway();
  const baseline = session ? await getBaselineState(session.id) : null;

  return (
    <article>
      {/* --- Header -------------------------------------------------------- */}
      <header className="border-b border-sand-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
          <Eyebrow>Course introduction</Eyebrow>
          <Display as="h1" className="mt-5 text-display text-ink">
            Before you begin
          </Display>
          <p className="mt-6 text-lg text-sand-700">
            Some people join Save7 already understanding the transplant landscape in South
            Africa. Others have never been exposed to the organ donation crisis. What
            everyone has in common is a passion for educating others about organ donation
            and transplantation.
          </p>
          <p className="mt-4 text-lg text-sand-700">
            This course gives you the knowledge to speak about it confidently.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        {/* --- Philosophy -------------------------------------------------- */}
        <section>
          <Display as="h2" className="text-title text-ink">
            The Save7 position
          </Display>
          <blockquote className="mt-5 border-l-3 border-teal-500 bg-teal-50 py-5 pl-6 pr-5">
            <p className="text-lg font-medium text-ink">
              Whether it is for awareness campaigns or a private conversation with family
              and friends, the most important part is simply starting the conversation.
            </p>
          </blockquote>
          <div className="prose-save7 mt-6">
            <p>
              That is worth taking literally. The goal of this course is not to turn you
              into a clinician, and it is not to teach you to win arguments. It is to make
              you someone people are willing to talk to about organ donation — and who
              knows enough to be useful when they do.
            </p>
            <p>
              A great deal follows from that. You will spend more time on how to respond
              to a frightened family member than on transplant immunology. You will be
              told repeatedly that <strong>&ldquo;I don&apos;t know, let me find
              out&rdquo;</strong> is a good answer. And you will learn that someone who
              decides <em>against</em> donation but tells their family clearly is a
              success, not a failure.
            </p>
          </div>
        </section>

        {/* --- Three levels ------------------------------------------------ */}
        <section className="mt-16">
          <Display as="h2" className="text-title text-ink">
            Three levels, three achievements
          </Display>
          <p className="mt-4 text-sand-600">
            The course is a pathway, not a single block. We recommend the levels in order,
            but you can start wherever suits what you already know — and stopping after any
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
                    <Display as="h3" className="text-xl text-ink">
                      {level.title}
                    </Display>
                    <Badge
                      tone="neutral"
                      className={cx(meta.softClass, meta.textClass, "border-transparent")}
                    >
                      {meta.label}
                    </Badge>
                    <span className="text-sm text-sand-500">
                      {level.estMinMinutes}–{level.estMaxMinutes} min
                    </span>
                  </div>
                  <p className="mt-3 text-sand-700">{level.goal}</p>
                  <p className="mt-3 text-sm text-sand-500">
                    Modules: {level.modules.map((m) => m.title).join(" · ")}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-ink">
                    Earns the &ldquo;{level.certificateTitle}&rdquo; certificate.
                  </p>
                </Card>
              );
            })}
          </ol>
        </section>

        {/* --- What's included --------------------------------------------- */}
        <section className="mt-16">
          <Display as="h2" className="text-title text-ink">
            What the course includes
          </Display>
          <dl className="mt-6 space-y-5">
            {[
              [
                "Multimedia learning",
                "Video, visual storytelling and interactive diagrams. You will not be handed walls of text to read.",
              ],
              [
                "Interactive questions",
                "Two to four short questions after each topic. Every answer comes with an explanation, including an explanation of why a tempting wrong answer is tempting.",
              ],
              [
                "Study material",
                "A concise written summary of each module, to keep and refer back to.",
              ],
              [
                "Optional deeper reading",
                "Clinical and academic sources for anyone who wants them. The course is complete without opening a single one.",
              ],
              [
                "A baseline assessment",
                "Twenty short questions before you start. This is a baseline, not a test — there is no pass mark and nobody is judged on it.",
              ],
              [
                "The same baseline, again",
                "After each level you finish, so you can see what changed. It is optional, and it never affects a certificate.",
              ],
              [
                "A Stage Quiz in every module",
                "Five questions, with unlimited retries. Passing every Stage Quiz in a level earns its certificate.",
              ],
              [
                "A certificate of completion",
                "One per level, with a unique ID that can be verified online.",
              ],
            ].map(([title, body]) => (
              <div key={title} className="border-b border-sand-200 pb-5">
                <dt className="font-bold text-ink">{title}</dt>
                <dd className="mt-1 text-sand-600">{body}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* --- How each module works ---------------------------------------- */}
        <section className="mt-16">
          <Display as="h2" className="text-title text-ink">
            How each module works
          </Display>
          <p className="mt-4 text-sand-600">
            Every module follows the same shape, so you always know where you are.
          </p>
          <ol className="mt-6 space-y-3">
            {[
              ["Why this matters", "A short explanation of why the topic is worth your time."],
              ["Learn", "The main experience — usually visual or interactive."],
              ["Key takeaways", "Three to six things worth remembering."],
              ["Check your understanding", "A few questions, with explanations."],
              ["Study guide", "The written summary."],
              ["Further reading", "Optional, always."],
              ["Complete module", "You mark it done yourself."],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-4">
                <span className="font-display text-xl text-pink-300">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong className="text-ink">{title}</strong>
                  <span className="text-sand-600"> — {body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* --- Honesty about content state --------------------------------- */}
        <section className="mt-16">
          <Card className="border-review/30 bg-review-soft p-6">
            <Badge tone="review">A note on this early version</Badge>
            <Display as="h2" className="mt-4 text-xl text-ink">
              Some sections are still being written
            </Display>
            <div className="prose-save7 mt-3">
              <p>
                This platform has been built ahead of the final Save7 study guide. Where a
                medical, legal or statistical statement has not yet been verified against
                an authoritative source, you will see a{" "}
                <span className="whitespace-nowrap">
                  <Badge tone="review">Pending Save7 review</Badge>
                </span>{" "}
                marker, and the text is left blank rather than filled in with something
                unverified.
              </p>
              <p>
                We would rather show you an obvious gap than a confident guess. The
                structure, the interactions and the assessments are all complete and
                working.
              </p>
            </div>
          </Card>
        </section>

        {/* --- Next step ---------------------------------------------------- */}
        <section className="mt-16">
          <Display as="h2" className="text-title text-ink">
            Ready?
          </Display>
          {session ? (
            baseline?.completed ? (
              <>
                <p className="mt-4 text-sand-600">
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
                <p className="mt-4 text-sand-600">
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
              <p className="mt-4 text-sand-600">
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
          <p className="mt-6 text-sm text-sand-500">
            <Link href="/privacy" className="underline">
              What we do with your information
            </Link>
          </p>
        </section>
      </div>
    </article>
  );
}
