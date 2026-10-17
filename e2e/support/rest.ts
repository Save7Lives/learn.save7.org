import type { Client } from "pg";

import { ANON_KEY, GATEWAY_URL, signJwt } from "./config";
import { arrangeAuthUser, type Identity } from "./people";

/**
 * Talking to the API the way a browser (or anyone with the public anon key) can.
 *
 * Every call goes through the gateway, the same front door the app uses, so a
 * refusal here is a refusal a real client would get. No call here uses the service
 * role or the superuser connection.
 *
 * `token` is a signed-in person's access token. Without one the call is anonymous:
 * the anon key is public by design (it is in every page of the site), so anyone can
 * make it.
 */
export type ApiResult<T = unknown> = {
  status: number;
  ok: boolean;
  body: T;
  /** Postgres or PostgREST's own sentence for a refusal, or "". */
  message: string;
};

export async function api<T = unknown>(
  path: string,
  options: { token?: string; method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown } = {},
): Promise<ApiResult<T>> {
  const { token, method = "GET", body } = options;
  const response = await fetch(`${GATEWAY_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: ANON_KEY,
      authorization: `Bearer ${token ?? ANON_KEY}`,
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  const message =
    parsed && typeof parsed === "object" && "message" in parsed
      ? String((parsed as { message: unknown }).message)
      : "";
  return { status: response.status, ok: response.ok, body: parsed as T, message };
}

/**
 * An access token for this person, as the sign-in would give them. The account is
 * made the way a first sign-in makes it if it does not exist, so the database's own
 * trigger links it to their registration.
 */
export async function tokenFor(db: Client, who: Identity): Promise<string> {
  const userId = await arrangeAuthUser(db, who);
  return signJwt({
    sub: userId,
    email: who.email,
    role: "authenticated",
    aud: "authenticated",
    user_metadata: { full_name: who.name, given_name: who.givenName, family_name: who.familyName },
    app_metadata: { provider: "google" },
  });
}

/** Rows a read returned, or `[]` when the API refused or the table showed nothing. */
export function rowsOf(result: ApiResult): unknown[] {
  return result.ok && Array.isArray(result.body) ? result.body : [];
}
