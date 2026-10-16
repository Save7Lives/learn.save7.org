/**
 * Embeds the certificate's three fonts into a TypeScript module as base64.
 *
 * The certificate SVG carries its own @font-face rules so that the artifact a
 * learner keeps (a serialised PNG, the PDF) is set in the brand typefaces and not
 * the browser's fallback. next/font/google content-hashes its filenames, so there
 * is no stable URL to reference; the woff2 files live in src/assets/fonts/ and are
 * inlined here. Montserrat 700 and 800 and Lexend 400, all SIL OFL 1.1, instanced
 * from the variable fonts in google/fonts and subset to Latin and Latin Extended.
 * Re-run this if the files change:
 *
 *   npm run certificate:fonts
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dir = path.join(root, "src", "assets", "fonts");
const target = path.join(root, "src", "components", "certificate", "certificate-fonts.ts");

const faces = [
  { name: "S7 Montserrat", weight: 700, file: "Montserrat-700.woff2" },
  { name: "S7 Montserrat", weight: 800, file: "Montserrat-800.woff2" },
  { name: "S7 Lexend", weight: 400, file: "Lexend-400.woff2" },
];

const rules = [];
for (const face of faces) {
  const bytes = await readFile(path.join(dir, face.file));
  rules.push(
    `@font-face{font-family:"${face.name}";font-weight:${face.weight};font-style:normal;` +
      `src:url(data:font/woff2;base64,${bytes.toString("base64")}) format("woff2");}`,
  );
}

const contents = `// GENERATED FILE — do not edit by hand.
// Run \`npm run certificate:fonts\` to regenerate from src/assets/fonts/.
//
// @font-face rules for the certificate SVG, with the fonts inlined as base64 so a
// serialised PNG or PDF is self-contained. See scripts/generate-certificate-fonts.mjs.

export const CERTIFICATE_FONT_CSS = ${JSON.stringify(rules.join("\n"))};
`;

await writeFile(target, contents, "utf8");
console.log(`Wrote ${path.relative(root, target)} (${(contents.length / 1024).toFixed(1)} KB)`);
