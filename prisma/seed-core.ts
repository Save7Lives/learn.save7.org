/**
 * The seeding logic itself, with no database driver of its own.
 *
 * Split out of seed.ts so it can run in two places against the same code:
 *
 *   - the CLI (`npm run db:seed`), against local SQLite or Postgres
 *   - a deployed Worker (`POST /api/admin/reseed`), against Cloudflare D1
 *
 * That second path is what makes the content-review register actionable: when
 * Save7 signs off a correction, the corrected content has to reach production
 * without a database migration or a hand-written SQL import. Nothing here may
 * import a driver — better-sqlite3 is a native module and would break the
 * Workers build.
 */

import { and, eq, inArray, notInArray, sql } from "drizzle-orm";

import type { Db } from "../src/lib/db";
import {
  choices,
  contentReviewItems,
  courses,
  lessons,
  levels as levelsTable,
  modules as modulesTable,
  questions,
  quizAnswers,
  resources,
  users,
} from "../src/db/schema";
import bcrypt from "bcryptjs";
import { COURSE_SLUG } from "../src/lib/constants";
import { beginnerLevel } from "./content/level-beginner";
import { intermediateLevel } from "./content/level-intermediate";
import { advancedLevel } from "./content/level-advanced";
import { questionSeeds } from "./content/questions";
import { resourceSeeds } from "./content/resources";
import type { LevelSeed, ReviewSeed } from "./content/types";

/**
 * Assigned by seedContent() before anything runs.
 *
 * Module-level and mutable so the several hundred `db.` call sites below did not
 * all have to be rewritten to thread a client parameter through.
 */
let db: Db;

export type SeedOptions = {
  /**
   * Create the development admin account with its known weak password.
   * Never enable this in production — it would publish a working admin login.
   */
  createDevAdmin?: boolean;
  /** Where progress lines go. Defaults to console.log. */
  log?: (message: string) => void;
};


const levels: LevelSeed[] = [beginnerLevel, intermediateLevel, advancedLevel];

/**
 * Content-review items derived from the content itself.
 *
 * Rather than maintaining a separate hand-written list that would immediately
 * drift out of date, the register is *generated* by walking the seeded payloads
 * for `pendingReview` flags and stub resources. A claim cannot be added to the
 * course without appearing in Save7's review queue, because the queue is built
 * from the same objects.
 */
function deriveReviewItems(): ReviewSeed[] {
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
      return "South African guidelines on the determination of death (current edition).";
    case "the-law":
      return "National Health Act, current consolidated text. Requires legal verification.";
    case "who-can-donate":
      return "Current authoritative guidance on donor suitability — not an older study guide.";
    case "why-are-we-losing-organs":
      return "Current South African donation statistics, date-stamped at publication.";
    default:
      return "Save7 study guide and supporting literature.";
  }
}


