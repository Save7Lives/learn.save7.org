import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getPathwayForUser, getBaselineState } from "@/lib/course";
import { LevelCard } from "@/components/course/LevelCard";
import { Badge, ButtonLink, Display, Eyebrow } from "@/components/ui/primitives";

/**
 * Edge runtime, required by Cloudflare Pages.
 *
 * `@cloudflare/next-on-pages` refuses to build a route that renders on the
 * Node runtime — every server-rendered route on Pages runs on workerd. This is
 * the whole reason the app is pinned to Next 15.5.2: the adapter supports no
 * higher, and OpenNext (which does not need this) supports no lower.
 */
export const runtime = "edge";

export default async function HomePage() {
  const session = await getSession();

  const { levels } = await getPathwayForUser(session?.id ?? null);
  const baseline = session ? await getBaselineState(session.id) : null;

  // Recommend the first level they haven't finished, so the card that carries the
  // pink CTA is always the genuinely useful one.
  const recommendedSlug =
    levels.find((l) => l.progress?.status !== "COMPLETE")?.slug ?? levels[0]?.slug;

  return (
    <>
      {/* --- Hero ---------------------------------------------------------- */}
      <section className="on-ink relative overflow-hidden bg-ink text-cream">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-40 size-[34rem] rounded-full bg-pink/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-52 -left-24 size-[30rem] rounded-full bg-teal/15 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <Eyebrow className="text-teal">
            Save7 Organ Donation &amp; Transplantation Awareness Course
          </Eyebrow>

          <Display as="h1" className="mt-6 max-w-3xl text-hero text-cream">
            Transplant
            <br />
            Alchemy <span className="text-pink">101</span>
          </Display>

          <p className="mt-8 max-w-xl text-lg text-cream/75">
            Some people join Save7 already understanding the transplant landscape in
            South Africa. Others have never been exposed to the organ donation crisis.
            What everyone has in common is a passion for educating others.
          </p>

          <blockquote className="mt-8 max-w-xl border-l-2 border-teal pl-5 text-lg font-medium text-cream">
            Whether it is for an awareness campaign or a private conversation with family
            and friends, the most important part is simply starting the conversation.
          </blockquote>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <ButtonLink
              href={session ? "#levels" : "/register"}
              size="lg"
              variant="primary"
            >
              {session ? "Choose your level" : "Start the course"}
            </ButtonLink>
            <ButtonLink
              href="/course/introduction"
              size="lg"
              variant="onInk"
            >
              How the course works
            </ButtonLink>
          </div>

          {session && baseline && !baseline.completed ? (
            <p className="mt-6 text-sm text-cream/60">
              Before your first module we&apos;ll ask you 12 quick questions, so we can
              show you how much you&apos;ve learned by the end.
            </p>
          ) : null}
        </div>
      </section>

      {/* --- Level chooser -------------------------------------------------- */}
      <section id="levels" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8">
        <div className="max-w-2xl">
          <Display as="h2" className="text-display text-ink">
            Choose your learning level
          </Display>
          <p className="mt-4 text-sand-600">
            We recommend completing the levels in order, but you can choose where you
            begin based on what you already know.{" "}
            <strong className="text-ink">
              Each level is a complete achievement with its own certificate
            </strong>{" "}
            — you are not expected to finish all three to be an informed advocate.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {levels.map((level) => (
            <LevelCard
              key={level.slug}
              level={level}
              progress={level.progress}
              signedIn={Boolean(session)}
              recommended={level.slug === recommendedSlug}
            />
          ))}
        </div>
      </section>

      {/* --- What the course includes --------------------------------------- */}
      <section className="border-y border-sand-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <Display as="h2" className="text-title text-ink">
            What&apos;s included
          </Display>
          <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Multimedia learning",
                body: "Video, visual storytelling and interactive diagrams instead of walls of text.",
              },
              {
                title: "Interactive questions",
                body: "Short checks after each topic, with explanations that teach rather than just mark you.",
              },
              {
                title: "Conversation practice",
                body: "Real objections you will actually hear, and the chance to try responses safely.",
              },
              {
                title: "Study material",
                body: "A concise written summary of every module, to keep and refer back to.",
              },
              {
                title: "Optional deeper reading",
                body: "Clinical and academic material for anyone who wants it. The course is complete without it.",
              },
              {
                title: "Before and after assessment",
                body: "A short baseline quiz, then a post-course assessment, so you can see exactly how much you have learned.",
              },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="font-bold text-ink">{item.title}</h3>
                <p className="mt-1.5 text-sm text-sand-600">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-3 rounded-card border border-sand-200 bg-sand-50 p-6">
            <div className="flex-1">
              <h3 className="font-bold text-ink">A certificate for each level</h3>
              <p className="mt-1 text-sm text-sand-600">
                Conversation Starter, Donation Advocate and Transplant Advocate. Each is
                verifiable from its certificate ID.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="teal">Conversation Starter</Badge>
              <Badge tone="neutral">Donation Advocate</Badge>
              <Badge tone="pink">Transplant Advocate</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* --- The ten questions ---------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <Display as="h2" className="text-title text-ink">
          By the end, you&apos;ll be able to answer
        </Display>
        <ol className="mt-8 grid gap-x-10 gap-y-4 sm:grid-cols-2">
          {[
            "Who needs organs?",
            "Why are organs being lost?",
            "What is brain death?",
            "How does donation work?",
            "Who is involved?",
            "What does South African law say?",
            "Who can donate?",
            "What happens after transplantation?",
            "How do I talk about donation?",
            "How can I become part of the solution?",
          ].map((q, i) => (
            <li key={q} className="flex items-baseline gap-4 border-b border-sand-200 pb-3">
              <span className="font-display text-2xl text-pink-300">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-medium text-ink">{q}</span>
            </li>
          ))}
        </ol>

        <div className="mt-12">
          <ButtonLink href={session ? "#levels" : "/register"} size="lg">
            {session ? "Choose your level" : "Create your account"}
          </ButtonLink>
          {!session ? (
            <p className="mt-3 text-sm text-sand-500">
              Already started?{" "}
              <Link href="/login" className="font-semibold text-pink-600 underline">
                Sign in
              </Link>
            </p>
          ) : null}
        </div>
      </section>
    </>
  );
}
