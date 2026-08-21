import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { getBaselineState, getPathwayForUser } from "@/lib/course";
import { ButtonLink, Card, Display, Eyebrow, TIER_META, cx } from "@/components/ui/primitives";
import type { LevelTier } from "@/lib/constants";

/**
 * Edge runtime, required by Cloudflare Pages.
 *
 * `@cloudflare/next-on-pages` refuses to build a route that renders on the
 * Node runtime — every server-rendered route on Pages runs on workerd. This is
 * the whole reason the app is pinned to Next 15.5.2: the adapter supports no
 * higher, and OpenNext (which does not need this) supports no lower.
 */
export const runtime = "edge";

export const metadata: Metadata = { title: "Baseline recorded" };

/**
 * Confirmation after the baseline.
 *
 * The score is shown, but framed carefully and without a pass mark, a grade or
 * any comparison to other learners. A low baseline is the most useful possible
 * starting point, and the copy says so — a learner who feels they have failed
 * before the course begins is a learner who leaves.
 */
export default async function BaselineDonePage() {
  const user = await requireUser("/assessment/pre/done");
  const baseline = await getBaselineState(user.id);

  if (!baseline.completed) redirect("/assessment/pre");

  const { levels } = await getPathwayForUser(user.id);
  const beginner = levels[0];
  const tier = (beginner?.tier ?? "BEGINNER") as LevelTier;

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
      <Eyebrow>Baseline recorded</Eyebrow>
      <Display as="h1" className="mt-5 text-display text-ink">
        That&apos;s your starting point
      </Display>

      <Card className="mt-8 p-6 sm:p-8">
        <p className="text-sm font-semibold text-sand-500">
          Before the course
        </p>
        <p className="mt-1 font-display text-6xl text-ink">{baseline.scorePct}%</p>
        <p className="mt-2 text-sm text-sand-500">
          {baseline.scoreRaw} of {baseline.scoreMax} questions
        </p>

        <div className="mt-6 border-t border-sand-200 pt-5">
          <p className="text-sand-700">
            There is no pass mark here, and this is not a grade. It is a measurement taken
            before you learned anything — which is exactly what makes the number at the end
            meaningful.
          </p>
          <p className="mt-3 text-sand-700">
            {baseline.scorePct !== null && baseline.scorePct < 50
              ? "A low baseline is genuinely the best place to start from. You have the most to gain."
              : "You already know some of this. The course will fill in the parts that are harder to pick up casually — brain death, the law, and how to handle a difficult conversation."}
          </p>
        </div>
      </Card>

      <div className="mt-10">
        <Display as="h2" className="text-title text-ink">
          Now choose where to begin
        </Display>
        <p className="mt-3 text-sand-600">
          We recommend starting with{" "}
          <strong className="text-ink">{beginner?.title ?? "Beginner"}</strong>, but you can
          start at any level.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {beginner ? (
            <ButtonLink href={`/levels/${beginner.slug}`} size="lg">
              <span
                aria-hidden="true"
                className={cx("size-2 rounded-full", TIER_META[tier].dotClass)}
              />
              Start {TIER_META[tier].label}
            </ButtonLink>
          ) : null}
          <ButtonLink href="/#levels" size="lg" variant="outline">
            See all three levels
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
