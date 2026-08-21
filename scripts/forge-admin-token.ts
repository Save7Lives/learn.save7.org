/**
 * Dev-only security probe.
 *
 * Signs a *valid* session token for a real LEARNER but claims `role: "ADMIN"` in
 * the payload. Used to verify that the role is re-read from the database on every
 * request and never trusted from the token — otherwise anyone able to obtain a
 * learner session could self-promote by editing a claim.
 */
import "dotenv/config";
import { SignJWT } from "jose";
import { eq } from "drizzle-orm";

// Node driver, not the app's edge client — see src/lib/db-node.ts.
import { dbNode as db } from "../src/lib/db-node";
import { users } from "../src/db/schema";

async function main() {
  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.role, "LEARNER"))
    .limit(1);
  if (!user) throw new Error("no learner to impersonate");

  console.log(
    await new SignJWT({ email: user.email, name: user.name, role: "ADMIN" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(new Date(Date.now() + 3_600_000))
      .sign(new TextEncoder().encode(process.env.AUTH_SECRET!)),
  );
}

main();
