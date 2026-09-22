import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * No incremental cache override, deliberately.
 *
 * OpenNext's getting-started config wires an R2 bucket as the incremental cache.
 * There is nothing here for it to hold: every route in this app reads the session
 * cookie, so every route is dynamic and Next writes no cached entries to populate
 * it with. The three `actions.ts` files say the same thing from the other side —
 * they skip `revalidatePath()` because there is no cached entry to invalidate.
 *
 * Adding the bucket would mean a paid-plan resource (see the zero-budget
 * constraint in the map) standing empty. If a genuinely static route is ever
 * added, this is the file that gains the override.
 */
export default defineCloudflareConfig();
