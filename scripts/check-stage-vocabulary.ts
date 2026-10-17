// Stage vocabulary check (#29). The glossary says Stage, not module. This finds the
// word "module(s)" in what a learner can read: string literals, template text and JSX
// text under src/. Identifiers, property names, imports, comments and URL paths such as
// `/modules/` (the route still says module) are not learner-facing and are ignored.
//
//   npm run check:vocabulary
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const WORD = /\bmodules?\b/i;
const hits: string[] = [];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(n) ? [p] : [];
  });
}

for (const file of walk("src")) {
  const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = (n: ts.Node) => {
    let text: string | null = null;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n) || ts.isJsxText(n)) text = n.text ?? "";
    // A bare word ("MODULE") is a constant or key; prose has a space. JSX text is always prose.
    const isProse = text !== null && (ts.isJsxText(n) || /\s/.test(text.trim()));
    // Error messages and logs are for developers, not learners.
    let inDiagnostic = false;
    for (let p: ts.Node | undefined = n.parent; p && !inDiagnostic; p = p.parent) {
      if (ts.isNewExpression(p) && p.expression.getText() === "Error") inDiagnostic = true;
      if (ts.isCallExpression(p) && /^console\./.test(p.expression.getText())) inDiagnostic = true;
      if (ts.isStatement(p)) break;
    }
    const skip =
      !isProse ||
      inDiagnostic ||
      (ts.isStringLiteral(n) && (ts.isImportDeclaration(n.parent) || ts.isExportDeclaration(n.parent) || ts.isLiteralTypeNode(n.parent) || (ts.isJsxAttribute(n.parent) && ["className", "style"].includes(n.parent.name.getText())))) ||
      (text !== null && /^\S*\/modules\b\S*$/.test(text.trim()));
    if (text !== null && !skip && WORD.test(text)) {
      const { line } = sf.getLineAndCharacterOfPosition(n.getStart());
      hits.push(`${file}:${line + 1}: ${text.replace(/\s+/g, " ").trim().slice(0, 80)}`);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}

if (hits.length) {
  console.error(`Found "module(s)" in learner-facing text. Use Stage (or Level):\n${hits.join("\n")}`);
  process.exit(1);
}
console.log("Stage vocabulary: no learner-facing use of module(s) under src/.");
