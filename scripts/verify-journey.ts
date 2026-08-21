/**
 * Dev-only end-to-end check of the data layer.
 *
 * Drives a real learner through the whole journey against the real database:
 * register → baseline → every Beginner module → post-assessment → knowledge
 * impact → certificate → public verification → admin analytics.
 *
 * Written when the ORM was swapped from Prisma to Drizzle, to prove the rewritten
 * queries preserve behaviour rather than merely compiling.
 */
import "dotenv/config";
import { and, eq } from "drizzle-orm";

// Node driver, not the app's edge client — see src/lib/db-node.ts.
import { dbNode as db } from "../src/lib/db-node";
import { choices, levels, questions, users } from "../src/db/schema";
import { getBaselineState, getCourse, getPathwayForUser } from "../src/lib/course";
import { completeModule, isLevelContentComplete, markLessonViewed } from "../src/lib/progress";
import { startAttempt, submitAttempt, gradeCheckAnswer } from "../src/lib/quiz";
import { getCourseImpact, getKnowledgeImpact } from "../src/lib/impact";
import { issueCertificateIfEarned, verifyCertificate } from "../src/lib/certificates";
import { getProfile, updateProfile } from "../src/lib/profile";
import {
  getCertificates,
  getKnowledgeSummary,
  getLearnerSummary,
  getModuleEngagement,
  getMostMissedQuestions,
  getReviewSummary,
} from "../src/lib/analytics";

let failures = 0;
function check(label: string, condition: boolean, detail?: unknown) {
  const mark = condition ? "  ok  " : " FAIL ";
  if (!condition) failures++;
  console.log(`${mark} ${label}${detail !== undefined ? `  → ${JSON.stringify(detail)}` : ""}`);
}

/** Answer a question set, getting `correctRatio` of them right. */
async function answersFor(questionIds: string[], correctRatio: number) {
  const out = [];
  for (const [i, questionId] of questionIds.entries()) {
    const rows = await db
      .select({ id: choices.id, isCorrect: choices.isCorrect })
      .from(choices)
      .where(eq(choices.questionId, questionId));
    const wantCorrect = i / questionIds.length < correctRatio;
    const picked = wantCorrect
      ? rows.filter((c) => c.isCorrect).map((c) => c.id)
      : rows.filter((c) => !c.isCorrect).slice(0, 1).map((c) => c.id);
    out.push({ questionId, choiceIds: picked });
  }
  return out;
}

