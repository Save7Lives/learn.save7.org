import { randomBytes } from "node:crypto";
import type { BrowserContext } from "@playwright/test";
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

export function newIdentity(label = "student", names?: { given?: string; family?: string }): Identity {
  const tag = randomBytes(4).toString("hex");
  const givenName = names?.given ?? "Thandi";
  const familyName = names?.family ?? `Test${tag}`;
  return {
    // `.test` is reserved (RFC 2606): it can never be a real mailbox.
    email: `${label}-${tag}@e2e.test`,
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

/** Registered as an adult with consent: what `register-learner` leaves behind. */
export async function arrangeRegisteredLearner(
  db: Client,
  who: Identity,
  options: { dateOfBirth?: string; consent?: boolean } = {},
) {
  const { dateOfBirth = "1990-04-12", consent = true } = options;
  await db.query(
    `insert into learners (email, first_name, last_name, name, date_of_birth, popia_consent_at)
     values ($1, $2, $3, $4, $5, $6)
     on conflict do nothing`,
    [who.email, who.givenName, who.familyName, who.name, dateOfBirth, consent ? new Date() : null],
  );
}

/** An auth account for this person, made the way a first sign-in makes it. */
async function arrangeAuthUser(db: Client, who: Identity): Promise<string> {
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
