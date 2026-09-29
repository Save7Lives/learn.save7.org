/**
 * Pipe tables in lesson Markdown, parsed in one place.
 *
 * Two readers need the same answer to "is this a table?": `Markdown.tsx`, which
 * renders one, and `loadLesson()` in `prisma/content/markdown.ts`, which refuses a
 * malformed one before it can ship. If they disagreed, a table the loader passed
 * could still reach a learner as rows of pipes. So both call `parseTable()`.
 *
 * This only splits text into cells. It produces no markup, and every cell is
 * escaped by the renderer like any other text.
 *
 * The accepted shape, and nothing else:
 *
 *   | Route | When | Who consents |
 *   |---|---|---|
 *   | Living donation | While the donor is alive | The donor |
 *
 * - The table is its own block, with a blank line before and after it, and every
 *   line starts with `|`.
 * - Row one is the header. Row two is the separator: `---` in every cell, with
 *   optional `:` alignment marks, which are accepted and ignored.
 * - At least one body row follows, and every row has as many cells as the header.
 * - The first cell of each body row names that row. It may be empty in the header
 *   row, as it is in a two-sided comparison.
 */

export type Table = { header: string[]; rows: string[][] };

const SEPARATOR_CELL = /^:?-{3,}:?$/;

function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

/** Whether a block contains a table line at all, well-formed or not. */
export function hasTableLine(block: string): boolean {
  return /^\s*\|/m.test(block);
}

/** A block read as a table, or the reason it is not one. */
export function parseTable(block: string): Table | { error: string } {
  const lines = block.trim().split("\n");

  if (!lines.every((line) => line.trim().startsWith("|"))) {
    return {
      error: "a table must be a block of its own, with a blank line around it and every line starting with |",
    };
  }
  if (lines.length < 3) {
    return { error: "a table needs a header row, a --- separator row and at least one body row" };
  }

  const header = cells(lines[0]);
  if (header.length < 2) {
    return { error: "a table needs at least two columns: the row's name and one value" };
  }

  const separator = cells(lines[1]);
  if (!separator.every((cell) => SEPARATOR_CELL.test(cell))) {
    return { error: "its second row must be the --- separator row" };
  }
  if (separator.length !== header.length) {
    return {
      error: `its separator row has ${separator.length} cells and its header has ${header.length}`,
    };
  }

  const rows = lines.slice(2).map(cells);
  const uneven = rows.findIndex((row) => row.length !== header.length);
  if (uneven !== -1) {
    return {
      error: `body row ${uneven + 1} has ${rows[uneven].length} cells and the header has ${header.length}`,
    };
  }

  return { header, rows };
}
