/** Prints the app's environment as KEY=VALUE lines (for `env $(…)` when running by hand). */
import { appEnv } from "./config";

for (const [k, v] of Object.entries(appEnv())) console.log(`${k}=${v}`);
