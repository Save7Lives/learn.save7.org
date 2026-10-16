import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { getBaselineState } from "@/lib/baseline";
import { getPathwayForUser, getLearnerCertificates } from "@/lib/course";
import { BaselineResults } from "@/components/course/BaselineResults";
import {
  Badge,
  ButtonLink,
  Card,
  Display,
  Eyebrow,
  ProgressBar,
  TIER_META,
  cx,
} from "@/components/ui/primitives";
import type { LevelTier } from "@/lib/constants";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My progress" };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");

  const [{ levels }, baseline, certificates] = await Promise.all([
    getPathwayForUser(user.id),
    getBaselineState(user.id),
    getLearnerCertificates(user.id),
  ]);

  // Improvement is derived, never stored: the latest later Sitting against the
  // first, the same comparison learn_my_progress makes.
  const before = baseline.first;
  const after = baseline.latestLater;

  const modulesComplete = levels.reduce(
    (sum, l) => sum + (l.progress?.modulesComplete ?? 0),
    0,
  );
  const modulesTotal = levels.reduce((sum, l) => sum + (l.progress?.modulesTotal ?? 0), 0);

  // Where to send them next: the first level that isn't finished.
  const nextLevel = levels.find((l) => l.progress?.status !== "COMPLETE") ?? null;

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
      <Eyebrow>My progress</Eyebrow>
      <Display as="h1" className="mt-4 text-display text-navy">
        {user.name}
      </Display>
      <p className="mt-2 text-sm">
        <Link href="/profile" className="font-semibold text-pink underline">
          Edit your name
        </Link>
      </p>

      {/* --- Baseline gate ------------------------------------------------- */}
      {!baseline.completed ? (
        <Card className="mt-8 border-pink-line bg-pink-50 p-6">
          <Display as="h2" className="text-title text-navy">
            Start with the baseline
          </Display>
          <p className="mt-3 text-grey">
            Twenty short questions before you begin. There is no pass mark. It is the
            &ldquo;before&rdquo; that shows what you learn, so the levels open once
            it&apos;s done.
          </p>
          <div className="mt-5">
            <ButtonLink href="/assessment/pre" size="lg">
              Start the baseline assessment
            </ButtonLink>
          </div>
        </Card>
      ) : null}

      {/* --- A later Sitting: offered, never required ---------------------- */}
      {baseline.completed && baseline.due !== null ? (
        <Card className="mt-8 border-pink-line bg-pink-50 p-6">
          <Display as="h2" className="text-title text-navy">
            See what you&apos;ve learned
          </Display>
          <p className="mt-3 text-grey">
            You&apos;ve finished a level since your last baseline. Sit the same twenty
            questions again to see how your scores have moved. It&apos;s optional, and it
            doesn&apos;t affect your certificates.
          </p>
          <div className="mt-5">
            <ButtonLink href="/assessment/pre" size="lg">
              Take sitting {baseline.due}
            </ButtonLink>
          </div>
        </Card>
      ) : null}

      {/* --- Knowledge impact --------------------------------------------- */}
      {before ? (
        <Card className="mt-8 overflow-hidden">
          <div className="grid sm:grid-cols-4">
            <Stat label="Before the course" value={`${before.totalPct}%`} sub="Baseline, at signup" />
            <Stat
              label="Latest baseline"
              value={after ? `${after.totalPct}%` : "n/a"}
              sub={after ? `Sitting ${after.sittingNo} of 4` : "After your first level"}
            />
            <Stat
              label="Improvement"
              value={
                after
                  ? `${after.totalPct - before.totalPct >= 0 ? "+" : ""}${after.totalPct - before.totalPct}`
                  : "n/a"
              }
              sub="percentage points"
              emphasis
            />
            <Stat
              label="Modules complete"
              value={`${modulesComplete}/${modulesTotal}`}
              sub={`${levels.length} levels available`}
            />
          </div>
          <div className="border-t border-line px-5 py-4">
            <BaselineResults state={baseline} />
          </div>
        </Card>
      ) : null}

      {/* --- Continue ------------------------------------------------------ */}
      {baseline.completed && nextLevel ? (
        <Card className="mt-6 p-6">
          <Eyebrow>Pick up where you left off</Eyebrow>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="flex-1">
              <Display as="h2" className="text-title text-navy">
                {nextLevel.title}
              </Display>
              <p className="mt-1 text-sm text-grey">
                {nextLevel.progress?.modulesComplete ?? 0} of{" "}
                {nextLevel.progress?.modulesTotal ?? 0} modules complete
              </p>
            </div>
            <ButtonLink
              href={
                nextLevel.progress?.nextModuleSlug
                  ? `/levels/${nextLevel.slug}/modules/${nextLevel.progress.nextModuleSlug}`
                  : `/levels/${nextLevel.slug}`
              }
              size="lg"
            >
              {nextLevel.progress?.status === "NOT_STARTED" ? "Start" : "Continue"}
            </ButtonLink>
          </div>
        </Card>
      ) : null}

      {/* --- Level breakdown ---------------------------------------------- */}
      <section className="mt-10">
        <Display as="h2" className="text-title text-navy">
          Your levels
        </Display>
        <ul className="mt-5 space-y-3">
          {levels.map((level) => {
            const tier = level.tier as LevelTier;
            const meta = TIER_META[tier];
            const p = level.progress;
            const done = p?.status === "COMPLETE";

            return (
              <Card as="li" key={level.slug} className="p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={cx("size-2.5 rounded-full", meta.dotClass)}
                      />
                      <Link
                        href={`/levels/${level.slug}`}
                        className="font-bold text-navy underline decoration-transparent hover:decoration-line-strong"
                      >
                        {level.title}
                      </Link>
                      {done ? <Badge tone="correct">Complete</Badge> : null}
                      {p?.certificatePublicId ? (
                        <Badge tone="pink">Certificate earned</Badge>
                      ) : null}
                    </div>

                    <p className="mt-1 text-sm text-grey">
                      {p?.modulesComplete ?? 0} of {p?.modulesTotal ?? 0} modules
                      {` · ${p?.stagesPassed ?? 0} of ${p?.modulesTotal ?? 0} Stage Quizzes passed`}
                    </p>

                    <div className="mt-3 max-w-md">
                      <ProgressBar
                        value={p?.percentComplete ?? 0}
                        label={`${level.title} progress`}
                        tone={done ? "teal" : "pink"}
                      />
                    </div>
                  </div>

                  <ButtonLink
                    href={`/levels/${level.slug}`}
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                  >
                    {done ? "Review" : p?.status === "IN_PROGRESS" ? "Continue" : "Start"}
                  </ButtonLink>
                </div>
              </Card>
            );
          })}
        </ul>
      </section>

      {/* --- Certificates -------------------------------------------------- */}
      <section className="mt-10">
        <Display as="h2" className="text-title text-navy">
          My certificates
        </Display>

        {certificates.length === 0 ? (
          <p className="mt-4 rounded-card border border-dashed border-line-strong bg-line/40 p-5 text-grey">
            No certificates yet. Finish a level&apos;s modules and pass its assessment to
            earn one. Each level has its own.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {certificates.map((cert) => (
              <Card as="li" key={cert.publicId} className="p-5">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-navy">{cert.awardTitleSnapshot}</p>
                      {cert.revokedAt ? (
                        <Badge tone="incorrect">Revoked</Badge>
                      ) : (
                        <Badge tone="correct">Valid</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-grey">
                      {cert.levelTitle} · issued{" "}
                      {cert.issuedAt.toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-1 font-mono text-xs text-grey">
                      {cert.publicId}
                    </p>
                  </div>
                  <ButtonLink
                    href={`/certificate/${cert.publicId}`}
                    variant="outline"
                    size="sm"
                  >
                    View &amp; download
                  </ButtonLink>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-10 text-sm text-grey">
        Your scores are private to you and are only reported to Save7 in aggregate.{" "}
        <Link href="/privacy" className="underline">
          What we store and why
        </Link>
        .
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  emphasis,
}: {
  label: string;
  value: string;
  sub: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cx(
        "border-b border-line p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0",
        emphasis && "bg-pink-50",
      )}
    >
      <p
        className={cx(
          "text-xs font-bold uppercase tracking-wider",
          emphasis ? "text-pink" : "text-grey",
        )}
      >
        {label}
      </p>
      <p
        className={cx(
          "mt-1.5 font-display text-4xl",
          emphasis ? "text-pink" : "text-navy",
        )}
      >
        {value}
      </p>
      <p className={cx("mt-0.5 text-xs", emphasis ? "text-pink" : "text-grey")}>
        {sub}
      </p>
    </div>
  );
}
