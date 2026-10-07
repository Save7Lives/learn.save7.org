import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { getBaselineState } from "@/lib/baseline";
import { getPathwayForUser } from "@/lib/course";
import { BaselineResults } from "@/components/course/BaselineResults";
import { ButtonLink, Card, Display, Eyebrow, TIER_META, cx } from "@/components/ui/primitives";
import type { LevelTier } from "@/lib/constants";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Baseline recorded" };

/**
 * The Baseline's results: the latest Sitting's score by Level and overall, and
 * every earlier Sitting beneath it once there is more than one.
 *
 * The score is shown, but framed carefully and without a pass mark, a grade or
 * any comparison to other learners. A low first Sitting is the most useful
 * possible starting point, and the copy says so — a learner who feels they have
 * failed before the course begins is a learner who leaves. The questions are not
 * reviewed: they come back at every Sitting (see lib/baseline.ts).
 */
export default async function BaselineDonePage() {
  const user = await requireUser("/assessment/pre/done");
  const baseline = await getBaselineState(user.id);

  if (!baseline.completed) redirect("/assessment/pre");

  const latest = baseline.sittings[baseline.sittings.length - 1];
  const first = baseline.first!;
  const isFirst = latest.sittingNo === 1;
  const change = latest.totalPct - first.totalPct;

  const { levels } = await getPathwayForUser(user.id);
  const nextLevel = levels.find((l) => l.progress?.status !== "COMPLETE") ?? null;
  const tier = (nextLevel?.tier ?? "BEGINNER") as LevelTier;

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
      <Eyebrow>Baseline recorded</Eyebrow>
      <Display as="h1" className="mt-5 text-display text-ink">
        {isFirst ? <>That&apos;s your starting point</> : <>Here&apos;s what changed</>}
      </Display>

      <Card className="mt-8 p-6 sm:p-8">
        <p className="text-sm font-semibold text-sand-500">
          {isFirst ? "Before the course" : `Sitting ${latest.sittingNo} of 4`}
        </p>
        <p className="mt-1 font-display text-6xl text-ink">{latest.totalPct}%</p>
        <p className="mt-2 text-sm text-sand-500">
          {latest.totalScore} of {latest.totalMax} questions
          {isFirst ? null : (
            <>
              {" · "}
              <span className="font-semibold text-ink">
                {change >= 0 ? "+" : ""}
                {change} points
              </span>{" "}
              since your first sitting ({first.totalPct}%)
            </>
          )}
        </p>

        <div className="mt-6 border-t border-sand-200 pt-5">
          <BaselineResults state={baseline} highlight={latest.sittingNo} />
        </div>

        <div className="mt-6 border-t border-sand-200 pt-5">
          {isFirst ? (
            <>
              <p className="text-sand-700">
                There is no pass mark here, and this is not a grade. It is a measurement taken
                before you learned anything — which is exactly what makes the later sittings
                meaningful. You&apos;ll sit the same questions again after each level you
                finish.
              </p>
              <p className="mt-3 text-sand-700">
                {latest.totalPct < 50
                  ? "A low baseline is genuinely the best place to start from. You have the most to gain."
                  : "You already know some of this. The course will fill in the parts that are harder to pick up casually — brain death, the law, and how to handle a difficult conversation."}
              </p>
            </>
          ) : (
            <p className="text-sand-700">
              Each row is the same {latest.totalMax} questions, so the difference between rows is what
              you learned. A level you haven&apos;t studied yet usually moves least — that is
              expected, not a shortfall.
            </p>
          )}
        </div>
      </Card>

      {baseline.due !== null ? (
        <Card className="mt-6 border-pink-200 bg-pink-50/50 p-6">
          <p className="text-sand-700">
            You&apos;ve finished a level since your last sitting, so sitting {baseline.due} is
            ready whenever you are.
          </p>
          <div className="mt-4">
            <ButtonLink href="/assessment/pre">Take sitting {baseline.due}</ButtonLink>
          </div>
        </Card>
      ) : null}

      <div className="mt-10">
        {isFirst ? (
          <>
            <Display as="h2" className="text-title text-ink">
              Now choose where to begin
            </Display>
            <p className="mt-3 text-sand-600">
              We recommend starting with{" "}
              <strong className="text-ink">{nextLevel?.title ?? "Beginner"}</strong>, but you
              can start at any level.
            </p>
          </>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {nextLevel ? (
            <ButtonLink href={`/levels/${nextLevel.slug}`} size="lg">
              <span
                aria-hidden="true"
                className={cx("size-2 rounded-full", TIER_META[tier].dotClass)}
              />
              {nextLevel.progress?.status === "NOT_STARTED" ? "Start" : "Continue"}{" "}
              {TIER_META[tier].label}
            </ButtonLink>
          ) : null}
          <ButtonLink href={isFirst ? "/#levels" : "/dashboard"} size="lg" variant="outline">
            {isFirst ? "See all three levels" : "My progress"}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
