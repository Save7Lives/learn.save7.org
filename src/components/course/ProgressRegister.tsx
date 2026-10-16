import Link from "next/link";
import {
  MAX_SITTINGS,
  levelImprovement,
  percent,
  sittingLabel,
  type BaselineState,
} from "@/lib/baseline";
import type { StageState, LevelWithProgress } from "@/lib/course";
import { Icon } from "@/components/ui/icons";
import { ButtonLink, ProgressBar } from "@/components/ui/primitives";
import {
  IconChip,
  PortalCard,
  PromptCard,
  RailStepper,
  StatCard,
  StatusPill,
  tintAt,
  type RailStep,
} from "@/components/portal/Portal";
import { BaselineResults } from "./BaselineResults";
import { BaselineTrend, type TrendData } from "./BaselineTrend";

/**
 * My progress, as the Portal Register (#71): the learner's Progress Record laid out
 * as prompts, headline figures, the Baseline, one card per Level and the
 * certificates. Presentational: the page fetches, this draws, so every state of the
 * record can be rendered from plain data.
 *
 * Every figure counts Stages passed (`stagesPassed`), the same as the Level
 * percentage and the Certificate. Stages merely marked read only decide where
 * "Continue" resumes, and are never shown as a count.
 */

type Certificate = {
  publicId: string;
  levelSlug: string | null;
  levelTitle: string;
  awardTitleSnapshot: string;
  issuedAt: Date;
  revokedAt: Date | null;
};

const SLOT_NAMES = ["At signup", "After Beginner", "After Intermediate", "After Advanced"];

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" });

const signed = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n);

