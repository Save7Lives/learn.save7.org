import { test, expect } from "../fixtures";
import {
  arrangeAdmin,
  arrangeRegisteredLearner,
  chooseGoogleAccount,
  newIdentity,
  signInWithGoogle as signIn,
} from "../support/people";

/**
 * Proof that the harness can be somebody other than a new Student, so the journeys
 * that follow (T36: the 18+ refusal, consent gating, the Admin and Owner journeys)
 * start from working fixtures. These are deliberately thin: they check each person
 * can sign in and land where their role puts them, nothing more.
 */
test("a registered Student signs in and an Admin URL is hidden from them", async ({ page, context, db }) => {
  const student = newIdentity("student");
  await arrangeRegisteredLearner(db, student);
  await chooseGoogleAccount(context, student);
  await signIn(page);
  await expect(page).toHaveURL(/\/dashboard$/);

  const response = await page.goto("/admin");
  expect(response?.status()).toBe(404);
});

test("an Admin signs in and can open the Admin Overview", async ({ page, context, db }) => {
  const admin = newIdentity("admin");
  await arrangeAdmin(db, admin, "admin");
  await chooseGoogleAccount(context, admin);
  await signIn(page);
  await expect(page).toHaveURL(/\/dashboard$/);

  const response = await page.goto("/admin");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("link", { name: "Students" }).first()).toBeVisible();
});

test("the Owner signs in and can open the Admin Overview", async ({ page, context, db }) => {
  const owner = newIdentity("owner");
  await arrangeAdmin(db, owner, "owner");
  await chooseGoogleAccount(context, owner);
  await signIn(page);
  await expect(page).toHaveURL(/\/dashboard$/);

  const response = await page.goto("/admin");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("link", { name: "Students" }).first()).toBeVisible();
});

test("an address nobody registered cannot sign in", async ({ page, context }) => {
  const stranger = newIdentity("stranger");
  await chooseGoogleAccount(context, stranger);
  await signIn(page);
  // The database's sign-in trigger refuses an unregistered address; the app stays put.
  await expect(page).not.toHaveURL(/\/dashboard/);
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
});

test("a Student whose consent is missing is sent to finish enrolling", async ({ page, context, db }) => {
  const student = newIdentity("noconsent");
  await arrangeRegisteredLearner(db, student, { consent: false });
  await chooseGoogleAccount(context, student);
  await signIn(page);
  await expect(page).toHaveURL(/\/enrol/);
});
