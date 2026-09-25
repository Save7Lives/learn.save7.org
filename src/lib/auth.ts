import "server-only";

import { supabaseServer } from "./supabase/server";
import type { UserRole } from "./constants";

/**
 * Session handling.
 *
 * The account is a Google account, verified by Supabase, on the same project the
 * OS and the volunteer portal use — so a volunteer has one identity across all
 * three sites and the portal can show their course progress.
 *
 * This replaces a hand-rolled email-and-password session. The seam the previous
 * implementation named for exactly this change was `createSession` / `getSession`,
 * and that is the seam this keeps: nothing outside this file reads a cookie, and
 * `authz.ts` and every guarded page continue to call `getSession()` unchanged.
 *
 * What is gone, and why nothing here replaces it:
 *
 *   * **Passwords.** No bcrypt, no `passwordHash`, no registration form. Who may
 *     hold an account is `auth_enforce_save7_domain()`'s business (migration
 *     0095): a @save7.org address, an invited stakeholder, an active volunteer, or
 *     a registered learner. Sign-up is therefore *registration first, sign-in
 *     second*, and the login page says so, because a database trigger cannot.
 *   * **A session cookie of our own.** The Supabase cookie is the session, and
 *     it carries the JWT that row level security reads. Minting a second cookie
 *     would mean the app's idea of who you are could drift from the database's.
 */

/**
 * What is still to ask before the course opens to this learner.
 *
 * `register-learner` asks both at once, so a registered learner arrives
 * `"complete"`. `learn_claim_me()` asks neither, because it enrols staff,
 * volunteers and stakeholders on sign-in with no form in front of it (#44). Date
 * of birth comes first, as it does at registration, so a minor is refused before
 * being asked to agree to anything.
 */
export type EnrolmentStep = "date-of-birth" | "consent" | "complete";

export type SessionUser = {
  /** The `learners` row id — what every progress and attempt row keys on. */
  id: string;
  email: string;
  name: string;
  role: UserRole;
  enrolment: EnrolmentStep;
};

/**
 * The current session, or null.
 *
 * Three reads, and each is deliberate:
 *
 *   1. `getUser()` rather than `getSession()` on the Supabase client — the latter
 *      returns whatever is in the cookie without checking it. `getUser()` verifies
 *      the token with the auth server, which is the difference between trusting a
 *      signature and trusting a cookie.
 *   2. the `learners` row, through RLS, which returns theirs and nobody else's.
 *   3. `app_is_staff()`, for the admin dashboards. Asked of the database rather
 *      than inferred from the email domain: staff status is a `people` row with an
 *      `app_role`, and a revoked staff member must lose the dashboards
 *      immediately rather than whenever a token expires.
 */
export async function getSession(): Promise<SessionUser | null> {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: learner } = await supabase
    .from("learners")
    .select("id, email, name, date_of_birth, popia_consent_at")
    .eq("user_id", user.id)
    .maybeSingle();

  // Signed in, but not enrolled. The caller decides what that means: the course
  // pages send them through enrolment, the admin pages do not care.
  if (!learner) {
    const { data: isStaff } = await supabase.rpc("app_is_staff");
    if (!isStaff) return null;

    return {
      id: "",
      email: user.email ?? "",
      name: (user.user_metadata?.full_name as string) ?? user.email ?? "Save7 staff",
      role: "ADMIN",
      enrolment: "complete",
    };
  }

  const { data: isStaff } = await supabase.rpc("app_is_staff");

  return {
    id: learner.id,
    email: learner.email,
    name: learner.name,
    role: isStaff ? "ADMIN" : "LEARNER",
    enrolment: !learner.date_of_birth
      ? "date-of-birth"
      : !learner.popia_consent_at
        ? "consent"
        : "complete",
  };
}

/**
 * Enrol the signed-in account on the course, idempotently.
 *
 * The database does this rather than an insert from here, because `learners` has
 * no insert policy: a client that could write that table could write the fourth
 * accept path of the sign-in trigger. `learn_claim_me()` is security definer,
 * takes the address from the JWT, and links to a `volunteers` row when one
 * matches — which is what joins a volunteer's two rows into one identity.
 */
export async function claimLearner(
  firstName?: string,
  lastName?: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("learn_claim_me", {
    p_first_name: firstName ?? null,
    p_last_name: lastName ?? null,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data as string };
}

/**
 * Record the signed-in learner's date of birth, once.
 *
 * `learn_record_date_of_birth()` makes the decision, computed against today the
 * same way `register-learner` does. `ofAge: false` means they are under 18 and
 * **their `learners` row is already gone**, with the date never stored. The
 * caller must end the session: `learn_claim_me()` would enrol them again on the
 * next page load, and they would be asked again in a loop.
 */
export async function recordDateOfBirth(
  isoDate: string,
): Promise<{ ok: true; ofAge: boolean } | { ok: false; error: string }> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("learn_record_date_of_birth", { p_dob: isoDate });

  if (error) return { ok: false, error: error.message };
  return { ok: true, ofAge: data === true };
}

/**
 * Record the signed-in learner's POPIA consent, once. Idempotent in the database:
 * a second call keeps the first timestamp.
 */
export async function recordConsent(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("learn_record_popia_consent");

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Ends the session everywhere, not just in this tab. */
export async function destroySession(): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
}
