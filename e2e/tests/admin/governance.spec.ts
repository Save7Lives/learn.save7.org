import type { Page } from "@playwright/test";
import type { Client } from "pg";

import { test, expect, gotoAdmin } from "../../fixtures";
import { openRunDatabase } from "../../support/database";
import {
  arrangeAdmin,
  arrangeAuthUser,
  arrangeRegisteredLearner,
  chooseGoogleAccount,
  newIdentity,
  openSignedIn,
  signInWithGoogle,
} from "../../support/people";
import { api, tokenFor } from "../../support/rest";

/**
 * Who may change what (spec 11, stories 78 to 86 and 103).
 *
 *   Eligibility Rule     any Admin edits it, as a new version each time, never empty
 *   Content review       any Admin signs an item off, recorded under their own name
 *   Admin access         only the Owner grants and revokes; the Owner cannot be revoked;
 *                        Save7 staff are not Admins unless granted
 *
 * These change what the whole site shares (the one Owner, the rule's versions, the
 * review register), so this file is its own project, run alone after the cohort file
 * (see playwright.config.ts). The Owner, an ordinary Admin and a Student to grant
 * are arranged once; each test signs in as whom it needs.
 */
const tag = Math.random().toString(16).slice(2, 6);
const owner = newIdentity("gov-owner", { given: "Olivia", family: `Owner${tag}` });
const admin = newIdentity("gov-admin", { given: "Adaeze", family: `Admin${tag}` });
const student = newIdentity("gov-student", { given: "Sipho", family: `Student${tag}` });

let studentId = "";
let ownerLearnerId = "";
let adminLearnerId = "";
let reviewClaim = "";

test.beforeAll(async () => {
  const db = await openRunDatabase();
  try {
    await arrangeAdmin(db, owner, "owner");
    await arrangeAdmin(db, admin, "admin");
    await arrangeRegisteredLearner(db, student);
    await arrangeAuthUser(db, student);

    const id = (who: { email: string }) =>
      db
        .query<{ id: string }>("select id from learners where lower(email) = lower($1)", [who.email])
        .then((r) => r.rows[0].id);
    studentId = await id(student);
    ownerLearnerId = await id(owner);
    adminLearnerId = await id(admin);

    // A clean slate for the rule, so a rerun on a kept database starts as a first run
    // does. (Version numbers come from a sequence and keep counting; nothing below
    // assumes where they start.)
    await db.query("delete from learn_eligibility_signals");
    await db.query("delete from learn_eligibility_rules");

    // One claim waiting for a reviewer. Everything else in the register is already approved.
    const { rows } = await db.query<{ claim: string }>(
      `update learn_review_items
          set status = 'NEEDS_VERIFICATION', cleared_by_user = null, cleared_at = null
        where id = (select id from learn_review_items order by severity, location, id limit 1)
        returning claim`,
    );
    reviewClaim = rows[0].claim;
  } finally {
    await db.end();
  }
});

