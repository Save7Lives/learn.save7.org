import type { Page } from "@playwright/test";

import { test, expect } from "../../fixtures";
import { openRunDatabase } from "../../support/database";
import {
  completeLevel,
  makeMostMissed,
  setLastActive,
  sitBaseline,
  takeStageQuiz,
} from "../../support/learning";
import {
  arrangeAdmin,
  arrangeRegisteredLearner,
  chooseGoogleAccount,
  newIdentity,
  signInWithGoogle,
} from "../../support/people";

/**
 * The Admin's view of the cohort (spec 11, stories 71 to 77 and 86 to 88).
 *
 * The Overview counts everyone, so this file starts by emptying the cohort and
 * arranging a small, known one, and nothing else touches the database while it runs
 * (it is its own project, after the learner journeys: see playwright.config.ts).
 * Everything is then asserted from the screen an Admin sees.
 *
 *   Lerato   Admin, signed up today, no Sitting yet
 *   Ayanda   signed up today, no Sitting yet
 *   Bongani  signed up 100 days ago, Sitting 1 (0 of 20), failed Stage 1's quiz
 *   Chipo    signed up 60 days ago, Sitting 1 (0 of 20), Beginner complete,
 *            Sitting 2 (20 of 20)
 *   Dumisani signed up 10 days ago, Sitting 1 (0 of 20), all three Levels complete
 */
const tag = Math.random().toString(16).slice(2, 6);
const cast = {
  admin: newIdentity("overview-admin", { given: "Lerato", family: `Admin${tag}` }),
  awaiting: newIdentity("awaiting", { given: "Ayanda", family: `Awaiting${tag}` }),
  beginner: newIdentity("beginner", { given: "Bongani", family: `Beginner${tag}` }),
  intermediate: newIdentity("intermediate", { given: "Chipo", family: `Intermediate${tag}` }),
  complete: newIdentity("complete", { given: "Dumisani", family: `Complete${tag}` }),
};
let missedPrompt = "";

const day = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 86_400_000).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  });

test.beforeAll(async () => {
  const db = await openRunDatabase();
  try {
    // An empty cohort, so every count below is exact.
    await db.query("delete from learners");
    // And no Eligibility Rule yet, as on a new database.
    await db.query("delete from learn_eligibility_signals");
    await db.query("delete from learn_eligibility_rules");

    await arrangeRegisteredLearner(db, cast.awaiting);
    await arrangeRegisteredLearner(db, cast.beginner, { signedUpDaysAgo: 100 });
    await arrangeRegisteredLearner(db, cast.intermediate, { signedUpDaysAgo: 60 });
    await arrangeRegisteredLearner(db, cast.complete, { signedUpDaysAgo: 10 });
    await arrangeAdmin(db, cast.admin, "admin");

    await sitBaseline(db, cast.beginner, "wrong");
    await takeStageQuiz(db, cast.beginner, "why-donation-matters", "wrong");

    await sitBaseline(db, cast.intermediate, "wrong");
    await completeLevel(db, cast.intermediate, "beginner");
    await sitBaseline(db, cast.intermediate, "correct");

    await sitBaseline(db, cast.complete, "wrong");
    for (const level of ["beginner", "intermediate", "advanced"]) {
      await completeLevel(db, cast.complete, level);
    }

    missedPrompt = await makeMostMissed(db, "why-donation-matters", [
      cast.beginner,
      cast.intermediate,
      cast.complete,
    ]);

    await setLastActive(db, cast.beginner, 2);
    await setLastActive(db, cast.intermediate, 1);
    await setLastActive(db, cast.complete, 5);
  } finally {
    await db.end();
  }
});

async function signInAsAdmin(page: Page, context: Parameters<typeof chooseGoogleAccount>[0]) {
  await chooseGoogleAccount(context, cast.admin);
  await signInWithGoogle(page);
  await expect(page).toHaveURL(/\/dashboard$/);
}

const row = (page: Page, who: { name: string }) =>
  page.getByRole("link", { name: new RegExp(`^${who.name}, open`) });

const chips = (page: Page, group: string) => page.getByRole("group", { name: group });

