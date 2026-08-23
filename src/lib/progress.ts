import "server-only";

import { supabaseServer } from "./supabase/server";
import type { EventType } from "./constants";

/**
 * Progress writes and engagement events.
 *
 * Kept apart from the read path in course.ts so that every mutation of a
 * learner's record goes through one small, auditable file.
 *
 * ── WHAT MOVED INTO THE DATABASE, AND WHY ───────────────────────────────────
 * Level and course percentages are **derived**, and a client that can write its
 * own percentage makes the dashboard fiction. So `learn_view_lesson()` and
 * `learn_complete_module()` are security definer functions (migration 0096):
 * the app asserts the one thing a learner is entitled to assert — that they read
 * a lesson, or finished a module — and the database recomputes everything that
 * follows. `learn_level_progress` and `learn_course_progress` have no write
 * policy for anybody as a result.
 *
 * That also removes the recalculation cascade this file used to carry. The two
 * functions below are what is left of it.
 */

// --- Events -----------------------------------------------------------------

/**
 * Record an engagement event.
 *
 * Deliberately stores no IP address and no user agent — see the privacy notice.
 * Save7 needs to know whether people are learning, not who they are or what
 * device they used.
 *
 * Never throws: analytics failing must not break a lesson. A learner losing their
 * place because an event insert failed would be a far worse bug than a missing
 * data point.
 */
export async function recordEvent(
  userId: string | null,
  type: EventType,
  options: {
    sessionKey?: string;
    moduleId?: string;
    lessonId?: string;
    metaJson?: string;
  } = {},
): Promise<void> {
  try {
    const supabase = await supabaseServer();
    await supabase.from("learn_events").insert({
      learner_id: userId,
      // Falls back to the learner id so an event is always attributable to a
      // session of some kind without inventing a fingerprint.
      session_key: options.sessionKey ?? userId ?? "anonymous",
      type,
      module_slug: options.moduleId ?? null,
      lesson_slug: options.lessonId ?? null,
      meta: options.metaJson ? (JSON.parse(options.metaJson) as unknown) : null,
    });
  } catch {
    // Intentionally swallowed.
  }
}

// --- Module progress --------------------------------------------------------

/** The outcome of a write a learner is waiting on. */
export type WriteResult = { ok: true } | { ok: false; error: string };

/** Mark a lesson as viewed, and keep the resume pointer up to date. */
export async function markLessonViewed(
  userId: string,
  moduleId: string,
  lessonId: string,
  secondsToAdd = 0,
): Promise<void> {
  const supabase = await supabaseServer();

  // The learner comes from the JWT inside the function, not from `userId` — an
  // argument naming somebody else would be a client editing another learner's
  // record. `userId` stays in the signature because every caller has it and the
  // event below is attributed with it.
  const { error } = await supabase.rpc("learn_view_lesson", {
    p_module_slug: moduleId,
    p_lesson_slug: lessonId,
    p_seconds: secondsToAdd,
  });

  // Logged rather than ignored. supabase.rpc() resolves with an error object
  // instead of throwing, so an unchecked call turns a refused write — a missing
  // policy, a renamed function — into progress that silently never saves. This
  // one is fire-and-forget from an effect, so it must not throw; the log is what
  // makes the failure findable in the deployment's function logs.
  if (error) {
    console.error("learn_view_lesson failed", {
      moduleId,
      lessonId,
      message: error.message,
    });
  }

  await recordEvent(userId, "lesson_view", { moduleId, lessonId });
}

/**
 * Complete a module.
 *
 * The learner marks this explicitly rather than it happening implicitly on
 * scroll — the brief asks for an explicit completion step, and an explicit action
 * is also a more honest record of engagement than "reached the bottom".
 *
 * The level and course percentages are recomputed by the same call, inside the
 * database, so they cannot drift from the module rows they are derived from.
 */
export async function completeModule(
  userId: string,
  moduleId: string,
): Promise<WriteResult> {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("learn_complete_module", {
    p_module_slug: moduleId,
  });

  // Unlike the lesson-view write above, this one is reported back to the learner.
  // Completing a module is the deliberate act the whole module builds up to, and
  // telling somebody it is done when nothing was recorded loses their progress
  // and the completion metric with it.
  if (error) {
    console.error("learn_complete_module failed", {
      moduleId,
      message: error.message,
    });
    return { ok: false, error: "We couldn't save your progress. Please try again." };
  }

  await recordEvent(userId, "module_complete", { moduleId });
  return { ok: true };
}

/** Whether every mandatory module in a level is complete. Gates the certificate. */
export async function isLevelContentComplete(
  userId: string,
  levelId: string,
): Promise<boolean> {
  const supabase = await supabaseServer();

  const { data: mandatory } = await supabase
    .from("learn_modules")
    .select("slug")
    .eq("level_slug", levelId)
    .eq("is_mandatory", true);

  const required = (mandatory ?? []).map((m) => (m as { slug: string }).slug);
  if (required.length === 0) return false;

  const { count } = await supabase
    .from("learn_module_progress")
    .select("module_slug", { count: "exact", head: true })
    .eq("learner_id", userId)
    .eq("status", "COMPLETE")
    .in("module_slug", required);

  return (count ?? 0) === required.length;
}
