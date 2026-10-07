import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { LessonKind } from "../../src/lib/constants";
import { FILM_KEYS, isFilmKey, type FilmKey } from "../../src/lib/films";
import { hasTableLine, parseTable } from "../../src/lib/markdown-table";
import { courseStructure, type LevelStructure, type StageSeed } from "./structure";

/**
 * Read a lesson's prose out of its Markdown file.
 *
 * Prose moved out of TypeScript in #33: 20,800 words of course content had been
 * living inside template literals, which is a poor place to write and a worse
 * place to review. What stayed in TypeScript is what the compiler can actually
 * check — question banks, interactive payloads, `verifiedAgainst` sign-offs.
 *
 * The split is by *kind*, not by file: INTRO, PRIMARY, TAKEAWAYS, STUDY_GUIDE
 * and FURTHER_READING carry prose and name a `bodyPath`. CHECK carries a
 * question bank and COMPLETE is a shell, so neither names one.
 */

/** A lesson's front matter, as the authoring files declare it. */
export type LessonFrontMatter = {
  slug: string;
  title: string;
  kind: LessonKind;
  stage: string;
  level: string;
  /**
   * The film this lesson opens with, as a key in `src/lib/films.ts`. Optional, and
   * only ever a registry key: the loader refuses anything else, so content can't
   * name a URL or a path (#61).
   */
  video?: FilmKey;
};

export type LoadedLesson = {
  frontMatter: LessonFrontMatter;
  bodyMarkdown: string;
  /** True while the file is still the stub #33 generated. */
  isStub: boolean;
};

const STUB_MARKER = "_Not yet written._";

/**
 * Minimal front-matter split.
 *
 * Deliberately not a YAML parser: the front matter here is five flat scalar
 * keys, fixed by the generator, plus an optional `video`, and reaching for a
 * dependency to read them would be the larger cost. If the shape ever grows
 * nesting, replace this wholesale rather than teaching it to limp along.
 */
function parseFrontMatter(raw: string, path: string): [LessonFrontMatter, string] {
  if (!raw.startsWith("---\n")) {
    throw new Error(`${path}: expected front matter delimited by ---`);
  }
  const end = raw.indexOf("\n---", 4);
  if (end === -1) throw new Error(`${path}: front matter is not closed`);

  const fields: Record<string, string> = {};
  for (const line of raw.slice(4, end).split("\n")) {
    if (!line.trim()) continue;
    const colon = line.indexOf(":");
    if (colon === -1) throw new Error(`${path}: cannot read front-matter line ${line}`);
    const value = line.slice(colon + 1).trim();
    fields[line.slice(0, colon).trim()] =
      value.startsWith('"') ? (JSON.parse(value) as string) : value;
  }

  for (const key of ["slug", "title", "kind", "stage", "level"]) {
    if (!fields[key]) throw new Error(`${path}: front matter is missing ${key}`);
  }
  if ("video" in fields && !isFilmKey(fields.video)) {
    throw new Error(
      `${path}: video ${JSON.stringify(fields.video)} is not a registered film. ` +
        `It takes a key from src/lib/films.ts (${FILM_KEYS.join(", ")}), never a URL or a path.`,
    );
  }
  return [fields as LessonFrontMatter, raw.slice(end + 4).trim()];
}

/**
 * Strip the drafting brief.
 *
 * #33 seeded every Stage's INTRO with the spec's own bullets and a salvage note
 * inside an HTML comment, so whoever writes the lesson has the brief in front of
 * them. It is authoring scaffolding and must never reach a learner — so it is
 * removed here rather than relied on being deleted by hand.
 */
function stripComments(body: string): string {
  return body.replace(/<!--[\s\S]*?-->/g, "").trim();
}

