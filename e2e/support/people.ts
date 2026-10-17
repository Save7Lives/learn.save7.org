import { randomBytes } from "node:crypto";
import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import type { Client } from "pg";

import { APP_URL } from "./config";

/**
 * People for tests to be: a Student, an Admin, the Owner, someone under 18.
 *
 * Each call makes a fresh address, so tests never share an account and can run in
 * parallel against one database. `arrange*` functions write straight to the database
 * as a superuser to set the scene quickly. They are for arranging only; what a test
 * asserts must be something a visitor, Student or Admin could observe.
 */
export type Identity = {
  email: string;
  name: string;
  givenName: string;
  familyName: string;
};

export function newIdentity(
  label = "student",
  names?: {
    given?: string;
    family?: string;
    /**
     * The mail domain. The default, `.test`, can never be a real mailbox. Pass
     * `save7.org` to be a staff member, whom the sign-in trigger admits without a
     * registration (and who is therefore asked for a date of birth and consent on
     * first entry). Still unique per call, so still safe to run in parallel.
     */
    domain?: string;
  },
): Identity {
  const tag = randomBytes(4).toString("hex");
  const givenName = names?.given ?? "Thandi";
  const familyName = names?.family ?? `Test${tag}`;
  return {
    // `.test` is reserved (RFC 2606): it can never be a real mailbox.
    email: `${label}-${tag}@${names?.domain ?? "e2e.test"}`,
    name: `${givenName} ${familyName}`,
    givenName,
    familyName,
  };
}

/**
 * Make the next Google sign-in in this browser context be this person. The gateway
 * reads the cookie; with none, it refuses to sign anybody in.
 */
export async function chooseGoogleAccount(context: BrowserContext, who: Identity) {
  const value = Buffer.from(JSON.stringify(who)).toString("base64url");
  await context.addCookies([{ name: "e2e_identity", value, url: APP_URL }]);
}

/**
 * Press the app's own "Continue with Google" on the sign-in page. Call after
 * `chooseGoogleAccount`. Returns once the click is made; the test then asserts where
 * the person lands. Real Google is never contacted: anything bound for it is aborted.
 */
export async function signInWithGoogle(page: Page, next?: string) {
  await page.route("https://accounts.google.com/**", (route) => route.abort());
  await page.goto(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  await page.getByRole("button", { name: "Continue with Google" }).click();
}

/**
 * A second (third...) person in the same test: a browser context of their own, signed
 * in as them. For journeys where one person's action changes what another can see.
 * Close the context when done.
 */
export async function openSignedIn(browser: Browser, baseURL: string | undefined, who: Identity) {
  const context = await browser.newContext({ baseURL, viewport: { width: 1024, height: 900 } });
  await chooseGoogleAccount(context, who);
  const page = await context.newPage();
  await signInWithGoogle(page);
  await expect(page).toHaveURL(/\/dashboard$/);
  return { context, page };
}

/** Registered as an adult with consent: what `register-learner` leaves behind. */
export async function arrangeRegisteredLearner(
  db: Client,
  who: Identity,
  options: {
    /** `null` is "not yet asked", as for someone admitted by the sign-in trigger. */
    dateOfBirth?: string | null;
    consent?: boolean;
    /** Backdate the signup, for the "Signed up" filters. */
    signedUpDaysAgo?: number;
  } = {},
) {
  const { dateOfBirth = "1990-04-12", consent = true, signedUpDaysAgo = 0 } = options;
  await db.query(
    `insert into learners (email, first_name, last_name, name, date_of_birth, popia_consent_at, created_at)
     values ($1, $2, $3, $4, $5, $6, now() - make_interval(days => $7::int))
     on conflict do nothing`,
    [
      who.email,
      who.givenName,
      who.familyName,
      who.name,
      dateOfBirth,
      consent ? new Date() : null,
      signedUpDaysAgo,
    ],
  );
  // The sign-in trigger links a Student to their account when the account is made. If
  // the account came first (a kept database, or a Student re-arranged), link it here.
  await db.query(
    `update learners set user_id = (select id from auth.users where lower(email) = lower($1))
      where lower(email) = lower($1) and user_id is null`,
    [who.email],
  );
}

/** An auth account for this person, made the way a first sign-in makes it. */
export async function arrangeAuthUser(db: Client, who: Identity): Promise<string> {
  const existing = await db.query<{ id: string }>(
    "select id from auth.users where lower(email) = lower($1)",
    [who.email],
  );
  if (existing.rows[0]) return existing.rows[0].id;
  const { rows } = await db.query<{ id: string }>(
    "insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id",
    [who.email, JSON.stringify({ full_name: who.name, given_name: who.givenName, family_name: who.familyName })],
  );
  return rows[0].id;
}

/**
 * A Learn Admin (`role: "admin"`) or the Owner. Works on the real tables, so the
 * database's own rules (one Owner, no Owner-less table) apply, except that for the
 * Owner any earlier Owner is replaced: the Owner trigger is bypassed for this one
 * fixture statement so each test can have an Owner of its own.
 */
export async function arrangeAdmin(db: Client, who: Identity, role: "admin" | "owner" = "admin") {
  await arrangeRegisteredLearner(db, who);
  const userId = await arrangeAuthUser(db, who);
  await db.query("begin");
  try {
    await db.query("set local session_replication_role = replica");
    if (role === "owner") await db.query("delete from learn_admins where role = 'owner'");
    await db.query(
      `insert into learn_admins (user_id, role) values ($1, $2)
       on conflict (user_id) do update set role = excluded.role`,
      [userId, role],
    );
    await db.query("commit");
  } catch (error) {
    await db.query("rollback");
    throw error;
  }
}