async function signInAs(page: Page, context: Parameters<typeof chooseGoogleAccount>[0], who: typeof owner) {
  await chooseGoogleAccount(context, who);
  await signInWithGoogle(page);
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** A saved rule, as an Admin's save leaves it, for a test that needs one to protect. */
async function arrangeRule(db: Client, flags: string[] = ["level_complete:beginner"]) {
  const userId = await arrangeAuthUser(db, admin);
  await db.query("insert into learn_eligibility_rules (required_flags, created_by_user) values ($1, $2)", [
    flags,
    userId,
  ]);
}

const flag = (page: Page, level: string) => page.getByRole("checkbox", { name: new RegExp(`^${level} Level complete`) });
const versions = (page: Page) => page.getByRole("table", { name: /Every version of the Eligibility Rule/ });

// ── Eligibility Rule ────────────────────────────────────────────────────────

test("an Admin edits the Eligibility Rule, and each save is a new version that keeps the old one", async ({
  page,
  context,
}) => {
  await signInAs(page, context, admin);
  await gotoAdmin(page, "/admin/eligibility");

  // Nothing is saved until a flag is chosen, and nothing can be saved unchanged.
  const save = page.getByRole("button", { name: /^Save as version \d+$/ });
  await expect(save).toBeDisabled();
  await expect(page.getByText("Pick at least one flag to save.")).toBeVisible();

  // First version: Beginner Level complete. The number is the database's, so read it
  // back from the page rather than guess it.
  await flag(page, "Beginner").check();
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page).toHaveURL(/saved=\d+$/);
  const first = Number(new URL(page.url()).searchParams.get("saved"));
  await expect(page.getByText(`Saved as version ${first}. Earlier versions are kept in the history below.`)).toBeVisible();

  // The current rule, with who saved it by name.
  const current = page.getByRole("region", { name: "Current rule" });
  await expect(current).toContainText(`Version ${first}`);
  await expect(current).toContainText(`by ${admin.name}`);
  await expect(current).toContainText("Beginner Level complete");

  // An unchanged rule cannot be saved again.
  await expect(page.getByText("Change a flag to save a new version.")).toBeVisible();
  await expect(save).toBeDisabled();

  // Second version: Intermediate as well. The page says what saving will do.
  await flag(page, "Intermediate").check();
  await expect(save).toHaveText(`Save as version ${first + 1}`);
  await expect(page.getByText(`Saving adds version ${first + 1}. Version ${first} is kept as it is.`)).toBeVisible();
  await save.click();
  await expect(page).toHaveURL(new RegExp(`saved=${first + 1}$`));

  // History: the newest is current and lists both flags; the first is unchanged.
  await expect(current).toContainText(`Version ${first + 1}`);
  await expect(current).toContainText(/Beginner Level complete\s*Intermediate Level complete/);
  const rows = versions(page).getByRole("row");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(1)).toContainText(new RegExp(`${first + 1}\\s*Current`));
  await expect(rows.nth(1)).toContainText("Intermediate Level complete");
  await expect(rows.nth(2)).toContainText(new RegExp(`^${first}(?!\\d)`));
  await expect(rows.nth(2)).not.toContainText("Intermediate");
  await expect(rows.nth(2)).toContainText(admin.name);

  // Overview shows it read-only, with the way to edit it.
  await gotoAdmin(page, "/admin");
  const card = page.getByRole("region", { name: "Nerve Center eligibility" });
  await expect(card).toContainText(`Version ${first + 1}`);
  await expect(card).toContainText("Intermediate Level complete");
  await card.getByRole("link", { name: "Edit the rule" }).click();
  await expect(page).toHaveURL(/\/admin\/eligibility$/);
});

test("an empty Eligibility Rule is refused, even when the form is forced", async ({ page, context, db }) => {
  await arrangeRule(db);
  await signInAs(page, context, admin);
  await gotoAdmin(page, "/admin/eligibility");

  // gotoAdmin has waited for the page, so the one-off reads below see the real rule history.
  // eslint-disable-next-line no-restricted-syntax -- the count is the baseline the test compares to
  const before = await versions(page).getByRole("row").count();
  expect(before).toBeGreaterThan(1);
  // eslint-disable-next-line no-restricted-syntax -- the baseline the test compares to
  const current = await page.getByRole("region", { name: "Current rule" }).innerText();

  // Untick everything: told why, and Save is off.
  for (const level of ["Beginner", "Intermediate", "Advanced"]) await flag(page, level).uncheck();
  const refusal = "A rule with no flags would make every Student eligible. Pick at least one.";
  await expect(page.getByText(refusal).first()).toBeVisible();
  const save = page.getByRole("button", { name: /^Save as version \d+$/ });
  await expect(save).toBeDisabled();

  // Force it past the browser, the way a script would: the server says no as well.
  await save.evaluate((button: HTMLButtonElement) => button.removeAttribute("disabled"));
  await save.click();
  await expect(page.getByText(refusal)).toHaveCount(2);

  await page.reload();
  await expect(versions(page).getByRole("row")).toHaveCount(before);
  await expect(page.getByRole("region", { name: "Current rule" })).toHaveText(current, { useInnerText: true });
});

test("a saved rule version cannot be changed afterwards, by anyone", async ({ db }) => {
  await arrangeRule(db);
  const token = await tokenFor(db, admin);
  const { rows } = await db.query<{ version: number; required_flags: string[] }>(
    "select version, required_flags from learn_eligibility_rules order by version limit 1",
  );
  const oldest = rows[0];

  // An Admin, with the real API, trying to rewrite and then to delete a saved version.
  await api(`learn_eligibility_rules?version=eq.${oldest.version}`, {
    token,
    method: "PATCH",
    body: { required_flags: [] },
  });
  await api(`learn_eligibility_rules?version=eq.${oldest.version}`, { token, method: "DELETE" });
  const after = await db.query("select required_flags from learn_eligibility_rules where version = $1", [
    oldest.version,
  ]);
  expect(after.rows[0]?.required_flags).toEqual(oldest.required_flags);
});

