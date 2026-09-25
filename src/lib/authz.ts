import "server-only";

import { redirect } from "next/navigation";
import { getSession, type SessionUser } from "./auth";

/**
 * Authorisation guards.
 *
 * `proxy.ts` keeps unauthenticated visitors away from protected URLs, but a
 * proxy check is a convenience, not a security boundary — it can be bypassed by
 * anything that reaches a route handler directly. So every protected page and
 * every API route calls one of these, and the check happens on the server next
 * to the data it protects.
 */

/** Only allow same-site relative redirects, so `?next=` cannot become an open redirect. */
export function safeNext(raw: unknown): string {
  const value = typeof raw === "string" ? raw : "";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

/**
 * A signed-in learner the course is open to.
 *
 * Somebody enrolled by `learn_claim_me()` has not yet been asked their date of
 * birth or their consent, so they are sent to finish enrolling first. The
 * database refuses their progress either way (save7-os 0111 and 0117); this is
 * what puts the questions in front of them instead of an error.
 */
export async function requireUser(returnTo?: string): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    const target = returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login";
    redirect(target);
  }
  if (user.enrolment !== "complete") {
    redirect(returnTo ? `/enrol?next=${encodeURIComponent(returnTo)}` : "/enrol");
  }
  return user;
}

/**
 * Admin-only pages.
 *
 * A learner who reaches an admin URL gets 404, not 403. There is no reason to
 * confirm to a non-admin that Save7's analytics live at a particular path.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login?next=%2Fadmin");
  if (user.role !== "ADMIN") {
    const { notFound } = await import("next/navigation");
    notFound();
  }
  return user;
}

async function apiSession(): Promise<
  { ok: true; user: SessionUser } | { ok: false; response: Response }
> {
  const user = await getSession();
  if (!user) {
    return {
      ok: false,
      response: Response.json({ error: "Not signed in" }, { status: 401 }),
    };
  }
  return { ok: true, user };
}

/** For API routes, which return a response rather than redirecting. */
export async function apiUser(): Promise<
  { ok: true; user: SessionUser } | { ok: false; response: Response }
> {
  const result = await apiSession();
  if (!result.ok) return result;
  if (result.user.enrolment !== "complete") {
    return {
      ok: false,
      response: Response.json({ error: "Finish enrolling first" }, { status: 403 }),
    };
  }
  return result;
}

/** Not gated on enrolment: staff oversight needs no date of birth, as requireAdmin(). */
export async function apiAdmin(): Promise<
  { ok: true; user: SessionUser } | { ok: false; response: Response }
> {
  const result = await apiSession();
  if (!result.ok) return result;
  if (result.user.role !== "ADMIN") {
    return {
      ok: false,
      response: Response.json({ error: "Not found" }, { status: 404 }),
    };
  }
  return result;
}
