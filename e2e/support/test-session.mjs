// The test-session helper the accessibility audit (scripts/a11y/session.mjs) looks for.
//
// scripts/a11y/audit.mjs runs under plain node, so this is a thin .mjs that loads the
// real implementation (signed-in-session.ts, which reuses people.ts and the gateway)
// through tsx. Default export: async (context, { baseUrl, role }).
import { tsImport } from "tsx/esm/api";

const { signInTestSession } = await tsImport("./signed-in-session.ts", import.meta.url);

export default signInTestSession;