export function ProgressRegister({
  userName,
  baseline,
  levels,
  certificates,
}: {
  userName: string;
  baseline: BaselineState;
  levels: LevelWithProgress[];
  certificates: Certificate[];
}) {
  const stagesPassed = levels.reduce((sum, l) => sum + (l.progress?.stagesPassed ?? 0), 0);
  const stagesTotal = levels.reduce((sum, l) => sum + (l.progress?.modulesTotal ?? 0), 0);
  const nextLevel = levels.find((l) => l.progress?.status !== "COMPLETE") ?? null;
  const anyStarted = levels.some((l) => (l.progress?.stageStates ? Object.values(l.progress.stageStates).some((s) => s !== "NOT_STARTED") : false));

  const taken = baseline.sittings.length;
  const latest = baseline.sittings[taken - 1] ?? null;
  const before = baseline.first;
  const after = baseline.latestLater;
  const change = before && after ? after.totalPct - before.totalPct : null;

  return (
    <div className="mx-auto max-w-[70rem] px-4 pb-16 pt-7 sm:px-6">
      <div className="mb-[22px]">
        <h1 className="font-display text-[1.75rem] font-bold leading-tight tracking-[-0.01em] text-navy">
          My progress
        </h1>
        <p className="mt-1 text-grey">
          {userName} &middot;{" "}
          <Link href="/profile" className="font-medium text-teal-ink underline underline-offset-[3px]">
            Edit your name
          </Link>
        </p>
      </div>

      {/* --- Prompts ------------------------------------------------------- */}
      <div className="mb-[22px] grid gap-3.5 empty:hidden">
        {!baseline.completed ? (
          <PromptCard
            tone="pink"
            icon="chart"
            eyebrow="Start here"
            title="Start with the baseline"
            action={
              <ButtonLink href="/assessment/pre" size="lg">
                Start the baseline assessment <Icon name="arrow" />
              </ButtonLink>
            }
          >
            Twenty short questions before you begin. There is no pass mark. It is the &ldquo;before&rdquo; that
            shows what you learn, so the Levels open once it is done.
          </PromptCard>
        ) : null}

        {baseline.completed && baseline.due !== null ? (
          <PromptCard
            tone="pink"
            icon="chart"
            eyebrow="Optional"
            title="See what you&rsquo;ve learned"
            action={
              <ButtonLink href="/assessment/pre" variant="outline" className="border-navy">
                Take Sitting {baseline.due}
              </ButtonLink>
            }
          >
            You&rsquo;ve finished a Level since your last baseline. Sit the same twenty questions again to see
            how your scores have moved. It&rsquo;s optional, and it doesn&rsquo;t affect your certificates.
          </PromptCard>
        ) : null}

        {baseline.completed && nextLevel ? <NextUp level={nextLevel} anyStarted={anyStarted} /> : null}
      </div>

      {/* --- Headline figures ---------------------------------------------- */}
      <div
        role="group"
        aria-label="Headline figures"
        className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(13.75rem,1fr))] sm:gap-4"
      >
        <StatCard
          label="Stages passed"
          value={String(stagesPassed)}
          unit={`of ${stagesTotal}`}
          sub="Stage Quizzes passed"
          icon="book"
          tint={tintAt(0)}
        />
        <StatCard
          label="Certificates"
          value={String(certificates.length)}
          unit={`of ${levels.length}`}
          sub={
            certificates.length > 0
              ? certificates.map((c) => c.levelTitle).join(", ")
              : "One for each Level"
          }
          icon="award"
          tint={tintAt(1)}
        />
        <StatCard
          label="Baseline Sittings"
          value={String(taken)}
          unit={`of ${MAX_SITTINGS}`}
          sub={latest ? `Latest score ${latest.totalPct}%` : "Not sat yet"}
          icon="chart"
          tint={tintAt(2)}
        />
        <StatCard
          label="Improvement"
          value={change === null ? "n/a" : signed(change)}
          unit={change === null ? undefined : "points"}
          sub={
            before && after
              ? `Baseline ${before.totalPct}% to ${after.totalPct}%`
              : taken > 0
                ? "After your first Level"
                : "After your baseline"
          }
          icon="trend"
          tint={tintAt(3)}
        />
      </div>

      {/* --- Your baseline -------------------------------------------------- */}
      <SectionHead title="Your baseline" note="The same 20 questions at every Sitting, so the scores can be compared" />
      <BaselineSection baseline={baseline} />

      {/* --- Your Levels ---------------------------------------------------- */}
      <SectionHead title="Your Levels" note={`${stagesPassed} of ${stagesTotal} Stages passed`} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(18.75rem,1fr))] items-start gap-4">
        {levels.map((level) => (
          <LevelProgressCard
            key={level.slug}
            level={level}
            baseline={baseline}
            certificate={certificates.find((c) => c.levelSlug === level.slug && !c.revokedAt) ?? null}
            isNext={nextLevel?.slug === level.slug}
          />
        ))}
      </div>

      {/* --- Certificates --------------------------------------------------- */}
      <SectionHead title="Your certificates" />
      {certificates.length === 0 ? (
        <p className="m-0 rounded-[14px] border-[1.5px] border-dashed border-line-strong bg-white px-5 py-[18px] text-grey">
          No certificates yet. Pass every Stage Quiz in a Level to earn its certificate. Each Level has its own.
        </p>
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0">
          {certificates.map((cert, i) => (
            <PortalCard as="li" key={cert.publicId} className="flex flex-wrap items-center gap-3.5">
              <IconChip icon="award" tint={tintAt(i)} />
              <div className="min-w-0 flex-[1_1_16rem]">
                <p className="flex flex-wrap items-center gap-2 font-display font-bold text-navy">
                  {cert.awardTitleSnapshot}
                  {cert.revokedAt ? (
                    <StatusPill tone="warn" icon="x-circle">
                      Revoked
                    </StatusPill>
                  ) : (
                    <StatusPill tone="done" icon="check-circle">
                      Valid
                    </StatusPill>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-grey">
                  {cert.levelTitle} Level &middot; issued {formatDate(cert.issuedAt)}
                </p>
                <p className="mt-0.5 font-mono text-[0.8125rem] text-grey">{cert.publicId}</p>
              </div>
              <ButtonLink href={`/certificate/${cert.publicId}`} variant="outline" size="sm" className="border-navy">
                View and download
              </ButtonLink>
            </PortalCard>
          ))}
        </ul>
      )}

      <p className="mt-[34px] text-sm text-grey">
        Your scores are private to you and are only reported to Save7 in aggregate.{" "}
        <Link href="/privacy" className="font-medium text-teal-ink underline underline-offset-[3px]">
          What we store and why
        </Link>
        .
      </p>
    </div>
  );
}

