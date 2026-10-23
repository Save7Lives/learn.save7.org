/**
 * Interactive blocks in lesson Markdown, parsed in one place.
 *
 * A lesson can put a small interactive figure between its paragraphs: a comparison
 * to tap through, a checklist, a sequence of steps, a timed observation. Nazim asked
 * for diagrams and interactive elements inside the prose, and the prototype that
 * settled the shape is on the `prototype/interactive-lessons` branch.
 *
 * The figure's words live in the lesson file, never in a component, because course
 * copy in a component is outside everything that tracks content (CLAUDE.md, "Content
 * is data, not code"). The component only draws a registered kind of block. So a
 * block is a type the app knows plus `key: value` lines carrying its text:
 *
 *   :::compare
 *   title: Tap to compare
 *   tab: A coma
 *   row: The brainstem | Still works
 *   tab: Brain death
 *   row: The brainstem | Has stopped working
 *   :::
 *
 * Two readers need the same answer, as with tables: `LessonBody`, which renders a
 * block, and `loadLesson()` in `prisma/content/markdown.ts`, which refuses a
 * malformed one before it can ship. Both call `splitLessonBody()`.
 *
 * Values are plain text. React renders them as text nodes, so a block adds no way to
 * inject markup, and Markdown emphasis inside one would show as literal asterisks,
 * which is why the loader refuses it.
 */

export type CompareWidget = {
  type: "compare";
  title: string;
  tabs: Array<{ label: string; rows: Array<[string, string]> }>;
};

export type ChecklistWidget = {
  type: "checklist";
  title: string;
  items: string[];
  /** Shown until every item is ticked. */
  pending: string;
  /** Shown once every item is ticked. */
  done: string;
};

export type StepsWidget = {
  type: "steps";
  title: string;
  steps: Array<{ label: string; detail: string; choices: Array<[string, string]> }>;
};

export type TimerWidget = {
  type: "timer";
  title: string;
  /** How many units the observation runs for. Each takes about a second on screen. */
  units: number;
  start: string;
  /** Shown after each unit; `{n}` is the unit just completed. */
  tick: string;
  done: string;
  /** The button that sends the count back to zero. */
  reset: string;
  /** Shown once the count has been sent back to zero. */
  afterReset: string;
};

export type RevealWidget = {
  type: "reveal";
  title: string;
  /** Each card shows its front until tapped, then its back as well. */
  cards: Array<[string, string]>;
};

export type LessonWidget = CompareWidget | ChecklistWidget | StepsWidget | TimerWidget | RevealWidget;

export const WIDGET_TYPES = ["compare", "checklist", "steps", "timer", "reveal"] as const;

export type LessonSegment =
  | { kind: "markdown"; source: string }
  | { kind: "widget"; widget: LessonWidget }
  /** A block the parser refused. The renderer shows it as prose; the loader fails on it. */
  | { kind: "invalid"; source: string; error: string };

const BLOCK = /^:::([a-z-]+)[ \t]*\n([\s\S]*?)\n:::[ \t]*$/gm;

/** A lesson body cut into prose and interactive blocks, in order. */
export function splitLessonBody(body: string): LessonSegment[] {
  const out: LessonSegment[] = [];
  let last = 0;
  for (const match of body.matchAll(BLOCK)) {
    const prose = body.slice(last, match.index).trim();
    if (prose) out.push({ kind: "markdown", source: prose });
    const parsed = parseWidget(match[1], match[2]);
    out.push(
      "error" in parsed
        ? { kind: "invalid", source: match[0], error: parsed.error }
        : { kind: "widget", widget: parsed },
    );
    last = match.index + match[0].length;
  }
  const rest = body.slice(last).trim();
  if (rest) out.push({ kind: "markdown", source: rest });
  return out;
}

