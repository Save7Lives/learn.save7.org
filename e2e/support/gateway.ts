import { createHash, createHmac, randomBytes } from "node:crypto";
import http from "node:http";
import { Client } from "pg";

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  APP_URL,
  DATABASE,
  GATEWAY_URL,
  JWT_SECRET,
  PORTS,
  ROOT,
  SERVICE_KEY,
  signJwt,
  verifyJwt,
} from "./config";
import { connectionString } from "./database";
import { registerLearnerSource } from "./save7-os";

/**
 * A Supabase-shaped front door for the app under test.
 *
 * The app talks to exactly one origin, `NEXT_PUBLIC_SUPABASE_URL`. In production that
 * is Supabase; here it is this server, and it answers the four things the app uses:
 *
 *   /rest/v1/*                      forwarded to PostgREST, JWT intact
 *   /auth/v1/*                      sign-in, session exchange, user lookup, sign-out
 *   /functions/v1/register-learner  the real Edge Function, run unmodified
 *
 * **This is the test session.** Google is replaced here, at the auth boundary: the
 * app still redirects to `/auth/v1/authorize?provider=google`, still receives a code
 * and exchanges it with PKCE, and still carries the resulting JWT on every read. What
 * differs is who vouches for the person. A real Google consent screen would, and
 * this server instead takes the identity from the `e2e_identity` cookie a test sets,
 * and refuses with no cookie. Accounts are created by inserting into `auth.users`, so
 * the database's own sign-in triggers decide who is admitted, exactly as in production.
 *
 * **It cannot be switched on in production.** Nothing under `src/` imports or knows
 * of it. The app reaches it only because the suite points `NEXT_PUBLIC_SUPABASE_URL`
 * at it, and it signs tokens with a secret that no real Supabase project has, so a
 * session minted here is worthless anywhere else. The only way to "enable" it in a
 * production build is to point production's Supabase URL at a server on its own
 * machine, which is not a thing a build flag can do.
 */

type Identity = {
  email: string;
  name?: string;
  givenName?: string;
  familyName?: string;
};

type Pending = { userId: string; challenge: string | null };

const codes = new Map<string, Pending>();

const fromB64 = (s: string) => Buffer.from(s, "base64url").toString();

function identityFrom(req: http.IncomingMessage): Identity | null {
  const header = req.headers.cookie ?? "";
  const match = /(?:^|;\s*)e2e_identity=([^;]+)/.exec(header);
  if (!match) return null;
  try {
    const parsed = JSON.parse(fromB64(decodeURIComponent(match[1]))) as Identity;
    return parsed.email ? parsed : null;
  } catch {
    return null;
  }
}

function refreshTokenFor(userId: string) {
  const sig = createHmac("sha256", JWT_SECRET).update(`refresh:${userId}`).digest("base64url");
  return `${userId}.${sig}`;
}

function userIdFromRefresh(token: string): string | null {
  const [userId] = token.split(".");
  return userId && refreshTokenFor(userId) === token ? userId : null;
}

type UserRow = {
  id: string;
  email: string;
  raw_user_meta_data: Record<string, unknown> | null;
  created_at?: string;
};