function SectionHead({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-3 mt-[34px] flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
      <h2 className="font-display text-[1.375rem] font-bold leading-tight text-navy">{title}</h2>
      {note ? <span className="text-sm text-grey">{note}</span> : null}
    </div>
  );
}

// --- Next up -------------------------------------------------------------------

function NextUp({ level, anyStarted }: { level: LevelWithProgress; anyStarted: boolean }) {
  const p = level.progress;
  const stages = level.modules.filter((m) => m.isMandatory);
  const slug = p?.nextModuleSlug ?? null;
  const index = slug ? stages.findIndex((m) => m.slug === slug) : -1;
  const stage = index >= 0 ? stages[index] : null;
  const resuming = stage ? p?.stageStates[stage.slug] === "STARTED" : false;

  return (
    <PromptCard
      tone="white"
      icon="book"
      eyebrow={anyStarted ? "Pick up where you left off" : "Your first Stage"}
      title={stage ? stage.title : level.title}
      action={
        <ButtonLink
          href={slug ? `/levels/${level.slug}/modules/${slug}` : `/levels/${level.slug}`}
          size="lg"
        >
          {resuming || p?.status === "IN_PROGRESS" ? "Continue" : "Start"} <Icon name="arrow" />
        </ButtonLink>
      }
    >
      {level.title} Level
      {stage ? `, Stage ${index + 1} of ${stages.length}` : ""} &middot; {p?.stagesPassed ?? 0} of{" "}
      {p?.modulesTotal ?? 0} Stages passed
    </PromptCard>
  );
}

// --- Baseline ------------------------------------------------------------------

function slotStatus(baseline: BaselineState, i: number): string {
  const sitting = baseline.sittings.find((s) => s.sittingNo === i + 1);
  if (sitting) return `${sitting.totalScore} of ${sitting.totalMax}`;
  if (baseline.due === i + 1) return i === 0 ? "Do this first" : "Offered now";
  return "Not yet";
}

function SlotRow({ baseline }: { baseline: BaselineState }) {
  return (
    <ol aria-label="The four Baseline Sittings" className="m-0 mt-3.5 grid list-none grid-cols-2 gap-2.5 p-0 min-[721px]:grid-cols-4">
      {SLOT_NAMES.map((name, i) => {
        const takenSlot = baseline.sittings.some((s) => s.sittingNo === i + 1);
        const offered = baseline.due === i + 1;
        return (
          <li
            key={name}
            className={
              takenSlot
                ? "relative rounded-xl border border-line bg-white py-2.5 pl-4 pr-3 text-sm text-grey before:absolute before:bottom-2.5 before:left-0 before:top-2.5 before:w-1 before:rounded-r-[3px] before:bg-amber before:content-['']"
                : "relative rounded-xl border-[1.5px] border-dashed border-line-strong bg-white py-2.5 pl-4 pr-3 text-sm text-grey"
            }
          >
            <span className="block font-medium text-navy">{name}</span>
            <span className={offered ? "font-medium text-pink" : undefined}>{slotStatus(baseline, i)}</span>
          </li>
        );
      })}
    </ol>
  );
}

