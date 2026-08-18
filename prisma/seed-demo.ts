import "dotenv/config";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { and, asc, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import * as schema from "../src/db/schema";
import {
  certificates,
  courseProgress,
  courses,
  levelProgress,
  levels as levelsTable,
  moduleProgress,
  questions,
  quizAnswers,
  quizAttempts,
  users,
} from "../src/db/schema";
import { COURSE_SLUG } from "../src/lib/constants";

/**
 * Synthetic learners, for exercising the admin dashboard.
 *
 * Separate from the main seed on purpose: `npm run db:seed` must never invent
 * learners, because fake learners in a real Save7 deployment would corrupt the one
 * metric the platform exists to report. Run this only in development:
 *
 *   npm run db:seed:demo
 *
 * The names are ordinary South African names; nothing here is a real person.
 */

const sqlite = new Database(process.env.DATABASE_URL!.replace(/^file:/, ""));
const db = drizzle(sqlite, { schema });

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to create demo learners with NODE_ENV=production.");
  process.exit(1);
}

/** Deterministic pseudo-random, so repeated runs give comparable dashboards. */
function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

const PEOPLE = [
  "Nomsa Dlamini", "Pieter van der Merwe", "Aisha Patel", "Sipho Ndlovu",
  "Lerato Mahlangu", "Johan Botha", "Fatima Cassim", "Bongani Zulu",
  "Chloe Reddy", "Themba Nkosi", "Anja Steyn", "Yusuf Adams",
  "Palesa Molefe", "Riaan du Toit", "Zanele Khumalo", "Deon Naidoo",
  "Kagiso Sithole", "Michelle Fourie",
];