export async function seedContent(
  client: Db,
  options: SeedOptions = {},
): Promise<void> {
  db = client;
  const log = options.log ?? ((m: string) => console.log(m));

  log("Seeding Save7 · Transplant Alchemy 101\n");

  // --- Course --------------------------------------------------------------
  const courseFields = {
    title: "Transplant Alchemy 101",
    subtitle: "Save7 Organ Donation & Transplantation Awareness Course",
    description:
      "A three-level learning pathway. Some people join Save7 already understanding the transplant landscape in South Africa; others have never been exposed to the organ donation crisis. What everyone has in common is a passion for educating others.",
    isPublished: true,
  };
  const [course] = await db
    .insert(courses)
    .values({ slug: COURSE_SLUG, ...courseFields })
    .onConflictDoUpdate({ target: courses.slug, set: courseFields })
    .returning();
  log(`  course      ${course.title}`);

  // --- Levels, modules, lessons -------------------------------------------
  const moduleIdBySlug = new Map<string, string>();
  const levelIdBySlug = new Map<string, string>();
  const lessonIdByRef = new Map<string, string>();

  let moduleCount = 0;
  let lessonCount = 0;

  for (const [levelIndex, level] of levels.entries()) {
    const levelFields = {
      order: levelIndex + 1,
      tier: level.tier,
      title: level.title,
      strapline: level.strapline,
      goal: level.goal,
      estMinMinutes: level.estMinMinutes,
      estMaxMinutes: level.estMaxMinutes,
      accentToken: level.accentToken,
      certificateTitle: level.certificateTitle,
      certificateCode: level.certificateCode,
      passMarkPct: level.passMarkPct,
    };
    const [levelRow] = await db
      .insert(levelsTable)
      .values({ courseId: course.id, slug: level.slug, ...levelFields })
      .onConflictDoUpdate({
        target: [levelsTable.courseId, levelsTable.slug],
        set: levelFields,
      })
      .returning();
    levelIdBySlug.set(level.slug, levelRow.id);

    // Same reasoning for modules within a level.
    await db
      .delete(modulesTable)
      .where(
        and(
          eq(modulesTable.levelId, levelRow.id),
          notInArray(
            modulesTable.slug,
            level.modules.map((m) => m.slug),
          ),
        ),
      );

    await db
      .update(modulesTable)
      .set({ order: sql`${modulesTable.order} - 1000` })
      .where(eq(modulesTable.levelId, levelRow.id));

    for (const [modIndex, mod] of level.modules.entries()) {
      const modFields = {
        order: modIndex + 1,
        title: mod.title,
        coreQuestion: mod.coreQuestion,
        introMarkdown: mod.introMarkdown,
        estMinutes: mod.estMinutes,
        isMandatory: mod.isMandatory ?? true,
      };
      const [modRow] = await db
        .insert(modulesTable)
        .values({ levelId: levelRow.id, slug: mod.slug, ...modFields })
        .onConflictDoUpdate({
          target: [modulesTable.levelId, modulesTable.slug],
          set: modFields,
        })
        .returning();
      moduleIdBySlug.set(mod.slug, modRow.id);
      moduleCount++;

      // Remove lessons that have left this module *before* upserting the current
      // set. Lessons are keyed on (moduleId, slug) but also carry a unique
      // (moduleId, order) — so a renamed lesson would otherwise collide with the
      // retired row still occupying its position.
      //
      // ModuleProgress.lastLessonId is set to null on delete, and completed-lesson
      // ids are stored as JSON, so a learner simply loses a reference to a lesson
      // that no longer exists. Their module completion status is unaffected.
      await db
        .delete(lessons)
        .where(
          and(
            eq(lessons.moduleId, modRow.id),
            notInArray(
              lessons.slug,
              mod.lessons.map((l) => l.slug),
            ),
          ),
        );

      // Park the surviving rows outside the positive range before re-upserting.
      // `order` is unique per parent, so inserting or moving a row mid-list would
      // otherwise collide with whatever still occupies the target position — which
      // is exactly what pruning alone does not fix. Decrementing rather than
      // negating keeps the values distinct even if an earlier run died mid-seed
      // and left rows already parked.
      await db
        .update(lessons)
        .set({ order: sql`${lessons.order} - 1000` })
        .where(eq(lessons.moduleId, modRow.id));

      for (const [lessonIndex, lesson] of mod.lessons.entries()) {
        const lessonFields = {
          order: lessonIndex + 1,
          title: lesson.title,
          kind: lesson.kind,
          bodyMarkdown: lesson.bodyMarkdown ?? null,
          componentKey: lesson.componentKey ?? null,
          payloadJson: lesson.payload ? JSON.stringify(lesson.payload) : null,
        };
        const [lessonRow] = await db
          .insert(lessons)
          .values({ moduleId: modRow.id, slug: lesson.slug, ...lessonFields })
          .onConflictDoUpdate({
            target: [lessons.moduleId, lessons.slug],
            set: lessonFields,
          })
          .returning();
        lessonIdByRef.set(`${level.slug}/${mod.slug}/${lesson.slug}`, lessonRow.id);
        lessonCount++;
      }
    }
    log(
      `  level       ${level.tier.padEnd(12)} ${level.modules.length} modules · ${level.certificateTitle}`,
    );
  }
  log(`  modules     ${moduleCount}`);
  log(`  lessons     ${lessonCount}`);

  // --- Resources -----------------------------------------------------------
  for (const [i, r] of resourceSeeds.entries()) {
    const data = {
      description: r.description ?? null,
      type: r.type,
      isRequired: r.isRequired ?? false,
      source: r.source ?? null,
      author: r.author ?? null,
      externalUrl: r.externalUrl ?? null,
      filePath: r.filePath ?? null,
      licenceNote: r.licenceNote ?? null,
      isStub: r.isStub ?? false,
      order: i,
      moduleId: r.moduleSlug ? (moduleIdBySlug.get(r.moduleSlug) ?? null) : null,
    };
    await db
      .insert(resources)
      .values({ authoringKey: r.key, courseId: course.id, title: r.title, ...data })
      .onConflictDoUpdate({
        target: resources.authoringKey,
        set: { ...data, title: r.title },
      });
  }
  // Remove resources that no longer exist in the content source. Renaming an
  // authoring key would otherwise leave the old row orphaned in the library, and
  // a course that shows retired citations is worse than one that shows none.
  // Resources carry no learner data, so this is safe.
  const removedResources = await db
    .delete(resources)
    .where(
      and(
        eq(resources.courseId, course.id),
        notInArray(
          resources.authoringKey,
          resourceSeeds.map((r) => r.key),
        ),
      ),
    )
    .returning({ id: resources.id });

  const stubCount = resourceSeeds.filter((r) => r.isStub).length;
  log(
    `  resources   ${resourceSeeds.length} (${stubCount} awaiting citations)` +
      (removedResources.length > 0 ? ` · pruned ${removedResources.length} retired` : ""),
  );

  // --- Questions -----------------------------------------------------------
  for (const [i, q] of questionSeeds.entries()) {
    const data = {
      courseId: course.id,
      levelId: q.levelSlug ? (levelIdBySlug.get(q.levelSlug) ?? null) : null,
      moduleId: q.moduleSlug ? (moduleIdBySlug.get(q.moduleSlug) ?? null) : null,
      scope: q.scope,
      kind: q.kind,
      prompt: q.prompt,
      scenario: q.scenario ?? null,
      explanation: q.explanation,
      topicTag: q.topicTag,
      difficulty: q.difficulty ?? 1,
      pairKey: q.pairKey ?? null,
      order: i,
    };

    const [row] = await db
      .insert(questions)
      .values({ authoringKey: q.key, ...data })
      .onConflictDoUpdate({ target: questions.authoringKey, set: data })
      .returning({ id: questions.id });

    // Choices are rewritten wholesale: they are meaningless apart from their
    // question, and QuizAnswer stores selected ids as JSON rather than as a
    // foreign key, so replacing them cannot orphan a learner's record.
    await db.delete(choices).where(eq(choices.questionId, row.id));
    await db.insert(choices).values(
      q.choices.map((c, ci) => ({
        questionId: row.id,
        order: ci,
        text: c.text,
        isCorrect: c.isCorrect ?? false,
        feedback: c.feedback ?? null,
      })),
    );
  }

  // Retire questions that have left the bank — but only ones nobody has answered.
  // A question with answers is part of somebody's recorded score, so deleting it
  // would silently rewrite their result.
  const retired = await db
    .select({
      id: questions.id,
      authoringKey: questions.authoringKey,
      answerCount: sql<number>`(
        select count(*) from ${quizAnswers} where ${quizAnswers.questionId} = ${questions.id}
      )`,
    })
    .from(questions)
    .where(
      and(
        eq(questions.courseId, course.id),
        notInArray(
          questions.authoringKey,
          questionSeeds.map((q) => q.key),
        ),
      ),
    );
  const safeToDelete = retired.filter((q) => Number(q.answerCount) === 0);
  const keptBecauseAnswered = retired.filter((q) => Number(q.answerCount) > 0);
  if (safeToDelete.length > 0) {
    await db.delete(questions).where(
      inArray(
        questions.id,
        safeToDelete.map((q) => q.id),
      ),
    );
  }
  if (keptBecauseAnswered.length > 0) {
    log(
      `  warning     kept ${keptBecauseAnswered.length} retired question(s) that already have answers: ` +
        keptBecauseAnswered.map((q) => q.authoringKey).join(", "),
    );
  }

  const counts = {
    pre: questionSeeds.filter((q) => q.scope === "PRE").length,
    post: questionSeeds.filter((q) => q.scope === "POST").length,
    check: questionSeeds.filter((q) => q.scope === "CHECK").length,
  };
  log(
    `  questions   ${questionSeeds.length} (${counts.pre} baseline · ${counts.post} post · ${counts.check} inline)`,
  );

  // --- Content review register --------------------------------------------
  const reviewItems = deriveReviewItems();
  for (const item of reviewItems) {
    const key = `${item.entityType}:${item.entityRef}`;
    const resolvedId =
      item.entityType === "LESSON"
        ? (lessonIdByRef.get(item.entityRef.split("#")[0]) ?? item.entityRef)
        : item.entityRef;

    // Deliberately does NOT overwrite `status`, `reviewedById` or `reviewedAt`:
    // a re-seed must never silently un-approve something Save7 has signed off.
    const reviewFields = {
      entityType: item.entityType,
      entityId: resolvedId,
      location: item.location,
      claim: item.claim,
      category: item.category,
      sourceHint: item.sourceHint ?? null,
      notes: item.notes ?? null,
      severity: item.severity ?? 1,
    };
    await db
      .insert(contentReviewItems)
      .values({ authoringKey: key, ...reviewFields })
      .onConflictDoUpdate({
        target: contentReviewItems.authoringKey,
        set: reviewFields,
      });
  }
  // Prune register entries whose underlying claim has gone. Approved decisions on
  // *surviving* claims are never touched (see the upsert above); this only clears
  // rows whose lesson, resource or question no longer exists.
  const liveKeys = reviewItems.map((i) => `${i.entityType}:${i.entityRef}`);
  const removedReview = await db
    .delete(contentReviewItems)
    .where(notInArray(contentReviewItems.authoringKey, liveKeys))
    .returning({ id: contentReviewItems.id });

  const blocking = reviewItems.filter((i) => (i.severity ?? 1) === 1).length;
  log(
    `  review      ${reviewItems.length} items (${blocking} must clear before launch)` +
      (removedReview.length > 0 ? ` · pruned ${removedReview.length} retired` : ""),
  );

  // --- Accounts ------------------------------------------------------------
  // A single admin account so the dashboard is reachable on a fresh install.
  // The password is intentionally weak and intentionally printed: this is a
  // local development convenience, and .env.example says to replace it.
  //
  // Opt-in, and deliberately not merely defaulted off: this same function runs
  // in production via the reseed route, where creating admin@save7.org with a
  // published password would be a straightforward account takeover.
  if (options.createDevAdmin) {
    const adminEmail = "admin@save7.org";
    await db
      .insert(users)
      .values({
        email: adminEmail,
        name: "Save7 Admin",
        passwordHash: await bcrypt.hash("save7admin", 12),
        role: "ADMIN",
        popiaConsentAt: new Date(),
      })
      .onConflictDoUpdate({ target: users.email, set: { role: "ADMIN" } });
    log(`\n  admin       ${adminEmail} / save7admin  (development only)`);
  }

  log("\nDone.\n");
}
