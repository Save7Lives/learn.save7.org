/**
 * PROTOTYPE (T58), throwaway. Never merge to main.
 *
 * "Three variants of Beginner Stage 3 (How Donation Actually Works), switchable
 * via ?variant=, rendered through the real ModuleRunner with the real lesson
 * Markdown read from content/."
 *
 * Why a /prototype route and not the real Stage page: that page needs a signed-in
 * learner with Baseline Sitting 1 done, on the production Supabase project, and
 * there is no local database. Everything below the site header here is the real
 * lesson chrome and the real prose; only the variant-specific parts are new.
 *
 *   A  Prose + one film   — renderer unchanged; `video:` front matter on intro.md
 *   B  Small vocabulary   — renderer gains pipe tables and ::video[...]
 *   C  Components return  — ChapterVideo step + ComparePanel, from TS payloads
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { notFound } from "next/navigation";

import { beginnerLevel } from "../../../../../prisma/content/structure";
import { loadLesson } from "../../../../../prisma/content/markdown";
import { Markdown } from "@/components/lesson/Markdown";
import { ChapterVideo } from "@/components/interactive/ChapterVideo";
import { ComparePanel } from "@/components/interactive/ComparePanel";
import { TIER_META } from "@/components/ui/primitives";
import { mediaUrl } from "@/lib/media";
import type { ComparePanelPayload } from "@/lib/lesson-payloads";

import { CHAPTERS_ESTIMATED, FILM, FILM_CORRECTIONS, TRANSCRIPT } from "./film";
import { LessonVideo } from "./LessonVideo";
import { MarkdownB } from "./MarkdownB";
import { PrototypeRunner, type ProtoLesson } from "./PrototypeRunner";

export const dynamic = "force-dynamic";

const VARIANTS = ["A", "B", "C"] as const;
type Variant = (typeof VARIANTS)[number];

const STAGE = beginnerLevel.stages.find((s) => s.slug === "how-donation-works")!;
const HERE = "src/app/(site)/prototype/lesson-presentation";

function prose(slug: string): string {
  const seed = STAGE.lessons.find((l) => l.slug === slug)!;
  return loadLesson(seed.bodyPath!).bodyMarkdown;
}

/** Body of a prototype-only Markdown file: comment and front matter removed. */
function prototypeBody(file: string): string {
  const raw = readFileSync(join(process.cwd(), HERE, file), "utf8");
  return raw
    .replace(/<!--[\s\S]*?-->\s*/g, "")
    .replace(/^---\n[\s\S]*?\n---\n/, "");
}

