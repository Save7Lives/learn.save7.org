import type { BrowserContext } from "@playwright/test";

import { openRunDatabase } from "./database";
import { sitBaseline, stagesOf, takeStageQuiz } from "./learning";
import { arrangeAdmin, arrangeRegisteredLearner, type Identity } from "./people";

/**
 * A signed-in browser context for something that is not a test: the accessibility
 * audit (scripts/a11y/audit.mjs, via e2e/support/test-session.mjs) needs to look at
 * pages behind sign-in.
 *
 * It does what a person does. A fixed Student or Admin is arranged in the end-to-end
 * database (so it must be running: see "End-to-end tests" in README.md), the
 * test identity cookie is set, and the context walks through the app's own sign-in
 * button, so the app's session cookies land on the context exactly as they would for
 * a person. The Student has sat the Baseline and passed one Stage Quiz, so the Level
 * and Stage pages render lessons rather than the locked state.
 */
export type SessionRole = "student" | "admin";

const PEOPLE: Record<SessionRole, Identity> = {
  student: {
    email: "audit-student@e2e.test",
    name: "Thandi Audit",
    givenName: "Thandi",
    familyName: "Audit",
  },
  admin: {
    email: "audit-admin@e2e.test",
    name: "Lerato Audit",
    givenName: "Lerato",
    familyName: "Audit",
  },
};

async function arrange(role: SessionRole) {
  const who = PEOPLE[role];
  const db = await openRunDatabase();
  try {
    if (role === "admin") {
      await arrangeAdmin(db, who, "admin");
      return;
    }
    await arrangeRegisteredLearner(db, who);
    const { rows } = await db.query(
      "select 1 from learn_baseline_sittings s join learners l on l.id = s.learner_id where lower(l.email) = lower($1)",
      [who.email],
    );
    if (rows.length === 0) {
      await sitBaseline(db, who, "correct");
      const [first] = await stagesOf(db, "beginner");
      await takeStageQuiz(db, who, first, "correct");
    }
  } finally {
    await db.end();
  }
}

export async function signInTestSession(
  context: BrowserContext,
  { baseUrl, role }: { baseUrl: string; role: SessionRole },
) {
  const who = PEOPLE[role];
  if (!who) throw new Error(`Unknown test session role "${role}" (expected "student" or "admin").`);
  await arrange(role);

  const value = Buffer.from(JSON.stringify(who)).toString("base64url");
  await context.addCookies([{ name: "e2e_identity", value, url: baseUrl }]);

  const page = await context.newPage();
  try {
    await page.route("https://accounts.google.com/**", (route) => route.abort());
    await page.goto(`${baseUrl}/login`);
    await page.getByRole("button", { name: "Continue with Google" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  } finally {
    await page.close();
  }
}

export default signInTestSession;
