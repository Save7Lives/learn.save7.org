import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { LessonKind } from "../../src/lib/constants";
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
 * keys, fixed by the generator, and reaching for a dependency to read them
 * would be the larger cost. If the shape ever grows nesting, replace this
 * wholesale rather than teaching it to limp along.
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

export function loadLesson(bodyPath: string, repoRoot = process.cwd()): LoadedLesson {
  const path = join(repoRoot, bodyPath);
  const [frontMatter, body] = parseFrontMatter(readFileSync(path, "utf8"), bodyPath);
  return {
    frontMatter,
    bodyMarkdown: stripComments(body),
    isStub: body.includes(STUB_MARKER),
  };
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
