import type { Page } from "@playwright/test";

import { test, expect } from "../fixtures";
import { chooseGoogleAccount, newIdentity } from "../support/people";

/**
 * The learner journey (T28): the one path every Student walks, start to finish.
 *
 *   register (adult) -> sign in -> Baseline Sitting 1 -> read a Stage ->
 *   Stage Quiz fail, then pass -> pass the Level's other Stage Quizzes ->
 *   Level completion -> Certificate download -> public verification
 *
 * Everything is asserted from what the Student or a visitor can see or download. The
 * answer key is read from the database only to know what to click (see the `quiz`
 * fixture), and Google is replaced by the test identity provider at the auth boundary
 * (e2e/support/gateway.ts).
 */

const LEVEL = "Beginner";
const STAGES = ["Why donation matters", "Busting the myths", "How donation actually works"];
const AWARD_ID = /^S7-\d{4}-[A-Z]-\d{6}$/;

/** Open a Stage from the Level page and move to its quiz step. */
async function openStageQuiz(page: Page, stage: string, readAllSteps: boolean) {
  await page.goto("/dashboard");
  await page.getByRole("link", { name: new RegExp(stage) }).first().click();
  await expect(page.getByRole("heading", { name: stage, level: 1 })).toBeVisible();

  const steps = page.getByRole("navigation", { name: "Steps in this Stage" });
  if (readAllSteps) {
    // Read it the way a person does: Continue, step after step, until the quiz.
    while (!(await page.getByRole("button", { name: "Start the quiz" }).isVisible())) {
      await page.getByRole("button", { name: "Continue", exact: true }).click();
    }
  } else {
    await steps.getByText("Check", { exact: true }).first().click();
  }
  await expect(page.getByRole("region", { name: "Stage Quiz" })).toBeVisible();
}

test("a learner registers, sits the Baseline, completes a Level and is verified", async ({
  page,
  browser,
  quiz,
  context,
  baseURL,
}) => {
  const me = newIdentity();
  await page.route("https://accounts.google.com/**", (route) => route.abort());

  // ── Register (adult) ──────────────────────────────────────────────────────
  await page.goto("/register");
  await page.getByRole("textbox", { name: /^First name/ }).fill(me.givenName);
  await page.getByRole("textbox", { name: /^Surname/ }).fill(me.familyName);
  await page.getByRole("textbox", { name: /^Email address/ }).fill(me.email);
  await page.getByRole("textbox", { name: /^Date of birth/ }).fill("1990-04-12");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByText(/You.re registered/)).toBeVisible();

  // ── Sign in ───────────────────────────────────────────────────────────────
  await chooseGoogleAccount(context, me);
  await page.getByRole("link", { name: "Sign in with Google" }).click();
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(me.name)).toBeVisible();
  // Nothing is open until the Baseline is sat.
  await expect(page.getByText("Start with the baseline")).toBeVisible();
  await expect(page.getByText("Opens after your baseline").first()).toBeVisible();

  // ── Baseline Sitting 1 ────────────────────────────────────────────────────
  await page.getByRole("link", { name: "Start the baseline assessment" }).click();
  await expect(page.getByText("This is not a test")).toBeVisible();
  await page.getByRole("button", { name: "Start the baseline" }).click();
  await expect(page.getByText("Question 1 of 20")).toBeVisible();
  await quiz.complete(page, "first", "Submit and start learning");
  await expect(page).toHaveURL(/\/assessment\/pre\/done$/);
  // The Baseline never reveals its answers.
  await expect(page.getByText(/correct answer/i)).toHaveCount(0);

  // ── Read a Stage; Stage Quiz: fail, then pass ─────────────────────────────
  await openStageQuiz(page, STAGES[0], true);
  const stageQuiz = page.getByRole("region", { name: "Stage Quiz" });
  await expect(stageQuiz.getByText("Not started")).toBeVisible();

  await page.getByRole("button", { name: "Start the quiz" }).click();
  await quiz.complete(page, "wrong", "Submit the quiz");
  await expect(page.getByText("Not passed yet").first()).toBeVisible();
  await expect(page.getByText(/You need 4 to pass/)).toBeVisible();
  await expect(page.getByText(/0\s+of 5/)).toBeVisible();

  await page.getByRole("button", { name: "Try again" }).click();
  await quiz.complete(page, "correct", "Submit the quiz");
  await expect(page.getByText("Passed", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/5\s+of 5/)).toBeVisible();
  // Not the last Stage Quiz in the Level, so no Certificate yet.
  await expect(page.getByText(/You.ve earned the/)).toHaveCount(0);

  await page.getByRole("button", { name: "Done" }).click();
  await expect(stageQuiz.getByText("You have passed this Stage")).toBeVisible();
  // Finish the Stage: the last step of the spine.
  while (!(await page.getByRole("button", { name: "Finish this Stage" }).isVisible())) {
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  }
  await page.getByRole("button", { name: "Finish this Stage" }).click();
  // Finishing carries the Student on to the next Stage.
  await expect(page.getByRole("heading", { name: STAGES[1], level: 1 })).toBeVisible();

  // ── The rest of the Level ─────────────────────────────────────────────────
  await openStageQuiz(page, STAGES[1], false);
  await page.getByRole("button", { name: "Start the quiz" }).click();
  await quiz.complete(page, "correct", "Submit the quiz");
  await expect(page.getByText("Passed", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/You.ve earned the/)).toHaveCount(0);

  await openStageQuiz(page, STAGES[2], false);
  await page.getByRole("button", { name: "Start the quiz" }).click();
  await quiz.complete(page, "correct", "Submit the quiz");

  // ── Level completion ──────────────────────────────────────────────────────
  await expect(page.getByText(/You.ve earned the/)).toBeVisible();
  await page.getByRole("link", { name: "View my certificate" }).click();
  await expect(page).toHaveURL(/\/certificate\/S7-/);
  const publicId = page.url().split("/").pop()!;
  expect(publicId).toMatch(AWARD_ID);

  await page.goto("/dashboard");
  await expect(page.getByText("3 of 11 Stages passed").first()).toBeVisible();
  await expect(page.getByText(publicId)).toBeVisible();

  // ── Certificate download ──────────────────────────────────────────────────
  await page.goto(`/certificate/${publicId}`);
  await expect(page.getByText("Valid certificate")).toBeVisible();
  await expect(page.getByRole("heading", { name: me.name, level: 1 })).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download as PDF" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe(`Save7-${publicId}-${me.name.replace(/\s+/g, "-")}.pdf`);
  const path = await download.path();
  const { readFile } = await import("node:fs/promises");
  const bytes = await readFile(path);
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  expect(bytes.length).toBeGreaterThan(10_000);

  // ── Public verification: a stranger, signed out, with only the ID ─────────
  const stranger = await browser.newContext({ baseURL });
  const visitor = await stranger.newPage();
  await visitor.goto(`/certificate/${publicId}`);
  await expect(visitor.getByText("Valid certificate")).toBeVisible();
  await expect(visitor.getByRole("heading", { name: me.name, level: 1 })).toBeVisible();
  await expect(visitor.getByText(`${LEVEL} Level`).first()).toBeVisible();
  // What a verifier must not learn.
  await expect(visitor.getByText(me.email)).toHaveCount(0);

  await visitor.goto("/certificate/S7-2026-B-999999");
  await expect(visitor.getByText("No certificate found")).toBeVisible();
  await stranger.close();
});
