import { apiAdmin } from "@/lib/authz";
import { db } from "@/lib/db";
import { seedContent } from "../../../../../prisma/seed-core";

/**
 * Edge runtime, required by Cloudflare Pages.
 *
 * `@cloudflare/next-on-pages` refuses to build a route that renders on the
 * Node runtime — every server-rendered route on Pages runs on workerd. This is
 * the whole reason the app is pinned to Next 15.5.2: the adapter supports no
 * higher, and OpenNext (which does not need this) supports no lower.
 */
export const runtime = "edge";

/**
 * Re-apply the course content to the live database.
 *
 * This is what makes the content-review register actionable in production. When
 * Save7 signs off a correction — a legal provision in Module 9, a selection
 * criterion in Module 10, the FACTS step names — the corrected content is
 * deployed and then applied here, with no SQL by hand and no migration.
 *
 * Safe to call on a live course. seedContent() upserts on stable authoring keys
 * and prunes only content that has been retired; it never touches User,
 * QuizAttempt, ModuleProgress, Certificate or EventLog rows. Review decisions
 * already recorded are preserved — the register's status column is deliberately
 * excluded from the upsert, so approving a claim is not undone by a redeploy.
 *
 * Requires an admin session. Nothing about it is exposed in the UI, because it
 * is a deploy step rather than something to click by accident.
 */
export async function POST() {
  const auth = await apiAdmin();
  if (!auth.ok) return auth.response;

  const lines: string[] = [];

  try {
    await seedContent(db, {
      // Never in production: this would create admin@save7.org with a password
      // that is published in the repository.
      createDevAdmin: false,
      log: (message) => lines.push(message),
    });
  } catch (error) {
    console.error("Reseed failed", error);
    return Response.json(
      {
        error: "Reseed failed. The database is unchanged apart from any content already applied.",
        detail: error instanceof Error ? error.message : String(error),
        log: lines,
      },
      { status: 500 },
    );
  }

  return Response.json({ ok: true, log: lines });
}
