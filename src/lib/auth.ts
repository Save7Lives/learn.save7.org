import "server-only";

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { validateName } from "./profile";
import { users } from "@/db/schema";
import type { UserRole } from "./constants";

/**
 * Session handling.
 *
 * Deliberately hand-rolled rather than pulling in an auth framework. The
 * requirement is email plus password and a role flag, which is a signed cookie
 * and a bcrypt comparison — perhaps eighty lines. A framework would add a large
 * dependency, a pre-release peer against a brand-new Next major, and an
 * indirection to read through when something breaks, in exchange for OAuth
 * providers this course does not use.
 *
 * If Save7 later wants Google sign-in, the seam to replace is
 * `createSession` / `getSession`; nothing else in the app reads the cookie.
 */

const COOKIE_NAME = "save7_session";
const SESSION_DAYS = 30;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set to at least 32 characters. Generate one with: openssl rand -base64 48",
    );
  }
  return new TextEncoder().encode(value);
}

// --- Passwords -------------------------------------------------------------

/**
 * Cost factor 12. High enough to be expensive to attack, low enough that a
 * login on modest hosting stays well under a second.
 */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// --- Session cookie --------------------------------------------------------

export async function createSession(user: SessionUser): Promise<void> {
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    // Not readable by JavaScript, not sent cross-site, and HTTPS-only in
    // production. `lax` rather than `strict` so that following a certificate
    // verification link from elsewhere does not appear logged out.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/**
 * The current session, or null.
 *
 * The cookie is trusted for identity only after signature verification, and the
 * role is then re-read from the database rather than taken from the token. A
 * revoked admin must lose access immediately, not in thirty days when their
 * cookie expires.
 */
export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    userId = payload.sub;
  } catch {
    // Expired, tampered with, or signed by a rotated secret.
    return null;
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return null;

  return { ...user, role: user.role as UserRole };
}

// --- Registration and login ------------------------------------------------

export type AuthResult = { ok: true; user: SessionUser } | { ok: false; error: string };

export async function registerUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  popiaConsent: boolean;
}): Promise<AuthResult> {
  // Shared with the profile page, so signup and editing cannot drift apart and
  // start accepting different things.
  const validated = validateName(input.firstName, input.lastName);
  if (!validated.ok) return { ok: false, error: validated.error };

  const email = input.email.trim().toLowerCase();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { ok: false, error: "Please enter a valid email address." };
  if (input.password.length < 8)
    return { ok: false, error: "Your password needs to be at least 8 characters." };
  if (!input.popiaConsent)
    return {
      ok: false,
      error: "We need your consent to store your name, email and course progress.",
    };

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing)
    return { ok: false, error: "An account with that email already exists. Try signing in." };

  const [user] = await db
    .insert(users)
    .values({
      name: validated.name,
      firstName: validated.firstName,
      lastName: validated.lastName,
      email,
      passwordHash: await hashPassword(input.password),
      role: "LEARNER",
      // POPIA: consent is explicit and timestamped, never assumed.
      popiaConsentAt: new Date(),
      lastSeenAt: new Date(),
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    });

  return { ok: true, user: { ...user, role: user.role as UserRole } };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // One message for both a missing account and a wrong password, so the form
  // cannot be used to discover which addresses are registered.
  const failure = { ok: false as const, error: "That email and password don't match." };

  if (!user) {
    // Spend comparable time on a missing account so response timing does not
    // leak whether the address exists.
    await bcrypt.compare(input.password, "$2a$12$" + "x".repeat(53));
    return failure;
  }

  if (!(await verifyPassword(input.password, user.passwordHash))) return failure;

  await db.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, user.id));

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    },
  };
}