test("Overview shows the Growth Indicators for the whole cohort", async ({ page, context }) => {
  await signInAsAdmin(page, context);
  await page.goto("/admin");
  const main = page.locator("main");

  await expect(page.getByRole("heading", { name: "Overview", level: 1 })).toBeVisible();
  await expect(main).toContainText("5 of 5 Students");

  // Cohort size, and the three completion rates.
  await expect(main).toContainText(/Students\s*5\s*3 signed up in the last 30 days/);
  await expect(main).toContainText(/Completed Beginner\s*40%\s*2 of 5 Students/);
  await expect(main).toContainText(/Completed Intermediate\s*20%\s*1 of 5 Students/);
  await expect(main).toContainText(/Completed Advanced\s*20%\s*1 of 5 Students/);

  // The Baseline trend, as the table twin of the chart: Sitting 1 was taken by three
  // Students who scored nothing, Sitting 2 by one who scored everything.
  const trend = page.getByRole("table", { name: "Baseline trend as a table" });
  await expect(trend.getByRole("row", { name: /1\. At signup\s*3\s*0%/ })).toBeVisible();
  await expect(trend.getByRole("row", { name: /2\. After Beginner\s*1\s*100%/ })).toBeVisible();
  await expect(trend.getByRole("row", { name: /3\. After Intermediate\s*0\s*n\/a/ })).toBeVisible();

  // Improvement: only Chipo re-sat after finishing a Level, and gained 100 points on it.
  const improvement = page.getByRole("region", { name: "Improvement by Level" });
  await expect(improvement).toContainText(/Beginner\s*\+100 pp\s*Average of 1 Student who re-sat/);
  await expect(improvement).toContainText(/Intermediate\s*n\/a\s*No one has re-sat/);

  // Per-Stage Quiz pass rate: two of the three who tried Stage 1 passed it.
  const passRate = page.getByRole("region", { name: "Stage Quiz pass rate" });
  await expect(passRate).toContainText(/Why donation matters\s*2 passed of 3 who attempted\s*67%/);
  await expect(passRate).toContainText(/Busting the myths\s*2 passed of 2 who attempted\s*100%/);
  await expect(passRate).toContainText(/Ethics of donation and end-of-life care\s*1 passed of 1 who attempted/);

  // Drop-off: of three who opened Stage 1, one has not passed.
  const dropOff = page.getByRole("region", { name: "Stage drop-off" });
  await expect(dropOff).toContainText(/Why donation matters\s*1 of 3 who opened it have not passed\s*33%/);
  await expect(dropOff).toContainText(/Busting the myths\s*0 of 2 who opened it have not passed/);

  // The most missed question, with how often it was set and missed.
  const missed = page.getByRole("table", { name: "Most commonly missed Stage Quiz questions" });
  await expect(missed.getByRole("row").nth(1)).toContainText(missedPrompt);
  await expect(missed.getByRole("row").nth(1)).toContainText(/100%\s*3 of 3/);

  // Eligibility is a read-only summary here, with the way to edit it.
  await expect(page.getByRole("region", { name: "Nerve Center eligibility" })).toContainText(
    "No Eligibility Rule has been saved yet",
  );
});

test("Overview's Signed up filter narrows every figure to that cohort", async ({ page, context }) => {
  await signInAsAdmin(page, context);
  await page.goto("/admin");
  const main = page.locator("main");

  await chips(page, "Signed up").getByRole("link", { name: "Last 30 days" }).click();
  await expect(page).toHaveURL(/signed=30/);
  await expect(main).toContainText("3 of 5 Students");
  await expect(main).toContainText(/Students\s*3\s*3 signed up in the last 30 days/);
  // Of the three who signed up this month (Lerato, Ayanda, Dumisani), only Dumisani
  // finished anything.
  await expect(main).toContainText(/Completed Beginner\s*33%\s*1 of 3 Students/);

  await chips(page, "Signed up").getByRole("link", { name: "Last 90 days" }).click();
  await expect(main).toContainText("4 of 5 Students");
  await expect(main).toContainText(/Completed Beginner\s*50%\s*2 of 4 Students/);

  await chips(page, "Signed up").getByRole("link", { name: "All time" }).click();
  await expect(main).toContainText("5 of 5 Students");
});

