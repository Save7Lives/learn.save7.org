/**
 * PROTOTYPE (T58), throwaway. Variant B's renderer: the real Markdown.tsx plus
 * exactly two additions, both kept inside its escape-first design.
 *
 * 1. Pipe tables. Every cell goes through the same `inline()` as a paragraph,
 *    which escapes before it re-allows anything, so a table adds layout and no
 *    new way in. A table must have a header row and a `---` separator row.
 * 2. One block directive, `::video[journey-of-a-gift]`, alone in its paragraph.
 *    It names a film from a fixed registry, never a URL, so content cannot point
 *    the player anywhere.
 *
 * Copied rather than imported because `inline()` is not exported; if B wins, the
 * real change is a few lines in Markdown.tsx and loadLesson()'s guard.
 */
import { Fragment } from "react";
import { LessonVideo } from "./LessonVideo";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/(^|[^_])_([^_]+)_/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, '<code class="rounded bg-sand-100 px-1 py-0.5 text-sm">$1</code>')
    .replace(
      /\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
    );
}

const VIDEO_DIRECTIVE = /^::video\[([a-z0-9-]+)\]$/;
const FILMS: Record<string, string> = {
  "journey-of-a-gift":
    "Both deceased routes, the two-doctor rule and the conversation with the family, in seven minutes. Watch it here, then read on.",
};

function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function isTable(block: string): boolean {
  const lines = block.trim().split("\n");
  return (
    lines.length >= 3 &&
    lines.every((l) => l.trim().startsWith("|")) &&
    /^\|?\s*:?-{3,}/.test(lines[1].trim())
  );
}

function table(block: string): string {
  const [head, , ...body] = block.trim().split("\n");
  const th = cells(head)
    .map(
      (c) =>
        `<th scope="col" class="border-b-2 border-sand-300 p-3 text-left align-bottom text-sm font-bold text-ink">${inline(c)}</th>`,
    )
    .join("");
  const rows = body
    .map((line) => {
      const [first, ...rest] = cells(line);
      return (
        `<tr class="border-b border-sand-200">` +
        `<th scope="row" class="p-3 text-left align-top text-sm font-bold text-ink">${inline(first)}</th>` +
        rest.map((c) => `<td class="p-3 align-top text-sm text-sand-700">${inline(c)}</td>`).join("") +
        `</tr>`
      );
    })
    .join("");
  return `<div class="not-prose -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0"><table class="w-full min-w-[34rem] border-collapse"><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function block(trimmed: string): string {
  if (isTable(trimmed)) return table(trimmed);

  if (trimmed.startsWith("> ")) {
    const quote = trimmed
      .split("\n")
      .map((line) => line.replace(/^>\s?/, ""))
      .join(" ");
    return `<blockquote>${inline(quote)}</blockquote>`;
  }
  if (/^[-*]\s/.test(trimmed)) {
    const items = trimmed
      .split("\n")
      .filter((line) => /^[-*]\s/.test(line.trim()))
      .map((line) => `<li>${inline(line.trim().replace(/^[-*]\s+/, ""))}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  }
  if (/^\d+\.\s/.test(trimmed)) {
    const items = trimmed
      .split("\n")
      .filter((line) => /^\d+\.\s/.test(line.trim()))
      .map((line) => `<li>${inline(line.trim().replace(/^\d+\.\s+/, ""))}</li>`)
      .join("");
    return `<ol>${items}</ol>`;
  }
  if (trimmed.startsWith("### ")) return `<h3>${inline(trimmed.slice(4))}</h3>`;
  if (trimmed.startsWith("## ")) return `<h2>${inline(trimmed.slice(3))}</h2>`;
  return `<p>${inline(trimmed).replace(/\n/g, "<br />")}</p>`;
}

export function MarkdownB({ source }: { source: string }) {
  const blocks = source
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  // Consecutive ordinary blocks share one HTML chunk; a directive breaks the run.
  const segments: Array<{ html: string } | { film: string }> = [];
  for (const b of blocks) {
    const directive = b.match(VIDEO_DIRECTIVE);
    if (directive && FILMS[directive[1]]) {
      segments.push({ film: directive[1] });
      continue;
    }
    const last = segments[segments.length - 1];
    if (last && "html" in last) last.html += block(b);
    else segments.push({ html: block(b) });
  }

  return (
    <>
      {segments.map((s, i) =>
        "film" in s ? (
          <div key={i} className="my-8">
            <LessonVideo lead={FILMS[s.film]} />
          </div>
        ) : (
          <Fragment key={i}>
            <div className="prose-save7" dangerouslySetInnerHTML={{ __html: s.html }} />
          </Fragment>
        ),
      )}
    </>
  );
}