function BaselineSection({ baseline }: { baseline: BaselineState }) {
  const taken = baseline.sittings.length;

  if (taken === 0) {
    return (
      <PortalCard>
        <Eyebrow>Your starting point</Eyebrow>
        <p className="mt-1 text-grey">
          Your baseline scores appear here once you have sat the first Sitting. It is the &ldquo;before&rdquo; that
          every later Sitting is compared with.
        </p>
        <SlotRow baseline={baseline} />
      </PortalCard>
    );
  }

  if (taken === 1) {
    const first = baseline.sittings[0];
    return (
      <PortalCard>
        <Eyebrow>Your starting point</Eyebrow>
        <div className="mt-1.5 grid grid-cols-[repeat(auto-fit,minmax(9.375rem,1fr))] gap-3">
          {baseline.levels.map((level) => {
            const s = first.levelScores[level.slug];
            return (
              <Tile
                key={level.slug}
                label={level.title}
                value={s ? `${percent(s.score, s.max)}%` : "n/a"}
                raw={s ? `${s.score} of ${s.max}` : ""}
              />
            );
          })}
          <Tile label="Overall" value={`${first.totalPct}%`} raw={`${first.totalScore} of ${first.totalMax}`} total />
        </div>
        <SlotRow baseline={baseline} />
        <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-teal-line bg-teal-50 px-3.5 py-3 text-[0.9375rem] text-navy">
          <Icon name="info" className="mt-0.5 size-5 shrink-0 text-teal-ink" />
          <p>
            This is your starting point. Finish your first Level, then sit the same 20 questions again, and each
            line will begin to move.
          </p>
        </div>
      </PortalCard>
    );
  }

  return (
    <PortalCard>
      <BaselineTrend data={trendData(baseline)} />
      <details className="mt-3.5">
        <summary className="cursor-pointer text-[0.9375rem] font-medium text-teal-ink">View as a table</summary>
        <div className="mt-2">
          <BaselineResults state={baseline} />
        </div>
      </details>
    </PortalCard>
  );
}

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="font-display text-[0.8125rem] font-bold uppercase leading-snug tracking-[0.07em] text-teal-ink">
      {children}
    </p>
  );
}

function Tile({ label, value, raw, total }: { label: string; value: string; raw: string; total?: boolean }) {
  return (
    <div className={total ? "rounded-[14px] border border-teal-line bg-teal-50 px-4 py-3.5" : "rounded-[14px] border border-line px-4 py-3.5"}>
      <p className="text-sm text-grey">{label}</p>
      <p className="mt-0.5 font-display text-[1.75rem] font-extrabold leading-tight text-navy">{value}</p>
      <p className="text-sm text-grey">{raw}</p>
    </div>
  );
}

/** What the chart draws, from the same Sittings the table twin lists. */
export function trendData(baseline: BaselineState): TrendData {
  const slots = SLOT_NAMES.map((fixed, i) => {
    const sitting = baseline.sittings.find((s) => s.sittingNo === i + 1);
    return {
      name: sitting ? sittingLabel(baseline, sitting) : fixed,
      status: slotStatus(baseline, i),
      taken: !!sitting,
      offered: baseline.due === i + 1,
    };
  });
  const series = baseline.levels.map((level) => ({
    slug: level.slug,
    title: level.title,
    values: SLOT_NAMES.map((_, i) => {
      const s = baseline.sittings.find((x) => x.sittingNo === i + 1)?.levelScores[level.slug];
      return s ? percent(s.score, s.max) : null;
    }),
  }));
  const summary =
    "Baseline trend by Level. " +
    series
      .map((s) => `${s.title}: ${s.values.filter((v) => v !== null).map((v) => `${v}%`).join(", then ")}.`)
      .join(" ");
  return { slots, series, summary };
}

// --- A Level -------------------------------------------------------------------

