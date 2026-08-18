/**
 * A deliberately tiny Markdown renderer.
 *
 * Lesson prose uses only paragraphs, bold, italic, inline code, links and
 * blockquotes. A full Markdown pipeline plus a sanitiser would be a large
 * dependency and a real XSS surface for six features we control the input to.
 *
 * Everything is escaped first and only a fixed set of patterns is then re-allowed,
 * so content can never inject markup even if a future CMS lets a non-developer
 * write it.
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