test("Students lists everyone, newest first, with last active and no email address", async ({
  page,
  context,
}) => {
  await signInAsAdmin(page, context);
  await page.goto("/admin/students");
  const table = page.getByRole("table", { name: "Students, most recent signup first" });

  await expect(page.locator("main")).toContainText("5 of 5 Students");
  await expect(table.getByRole("row")).toHaveCount(6);

  // Newest signup first: the two who signed up today, then Dumisani, Chipo, Bongani.
  const order = await table.getByRole("link", { name: /, open their Progress Record$/ }).allInnerTexts();
  expect(order.slice(2).map((n) => n.split(",")[0])).toEqual([
    cast.complete.name,
    cast.intermediate.name,
    cast.beginner.name,
  ]);

  // Signed up, then last active: Bongani joined 100 days ago and was last seen two days ago.
  await expect(table.getByRole("row", { name: new RegExp(cast.beginner.name) })).toContainText(
    new RegExp(`${day(100)}\\s*${day(2)}`),
  );
  await expect(table.getByRole("row", { name: new RegExp(cast.complete.name) })).toContainText(
    new RegExp(`${day(10)}\\s*${day(5)}`),
  );

  // Where each stands.
  await expect(table.getByRole("row", { name: new RegExp(cast.complete.name) })).toContainText(/All complete\s*11 of 11/);
  await expect(table.getByRole("row", { name: new RegExp(cast.intermediate.name) })).toContainText(
    /Intermediate\s*3 of 11\s*100%\s*Sitting 2, 20 of 20\s*1 of 3/,
  );
  await expect(table.getByRole("row", { name: new RegExp(cast.awaiting.name) })).toContainText("Awaiting first Sitting");

  // Oversight stays proportionate: no email addresses, no date of birth.
  const text = await page.locator("main").innerText();
  expect(text).not.toContain("@e2e.test");
  expect(text).not.toMatch(/date of birth/i);
  await expect(page.getByRole("columnheader", { name: /email/i })).toHaveCount(0);
});

test("Students can be filtered by when they signed up", async ({ page, context }) => {
  await signInAsAdmin(page, context);
  await page.goto("/admin/students");
  const table = page.getByRole("table", { name: "Students, most recent signup first" });

  await chips(page, "Signed up").getByRole("link", { name: "Last 30 days" }).click();
  await expect(page.locator("main")).toContainText("3 of 5 Students");
  await expect(row(page, cast.complete)).toBeVisible();
  await expect(row(page, cast.awaiting)).toBeVisible();
  await expect(row(page, cast.intermediate)).toHaveCount(0);
  await expect(row(page, cast.beginner)).toHaveCount(0);

  await chips(page, "Signed up").getByRole("link", { name: "Last 90 days" }).click();
  await expect(page.locator("main")).toContainText("4 of 5 Students");
  await expect(row(page, cast.intermediate)).toBeVisible();
  await expect(row(page, cast.beginner)).toHaveCount(0);

  await chips(page, "Signed up").getByRole("link", { name: "All time" }).click();
  await expect(table.getByRole("row")).toHaveCount(6);
  await expect(row(page, cast.beginner)).toBeVisible();
});

test("Students can be filtered by Current Level", async ({ page, context }) => {
  await signInAsAdmin(page, context);
  await page.goto("/admin/students");

  const only = async (label: string, shown: Array<{ name: string }>, hidden: Array<{ name: string }>) => {
    await chips(page, "Current Level").getByRole("link", { name: label, exact: true }).click();
    await expect(chips(page, "Current Level").getByRole("link", { name: label, exact: true })).toHaveAttribute(
      "aria-current",
      "true",
    );
    for (const who of shown) await expect(row(page, who), `${label} shows ${who.name}`).toBeVisible();
    for (const who of hidden) await expect(row(page, who), `${label} hides ${who.name}`).toHaveCount(0);
  };

  await only("Awaiting first Sitting", [cast.awaiting, cast.admin], [cast.beginner, cast.intermediate, cast.complete]);
  await expect(page.locator("main")).toContainText("2 of 5 Students");
  await only("Beginner", [cast.beginner], [cast.awaiting, cast.intermediate, cast.complete]);
  await only("Intermediate", [cast.intermediate], [cast.beginner, cast.awaiting, cast.complete]);
  await only("Advanced", [], [cast.beginner, cast.intermediate, cast.complete, cast.awaiting]);
  await expect(page.getByText("No Students match.")).toBeVisible();
  await only("All complete", [cast.complete], [cast.beginner, cast.intermediate, cast.awaiting]);

  // The two filters combine: Dumisani is complete and signed up this month.
  await chips(page, "Signed up").getByRole("link", { name: "Last 30 days" }).click();
  await expect(row(page, cast.complete)).toBeVisible();
  await chips(page, "Current Level").getByRole("link", { name: "Intermediate", exact: true }).click();
  await expect(row(page, cast.intermediate)).toHaveCount(0);
  await expect(page.getByText("No Students match.")).toBeVisible();
});

