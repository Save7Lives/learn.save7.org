import { vi } from "vitest";

// A test that forgets to mock the database fails loudly instead of reaching for one.
vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: async () => {
    throw new Error("unit tests must not reach the database; mock supabaseServer");
  },
}));