test("a Student cannot save an Eligibility Rule or read the rules", async ({ db }) => {
  const token = await tokenFor(db, student);
  expect((await api("learn_eligibility_rules?select=version", { token })).body).toEqual([]);

  const userId = await arrangeAuthUser(db, student);
  const forged = await api("learn_eligibility_rules", {
    token,
    method: "POST",
    body: { required_flags: ["level_beginner_complete"], created_by_user: userId },
  });
  expect(forged.ok).toBe(false);
});

// ── Content review ──────────────────────────────────────────────────────────

test("an Admin signs off a review item, and it is recorded against their name", async ({ page, context }) => {
  await signInAs(page, context, admin);
  await gotoAdmin(page, "/admin/content-review");

  const item = page.getByRole("listitem").filter({ hasText: reviewClaim });
  await expect(item).toHaveCount(1);
  await item.getByRole("button", { name: "Review" }).click();
  await item.getByRole("textbox", { name: "Reviewer notes" }).fill("Checked against the cited source.");
  await item.getByRole("button", { name: "Approve" }).click();

  // It leaves the queue of items needing verification.
  await expect(page.getByRole("listitem").filter({ hasText: reviewClaim })).toHaveCount(0);

  // And is under Approved with who decided and when.
  await page.getByRole("link", { name: /^Approved \d+$/ }).click();
  await expect(page).toHaveURL(/status=APPROVED/);
  const approved = page.getByRole("listitem").filter({ hasText: reviewClaim });
  await expect(approved).toContainText(new RegExp(`Approved by ${admin.name} on `));

  // It survives a reload: it is stored, not just drawn.
  await page.reload();
  await expect(page.getByRole("listitem").filter({ hasText: reviewClaim })).toContainText(
    `Approved by ${admin.name}`,
  );
});

test("a Student cannot reach content review or change a review item", async ({ page, context, db }) => {
  await signInAs(page, context, student);
  expect((await page.goto("/admin/content-review"))?.status()).toBe(404);

  const token = await tokenFor(db, student);
  const { rows } = await db.query<{ id: string; status: string }>(
    "select id, status from learn_review_items order by id limit 1",
  );
  await api(`learn_review_items?id=eq.${rows[0].id}`, {
    token,
    method: "PATCH",
    body: { status: "REJECTED" },
  });
  const after = await db.query("select status from learn_review_items where id = $1", [rows[0].id]);
  expect(after.rows[0].status).toBe(rows[0].status);
});

// ── Admin access ────────────────────────────────────────────────────────────

test("the Owner makes a Student an Admin and takes it away again", async ({ page, context, browser, baseURL }) => {
  await signInAs(page, context, owner);
  await gotoAdmin(page, "/admin/students");
  const table = page.getByRole("table", { name: "Students, most recent signup first" });
  const row = table.getByRole("row", { name: new RegExp(student.name) });
  await expect(row).toContainText("Student");

  // The Student is signed in elsewhere. Before: no Admin, and the page is not even there.
  const theirs = await openSignedIn(browser, baseURL, student);
  expect((await theirs.page.goto("/admin"))?.status()).toBe(404);
  await expect(theirs.page.getByRole("link", { name: "Admin", exact: true })).toHaveCount(0);

  // Grant.
  await row.getByRole("button", { name: `Make ${student.name} an admin` }).click();
  await expect(row.getByRole("button", { name: `Remove admin from ${student.name}` })).toBeVisible();
  await expect(row).toContainText("Admin");
  await expect(row).not.toContainText("Make admin");

  // After: they can open the Admin at once, with no new sign-in.
  expect((await theirs.page.goto("/admin"))?.status()).toBe(200);
  await expect(theirs.page.getByRole("heading", { name: "Overview", level: 1 })).toBeVisible();

  // The Owner sees the grant on the Student's own page too.
  await row.getByRole("link", { name: new RegExp(`^${student.name}, open`) }).click();
  await expect(page.getByRole("heading", { name: student.name, level: 1 })).toBeVisible();
  await expect(page.locator("main")).toContainText("Admin");

  // Revoke, from the drill-down this time.
  await page.getByRole("button", { name: `Remove admin from ${student.name}` }).click();
  await expect(page.getByRole("button", { name: `Make ${student.name} an admin` })).toBeVisible();

  expect((await theirs.page.goto("/admin"))?.status()).toBe(404);
  await theirs.context.close();
});