test("Students can be searched by name", async ({ page, context }) => {
  await signInAsAdmin(page, context);
  await page.goto("/admin/students");
  await page.getByRole("searchbox", { name: "Search Students by name" }).fill(cast.beginner.familyName);
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/q=/);
  await expect(row(page, cast.beginner)).toBeVisible();
  await expect(row(page, cast.complete)).toHaveCount(0);
});

test("a Student's drill-down shows their Levels, Baseline table and recent activity", async ({
  page,
  context,
}) => {
  await signInAsAdmin(page, context);
  await page.goto("/admin/students");
  await row(page, cast.intermediate).click();
  await expect(page).toHaveURL(/\/admin\/students\/[0-9a-f-]{36}$/);
  const main = page.locator("main");

  await expect(page.getByRole("heading", { name: cast.intermediate.name, level: 1 })).toBeVisible();
  await expect(main).toContainText(/Signed up \d+ \w+ \d{4} · In progress on Intermediate/);
  await expect(main).toContainText("In progress on Intermediate");

  // The four headline figures.
  await expect(main).toContainText(/Stages passed\s*3\s*of 11/);
  await expect(main).toContainText(/Certificates\s*1\s*of 3/);
  await expect(main).toContainText(/Baseline Sittings\s*2\s*of 4/);
  await expect(main).toContainText(/Latest Baseline\s*100%\s*20 of 20\s*Sitting 2/);

  // Each Level with its Stages: Beginner done with its Certificate, Intermediate under way.
  await expect(main).toContainText(/Beginner\s*Certificate issued\s*3 of 3 Stages passed/);
  await expect(main).toContainText(/Certificate issued .*public ID S7-\d{4}-B-\d{6}/);
  await expect(main).toContainText(/Intermediate\s*In progress\s*0 of 4 Stages passed/);
  await expect(main).toContainText(/How donation happens: the process\s*Next up/);
  await expect(main).toContainText(/Advanced\s*Not started/);

  // The Baseline table, with Improvement on Beginner.
  const baseline = page.getByRole("table", { name: /Baseline Sittings, with Improvement by Level/ });
  await expect(baseline.getByRole("row", { name: /1\. At signup.*0 of 20/ })).toBeVisible();
  await expect(baseline.getByRole("row", { name: /2\. After Beginner.*20 of 20/ })).toBeVisible();
  await expect(baseline.getByRole("row", { name: /Improvement.*\+100 pp/ })).toBeVisible();
  await expect(baseline.getByRole("row", { name: /3\. After Intermediate/ })).toContainText("Not yet owed");

  // Dashboard activity, newest first.
  const activity = page.getByRole("table", { name: /recent dashboard activity/ });
  await expect(activity.getByRole("row", { name: /Opened a lesson\s*Why donation matters/ })).toBeVisible();

  // The way back.
  await page.getByRole("link", { name: "Students", exact: true }).first().click();
  await expect(page).toHaveURL(/\/admin\/students$/);
});

test("a Student who has not sat the Baseline drills down to a record that says so", async ({
  page,
  context,
}) => {
  await signInAsAdmin(page, context);
  await page.goto("/admin/students");
  await row(page, cast.awaiting).click();
  const main = page.locator("main");
  await expect(page.getByRole("heading", { name: cast.awaiting.name, level: 1 })).toBeVisible();
  await expect(main).toContainText("Awaiting first Sitting");
  await expect(main).toContainText(/Stages passed\s*0\s*of 11/);
  await expect(main).toContainText("Not taken yet. Stage content stays closed until it is.");
  await expect(main).toContainText("No activity recorded yet");
});

test("the Admin has no content tools and no way to export the data", async ({ page, context }) => {
  await signInAsAdmin(page, context);
  const nav = page.getByRole("navigation", { name: "Admin sections" });
  await page.goto("/admin");
  await expect(nav.getByRole("link")).toHaveText(["Overview", "Students", "Eligibility rule", "Content review"]);

  for (const path of ["/admin", "/admin/students", "/admin/eligibility", "/admin/content-review"]) {
    await page.goto(path);
    await expect(page.getByRole("link", { name: /export|download|csv/i }), path).toHaveCount(0);
    await expect(page.getByRole("button", { name: /export|download|csv/i }), path).toHaveCount(0);
  }
  for (const path of ["/admin/content", "/admin/export", "/admin/lessons"]) {
    expect((await page.goto(path))?.status(), path).toBe(404);
  }
});