/**
 * Refuse Markdown the app cannot render.
 *
 * `src/components/lesson/Markdown.tsx` is deliberately tiny — it escapes
 * everything, then re-allows paragraphs, **bold**, *italic*, `code`, https
 * links, blockquotes, flat lists, ##/### headings and pipe tables, because a
 * full pipeline plus a sanitiser would be a large XSS surface. Anything else
 * reaches the learner as literal characters: `---` a line of dashes,
 * `<https://…>` escaped angle brackets, a malformed table rows of pipes. #47
 * found a rule, an autolink and (before tables were allowed) a table in its own
 * first draft, so this fails the load rather than trusting a reviewer to spot
 * them.
 */
const UNRENDERABLE: Array<[string, RegExp]> = [
  ["a horizontal rule", /^\s*(-{3,}|\*{3,}|_{3,})\s*$/m],
  ["an angle-bracket autolink", /<https?:\/\//],
  ["a link that is not https", /\]\((?!https:\/\/)[^)]*\)/],
  ["a nested list item", /^[ \t]+([-*]|\d+\.)\s/m],
  ["a heading other than ## or ###", /^(#|#{4,})\s/m],
  ["emphasis nested inside bold", /\*\*[^*\n]*\*[^*\n]+\*[^*\n]*\*\*/],
];

function assertRenderable(body: string, path: string): void {
  for (const [what, pattern] of UNRENDERABLE) {
    const match = body.match(pattern);
    if (match) {
      throw new Error(
        `${path}: contains ${what} (${JSON.stringify(match[0].trim().slice(0, 40))}), which the lesson renderer shows as raw text. See content/README.md.`,
      );
    }
  }

  for (const block of body.split(/\n{2,}/)) {
    // A list is its whole block: the renderer keeps only the item lines, so a
    // line with no blank line between it and the list silently disappears. #60
    // found a sentence lost this way under myth 11.
    const lines = block.trim().split("\n");
    const item = /^[-*]\s/.test(lines[0]) ? /^[-*]\s/ : /^\d+\.\s/.test(lines[0]) ? /^\d+\.\s/ : null;
    const stray = item && lines.find((line) => !item.test(line.trim()));
    if (stray) {
      throw new Error(
        `${path}: a list swallows the line ${JSON.stringify(stray.trim().slice(0, 40))}, which the lesson renderer drops. Put a blank line between the list and it. See content/README.md.`,
      );
    }

    // Tables are allowed, malformed ones are not. The renderer asks parseTable()
    // the same question, so a table that passes here is a table on the page.
    if (!hasTableLine(block)) continue;
    const table = parseTable(block);
    if ("error" in table) {
      const firstLine = block.trim().split("\n")[0];
      throw new Error(
        `${path}: contains a malformed table (${JSON.stringify(firstLine.slice(0, 40))}): ${table.error}. The lesson renderer would show it as rows of pipes. See content/README.md.`,
      );
    }
  }
}

export function loadLesson(bodyPath: string, repoRoot = process.cwd()): LoadedLesson {
  const path = join(repoRoot, bodyPath);
  const [frontMatter, body] = parseFrontMatter(readFileSync(path, "utf8"), bodyPath);
  const bodyMarkdown = stripComments(body);
  const isStub = body.includes(STUB_MARKER);
  if (!isStub) assertRenderable(bodyMarkdown, bodyPath);
  return { frontMatter, bodyMarkdown, isStub };
}

/** Every prose lesson in the Course, with the stubs still flagged. */
export function loadCourseProse(repoRoot = process.cwd()): Array<
  LoadedLesson & { level: LevelStructure; stage: StageSeed }
> {
  const out = [];
  for (const level of courseStructure) {
    for (const stage of level.stages) {
      for (const lesson of stage.lessons) {
        if (!lesson.bodyPath) continue;
        const loaded = loadLesson(lesson.bodyPath, repoRoot);
        if (loaded.frontMatter.slug !== lesson.slug) {
          throw new Error(
            `${lesson.bodyPath}: front matter says slug ${loaded.frontMatter.slug}, structure.ts says ${lesson.slug}`,
          );
        }
        out.push({ ...loaded, level, stage });
      }
    }
  }
  return out;
}