function LevelProgressCard({
  level,
  baseline,
  certificate,
  isNext,
}: {
  level: LevelWithProgress;
  baseline: BaselineState;
  certificate: Certificate | null;
  isNext: boolean;
}) {
  const p = level.progress;
  const stages = level.modules.filter((m) => m.isMandatory);
  const total = p?.modulesTotal ?? stages.length;
  const passed = p?.stagesPassed ?? 0;
  const pct = total === 0 ? 0 : Math.round((100 * passed) / total);
  const complete = p?.status === "COMPLETE";
  const open = baseline.completed;

  const pill = !open ? (
    <StatusPill tone="none" icon="lock">
      Opens after your baseline
    </StatusPill>
  ) : certificate ? (
    <StatusPill tone="done" icon="award">
      Certificate issued
    </StatusPill>
  ) : complete ? (
    <StatusPill tone="done" icon="check-circle">
      All Stages passed
    </StatusPill>
  ) : p?.status === "IN_PROGRESS" ? (
    <StatusPill tone="progress" icon="clock">
      In progress
    </StatusPill>
  ) : (
    <StatusPill tone="none" icon="circle">
      Not started
    </StatusPill>
  );

  const completedAt = baseline.levelsCompleted.find((c) => c.slug === level.slug)?.completedAt ?? null;
  const improvement = levelImprovement(baseline.sittings, level.slug, completedAt);

  const steps: RailStep[] = stages.map((stage) => {
    const state: StageState = p?.stageStates[stage.slug] ?? "NOT_STARTED";
    const current =
      open && !complete && stage.slug === p?.nextModuleSlug && (p?.status === "IN_PROGRESS" || isNext);
    const href = open ? `/levels/${level.slug}/modules/${stage.slug}` : undefined;
    if (!open) return { key: stage.slug, title: stage.title, state: "locked", status: "Locked" };
    if (state === "PASSED") return { key: stage.slug, title: stage.title, state: "passed", status: "Passed", href };
    if (current) {
      return {
        key: stage.slug,
        title: stage.title,
        state: "current",
        status: state === "STARTED" ? "In progress" : "Up next",
        href,
      };
    }
    return {
      key: stage.slug,
      title: stage.title,
      state: "todo",
      status: state === "STARTED" ? "In progress" : "Not started",
      href,
    };
  });

  return (
    <PortalCard as="article" aria-label={`${level.title} Level`}>
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <h3 className="font-display text-lg font-bold leading-snug text-navy">
          <Link href={`/levels/${level.slug}`} className="no-underline hover:underline underline-offset-[3px]">
            {level.title}
          </Link>
        </h3>
        {pill}
      </div>

      <ProgressBar
        value={pct}
        tone="teal"
        label={`${level.title}: ${passed} of ${total} Stages passed`}
        className="mt-3.5"
      />
      <div className="mt-2 flex justify-between gap-2.5 text-sm text-grey">
        <span>
          {passed} of {total} Stages passed
        </span>
        <span className="font-medium text-navy">{pct}%</span>
      </div>

      {improvement ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-grey">
          <Icon name="trend" className="size-5 shrink-0 text-teal-ink" />
          <span>
            Improvement{" "}
            <span className="font-medium text-navy">
              {improvement.beforePct}% to {improvement.afterPct}%
            </span>
          </span>
          <StatusPill tone="done" icon="trend">
            {signed(improvement.change)} pts
          </StatusPill>
        </div>
      ) : complete ? (
        <div className="mt-3 flex items-center gap-2.5 text-sm text-grey">
          <Icon name="trend" className="size-5 shrink-0 text-teal-ink" />
          <span>Sit the baseline again to see your improvement.</span>
        </div>
      ) : null}

      <RailStepper steps={steps} label={`${level.title} Stages`} />

      <div className="mt-3.5 flex flex-wrap items-center gap-2.5 border-t border-line pt-3 text-sm text-grey">
        {certificate ? (
          <>
            <Icon name="award" className="size-5 shrink-0 text-teal-ink" />
            <span>Issued {formatDate(certificate.issuedAt)}</span>
            <span className="flex-1" />
            <Link
              href={`/certificate/${certificate.publicId}`}
              className="font-medium text-teal-ink underline underline-offset-[3px]"
            >
              View
            </Link>
          </>
        ) : (
          <>
            <Icon name="lock" className="size-5 shrink-0 text-grey" />
            <span>Certificate after all {total} Stage Quizzes</span>
          </>
        )}
      </div>
    </PortalCard>
  );
}
