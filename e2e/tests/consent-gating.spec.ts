import { test, expect } from "../fixtures";
import { api, tokenFor } from "../support/rest";
import {
  arrangeRegisteredLearner,
  chooseGoogleAccount,
  newIdentity,
  signInWithGoogle,
} from "../support/people";

/**
 * Consent and age gate every way progress is recorded (spec 11, stories 22, 25, 27).
 *
 * The app puts the two enrolment questions in front of a Student who has not
 * answered them. That is the friendly half. The half that counts is the database,
 * which refuses to record progress for anyone without a consenting adult on file,
 * whichever door they used. Both are checked, and the second talks to the API with a
 * real access token, the way a hand-written client would.
 */

/** A date comfortably under 18, in UTC. */
const MINOR = (() => {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - 15);
  return d.toISOString().slice(0, 10);
})();

test("a Student who has not consented is asked to, and cannot open the course until they do", async ({
  page,
  context,
  db,
}) => {
  const student = newIdentity("noconsent");
  await arrangeRegisteredLearner(db, student, { consent: false });
  await chooseGoogleAccount(context, student);
  await signInWithGoogle(page);
  await expect(page).toHaveURL(/\/enrol/);

  // Every door into the course leads to the same question.
  for (const path of ["/assessment/pre", "/levels/beginner", "/dashboard"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/enrol/);
    await expect(page.getByRole("heading", { name: "Your information" })).toBeVisible();
  }

  // Pressing on without agreeing says why it will not go on, under the box.
  await page.getByRole("button", { name: "Start the course" }).click();
  await expect(page.getByText(/We need your consent to store your name/)).toBeVisible();
  await expect(page).toHaveURL(/\/enrol/);

  // Agreeing opens the course.
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Start the course" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(student.name)).toBeVisible();
});

test("the database refuses to record progress without consent, and accepts it once given", async ({ db }) => {
  const student = newIdentity("noconsent-api");
  await arrangeRegisteredLearner(db, student, { consent: false });
  const token = await tokenFor(db, student);
  const call = (fn: string, body: unknown = {}) => api(`rpc/${fn}`, { token, method: "POST", body });

  for (const attempt of [
    () => call("learn_start_baseline_sitting"),
    () => call("learn_submit_baseline_sitting", { p_answers: {} }),
    () => call("learn_start_stage_quiz", { p_stage: "why-donation-matters" }),
    () => call("learn_view_lesson", { p_module_slug: "why-donation-matters", p_lesson_slug: "x", p_seconds: 1 }),
  ]) {
    const refused = await attempt();
    expect(refused.ok).toBe(false);
    // 403: signed in, but not allowed (an anonymous caller would get 401).
    expect(refused.status).toBe(403);
    expect(refused.message).toMatch(/consent/i);
  }

  const recorded = await call("learn_record_popia_consent");
  expect(recorded.ok).toBe(true);
  const started = await call("learn_start_baseline_sitting");
  expect(started.ok).toBe(true);
});

test("a staff member with no date of birth is asked for one before the course opens", async ({
  page,
  context,
}) => {
  const staff = newIdentity("staff-nodob", { domain: "save7.org" });
  await chooseGoogleAccount(context, staff);
  await signInWithGoogle(page);
  await expect(page).toHaveURL(/\/enrol/);

  for (const path of ["/dashboard", "/assessment/pre", "/levels/beginner"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/enrol/);
    await expect(page.getByRole("heading", { name: "Your date of birth" })).toBeVisible();
  }
});

test("the database refuses progress with no date of birth on record, or an under-18 one", async ({ db }) => {
  const unasked = newIdentity("nodob-api");
  const young = newIdentity("minor-api");
  // The second is a state the app never produces (an under-18 date is refused and
  // deleted on every path), set up directly to prove the writers check the age too.
  await arrangeRegisteredLearner(db, unasked, { dateOfBirth: null });
  await arrangeRegisteredLearner(db, young, { dateOfBirth: MINOR });

  for (const who of [unasked, young]) {
    const token = await tokenFor(db, who);
    for (const [fn, body] of [
      ["learn_start_baseline_sitting", {}],
      ["learn_submit_baseline_sitting", { p_answers: {} }],
      ["learn_start_stage_quiz", { p_stage: "why-donation-matters" }],
    ] as const) {
      const refused = await api(`rpc/${fn}`, { token, method: "POST", body });
      expect(refused.ok, `${fn} for ${who.email}`).toBe(false);
      expect(refused.message).toMatch(/18 or older/i);
    }
  }
});
