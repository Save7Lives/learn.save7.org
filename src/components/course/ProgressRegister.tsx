import Link from "next/link";
import { percent, sittingSlots, type BaselineState, type Sitting } from "@/lib/baseline";
import type { LevelWithPosition } from "@/lib/course";
import type { CoursePosition, PositionCertificate } from "@/lib/course-position";
import { Icon } from "@/components/ui/icons";
import { ButtonLink } from "@/components/ui/primitives";
import { PortalCard, PromptCard } from "@/components/portal/Portal";
import { BaselineResults } from "./BaselineResults";
import { BaselineTrend, type TrendData } from "./BaselineTrend";

/**
 * My progress (#71, laid out as the "Mix" of four prototypes): the learner's Progress
 * Record as prompts, the Levels as rows, what they have learned so far, the Baseline
 * chart and the certificates. Presentational: the page fetches, this draws, so every state of the
 * record can be rendered from plain data.
 *
 * Every figure counts Stages passed (`stagesPassed`), the same as the Level
 * percentage and the Certificate. Stages merely marked read only decide where
 * "Continue" resumes, and are never shown as a count. Which Level and Stage are next,
 * and whether the Levels are open, are the Student's Course Position, not this file's.
 */

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" });

const signed = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n);

export function ProgressRegister({
  userName,
  baseline,
  levels,
  position,
}: {
  userName: string;
  baseline: BaselineState;
  levels: LevelWithPosition[];
  position: CoursePosition;
}) {
  const { certificates, contentOpen } = position;
  const stagesPassed = levels.reduce((sum, l) => sum + l.position.stagesPassed, 0);
  const stagesTotal = levels.reduce((sum, l) => sum + l.position.stagesTotal, 0);
  const nextLevel = levels.find((l) => l.slug === position.currentLevelSlug) ?? null;
  const anyStarted = levels.some((l) => l.modules.some((m) => m.position.state !== "NOT_STARTED"));

  const before = baseline.first;
  const after = baseline.latestLater;
  const change = before && after ? after.totalPct - before.totalPct : null;

  return (
    // .my-progress staggers its sections in (globals.css).
    <div className="my-progress mx-auto max-w-[52rem] px-4 pb-16 pt-7 sm:px-6">
      <div className="mb-[22px]">
        <h1 className="font-display text-[1.75rem] font-bold leading-tight tracking-[-0.01em] text-navy">
          My progress
        </h1>
        <p className="mt-1 text-grey">
          {userName} &middot;{" "}
          <Link href="#profile" className="font-medium text-teal-ink underline underline-offset-[3px]">
            Edit your name
          </Link>
        </p>
      </div>

      {/* --- Prompts ------------------------------------------------------- */}
      <div className="mb-[22px] grid gap-3.5 empty:hidden">
        {!contentOpen ? (
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

        {contentOpen && baseline.due !== null ? (
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

        {contentOpen && nextLevel ? <NextUp level={nextLevel} anyStarted={anyStarted} /> : null}
      </div>

      {/* --- Your Levels ---------------------------------------------------- */}
      <SectionHead title="Your Levels" note={`${stagesPassed} of ${stagesTotal} Stages passed`} />
      <ul className="mp-rows">
        {levels.map((level, i) => (
          <LevelRow
            key={level.slug}
            level={level}
            open={contentOpen}
            certificate={certificates.find((c) => c.levelSlug === level.slug) ?? null}
            index={i}
          />
        ))}
      </ul>

      {/* --- What you've learned so far ---------------------------------------- */}
      {before && after && change !== null ? (
        <LearnedSoFar baseline={baseline} before={before} after={after} change={change} />
      ) : null}

      {/* --- Your baseline -------------------------------------------------- */}
      <SectionHead title="Your baseline" note="The same 20 questions at every Sitting, so the scores can be compared" />
      <BaselineSection baseline={baseline} />

      {/* --- Certificates --------------------------------------------------- */}
      <SectionHead title="Your certificates" />
      {certificates.length === 0 ? (
        <p className="m-0 rounded-[14px] border-[1.5px] border-dashed border-line-strong bg-white px-5 py-[18px] text-grey">
          No certificates yet. Pass every Stage Quiz in a Level to earn its certificate. Each Level has its own.
        </p>
      ) : (
        <ul className="mp-rows">
          {certificates.map((cert) => (
            <li key={cert.code}>
              <Link href={`/certificate/${cert.code}`} className="mp-row">
                <Icon name="award" className="size-5 shrink-0 text-teal-ink" />
                <span className="min-w-0 flex-1">
                  <span className="mp-row-title">{cert.levelTitle} certificate</span>
                  <span className="block text-sm text-grey">
                    Issued {formatDate(cert.issuedAt)} &middot; <span className="font-mono">{cert.code}</span>
                  </span>
                </span>
                <span className="text-sm font-medium text-teal-ink">View</span>
              </Link>
            </li>
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

function NextUp({ level, anyStarted }: { level: LevelWithPosition; anyStarted: boolean }) {
  const p = level.position;
  const stages = level.modules;
  const slug = p.resumeStageSlug;
  const index = slug ? stages.findIndex((m) => m.slug === slug) : -1;
  const stage = index >= 0 ? stages[index] : null;
  const resuming = stage ? stage.position.state === "STARTED" : false;

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
          className="mp-press"
        >
          {resuming || p.status === "IN_PROGRESS" ? "Continue" : "Start"} <Icon name="arrow" />
        </ButtonLink>
      }
    >
      {level.title} Level
      {stage ? `, Stage ${index + 1} of ${stages.length}` : ""} &middot; {p.stagesPassed} of{" "}
      {p.stagesTotal} Stages passed
    </PromptCard>
  );
}

// --- Baseline ------------------------------------------------------------------

function SlotRow({ baseline }: { baseline: BaselineState }) {
  return (
    <ol aria-label="The four Baseline Sittings" className="m-0 mt-3.5 grid list-none grid-cols-2 gap-2.5 p-0 min-[721px]:grid-cols-4">
      {sittingSlots(baseline).map((slot) => (
        <li
          key={slot.sittingNo}
          className={
            slot.taken
              ? "relative rounded-xl border border-line bg-white py-2.5 pl-4 pr-3 text-sm text-grey before:absolute before:bottom-2.5 before:left-0 before:top-2.5 before:w-1 before:rounded-r-[3px] before:bg-amber before:content-['']"
              : "relative rounded-xl border-[1.5px] border-dashed border-line-strong bg-white py-2.5 pl-4 pr-3 text-sm text-grey"
          }
        >
          <span className="block font-medium text-navy">{slot.name}</span>
          <span className={slot.offered ? "font-medium text-pink" : undefined}>{slot.status}</span>
        </li>
      ))}
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
  const all = sittingSlots(baseline);
  const slots = all.map(({ name, status, taken, offered }) => ({ name, status, taken, offered }));
  const series = baseline.levels.map((level) => ({
    slug: level.slug,
    title: level.title,
    values: all.map(({ sittingNo }) => {
      const s = baseline.sittings.find((x) => x.sittingNo === sittingNo)?.levelScores[level.slug];
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

// --- What you've learned so far --------------------------------------------------

/**
 * The before and after: Sitting 1 against the latest later Sitting, overall in large
 * figures and per Level as paired bars. The same comparison as the Improvement Save7
 * reports, drawn so a learner sees it first; the chart below keeps every Sitting.
 */
function LearnedSoFar({
  baseline,
  before,
  after,
  change,
}: {
  baseline: BaselineState;
  before: Sitting;
  after: Sitting;
  change: number;
}) {
  return (
    <section className="mt-[34px]" aria-labelledby="learned-so-far">
      <h2 id="learned-so-far" className="mp-eyebrow">
        What you&rsquo;ve learned so far
      </h2>
      <div className="mt-2 grid items-end gap-x-10 gap-y-6 sm:grid-cols-[auto_1fr]">
        <div>
          <p className="mp-hero">
            <span className="text-grey">{before.totalPct}%</span>
            <Icon name="arrow" className="mp-hero-arrow" />
            <span className="sr-only">to</span>
            <span>{after.totalPct}%</span>
          </p>
          <p className="mt-2 text-navy">
            <span className="font-medium text-teal-ink">{signed(change)} points</span> on the same 20 questions
          </p>
        </div>

        <dl className="m-0 grid gap-4">
          {baseline.levels.map((level, i) => {
            const b = before.levelScores[level.slug];
            const a = after.levelScores[level.slug];
            if (!b || !a) return null;
            const bp = percent(b.score, b.max);
            const ap = percent(a.score, a.max);
            return (
              <div key={level.slug} style={{ ["--i" as string]: i }}>
                <dt className="flex items-baseline justify-between gap-3">
                  <span className="font-medium text-navy">{level.title}</span>
                  <span className="text-sm tabular-nums text-grey">
                    {bp}% to <span className="font-medium text-navy">{ap}%</span>
                    <span className="ml-2 text-teal-ink">{signed(ap - bp)}</span>
                  </span>
                </dt>
                {/* Hidden from screen readers: the figures above say the same. */}
                <dd className="m-0 mt-1.5 grid gap-1" aria-hidden="true">
                  <span className="mp-pairbar is-before">
                    <span style={{ transform: `scaleX(${bp / 100})` }} />
                  </span>
                  <span className="mp-pairbar">
                    <span style={{ transform: `scaleX(${ap / 100})` }} />
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
      <p
        className="mt-3 flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm text-grey"
        aria-hidden="true"
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-full bg-line-strong" /> First baseline
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-full bg-teal" /> Latest
        </span>
      </p>
    </section>
  );
}

// --- A Level -------------------------------------------------------------------

/**
 * One Level as a row: its name, where it stands in words, and a bar of Stages passed.
 * The whole row opens the Level page, where its Stages are listed.
 */
function LevelRow({
  level,
  open,
  certificate,
  index,
}: {
  level: LevelWithPosition;
  /** Stage content is open: Sitting 1 is in. */
  open: boolean;
  certificate: PositionCertificate | null;
  index: number;
}) {
  const p = level.position;
  const total = p.stagesTotal;
  const passed = p.stagesPassed;
  const pct = total === 0 ? 0 : Math.round((100 * passed) / total);

  const status = !open ? (
    <span className="inline-flex items-center gap-1">
      <Icon name="lock" className="size-4 stroke-[2.25]" />
      Opens after your baseline
    </span>
  ) : certificate ? (
    <span className="inline-flex items-center gap-1 font-medium text-correct">
      <Icon name="award" className="size-4 stroke-[2.25]" />
      Certificate issued
    </span>
  ) : p.complete ? (
    <span className="inline-flex items-center gap-1 font-medium text-correct">
      <Icon name="check-circle" className="size-4 stroke-[2.25]" />
      All Stages passed
    </span>
  ) : p.status === "IN_PROGRESS" ? (
    <span className="font-medium text-navy">In progress</span>
  ) : (
    "Not started"
  );

  return (
    <li style={{ ["--i" as string]: index }}>
      <Link href={`/levels/${level.slug}`} className="mp-row">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="mp-row-title">{level.title}</span>
            <span className="text-sm text-grey">{status}</span>
          </span>
          <span
            className="mp-bar"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${level.title}: ${passed} of ${total} Stages passed`}
          >
            <span style={{ transform: `scaleX(${pct / 100})` }} />
          </span>
          <span className="mt-1.5 block text-sm text-grey">
            {passed} of {total} Stages passed
          </span>
        </span>
        <Icon name="arrow" className="mp-row-arrow size-4 shrink-0 stroke-[2.25]" />
      </Link>
    </li>
  );
}