test("an ordinary Admin sees who the Owner is but cannot grant or revoke Admin", async ({
  page,
  context,
  db,
}) => {
  await signInAs(page, context, admin);

  // They can see who grants access.
  await gotoAdmin(page, "/admin/students");
  await expect(page.getByText(`Owner: ${owner.name}`)).toBeVisible();

  // The Students list shows who is an Admin but offers no way to change it.
  const table = page.getByRole("table", { name: "Students, most recent signup first" });
  await expect(table.getByRole("row", { name: new RegExp(admin.name) })).toContainText("Admin");
  await expect(table.getByRole("row", { name: new RegExp(owner.name) })).toContainText("Owner");
  await expect(page.getByRole("button", { name: /make .* an admin|remove admin/i })).toHaveCount(0);

  // The database refuses it as well, whatever the page offers.
  const token = await tokenFor(db, admin);
  const grant = await api("rpc/learn_grant_admin", { token, method: "POST", body: { p_learner_id: studentId } });
  expect(grant.ok).toBe(false);
  expect(grant.message).toMatch(/Only the Owner/);

  const revoke = await api("rpc/learn_revoke_admin", {
    token,
    method: "POST",
    body: { p_learner_id: ownerLearnerId },
  });
  expect(revoke.ok).toBe(false);
  expect(revoke.message).toMatch(/Only the Owner/);

  // Nothing changed.
  const stillAdmin = await db.query(
    "select role from learn_admins a join auth.users u on u.id = a.user_id where lower(u.email) = lower($1)",
    [student.email],
  );
  expect(stillAdmin.rowCount).toBe(0);
});

test("a Student cannot grant or revoke Admin either", async ({ db }) => {
  const token = await tokenFor(db, student);
  for (const [fn, target] of [
    ["learn_grant_admin", studentId],
    ["learn_revoke_admin", adminLearnerId],
  ] as const) {
    const result = await api(`rpc/${fn}`, { token, method: "POST", body: { p_learner_id: target } });
    expect(result.ok, fn).toBe(false);
  }
  const roster = await api("rpc/learn_admin_roster", { token, method: "POST", body: {} });
  expect(roster.ok && Array.isArray(roster.body) ? roster.body : []).toEqual([]);
});

test("the Owner cannot be revoked, by anyone, and stays the Owner", async ({ page, context, db }) => {
  await signInAs(page, context, owner);
  await gotoAdmin(page, "/admin/students");
  const table = page.getByRole("table", { name: "Students, most recent signup first" });
  const own = table.getByRole("row", { name: new RegExp(owner.name) });

  // The Owner's own row marks them and offers no button; an Admin's row offers Remove.
  await expect(own).toContainText("Owner");
  await expect(own.getByRole("button")).toHaveCount(0);
  await expect(table.getByRole("row", { name: new RegExp(admin.name) }).getByRole("button", { name: /Remove admin/ })).toBeVisible();

  // The database refuses even the Owner asking: it is not a page rule.
  const token = await tokenFor(db, owner);
  const revoke = await api("rpc/learn_revoke_admin", { token, method: "POST", body: { p_learner_id: ownerLearnerId } });
  expect(revoke.ok).toBe(false);
  expect(revoke.message).toMatch(/Owner cannot be removed/);

  // Nor can the Owner's row be deleted or demoted straight through the API.
  const demoted = await api("learn_admins?role=eq.owner", { token, method: "PATCH", body: { role: "admin" } });
  expect(demoted.ok && Array.isArray(demoted.body) && demoted.body.length > 0).toBe(false);

  // Still the Owner: the Admin pages open and the Owner is named in the shell.
  expect((await page.goto("/admin"))?.status()).toBe(200);
  await expect(page.getByText(`Owner: ${owner.name}`)).toBeVisible();
});

test("Save7 staff are not Admins unless the Owner grants it", async ({ page, context }) => {
  const staff = newIdentity("gov-staff", { given: "Nomsa", family: `Staff${tag}`, domain: "save7.org" });
  await chooseGoogleAccount(context, staff);
  await signInWithGoogle(page);
  // Admitted to sign in, asked for their date of birth like anyone else...
  await expect(page).toHaveURL(/\/enrol/);
  // ...and the Admin is not theirs to open.
  expect((await page.goto("/admin"))?.status()).toBe(404);
  expect((await page.goto("/admin/students"))?.status()).toBe(404);
});
