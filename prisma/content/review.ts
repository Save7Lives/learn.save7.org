import { beginnerLevel } from "./level-beginner";
import { intermediateLevel } from "./level-intermediate";
import { advancedLevel } from "./level-advanced";
import { questionSeeds } from "./questions";
import { resourceSeeds } from "./resources";
import type { LevelSeed, ReviewSeed } from "./types";

/**
 * The content-review register, derived from the content.
 *
 * Rather than maintaining a separate hand-written list that would immediately
 * drift out of date, the register is *generated* by walking the authored payloads
 * for `pendingReview` flags and stub resources. A claim cannot be added to the
 * course without appearing in Save7's review queue, because the queue is built
 * from the same objects.
 *
 * Extracted from the old seed when the backend moved to Supabase. That seed wrote
 * rows into a local SQLite file; the register is now emitted into the migration
 * that loads the course, and this is the one definition both the course content
 * and scripts/emit-supabase-content.ts read.
 */

const levels: LevelSeed[] = [beginnerLevel, intermediateLevel, advancedLevel];

function truncate(s: string, n = 240): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > n ? `${clean.slice(0, n - 1)}…` : clean;
}

/** The two modules carrying the heaviest verification burden. */
function categoriseFor(moduleSlug: string): ReviewSeed["category"] {
  if (moduleSlug === "the-law") return "LEGAL";
  if (moduleSlug === "why-are-we-losing-organs") return "STATISTIC";
  return "MEDICAL";
}

function severityFor(moduleSlug: string): 1 | 2 | 3 {
  // Module 12 is on this list because it teaches FACTS — a named framework
  // belonging to someone else, reconstructed from a second-hand description.
  // Misstating another organisation's own strategy is not a minor error.
  return moduleSlug === "the-law" ||
    moduleSlug === "what-does-death-mean" ||
    moduleSlug === "who-can-donate" ||
    moduleSlug === "art-of-the-conversation"
    ? 1
    : 2;
}

function sourceHintFor(moduleSlug: string): string | undefined {
  switch (moduleSlug) {
    case "what-does-death-mean":
      return "Checked against Thomson D, et al. South African guidelines on the determination of death. SAJCC 2021;37(1):466. Confirm this is still the current edition.";
    case "the-law":
      return "Checked against the National Health Act 61 of 2003 as gazetted, plus Regulation 9 of GN R180 (2 March 2012) as described in the peer-reviewed literature. Still needs a qualified legal review against the current consolidated text and the gazetted regulations.";
    case "who-can-donate":
      return "Current authoritative guidance on donor suitability — not an older study guide.";
    case "why-are-we-losing-organs":
      return "Current South African donation statistics, date-stamped at publication.";
    default:
      return "Save7 study guide and supporting literature.";
  }
}

/**
 * Content-review items derived from the content itself.
 *
 * Rather than maintaining a separate hand-written list that would immediately
 * drift out of date, the register is *generated* by walking the seeded payloads
 * for `pendingReview` flags and stub resources. A claim cannot be added to the
 * course without appearing in Save7's review queue, because the queue is built
 * from the same objects.
 */
/**
 * Exported so the Supabase content generator derives the same register.
 *
 * scripts/emit-supabase-content.ts writes the course into the Supabase migration
 * that loads it, and the review register has to be derived from the content
 * rather than authored twice — the whole point of it is that a claim cannot enter
 * the course without appearing in Save7's queue.
 */
export function deriveReviewItems(): ReviewSeed[] {
  const items: ReviewSeed[] = [];

  // Walk every lesson payload looking for pendingReview markers.
  for (const level of levels) {
    for (const mod of level.modules) {
      const where = `M${mod.number} · ${mod.title}`;

      for (const lesson of mod.lessons) {
        const ref = `${level.slug}/${mod.slug}/${lesson.slug}`;
        const payload = lesson.payload as Record<string, unknown> | undefined;
        if (!payload) continue;

        /** Recursively collect anything flagged for review. */
        const visit = (node: unknown, path: string): void => {
          if (Array.isArray(node)) {
            node.forEach((child, i) => visit(child, `${path}[${i}]`));
            return;
          }
          if (!node || typeof node !== "object") return;

          const obj = node as Record<string, unknown>;

          if (obj.pendingReview === true) {
            const label =
              (obj.name as string) ??
              (obj.role as string) ??
              (obj.factor as string) ??
              (obj.label as string) ??
              (obj.heading as string) ??
              (obj.myth as string) ??
              (obj.speaker as string) ??
              (obj.text as string) ??
              path;

            items.push({
              entityType: "LESSON",
              entityRef: `${ref}#${path}`,
              location: `${where} › ${lesson.title}`,
              claim: truncate(String(label)),
              category: categoriseFor(mod.slug),
              severity: severityFor(mod.slug),
              sourceHint: (obj.reviewSourceHint as string) ?? sourceHintFor(mod.slug),
              notes:
                obj.awaitingContent === true
                  ? "Body text is a placeholder awaiting the Save7 study guide."
                  : undefined,
            });
          }

          if (obj.bottomLinePendingReview === true && typeof obj.bottomLine === "string") {
            items.push({
              entityType: "LESSON",
              entityRef: `${ref}#bottomLine`,
              location: `${where} › ${lesson.title}`,
              claim: truncate(obj.bottomLine),
              category: categoriseFor(mod.slug),
              severity: 1,
              sourceHint: (obj.reviewSourceHint as string) ?? sourceHintFor(mod.slug),
              notes: "Summary statement shown prominently to learners.",
            });
          }

          for (const [key, value] of Object.entries(obj)) {
            if (typeof value === "object" && value !== null) {
              visit(value, path ? `${path}.${key}` : key);
            }
          }
        };

        visit(payload, "");
      }
    }
  }

  // Every stub resource is a citation Save7 must complete.
  for (const r of resourceSeeds) {
    if (!r.isStub) continue;
    items.push({
      entityType: "RESOURCE",
      entityRef: `resource:${r.key}`,
      location: r.moduleSlug ? `Resource · ${r.moduleSlug}` : "Resource · course-wide",
      claim: `Incomplete citation: "${r.title}"`,
      category: r.type === "WEBSITE" || r.title.toLowerCase().includes("act") ? "LEGAL" : "MEDICAL",
      severity: r.isRequired ? 1 : 2,
      sourceHint: r.licenceNote ?? "Awaiting Save7's reference list.",
      notes: "No author, year or identifier has been invented for this resource.",
    });
  }

  // Every assessment item is signed off too — a wrong quiz answer teaches a
  // wrong fact just as effectively as a wrong lesson.
  for (const q of questionSeeds) {
    items.push({
      entityType: "QUESTION",
      entityRef: `question:${q.key}`,
      location: `Assessment · ${q.scope}${q.levelSlug ? ` · ${q.levelSlug}` : ""}${
        q.moduleSlug ? ` · ${q.moduleSlug}` : ""
      }`,
      claim: truncate(q.prompt),
      category:
        q.topicTag === "law"
          ? "LEGAL"
          : ["conversation", "advocacy-integrity", "family-conversation"].includes(q.topicTag)
            ? "MEDICAL"
            : "MEDICAL",
      severity: q.topicTag === "law" || q.topicTag === "brain-death" ? 1 : 2,
      sourceHint:
        "Derived from Save7's own course brief and stated key messages. Confirm against the study guide.",
      notes: "Confirm the keyed correct answer and the explanation text.",
    });
  }

  return items;
}
