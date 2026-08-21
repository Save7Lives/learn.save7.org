/**
 * Dev-only: prints a valid session cookie value so the running app can be
 * driven with curl during verification. Never ship or expose this.
 */
import "dotenv/config";
import { SignJWT } from "jose";
import { eq } from "drizzle-orm";
// Node driver, not the app's edge client — see src/lib/db-node.ts.
import { dbNode as db } from "../src/lib/db-node";
import { users } from "../src/db/schema";

async function main() {
  const role = process.argv[2] === "admin" ? "ADMIN" : "LEARNER";
  const [user] = await db.select().from(users).where(eq(users.role, role)).limit(1);
  if (!user) throw new Error(`no ${role} user found`);

  console.log(
    await new SignJWT({ email: user.email, name: user.name, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(new Date(Date.now() + 86_400_000))
      .sign(new TextEncoder().encode(process.env.AUTH_SECRET!)),
  );
}

main();
