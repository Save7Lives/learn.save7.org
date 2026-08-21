"use client";

import { createBrowserClient } from "@supabase/ssr";

import { requireConfig, STORAGE_KEY } from "./config";

/**
 * The browser client, for the sign-in page.
 *
 * One instance per tab: `createBrowserClient` is memoised inside the SSR helper,
 * but the module-level cache here makes it explicit, because two clients on one
 * page means two listeners racing to refresh the same token.
 */
let client: ReturnType<typeof createBrowserClient> | undefined;

export function supabaseBrowser() {
  if (!client) {
    const { url, anonKey } = requireConfig();
    client = createBrowserClient(url, anonKey, {
      cookieOptions: { name: STORAGE_KEY },
    });
  }
  return client;
}
