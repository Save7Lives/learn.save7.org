"use client";

import { createBrowserClient } from "@supabase/ssr";

import { STORAGE_KEY, type PublicSupabaseConfig } from "./config";

/**
 * The browser client, for the sign-in and registration pages.
 *
 * Takes its configuration as an argument rather than reading `process.env`: those
 * values are inlined at build time and this app is configured at runtime — see
 * config.ts. The server hands them down as props.
 *
 * One instance per tab: two clients on one page means two listeners racing to
 * refresh the same token.
 */
let client: ReturnType<typeof createBrowserClient> | undefined;

export function supabaseBrowser(config: PublicSupabaseConfig) {
  if (!client) {
    client = createBrowserClient(config.url, config.anonKey, {
      cookieOptions: { name: STORAGE_KEY },
    });
  }
  return client;
}
