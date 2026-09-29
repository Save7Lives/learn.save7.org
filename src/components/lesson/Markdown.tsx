import { parseTable, type Table } from "@/lib/markdown-table";

/**
 * A deliberately tiny Markdown renderer.
 *
 * Lesson prose uses only paragraphs, bold, italic, inline code, links,
 * blockquotes, flat lists, ##/### headings and pipe tables. A full Markdown
 * pipeline plus a sanitiser would be a large dependency and a real XSS surface
 * for a handful of features we control the input to.
 *
 * Everything is escaped first and only a fixed set of patterns is then re-allowed,
 * so content can never inject markup even if a future CMS lets a non-developer
 * write it. That is why this is an XSS boundary, not a formatting convenience:
 * any feature added here must keep every author-written character inside
 * `escapeHtml()`.
 */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(text: string): string {
  return (
    escapeHtml(text)
      // **bold**
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      // *italic* and _italic_
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
      .replace(/(^|[^_])_([^_]+)_/g, "$1<em>$2</em>")
      // `code`
      .replace(/`([^`]+)`/g, '<code class="rounded bg-sand-100 px-1 py-0.5 text-sm">$1</code>')
      // [text](https://…) — https only, so a link cannot become javascript:
      .replace(
        /\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
      )
  );
}

/**
 * A pipe table, as a table on desktop and as one card per row on a phone.
 *
 * Every cell goes through `inline()`, so a table adds layout and no new way to
 * inject markup. The first cell of each body row is its row header.
 *
 * Below `sm`, globals.css stacks each row into a card and labels every cell with
 * its column header, read from `data-label`: a four-column table in a 375px
 * column would otherwise scroll sideways, and this audience is mostly on phones.
 * The label is the header's plain text, with emphasis marks dropped *before* it is
 * escaped, so nothing the author wrote can close the attribute.
 *
 * The explicit roles keep the table a table to a screen reader once the stacked
 * layout changes its display: some browsers drop table semantics otherwise.
 */
function table({ header, rows }: Table): string {
  const labels = header.map((cell) => escapeHtml(cell.replace(/[*_`]/g, "")));
  const head = header
    .map((cell) => `<th scope="col" role="columnheader">${inline(cell)}</th>`)
    .join("");
  const body = rows
    .map(([first, ...rest]) => {
      const cells = rest
        .map((cell, i) => `<td role="cell" data-label="${labels[i + 1]}">${inline(cell)}</td>`)
        .join("");
      return `<tr role="row"><th scope="row" role="rowheader">${inline(first)}</th>${cells}</tr>`;
    })
    .join("");
  return (
    `<table role="table"><thead role="rowgroup"><tr role="row">${head}</tr></thead>` +
    `<tbody role="rowgroup">${body}</tbody></table>`
  );
}

export function Markdown({
  source,
  className = "prose-save7",
}: {
  source: string;
  className?: string;
}) {
  const blocks = source.split(/\n{2,}/).filter((b) => b.trim().length > 0);

  const html = blocks
    .map((block) => {
      const trimmed = block.trim();

      if (trimmed.startsWith("|")) {
        const parsed = parseTable(trimmed);
        // A malformed table falls through to a paragraph, escaped like any other.
        // loadLesson() refuses one, so this only guards content from elsewhere.
        if (!("error" in parsed)) return table(parsed);
      }

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
    })
    .join("");

  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
