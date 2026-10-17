import { createHmac } from "node:crypto";
import path from "node:path";

/**
 * Where everything in the end-to-end stack lives, in one place.
 *
 * Every address is loopback and every value is a throwaway. Nothing here is, or can
 * be mistaken for, a production credential: the JWT secret exists only to let the
 * local PostgREST trust the local gateway, and the keys below are signed with it.
 */
const num = (name: string, fallback: number) => Number(process.env[name] ?? fallback);

export const ROOT = path.resolve(__dirname, "..", "..");

export const PORTS = {
  postgres: num("E2E_PG_PORT", 54430),
  postgrest: num("E2E_POSTGREST_PORT", 54431),
  /** The Supabase-shaped front door: auth, REST, and the registration function. */
  gateway: num("E2E_GATEWAY_PORT", 54432),
  app: num("E2E_APP_PORT", 3107),
};

/** `localhost`, not `127.0.0.1`, so cookies set for the app are also sent to the gateway. */
export const APP_URL = `http://localhost:${PORTS.app}`;
export const GATEWAY_URL = `http://localhost:${PORTS.gateway}`;

export const DATABASE = {
  cluster: path.join(ROOT, ".e2e", "pg"),
  template: "save7_e2e_template",
  /** Recreated from the template at the start of every run. */
  run: "save7_e2e",
  host: "127.0.0.1",
};

export const JWT_SECRET = "save7-e2e-only-secret-never-used-anywhere-else-0123456789";

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

/** HS256, the algorithm Supabase signs with. */
export function signJwt(claims: Record<string, unknown>, ttlSeconds = 3600): string {
  const now = Math.floor(Date.now() / 1000);
  const head = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify({ iat: now, exp: now + ttlSeconds, ...claims }));
  const sig = createHmac("sha256", JWT_SECRET).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}

export function verifyJwt(token: string): Record<string, unknown> | null {
  const [head, body, sig] = token.split(".");
  if (!head || !body || !sig) return null;
  const expected = createHmac("sha256", JWT_SECRET).update(`${head}.${body}`).digest("base64url");
  if (expected !== sig) return null;
  const claims = JSON.parse(Buffer.from(body, "base64url").toString()) as Record<string, unknown>;
  if (typeof claims.exp === "number" && claims.exp < Date.now() / 1000) return null;
  return claims;
}

/** Fixed issue and expiry so the keys are stable between runs and safe to inline in the app build. */
const LONG = 10 * 365 * 24 * 3600;
export const ANON_KEY = signJwt({ role: "anon", iss: "supabase-e2e" }, LONG);
export const SERVICE_KEY = signJwt({ role: "service_role", iss: "supabase-e2e" }, LONG);

/**
 * The environment the app under test runs with. It points the app at the local
 * gateway and blanks the Google client id, so a developer's own `.env` (which names
 * the real project) is never consulted: process variables win over `.env` files.
 */
export function appEnv(): Record<string, string> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: GATEWAY_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON_KEY,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: "",
    NEXT_PUBLIC_SITE_URL: APP_URL,
    SITE_URL: APP_URL,
  };
}
