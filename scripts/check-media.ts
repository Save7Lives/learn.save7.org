/**
 * `npm run media:check`: the film's files agree with each other and with the registry.
 *
 * Names carry their content hash, the captions are the transcript's words in order,
 * the registry's size and duration are the file's. See media-checks.ts. Runs in CI.
 */
import { checkMedia } from "./media-checks";

const { errors, notes } = checkMedia();
for (const note of notes) console.log(`ok  ${note}`);
for (const error of errors) console.error(`ERR ${error}`);

if (errors.length > 0) {
  console.error(`\n${errors.length} problem(s) with the film's files.`);
  process.exit(1);
}
console.log("\nThe film's files are consistent.");
