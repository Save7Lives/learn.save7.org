import { test, expect } from "../fixtures";
import { GATEWAY_URL, ANON_KEY } from "../support/config";
import { chooseGoogleAccount, newIdentity, signInWithGoogle } from "../support/people";

/**
 * The 18+ rule (spec 11, stories 14 to 16, 20 and 25).
 *
 * There are three ways in, and the rule has to hold on each:
 *
 *   1. the register form, which refuses an under-18 date before sending anything;
 *   2. the registration function itself, because the form is only a courtesy and the
 *      endpoint is public;
 *   3. a person the sign-in trigger already admits (staff, volunteers) and who is
 *      asked their date of birth on first entry, who must meet a terminal page.
 *
 * "Nothing stored" is the point of all three, so each test ends by checking that no
 * Student exists for that address, and that the address still cannot sign in.
 */

/** An ISO date this many whole years (and a few days) ago, in UTC, clear of any birthday edge. */
function yearsAgo(years: number): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - years);
  d.setUTCDate(d.getUTCDate() - 3);
  return d.toISOString().slice(0, 10);
}

const REFUSED = "You must be 18 or older to register for this course.";

test("the register form refuses someone under 18 and nothing is stored", async ({ page, context, db }) => {
  const child = newIdentity("minor");

  await page.goto("/register");
  await page.getByRole("textbox", { name: /^First name/ }).fill(child.givenName);
  await page.getByRole("textbox", { name: /^Surname/ }).fill(child.familyName);
  await page.getByRole("textbox", { name: /^Email address/ }).fill(child.email);
  await page.getByRole("textbox", { name: /^Date of birth/ }).fill(yearsAgo(15));
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Register" }).click();

  // Told clearly, under the field it is about, and not registered.
  await expect(page.getByText(REFUSED, { exact: true })).toBeVisible();
  await expect(page.getByText(/You.re registered/)).toHaveCount(0);

  // Nothing was kept about them.
  const stored = await db.query("select 1 from learners where lower(email) = lower($1)", [child.email]);
  expect(stored.rowCount).toBe(0);

  // And because nothing was kept, that address cannot sign in.
  await chooseGoogleAccount(context, child);
  await signInWithGoogle(page);
  await expect(page).not.toHaveURL(/\/dashboard/);
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
});

test("an adult who registers is accepted, so the refusal is about age and nothing else", async ({ page }) => {
  const adult = newIdentity("adult");
  await page.goto("/register");
  await page.getByRole("textbox", { name: /^First name/ }).fill(adult.givenName);
  await page.getByRole("textbox", { name: /^Surname/ }).fill(adult.familyName);
  await page.getByRole("textbox", { name: /^Email address/ }).fill(adult.email);
  await page.getByRole("textbox", { name: /^Date of birth/ }).fill(yearsAgo(30));
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByText(/You.re registered/)).toBeVisible();
});

test("the registration function refuses an under-18 date sent straight to it", async ({
  page,
  context,
  db,
  request,
}) => {
  const child = newIdentity("bypass");

  // What anyone with the public anon key can send, skipping the form altogether.
  const response = await request.post(`${GATEWAY_URL}/functions/v1/register-learner`, {
    headers: { authorization: `Bearer ${ANON_KEY}`, "content-type": "application/json" },
    data: {
      firstName: child.givenName,
      lastName: child.familyName,
      email: child.email,
      dateOfBirth: yearsAgo(16),
      popiaConsent: true,
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
  const body = (await response.json()) as { error?: string };
  expect(body.error).toMatch(/18/);

  const stored = await db.query("select 1 from learners where lower(email) = lower($1)", [child.email]);
  expect(stored.rowCount).toBe(0);

  await chooseGoogleAccount(context, child);
  await signInWithGoogle(page);
  await expect(page).not.toHaveURL(/\/dashboard/);
});

test("the registration function refuses a registration with no consent", async ({ db, request }) => {
  const adult = newIdentity("noconsent-api");
  const response = await request.post(`${GATEWAY_URL}/functions/v1/register-learner`, {
    headers: { authorization: `Bearer ${ANON_KEY}`, "content-type": "application/json" },
    data: {
      firstName: adult.givenName,
      lastName: adult.familyName,
      email: adult.email,
      dateOfBirth: yearsAgo(30),
      popiaConsent: false,
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
  const stored = await db.query("select 1 from learners where lower(email) = lower($1)", [adult.email]);
  expect(stored.rowCount).toBe(0);
});

test("someone already admitted who turns out to be under 18 meets a terminal refusal", async ({
  page,
  context,
  db,
}) => {
  // A Save7 address is admitted by the sign-in trigger with no registration, so the
  // course asks for the date of birth on first entry.
  const staff = newIdentity("staff-minor", { domain: "save7.org" });
  await chooseGoogleAccount(context, staff);
  await signInWithGoogle(page);

  await expect(page).toHaveURL(/\/enrol/);
  await expect(page.getByRole("heading", { name: "Your date of birth" })).toBeVisible();
  await page.getByRole("textbox", { name: /^Date of birth/ }).fill(yearsAgo(16));
  await page.getByRole("button", { name: "Continue" }).click();

  // The refusal page: says why, offers no form to loop back into, and they are signed out.
  await expect(page).toHaveURL(/\/enrol\/refused$/);
  await expect(page.getByRole("heading", { name: "18 or older only" })).toBeVisible();
  await expect(page.getByText(REFUSED, { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /continue|start the course|register/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Back to the homepage" })).toBeVisible();

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);

  // The date they gave was never stored, and neither was the Student.
  const stored = await db.query("select 1 from learners where lower(email) = lower($1)", [staff.email]);
  expect(stored.rowCount).toBe(0);
});

test("someone already admitted who is an adult is asked for their date of birth, then their consent", async ({
  page,
  context,
}) => {
  const staff = newIdentity("staff-adult", { domain: "save7.org" });
  await chooseGoogleAccount(context, staff);
  await signInWithGoogle(page);

  await expect(page.getByRole("heading", { name: "Your date of birth" })).toBeVisible();
  await page.getByRole("textbox", { name: /^Date of birth/ }).fill(yearsAgo(35));
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Your information" })).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Start the course" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("the refusal page can be reached directly and holds no form to loop back into", async ({ page }) => {
  // It needs no session: by the time anyone sees it the row is gone and they are signed out.
  await page.goto("/enrol/refused");
  await expect(page.getByRole("heading", { name: "18 or older only" })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Back to the homepage" })).toBeVisible();
});
