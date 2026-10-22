import { describe, expect, it } from "vitest";
import { splitLessonBody } from "@/lib/lesson-widgets";

const compare = `:::compare
title: Tap to compare
tab: A coma
row: The brainstem | Still works
tab: Brain death
row: The brainstem | Has stopped working
:::`;

describe("splitLessonBody", () => {
  it("leaves prose without blocks as one Markdown segment", () => {
    expect(splitLessonBody("## A\n\nText.")).toEqual([{ kind: "markdown", source: "## A\n\nText." }]);
  });

  it("cuts a block out of the prose, in order", () => {
    const segments = splitLessonBody(`Before.\n\n${compare}\n\nAfter.`);
    expect(segments.map((s) => s.kind)).toEqual(["markdown", "widget", "markdown"]);
    expect(segments[1]).toEqual({
      kind: "widget",
      widget: {
        type: "compare",
        title: "Tap to compare",
        tabs: [
          { label: "A coma", rows: [["The brainstem", "Still works"]] },
          { label: "Brain death", rows: [["The brainstem", "Has stopped working"]] },
        ],
      },
    });
  });

  it("attaches each choice to the step above it", () => {
    const [segment] = splitLessonBody(`:::steps
title: Steps
step: One | First
choice: A | Detail A
step: Two | Second
:::`);
    expect(segment.kind === "widget" && segment.widget).toMatchObject({
      steps: [
        { label: "One", choices: [["A", "Detail A"]] },
        { label: "Two", choices: [] },
      ],
    });
  });

  it("reads a timer and keeps {n} for the renderer", () => {
    const [segment] = splitLessonBody(`:::timer
title: Wait
units: 5
start: Go
tick: Minute {n}
done: Done
reset: Again
after-reset: Back to zero
:::`);
    expect(segment.kind === "widget" && segment.widget).toMatchObject({ type: "timer", units: 5, tick: "Minute {n}" });
  });

  it.each([
    [":::diagram\ntitle: X\n:::", "not a block the app can draw"],
    [":::compare\ntab: A\nrow: x | y\ntab: B\nrow: x | y\n:::", "exactly one title"],
    [":::compare\ntitle: T\ntab: A\nrow: x | y\n:::", "at least two tab"],
    [":::compare\ntitle: T\ntab: A\nrow: no bar\ntab: B\nrow: x | y\n:::", "label | text"],
    [":::checklist\ntitle: T\nitem: **a**\nitem: b\npending: p\ndone: d\n:::", "contains bold"],
    [":::checklist\ntitle: T\nitem: a\nitem: b\nnote: n\npending: p\ndone: d\n:::", "has no note"],
    [":::timer\ntitle: T\nunits: 5\nstart: s\ntick: no n\ndone: d\nreset: r\nafter-reset: a\n:::", "{n}"],
  ])("refuses a malformed block: %s", (source, error) => {
    const [segment] = splitLessonBody(source);
    expect(segment.kind).toBe("invalid");
    expect(segment.kind === "invalid" && segment.error).toContain(error);
  });
});