function userJson(row: UserRow) {
  return {
    id: row.id,
    aud: "authenticated",
    role: "authenticated",
    email: row.email,
    email_confirmed_at: new Date().toISOString(),
    app_metadata: { provider: "google", providers: ["google"] },
    user_metadata: row.raw_user_meta_data ?? {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function sessionJson(row: UserRow) {
  const expiresIn = 3600;
  const access = signJwt(
    {
      sub: row.id,
      email: row.email,
      role: "authenticated",
      aud: "authenticated",
      user_metadata: row.raw_user_meta_data ?? {},
      app_metadata: { provider: "google" },
    },
    expiresIn,
  );
  return {
    access_token: access,
    token_type: "bearer",
    expires_in: expiresIn,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    refresh_token: refreshTokenFor(row.id),
    user: userJson(row),
  };
}

async function readBody(req: http.IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

function cors(req: http.IncomingMessage, res: http.ServerResponse) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] ?? "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Expose-Headers", "*");
}

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

/**
 * Load the real `register-learner` Edge Function. It is Deno code, so two things are
 * adapted and nothing else: the `jsr:` import becomes the npm package, and `Deno` is
 * given the two members the file uses. The function's own validation, 18+ refusal,
 * consent rule and throttle are untouched.
 */
async function loadRegisterLearner(): Promise<(req: Request) => Promise<Response>> {
  let handler: ((req: Request) => Promise<Response>) | undefined;
  const env: Record<string, string> = {
    SUPABASE_URL: GATEWAY_URL,
    SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
    REGISTRATION_SALT: "e2e-salt",
  };
  (globalThis as unknown as { Deno: unknown }).Deno = {
    env: { get: (k: string) => env[k] },
    serve: (h: (req: Request) => Promise<Response>) => {
      handler = h;
    },
  };

  const dir = path.join(ROOT, ".e2e", "functions");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "register-learner.ts");
  const source = registerLearnerSource().replace(
    /from\s+['"]jsr:@supabase\/supabase-js@[^'"]+['"]/,
    `from "@supabase/supabase-js"`,
  );
  if (!source.includes(`from "@supabase/supabase-js"`)) {
    throw new Error("register-learner no longer imports supabase-js the way the harness expects");
  }
  writeFileSync(file, source);
  await import(file);
  if (!handler) throw new Error("register-learner did not call Deno.serve");
  return handler;
}

