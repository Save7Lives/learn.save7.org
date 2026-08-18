/**
 * Embeds the Save7 lockup into a TypeScript module as a data URI.
 *
 * The certificate needs the logo inlined so that a downloaded PNG is
 * self-contained. Reading it from disk at request time meant a dynamic
 * `fs.readFile` path, which made Turbopack bundle the entire source tree into the
 * server output, and made the page sensitive to the process's working directory.
 *
 * Generating a module instead removes the filesystem from the request path
 * entirely. Re-run this if the brand assets are ever updated:
 *
 *   npm run brand:generate
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "public", "brand", "Save7-logo-horizontal.png");
const target = path.join(root, "src", "lib", "brand-assets.ts");

const bytes = await readFile(source);
const base64 = bytes.toString("base64");

const contents = `// GENERATED FILE — do not edit by hand.
// Run \`npm run brand:generate\` to regenerate from public/brand/.
//
// The Save7 horizontal lockup, inlined as a data URI so the certificate renders
// and downloads as a self-contained image. See scripts/generate-brand-assets.mjs
// for why this is generated rather than read from disk at request time.

/** Official Save7 horizontal lockup (${bytes.length.toLocaleString("en-ZA")} bytes). */
export const SAVE7_LOGO_HORIZONTAL_DATA_URI =
  "data:image/png;base64,${base64}";
`;

await writeFile(target, contents, "utf8");
console.log(
  `Wrote ${path.relative(root, target)} (${(contents.length / 1024).toFixed(1)} KB) from ${path.relative(root, source)}`,
);