const PLAIN_TEXT: Array<[string, RegExp]> = [
  ["bold", /\*\*/],
  ["code", /`/],
  ["a link", /\]\(/],
];

function parseWidget(type: string, inner: string): LessonWidget | { error: string } {
  if (!(WIDGET_TYPES as readonly string[]).includes(type)) {
    return { error: `:::${type} is not a block the app can draw (${WIDGET_TYPES.join(", ")})` };
  }

  const lines: Array<[string, string]> = [];
  for (const raw of inner.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const colon = line.indexOf(":");
    if (colon === -1) return { error: `cannot read ${JSON.stringify(line.slice(0, 40))}: every line is key: value` };
    const value = line.slice(colon + 1).trim();
    if (!value) return { error: `${line.slice(0, colon)} has no text` };
    for (const [what, pattern] of PLAIN_TEXT) {
      if (pattern.test(value)) {
        return { error: `${JSON.stringify(value.slice(0, 40))} contains ${what}; text in a block is plain` };
      }
    }
    lines.push([line.slice(0, colon).trim(), value]);
  }

  const one = (key: string) => lines.filter(([k]) => k === key).map(([, v]) => v);
  const pair = (value: string): [string, string] | null => {
    const bar = value.indexOf("|");
    if (bar === -1) return null;
    const left = value.slice(0, bar).trim();
    const right = value.slice(bar + 1).trim();
    return left && right ? [left, right] : null;
  };
  const allowed = (keys: string[]) => {
    const stray = lines.find(([k]) => !keys.includes(k));
    return stray ? `:::${type} has no ${stray[0]}: line (it takes ${keys.join(", ")})` : null;
  };
  const single = (key: string) => {
    const values = one(key);
    return values.length === 1 ? values[0] : null;
  };

  const title = single("title");
  if (!title) return { error: `:::${type} needs exactly one title: line` };

  if (type === "compare") {
    const stray = allowed(["title", "tab", "row"]);
    if (stray) return { error: stray };
    const tabs: CompareWidget["tabs"] = [];
    for (const [key, value] of lines) {
      if (key === "tab") tabs.push({ label: value, rows: [] });
      if (key === "row") {
        const row = pair(value);
        if (!row) return { error: `row ${JSON.stringify(value.slice(0, 40))} needs a label | text` };
        if (!tabs.length) return { error: "a row: line comes after the tab: it belongs to" };
        tabs[tabs.length - 1].rows.push(row);
      }
    }
    if (tabs.length < 2) return { error: ":::compare needs at least two tab: lines" };
    const empty = tabs.find((t) => !t.rows.length);
    if (empty) return { error: `tab ${JSON.stringify(empty.label)} has no row: lines` };
    return { type, title, tabs };
  }

  if (type === "checklist") {
    const stray = allowed(["title", "item", "pending", "done"]);
    if (stray) return { error: stray };
    const items = one("item");
    const pending = single("pending");
    const done = single("done");
    if (items.length < 2) return { error: ":::checklist needs at least two item: lines" };
    if (!pending || !done) return { error: ":::checklist needs one pending: and one done: line" };
    return { type, title, items, pending, done };
  }

  if (type === "steps") {
    const stray = allowed(["title", "step", "choice"]);
    if (stray) return { error: stray };
    const steps: StepsWidget["steps"] = [];
    for (const [key, value] of lines) {
      const parts = pair(value);
      if (key === "title") continue;
      if (!parts) return { error: `${key} ${JSON.stringify(value.slice(0, 40))} needs a label | text` };
      if (key === "step") steps.push({ label: parts[0], detail: parts[1], choices: [] });
      if (key === "choice") {
        if (!steps.length) return { error: "a choice: line comes after the step: it belongs to" };
        steps[steps.length - 1].choices.push(parts);
      }
    }
    if (steps.length < 2) return { error: ":::steps needs at least two step: lines" };
    return { type, title, steps };
  }

  if (type === "reveal") {
    const stray = allowed(["title", "card"]);
    if (stray) return { error: stray };
    const cards: RevealWidget["cards"] = [];
    for (const value of one("card")) {
      const card = pair(value);
      if (!card) return { error: `card ${JSON.stringify(value.slice(0, 40))} needs a front | back` };
      cards.push(card);
    }
    if (cards.length < 2) return { error: ":::reveal needs at least two card: lines" };
    return { type, title, cards };
  }

  // timer
  const stray = allowed(["title", "units", "start", "tick", "done", "reset", "after-reset"]);
  if (stray) return { error: stray };
  const units = Number(single("units"));
  if (!Number.isInteger(units) || units < 1 || units > 20) {
    return { error: ":::timer needs units: a whole number from 1 to 20" };
  }
  const fields = ["start", "tick", "done", "reset", "after-reset"].map(single);
  if (fields.some((f) => !f)) {
    return { error: ":::timer needs one each of start:, tick:, done:, reset: and after-reset:" };
  }
  const [start, tick, done, reset, afterReset] = fields as string[];
  if (!tick.includes("{n}")) return { error: "the timer's tick: line needs {n}, the unit just completed" };
  return { type: "timer", title, units, start, tick, done, reset, afterReset };
}

