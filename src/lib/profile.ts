import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "./db";
import { certificates, users } from "@/db/schema";
import { recordEvent } from "./progress";
import { NAME_MAX } from "./constants";

/**
 * A learner's own account details.
 *
 * Kept apart from auth.ts, which is about proving who someone is. This is about
 * what they may change about themselves — currently their name, which matters more
 * here than in most products because it is printed on a certificate.
 */

export type ProfileResult = { ok: true; name: string } | { ok: false; error: string };

/**
 * Tidy whitespace and strip control characters.
 *
 * Deliberately does *not* validate the shape of a name. Rules like "letters only"
 * or "no numbers" reject real people — apostrophes, Afrikaans prefixes, hyphenated
 * surnames, names in other scripts. The only things removed are those that would
 * corrupt a certificate: control characters and runs of whitespace.
 */
function clean(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The full name stored on User.name and printed on certificates. */
export function composeName(firstName: string, lastName: string): string {
  return clean(`${clean(firstName)} ${clean(lastName)}`);
}

/**
 * Validate a first name and surname, returning the composed full name.
 *
 * Shared with registration so signup and profile editing cannot drift apart and
 * start accepting different things.
 */
export function validateName(
  firstNameRaw: string,
  lastNameRaw: string,
):
  | { ok: true; firstName: string; lastName: string; name: string }
  | { ok: false; error: string } {
  const firstName = clean(firstNameRaw);
  const lastName = clean(lastNameRaw);

  if (!firstName) return { ok: false, error: "Please enter your first name." };
  if (!lastName) return { ok: false, error: "Please enter your surname." };
  if (firstName.length > NAME_MAX || lastName.length > NAME_MAX)
    return { ok: false, error: `Please keep each name under ${NAME_MAX} characters.` };

  return { ok: true, firstName, lastName, name: `${firstName} ${lastName}` };
}

export type Profile = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  popiaConsentAt: Date | null;
};

/**
 * The learner's own record.
 *
 * firstName / lastName are nullable in the database for accounts that predate
 * them, so they are filled here by splitting `name` the same way migration 0002
 * does — the form is never blank, and saving once makes the split permanent.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      firstName: users.firstName,
      lastName: users.lastName,
      createdAt: users.createdAt,
      popiaConsentAt: users.popiaConsentAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) return null;

  const spaceAt = row.name.indexOf(" ");
  return {
    ...row,
    firstName: row.firstName ?? (spaceAt > 0 ? row.name.slice(0, spaceAt) : row.name),
    lastName: row.lastName ?? (spaceAt > 0 ? row.name.slice(spaceAt + 1).trim() : ""),
  };
}

/**
 * Change the learner's name.
 *
 * Also rewrites the name on their live certificates. That looks like it defeats
 * the purpose of a snapshot, so it is worth being explicit: the snapshot exists so
 * verification keeps working if the account is later deleted, not to freeze a
 * typo. Someone who corrects the spelling of their own name should get a corrected
 * certificate, and the certificate's meaning — this person passed this level on
 * this date — does not change when the spelling does. Revoked certificates are
 * left alone: those are historical records and should not move.
 */
export async function updateProfile(
  userId: string,
  input: { firstName: string; lastName: string },
): Promise<ProfileResult> {
  const validated = validateName(input.firstName, input.lastName);
  if (!validated.ok) return validated;

  const { firstName, lastName, name } = validated;

  await db
    .update(users)
    .set({ firstName, lastName, name, updatedAt: new Date() })
    .where(eq(users.id, userId));

  await db
    .update(certificates)
    .set({ learnerNameSnapshot: name })
    .where(and(eq(certificates.userId, userId), isNull(certificates.revokedAt)));

  // Recorded so that a name change on an issued certificate is traceable. Stores
  // no names — keeping the old one would retain personal information the learner
  // has just asked us to stop using.
  await recordEvent(userId, "profile_update", {
    metaJson: JSON.stringify({ field: "name" }),
  });

  return { ok: true, name };
}