export async function startGateway(): Promise<{ close: () => Promise<void> }> {
  const db = new Client({ connectionString: connectionString(DATABASE.run) });
  await db.connect();
  const registerLearner = await loadRegisterLearner();

  const userByEmail = async (email: string): Promise<UserRow | null> => {
    const { rows } = await db.query<UserRow>(
      "select id, email, raw_user_meta_data from auth.users where lower(email) = lower($1)",
      [email],
    );
    return rows[0] ?? null;
  };
  const userById = async (id: string): Promise<UserRow | null> => {
    const { rows } = await db.query<UserRow>(
      "select id, email, raw_user_meta_data from auth.users where id = $1",
      [id],
    );
    return rows[0] ?? null;
  };

  const server = http.createServer(async (req, res) => {
    cors(req, res);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url ?? "/", GATEWAY_URL);
    const route = url.pathname;

    try {
      if (route === "/__e2e/health") return sendJson(res, 200, { ok: true });

      // ── REST: straight through to PostgREST ────────────────────────────────
      if (route.startsWith("/rest/v1/") || route === "/rest/v1") {
        const body = ["GET", "HEAD"].includes(req.method ?? "GET") ? undefined : await readBody(req);
        const headers: Record<string, string> = {};
        for (const [k, v] of Object.entries(req.headers)) {
          if (typeof v === "string" && !["host", "connection", "content-length"].includes(k)) {
            headers[k] = v;
          }
        }
        const upstream = await fetch(
          `http://127.0.0.1:${PORTS.postgrest}${route.slice("/rest/v1".length) || "/"}${url.search}`,
          { method: req.method, headers, body: body as BodyInit | undefined },
        );
        const out: Record<string, string> = {};
        upstream.headers.forEach((v, k) => {
          if (!["content-encoding", "content-length", "transfer-encoding", "connection"].includes(k)) {
            out[k] = v;
          }
        });
        res.writeHead(upstream.status, out);
        res.end(Buffer.from(await upstream.arrayBuffer()));
        return;
      }

      // ── The registration Edge Function ─────────────────────────────────────
      if (route === "/functions/v1/register-learner") {
        const body = ["GET", "HEAD"].includes(req.method ?? "GET") ? undefined : await readBody(req);
        const headers = new Headers();
        for (const [k, v] of Object.entries(req.headers)) {
          if (typeof v === "string") headers.set(k, v);
        }
        const response = await registerLearner(
          new Request(`${GATEWAY_URL}${route}`, {
            method: req.method,
            headers,
            body: body as BodyInit | undefined,
          }),
        );
        const out: Record<string, string> = {};
        response.headers.forEach((v, k) => (out[k] = v));
        res.writeHead(response.status, out);
        res.end(Buffer.from(await response.arrayBuffer()));
        return;
      }

      // ── Auth: the test identity provider ───────────────────────────────────
      if (route === "/auth/v1/authorize") {
        const redirectTo = url.searchParams.get("redirect_to") ?? APP_URL;
        // Only ever send a session back to the app under test.
        if (!redirectTo.startsWith(`${APP_URL}/`) && redirectTo !== APP_URL) {
          return sendJson(res, 400, { error: "redirect_to must be the app under test" });
        }
        const identity = identityFrom(req);
        if (!identity) {
          return sendJson(res, 400, {
            error: "No test identity. A test signs in by setting the e2e_identity cookie first.",
          });
        }

        let user = await userByEmail(identity.email);
        if (!user) {
          const meta = {
            email: identity.email,
            full_name: identity.name ?? identity.email,
            name: identity.name ?? identity.email,
            given_name: identity.givenName,
            family_name: identity.familyName,
            iss: "https://accounts.google.com",
            provider_id: createHash("sha256").update(identity.email).digest("hex").slice(0, 21),
          };
          try {
            // The database's sign-in trigger decides whether this address may hold
            // an account. A refusal surfaces the way GoTrue reports it.
            const { rows } = await db.query<UserRow>(
              "insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id, email, raw_user_meta_data",
              [identity.email, JSON.stringify(meta)],
            );
            user = rows[0];
          } catch (error) {
            const back = new URL(redirectTo);
            back.searchParams.set("error", "server_error");
            back.searchParams.set("error_code", "unexpected_failure");
            back.searchParams.set("error_description", "Database error saving new user");
            console.log(`[e2e] sign-in refused for ${identity.email}: ${(error as Error).message}`);
            res.writeHead(302, { location: back.toString() });
            res.end();
            return;
          }
        }

        const code = randomBytes(16).toString("hex");
        codes.set(code, { userId: user!.id, challenge: url.searchParams.get("code_challenge") });
        const back = new URL(redirectTo);
        back.searchParams.set("code", code);
        res.writeHead(302, { location: back.toString() });
        res.end();
        return;
      }

      if (route === "/auth/v1/token") {
        const grant = url.searchParams.get("grant_type");
        const body = JSON.parse((await readBody(req)).toString() || "{}") as Record<string, string>;

        if (grant === "pkce") {
          const pending = codes.get(body.auth_code);
          codes.delete(body.auth_code);
          const verifierHash = createHash("sha256")
            .update(body.code_verifier ?? "")
            .digest("base64url");
          if (!pending || (pending.challenge && pending.challenge !== verifierHash)) {
            return sendJson(res, 400, { error: "invalid_grant", error_description: "bad code" });
          }
          const user = await userById(pending.userId);
          return user ? sendJson(res, 200, sessionJson(user)) : sendJson(res, 400, { error: "no user" });
        }

        if (grant === "refresh_token") {
          const userId = userIdFromRefresh(body.refresh_token ?? "");
          const user = userId ? await userById(userId) : null;
          return user
            ? sendJson(res, 200, sessionJson(user))
            : sendJson(res, 400, { error: "invalid_grant", error_description: "bad refresh token" });
        }

        return sendJson(res, 400, { error: "unsupported_grant_type" });
      }

      if (route === "/auth/v1/user") {
        const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
        const claims = verifyJwt(token);
        const user =
          claims && claims.role === "authenticated" && typeof claims.sub === "string"
            ? await userById(claims.sub)
            : null;
        return user
          ? sendJson(res, 200, userJson(user))
          : sendJson(res, 401, { code: 401, msg: "invalid JWT", error_code: "bad_jwt" });
      }

      if (route === "/auth/v1/logout") {
        res.writeHead(204);
        res.end();
        return;
      }

      sendJson(res, 404, { error: `the e2e gateway does not serve ${route}` });
    } catch (error) {
      console.error("[e2e] gateway error", error);
      sendJson(res, 500, { error: (error as Error).message });
    }
  });

  await new Promise<void>((resolve) => server.listen(PORTS.gateway, resolve));

  return {
    close: async () => {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await db.end().catch(() => {});
    },
  };
}