async function main() {
  const email = `journey-${Date.now()}@example.test`;

  // --- The learner ---------------------------------------------------------
  /**
   * Created directly, rather than through the app.
   *
   * There is no `registerUser` any more: sign-in is a Google account verified by
   * Supabase, and the three rules this suite used to assert here have moved to
   * where they are now enforced —
   *
   *   * a duplicate address is refused by `learners_email_key`, the unique index;
   *   * POPIA consent is required by the `register-learner` Edge Function, which
   *     refuses rather than defaults;
   *   * name validation is shared with the profile page and still asserted below.
   *
   * **This suite still runs against the local SQLite file, which is the database
   * the app reads until the data layer is ported to Supabase.** When that port
   * lands, this file moves with it.
   */
  const [created] = await db
    .insert(users)
    .values({
      name: "Journey Tester",
      firstName: "Journey",
      lastName: "Tester",
      email,
      passwordHash: "",
      role: "LEARNER",
      popiaConsentAt: new Date(),
      lastSeenAt: new Date(),
    })
    .returning({ id: users.id, email: users.email });
  check("learner created", Boolean(created?.id), created?.email);
  if (!created) return;
  const userId = created.id;

  // --- Baseline ------------------------------------------------------------
  const course = await getCourse();
  const pre = await startAttempt(userId, "PRE", null);
  check("baseline attempt starts", pre.attempt.attemptNo === 1 && !pre.alreadySubmitted);

  const preQs = await db
    .select({ id: questions.id })
    .from(questions)
    .where(and(eq(questions.courseId, course.id), eq(questions.scope, "PRE")));
  // Deliberately weak: 1 of 12, so there is real improvement to measure later.
  const preResult = await submitAttempt(userId, pre.attempt.id, await answersFor(preQs.map((q) => q.id), 0.09));
  check("baseline grades", !("error" in preResult), "error" in preResult ? preResult : (preResult as { scorePct: number }).scorePct);
  const preScore = "error" in preResult ? -1 : preResult.scorePct;

  const baseline = await getBaselineState(userId);
  check("baseline recorded as complete", baseline.completed && baseline.scorePct === preScore);

  // The critical integrity check: the baseline must not be retakeable.
  const preAgain = await startAttempt(userId, "PRE", null);
  check("baseline cannot be retaken", preAgain.alreadySubmitted && preAgain.attempt.id === pre.attempt.id);

  // --- Beginner modules ----------------------------------------------------
  const beginner = await db.query.levels.findFirst({
    where: and(eq(levels.courseId, course.id), eq(levels.slug, "beginner")),
    with: { modules: { with: { lessons: true } } },
  });
  if (!beginner) return check("beginner level exists", false);

  check("level not complete before modules", !(await isLevelContentComplete(userId, beginner.id)));

  for (const mod of beginner.modules) {
    for (const lesson of mod.lessons) {
      await markLessonViewed(userId, mod.id, lesson.id, 45);
    }
    await completeModule(userId, mod.id);
  }
  check("level content complete after modules", await isLevelContentComplete(userId, beginner.id));

  // An inline check answer, which also exercises the CHECK attempt path.
  const checkQ = await db
    .select({ id: questions.id })
    .from(questions)
    .where(and(eq(questions.scope, "CHECK"), eq(questions.moduleId, beginner.modules[0].id)))
    .limit(1);
  if (checkQ[0]) {
    const correct = await db
      .select({ id: choices.id })
      .from(choices)
      .where(and(eq(choices.questionId, checkQ[0].id), eq(choices.isCorrect, true)));
    const fb = await gradeCheckAnswer(userId, checkQ[0].id, correct.map((c) => c.id));
    check("inline check grades correct answer", !("error" in fb) && fb.isCorrect);
    const fb2 = await gradeCheckAnswer(userId, checkQ[0].id, []);
    check("inline check re-answer is idempotent", !("error" in fb2));
  }

  // --- Post assessment -----------------------------------------------------
  const post = await startAttempt(userId, "POST", beginner.id);
  const postQs = await db
    .select({ id: questions.id })
    .from(questions)
    .where(and(eq(questions.levelId, beginner.id), eq(questions.scope, "POST")));
  const postResult = await submitAttempt(userId, post.attempt.id, await answersFor(postQs.map((q) => q.id), 1));
  check("post assessment grades", !("error" in postResult));
  if ("error" in postResult) return;
  check("perfect score is 100%", postResult.scorePct === 100, postResult.scorePct);
  check("graded answers returned", postResult.answers.length === postQs.length);
  check("graded answers include the key", postResult.answers[0].choices.some((c) => c.isCorrect));

  // Re-submitting must return the stored result, not regrade.
  const resubmit = await submitAttempt(userId, post.attempt.id, []);
  check(
    "resubmission is idempotent",
    !("error" in resubmit) && resubmit.scorePct === 100,
    "error" in resubmit ? resubmit : resubmit.scorePct,
  );

  // --- Knowledge impact ----------------------------------------------------
  const impact = await getKnowledgeImpact(userId, beginner.id);
  check("impact has before and after", impact.before !== null && impact.after !== null);
  check("recorded attempt is attempt 1", impact.after?.attemptNo === 1);
  check("point change is positive", (impact.absolutePointChange ?? 0) > 0, impact.absolutePointChange);
  check(
    "relative change suppressed on tiny baseline",
    preScore < 25 ? impact.relativeChangePct === null : true,
    { preScore, relative: impact.relativeChangePct },
  );
  check("matched pairs computed", impact.paired !== null, impact.paired?.pairCount);
  check("passed", impact.passed);

  const courseImpact = await getCourseImpact(userId);
  check("course impact counts one level", courseImpact.levelsAssessed === 1, courseImpact);

  // --- Certificate ---------------------------------------------------------
  const cert = await issueCertificateIfEarned(userId, beginner.id);
  check("certificate issued", cert !== null, cert?.publicId);
  const again = await issueCertificateIfEarned(userId, beginner.id);
  check("certificate issue is idempotent", again?.publicId === cert?.publicId);

  if (cert) {
    const verified = await verifyCertificate(cert.publicId);
    check("certificate verifies publicly", verified !== null);
    check("verification exposes no score", !Object.keys(verified ?? {}).includes("scorePct"));
    check("verification exposes no email", !JSON.stringify(verified).includes(email));
    check("unknown certificate does not verify", (await verifyCertificate("S7-2026-B-999999")) === null);
  }

  // A second level must not be certificated off the first level's work.
  const intermediate = await db.query.levels.findFirst({
    where: and(eq(levels.courseId, course.id), eq(levels.slug, "intermediate")),
  });
  if (intermediate) {
    check(
      "certificate refused for incomplete level",
      (await issueCertificateIfEarned(userId, intermediate.id)) === null,
    );
  }

  // --- Pathway and analytics ----------------------------------------------
  const pathway = await getPathwayForUser(userId);
  const bLevel = pathway.levels.find((l) => l.slug === "beginner");
  check("pathway shows level complete", bLevel?.progress?.status === "COMPLETE");
  check("pathway shows 100%", bLevel?.progress?.percentComplete === 100, bLevel?.progress?.percentComplete);
  check("pathway carries certificate", bLevel?.progress?.certificatePublicId === cert?.publicId);
  check("signed-out pathway has no progress", (await getPathwayForUser(null)).levels.every((l) => l.progress === null));

  // --- Profile editing -----------------------------------------------------
  const composed = await getProfile(userId);
  check("the composed full name is what a certificate prints",
    composed?.name === "Journey Tester", composed?.name);

  const beforeEdit = await getProfile(userId);
  check("profile splits into first name and surname",
    beforeEdit?.firstName === "Journey" && beforeEdit?.lastName === "Tester", beforeEdit);

  const blank = await updateProfile(userId, { firstName: "  ", lastName: "Tester" });
  check("blank first name rejected", !blank.ok);
  const noSurname = await updateProfile(userId, { firstName: "Journey", lastName: "" });
  check("blank surname rejected", !noSurname.ok);
  const tooLong = await updateProfile(userId, { firstName: "a".repeat(61), lastName: "Tester" });
  check("over-long name rejected", !tooLong.ok);

  // A multi-word surname must survive a round trip: this is the case the
  // first-space split exists for.
  const renamed = await updateProfile(userId, {
    firstName: "  Journey\u0000 ",
    lastName: "van  der Tester",
  });
  check("name saved", renamed.ok && renamed.name === "Journey van der Tester", renamed);
  check("control characters and double spaces stripped",
    renamed.ok && !/[\u0000-\u001F]/.test(renamed.name) && !renamed.name.includes("  "));

  const afterEdit = await getProfile(userId);
  check("profile reflects the edit",
    afterEdit?.firstName === "Journey" && afterEdit?.lastName === "van der Tester", afterEdit);

  // The certificate was issued under the old name and must now carry the new one:
  // a corrected spelling should not leave a wrong certificate behind.
  const renamedCert = cert ? await verifyCertificate(cert.publicId) : null;
  check("issued certificate carries the corrected name",
    renamedCert?.learnerName === "Journey van der Tester", renamedCert?.learnerName);

  const [learners, knowledge, missed, engagement, certs, review] = await Promise.all([
    getLearnerSummary(),
    getKnowledgeSummary(),
    getMostMissedQuestions(),
    getModuleEngagement(),
    getCertificates(),
    getReviewSummary(),
  ]);
  check("learner summary counts our learner", learners.registered > 0 && learners.active > 0, learners);
  check("knowledge summary has per-level rows", knowledge.perLevel.length === 3);
  check("knowledge distribution buckets", knowledge.baselineDistribution.length === 5);
  check("most-missed returns rows", Array.isArray(missed), missed.length);
  check("engagement covers 13 modules", engagement.length === 13);
  check("engagement ordered by level then module", engagement[0].order === 1);
  check("engagement records time", engagement.some((m) => (m.medianSeconds ?? 0) > 0));
  check("certificates listed", certs.some((c) => c.publicId === cert?.publicId));
  check("review register intact", review.total === 103, review);

  // --- Tidy up -------------------------------------------------------------
  await db.delete(users).where(eq(users.id, userId));
  check("test learner removed", (await db.select().from(users).where(eq(users.id, userId))).length === 0);

  console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} CHECK(S) FAILED\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
