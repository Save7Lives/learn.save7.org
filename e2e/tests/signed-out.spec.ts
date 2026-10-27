import { test, expect } from "../fixtures";
import { api, rowsOf, tokenFor } from "../support/rest";
import { arrangeRegisteredLearner, newIdentity } from "../support/people";

/**
 * What a visitor can and cannot see (spec 11, stories 1, 2, 104 and 106).
 *
 * The catalogue is public: the Levels and Stages, so a visitor can decide whether the
 * course is for them. What teaches (Stage prose) stays behind sign-in, and what marks
 * (the answer keys) is readable by nobody with a browser, signed in or not. The API
 * checks speak to the same front door the site does, with only the public anon key a
 * visitor already holds.
 */

const STAGES_URL = "/levels/beginner/modules/why-donation-matters";

test("a visitor sees the three Levels and eleven Stages on the home page", async ({ page, db }) => {
  const { rows: levels } = await db.query<{ title: string }>("select title from learn_levels order by position");
  const { rows: stages } = await db.query<{ title: string }>("select title from learn_modules order by level_slug, position");
  expect(levels).toHaveLength(3);
  expect(stages).toHaveLength(11);

  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  const body = page.locator("main");
  for (const { title } of [...levels, ...stages]) {
    await expect(body).toContainText(title);
  }
});

test("a visitor can read the course introduction and the privacy notice", async ({ page }) => {
  for (const path of ["/course/introduction", "/privacy"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
  }
});

test("Stage pages, the Baseline and the dashboards send a visitor to sign in", async ({ page }) => {
  for (const path of [STAGES_URL, "/levels/beginner", "/assessment/pre", "/dashboard", "/profile", "/admin"]) {
    await page.goto(path);
    await expect(page, path).toHaveURL(/\/login/);
  }
});

test("a visitor's page source holds none of the Stage prose", async ({ page, db }) => {
  // The longest plain sentence of the first lesson of each Stage: prose a visitor must not be handed.
  const { rows } = await db.query<{ body_markdown: string }>(
    `select distinct on (module_slug) body_markdown
       from learn_lessons
      where body_markdown is not null and length(body_markdown) > 200
      order by module_slug, position`,
  );
  expect(rows.length).toBeGreaterThanOrEqual(8);
  const sentences = rows.map(({ body_markdown }) =>
    body_markdown
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.replace(/[*_`#>|]/g, "").trim())
      .filter((s) => s.length > 50 && !/[\n[\]()]/.test(s))
      .sort((a, b) => b.length - a.length)[0],
  );
  expect(sentences.filter(Boolean).length).toBeGreaterThanOrEqual(8);

  for (const path of ["/", "/course/introduction", "/privacy", "/login", "/register"]) {
    await page.goto(path);
    const html = await page.content();
    for (const sentence of sentences.filter(Boolean)) {
      expect(html, `${path} must not contain "${sentence.slice(0, 40)}"`).not.toContain(sentence);
    }
  }
});

test("the catalogue is readable without signing in", async () => {
  const levels = await api("learn_levels?select=slug,title,position&order=position");
  expect(levels.ok).toBe(true);
  expect(rowsOf(levels)).toHaveLength(3);

  const stages = await api("learn_modules?select=slug,title,level_slug&order=position");
  expect(stages.ok).toBe(true);
  expect(rowsOf(stages)).toHaveLength(11);
});

test("Stage prose is not readable without signing in", async ({ db }) => {
  // There is prose to find: the refusal below is not an empty table.
  const { rows } = await db.query<{ n: string }>("select count(*) as n from learn_lessons where body_markdown is not null");
  expect(Number(rows[0].n)).toBeGreaterThan(0);

  // The lessons themselves, and every column of a Stage that carries prose.
  expect(rowsOf(await api("learn_lessons?select=slug,title,body_markdown"))).toEqual([]);
  const intro = await api("learn_modules?select=intro_markdown");
  expect(intro.ok).toBe(false);
  expect(intro.message).toMatch(/permission denied/i);
});

test("the answer keys are not readable without signing in", async () => {
  for (const path of [
    "learn_choices?select=is_correct",
    "learn_choices?select=*",
    "learn_questions?select=prompt,explanation",
    "learn_questions_pub?select=prompt",
    "learn_options_pub?select=text",
  ]) {
    const result = await api(path);
    expect(rowsOf(result), path).toEqual([]);
    expect(result.ok, path).toBe(false);
  }

  const graded = await api("rpc/learn_grade_check", {
    method: "POST",
    body: { p_question: "00000000-0000-0000-0000-000000000000", p_chosen: ["a"] },
  });
  expect(graded.ok).toBe(false);
});

test("a visitor can read no Student's records", async ({ db }) => {
  // Someone exists to be read.
  const student = newIdentity("someone");
  await arrangeRegisteredLearner(db, student);

  for (const path of [
    "learners?select=email,name,date_of_birth",
    "learn_baseline_sittings?select=*",
    "learn_attempts?select=*",
    "learn_certificates?select=*",
    "learn_review_items?select=*",
    "learn_eligibility_rules?select=*",
  ]) {
    expect(rowsOf(await api(path)), path).toEqual([]);
  }
});

test("a signed-in Student cannot read the answer keys either", async ({ db }) => {
  const student = newIdentity("keys");
  await arrangeRegisteredLearner(db, student);
  const token = await tokenFor(db, student);

  for (const path of ["learn_choices?select=is_correct", "learn_questions?select=prompt,explanation"]) {
    const result = await api(path, { token });
    expect(result.ok, path).toBe(false);
    expect(rowsOf(result), path).toEqual([]);
  }
});

test("an anonymous client cannot enrol itself or ask who the Admins are", async () => {
  for (const fn of ["learn_claim_me", "learn_admin_roster", "learn_admin_role"]) {
    const result = await api(`rpc/${fn}`, { method: "POST", body: {} });
    expect(result.ok, fn).toBe(false);
  }
});
