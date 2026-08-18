import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Default OpenNext configuration.
 *
 * No incremental cache is configured: every page in this app is either static
 * or user-specific and server-rendered on demand, so there is nothing to
 * revalidate. Adding an R2 or KV cache would add moving parts for no benefit.
 */
export default defineCloudflareConfig();