function CheckPlaceholder() {
  return (
    <div className="rounded-card border border-dashed border-sand-300 p-6 text-sm text-sand-500">
      The Stage Quiz renders here on the real page (#57). Unchanged by every variant.
    </div>
  );
}

function CompletePlaceholder() {
  return (
    <div className="rounded-card border border-dashed border-sand-300 p-6 text-sm text-sand-500">
      The Stage&apos;s completion step renders here on the real page. Unchanged by every variant.
    </div>
  );
}

/** The spine every variant shares; a variant overrides individual steps. */
function baseLessons(render: (md: string) => React.ReactNode): ProtoLesson[] {
  return STAGE.lessons.map((l) => ({
    id: l.slug,
    slug: l.slug,
    title: l.title,
    kind: l.kind,
    content:
      l.kind === "CHECK" ? (
        <CheckPlaceholder />
      ) : l.kind === "COMPLETE" ? (
        <CompletePlaceholder />
      ) : (
        render(prose(l.slug))
      ),
  }));
}

// --- A: prose plus one film ----------------------------------------------------

function variantA(): ProtoLesson[] {
  return baseLessons((md) => <Markdown source={md} />).map((l) =>
    l.slug === "intro"
      ? {
          ...l,
          content: (
            <>
              <div className="mb-8">
                <LessonVideo lead="Save7's explainer. It walks through all three Stages of this Level; this Stage is where it lands." />
              </div>
              <Markdown source={prose("intro")} />
            </>
          ),
        }
      : l,
  );
}

// --- B: a small, fixed vocabulary --------------------------------------------

function variantB(): ProtoLesson[] {
  return baseLessons((md) => <MarkdownB source={md} />).map((l) =>
    l.slug === "routes-to-donation"
      ? { ...l, content: <MarkdownB source={prototypeBody("routes-to-donation.b.md")} /> }
      : l,
  );
}

// --- C: the prior build's components come back -------------------------------

const ORGANS_VS_TISSUE: ComparePanelPayload = {
  columns: [
    { id: "organs", label: "Organs", caption: "Kidneys, liver, heart, lungs, pancreas", emphasis: true },
    { id: "tissue", label: "Tissue", caption: "Corneas, bone, ligaments, skin, heart valves" },
  ],
  rows: [
    {
      id: "where",
      label: "Where it can be recovered",
      cells: {
        organs: "Only in a hospital, from a patient whose circulation has been maintained",
        tissue: "Irrespective of the manner of death, in a far wider range of settings, even after the body has been moved to a mortuary",
      },
    },
    {
      id: "time",
      label: "How long it lasts",
      cells: {
        organs: "Must be transplanted within hours",
        tissue: "Can be stored, so it need not be matched to a waiting recipient the same day",
      },
    },
  ],
};

const FOUR_ROUTES: ComparePanelPayload = {
  columns: [
    { id: "dbd", label: "After brain death", caption: "DBD", emphasis: true },
    { id: "dcd", label: "After circulatory death", caption: "DCD" },
    { id: "living", label: "Living donation" },
    { id: "tissue", label: "Tissue donation" },
  ],
  rows: [
    {
      id: "when",
      label: "When",
      cells: {
        dbd: "A patient on a ventilator is certified brain dead by two independent doctors",
        dcd: "Treatment is withdrawn where death is expected, and the heart stops",
        living: "While the donor is alive and well, by their own decision",
        tissue: "Irrespective of the manner of death, and much later than organ donation",
      },
    },
    {
      id: "what",
      label: "What can be donated",
      cells: {
        dbd: "Heart, lungs, liver, kidneys and pancreas, plus tissue",
        dcd: "Depends on the circumstances and on how quickly recovery can follow",
        living: "A kidney, or a segment of liver",
        tissue: "Corneas, bone and ligaments, skin, heart valves",
      },
    },
    {
      id: "consent",
      label: "Who consents",
      cells: {
        dbd: "Next of kin",
        dcd: "Next of kin",
        living: "The donor — the only route where they do",
        tissue: "Next of kin",
      },
    },
  ],
  bottomLine:
    "Most deceased organ donation in South Africa follows one of the first two routes, and both require consent from next of kin.",
};

function variantC(): ProtoLesson[] {
  const routes = prose("routes-to-donation");
  const cut = (from: string, to?: string) =>
    routes.slice(routes.indexOf(from), to ? routes.indexOf(to) : undefined).trim();

  const routesContent = (
    <>
      <Markdown source={cut("## Organs and tissue", "**Organs** —")} />
      <div className="my-8">
        <ComparePanel payload={ORGANS_VS_TISSUE} />
      </div>
      <Markdown source={cut("That difference is why", "## The four routes")} />
      <div className="mt-10">
        <Markdown source="## The four routes" />
      </div>
      <div className="my-6">
        <ComparePanel payload={FOUR_ROUTES} />
      </div>
      <Markdown source={cut("## The two teams")} />
    </>
  );

  const watch: ProtoLesson = {
    id: "watch",
    slug: "watch",
    title: "Watch: The Journey of a Gift",
    kind: "PRIMARY",
    content: (
      <>
        <div className="mb-8">
          <Markdown
            source={[
              "Save7's seven-minute explainer. It covers all three Stages of this Level, and it is the one film in the Course.",
              "**Before you watch: three details in the film don't match this course.** Go with the course; so does the Stage Quiz.",
              FILM_CORRECTIONS.map((c) => `- The film says *${c.film}*. The course says **${c.course}**.`).join("\n"),
            ].join("\n\n")}
          />
        </div>
        <ChapterVideo
          payload={{
            title: FILM.title,
            src: mediaUrl(FILM.src) ?? undefined,
            durationSeconds: FILM.durationSeconds,
            transcript: TRANSCRIPT,
            chapters: CHAPTERS_ESTIMATED,
          }}
        />
      </>
    ),
  };

  const lessons = baseLessons((md) => <Markdown source={md} />).map((l) =>
    l.slug === "routes-to-donation" ? { ...l, content: routesContent } : l,
  );
  const introAt = lessons.findIndex((l) => l.slug === "intro");
  lessons.splice(introAt + 1, 0, watch);
  return lessons;
}

// --- The route ----------------------------------------------------------------

const META: Record<Variant, { name: string; changedStep: string; notes: string[] }> = {
  A: {
    name: "Prose + one film",
    changedStep: "intro",
    notes: [
      "Authoring: one line of front matter on intro.md — `video: journey-of-a-gift`. The renderer does not change at all.",
      "The film is the first thing a learner meets in Stage 3. Tables stay lists (see “Learn”).",
      "New code: one server component (a <video>, the corrections note, a transcript). No payloads, no client JS.",
    ],
  },
  B: {
    name: "Small vocabulary: tables + ::video",
    changedStep: "routes-to-donation",
    notes: [
      "Authoring: pipe tables and a `::video[journey-of-a-gift]` line, written straight into the Markdown.",
      "The renderer grows by two block types, both still escape-first. The directive names a film from a fixed list, never a URL.",
      "The film sits mid-lesson, after the four routes. Try a phone width: 4-column tables scroll sideways.",
    ],
  },
  C: {
    name: "Prior build's components return",
    changedStep: "watch",
    notes: [
      "Authoring: TypeScript payloads (ComparePanel ×2, ChapterVideo), kept apart from the Markdown they interrupt.",
      "The film gets its own step with a chapter list. Chapter times here are ESTIMATED from the transcript; real ones would have to be timed.",
      "ComparePanel is a table on wide screens and a column picker on phones. The spine grows to 8 steps.",
    ],
  },
};

export default async function LessonPresentationPrototype(props: {
  searchParams: Promise<{ variant?: string; at?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { variant: raw, at } = await props.searchParams;
  const variant: Variant = VARIANTS.includes(raw as Variant) ? (raw as Variant) : "A";

  const lessons =
    variant === "A" ? variantA() : variant === "B" ? variantB() : variantC();
  const wanted = at ?? META[variant].changedStep;
  const index = Math.max(
    0,
    lessons.findIndex((l) => l.slug === wanted),
  );

  return (
    <PrototypeRunner
      key={variant}
      variant={variant}
      variants={VARIANTS.map((v) => ({ key: v, name: META[v].name }))}
      notes={META[variant].notes}
      changedStepTitle={lessons.find((l) => l.slug === META[variant].changedStep)?.title ?? ""}
      lessons={lessons}
      initialLessonIndex={index}
      moduleTitle={STAGE.title}
      moduleNumber={STAGE.number}
      coreQuestion={STAGE.coreQuestion}
      estMinutes={STAGE.estMinutes}
      levelTitle={beginnerLevel.title}
      tierLabel={TIER_META.BEGINNER.label}
      tierDotClass={TIER_META.BEGINNER.dotClass}
    />
  );
}
