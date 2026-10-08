import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getBaselineState } from "@/lib/baseline";
import { getPathwayForUser } from "@/lib/course";
import { LevelCard } from "@/components/course/LevelCard";
import { Badge, ButtonLink, Display, Eyebrow } from "@/components/ui/primitives";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

// The Badge colour for each Level's Certificate, in Level order.
const CERTIFICATE_TONES = ["teal", "neutral", "pink"] as const;

export default async function HomePage() {
  const session = await getSession();

  const { levels } = await getPathwayForUser(session?.id ?? null);
  const baseline = session ? await getBaselineState(session.id) : null;

  // A Certificate is titled with its Level's name. Read from `levels`, which a
  // signed-out visitor can read too (save7-os 0131), so there is no second copy to drift.
  const certificateTitles = levels.map((l) => l.certificateTitle);

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
            Organ Donation and Transplantation Awareness Course
          </Eyebrow>

          <Display as="h1" className="mt-6 max-w-3xl text-hero text-cream">
            Save7
            <br />
            <span className="text-pink">Learn</span>
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
              Before your first Stage we&apos;ll ask you 20 quick questions. After each
              level you can answer the same 20 again, so you can see how much you&apos;ve
              learned.
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
              Each level is a complete achievement with its own certificate.
            </strong>{" "}
            You are not expected to finish all three to be an informed advocate.
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
                title: "Plain-language lessons",
                body: "Written lessons in plain language, with a table wherever things are easier to compare side by side.",
              },
              {
                title: "Questions that explain",
                body: "Every Stage has a five-question quiz, with an explanation for each answer that teaches rather than just marks you.",
              },
              {
                title: "Real objections, answered",
                body: "The beliefs you will actually hear, twelve of them in the Beginner Level, each with what is true and why it is persuasive.",
              },
              {
                title: "Study material",
                body: "A written summary of every Stage, to come back to.",
              },
              {
                title: "Optional deeper reading",
                body: "The laws, guidelines and studies each Stage draws on, for anyone who wants them. The course is complete without them.",
              },
              {
                title: "Before and after assessment",
                body: "A short baseline quiz before you start, and the same questions again after each level if you choose, so you can see how much you have learned.",
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
                {certificateTitles.join(", ")}. Each is verifiable from its certificate
                ID.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {certificateTitles.map((title, i) => (
                <Badge key={title} tone={CERTIFICATE_TONES[i] ?? "neutral"}>
                  {title}
                </Badge>
              ))}
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
            "Who decides, and how is consent given?",
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