async function main() {
  const random = makeRandom(20260818);

  const course = await db.query.courses.findFirst({
    where: eq(courses.slug, COURSE_SLUG),
  });
  if (!course) throw new Error(`Course "${COURSE_SLUG}" not found. Run: npm run db:seed`);

  const levels = await db.query.levels.findMany({
    where: eq(levelsTable.courseId, course.id),
    orderBy: asc(levelsTable.order),
    with: { modules: { columns: { id: true, isMandatory: true } } },
  });

  const preQuestions = await db.query.questions.findMany({
    where: and(eq(questions.courseId, course.id), eq(questions.scope, "PRE")),
    with: { choices: true },
  });

  const passwordHash = await bcrypt.hash("demo-learner-password", 10);
  let created = 0;

  for (const name of PEOPLE) {
    const email = `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.test`;

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) continue;

    // Spread registrations over the last ~10 weeks.
    const createdAt = new Date(Date.now() - Math.floor(random() * 70) * 86_400_000);

    const [user] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
        role: "LEARNER",
        popiaConsentAt: createdAt,
        createdAt,
        lastSeenAt: new Date(Date.now() - Math.floor(random() * 5) * 86_400_000),
      })
      .returning();
    created++;

    // A realistic funnel: some register and stop, most take the baseline, fewer
    // finish a level, fewer still go on.
    const takesBaseline = random() < 0.85;
    if (!takesBaseline) continue;

    // Baseline ability, deliberately skewed low — that is the real-world shape.
    const ability = 0.15 + random() * 0.45;

    const [preAttempt] = await db
      .insert(quizAttempts)
      .values({
        userId: user.id,
        courseId: course.id,
        kind: "PRE",
        attemptNo: 1,
        startedAt: createdAt,
        submittedAt: createdAt,
      })
      .returning();

    let preRaw = 0;
    const preAnswers = preQuestions.map((q) => {
      const correctIds = q.choices.filter((c) => c.isCorrect).map((c) => c.id);
      const isCorrect = random() < ability;
      if (isCorrect) preRaw++;
      return {
        attemptId: preAttempt.id,
        questionId: q.id,
        choiceIdsJson: JSON.stringify(
          isCorrect ? correctIds : [q.choices.find((c) => !c.isCorrect)?.id ?? q.choices[0].id],
        ),
        isCorrect,
        answeredAt: createdAt,
      };
    });
    await db.insert(quizAnswers).values(preAnswers);
    const prePct = Math.round((preRaw / preQuestions.length) * 100);
    await db
      .update(quizAttempts)
      .set({ scoreRaw: preRaw, scoreMax: preQuestions.length, scorePct: prePct })
      .where(eq(quizAttempts.id, preAttempt.id));

    await db.insert(courseProgress).values({
      userId: user.id,
      courseId: course.id,
      status: "IN_PROGRESS",
      baselineDoneAt: createdAt,
      startedAt: createdAt,
    });

    // How far through the pathway this learner gets.
    const reach = random();
    const levelsToAttempt = reach < 0.35 ? 1 : reach < 0.75 ? 2 : 3;

    for (const [levelIndex, level] of levels.entries()) {
      if (levelIndex >= levelsToAttempt) break;

      // Within a level, some learners stall part-way — that is what produces the
      // drop-off figures the engagement page reports.
      const stalls = random() < 0.25 && levelIndex === levelsToAttempt - 1;
      const modulesToDo = stalls
        ? Math.max(1, Math.floor(level.modules.length * random()))
        : level.modules.length;

      for (const [moduleIndex, mod] of level.modules.entries()) {
        if (moduleIndex >= modulesToDo) break;
        // A stalling learner leaves their *last* module in progress. This is what
        // produces the drop-off figures the engagement page reports; without it
        // every module would show a 100% completion rate and the report would be
        // untestable.
        const complete = !(stalls && moduleIndex === modulesToDo - 1);
        await db.insert(moduleProgress).values({
          userId: user.id,
          moduleId: mod.id,
          status: complete ? "COMPLETE" : "IN_PROGRESS",
          completedAt: complete ? new Date() : null,
          completedLessonsJson: "[]",
          // Plausible spread of time-on-module in seconds.
          secondsSpent: Math.floor(240 + random() * 900),
        });
      }

      const finishedLevel = !stalls && modulesToDo === level.modules.length;
      await db.insert(levelProgress).values({
        userId: user.id,
        levelId: level.id,
        status: finishedLevel ? "COMPLETE" : "IN_PROGRESS",
        percentComplete: Math.round((modulesToDo / level.modules.length) * 100),
        completedAt: finishedLevel ? new Date() : null,
      });

      if (!finishedLevel) break;

      // Post assessment. Learning genuinely improves the score, with noise.
      const postQuestions = await db.query.questions.findMany({
        where: and(eq(questions.levelId, level.id), eq(questions.scope, "POST")),
        with: { choices: true },
      });
      if (postQuestions.length === 0) continue;

      const learned = Math.min(0.97, ability + 0.3 + random() * 0.35);

      const [postAttempt] = await db
        .insert(quizAttempts)
        .values({
          userId: user.id,
          courseId: course.id,
          levelId: level.id,
          kind: "POST",
          attemptNo: 1,
          submittedAt: new Date(),
        })
        .returning();

      let postRaw = 0;
      const postAnswers = postQuestions.map((q) => {
        const correctIds = q.choices.filter((c) => c.isCorrect).map((c) => c.id);
        // Multi-select is genuinely harder, so it is missed more often. Without
        // this the "most missed" report would be uniform noise.
        const penalty = q.kind === "MULTI" ? 0.2 : q.difficulty === 3 ? 0.12 : 0;
        const isCorrect = random() < learned - penalty;
        if (isCorrect) postRaw++;
        return {
          attemptId: postAttempt.id,
          questionId: q.id,
          choiceIdsJson: JSON.stringify(
            isCorrect
              ? correctIds
              : [q.choices.find((c) => !c.isCorrect)?.id ?? q.choices[0].id],
          ),
          isCorrect,
        };
      });
      await db.insert(quizAnswers).values(postAnswers);
      const postPct = Math.round((postRaw / postQuestions.length) * 100);
      await db
        .update(quizAttempts)
        .set({ scoreRaw: postRaw, scoreMax: postQuestions.length, scorePct: postPct })
        .where(eq(quizAttempts.id, postAttempt.id));

      // Certificate, if they passed.
      if (postPct >= level.passMarkPct) {
        const year = new Date().getFullYear();
        const sequence = (
          await db
            .select({ id: certificates.id })
            .from(certificates)
            .where(eq(certificates.levelId, level.id))
        ).length;
        await db.insert(certificates).values({
          publicId: `S7-${year}-${level.certificateCode}-${String(sequence + 1).padStart(6, "0")}`,
          userId: user.id,
          courseId: course.id,
          levelId: level.id,
          learnerNameSnapshot: user.name,
          awardTitleSnapshot: level.certificateTitle,
          scorePct: postPct,
        });
      } else {
        // A retake, which must not affect the reported improvement figures.
        await db.insert(quizAttempts).values({
          userId: user.id,
          courseId: course.id,
          levelId: level.id,
          kind: "POST",
          attemptNo: 2,
          submittedAt: new Date(),
          scoreRaw: postQuestions.length,
          scoreMax: postQuestions.length,
          scorePct: 100,
        });
      }
    }
  }

  console.log(`Created ${created} demo learners.`);
  console.log("Delete them with: npm run db:seed:demo:clear");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => sqlite.close());
