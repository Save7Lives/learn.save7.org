import type { ReactNode } from "react";
import { cx } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";

/**
 * The pieces a Stage Quiz and the Baseline share (#74): the progress strip, the
 * scenario box, the whole-row lettered choice and the marked choice.
 *
 * Nothing here ever receives an answer key. `QuizChoice` gets only a choice's text
 * and whether the learner picked it; `MarkedChoice` is used only on a paper the
 * database has already marked, and takes the verdict it was told.
 */

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/** A choice's letter pill: A to D, a rounded square when several answers apply. */
const PILL =
  "grid size-[30px] shrink-0 place-items-center border-[1.5px] font-(family-name:--font-display) text-[0.8125rem] font-bold leading-none";

// --- Progress ----------------------------------------------------------------

/**
 * "Question 3 of 5" and "2 answered" in text, over one 6px segment per question:
 * `teal-ink` answered, a taller navy one for the current question, `line` for the
 * rest. The Baseline draws 20 segments of the same strip. The segments are
 * decoration: the words beside them say the same thing.
 */
export function QuizProgress({
  total,
  current,
  answered,
}: {
  total: number;
  /** Zero-based. */
  current: number;
  /** Whether each question has an answer, in order. */
  answered: boolean[];
}) {
  const count = answered.filter(Boolean).length;
  return (
    <div className="mb-[22px]">
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <p
          aria-live="polite"
          className="font-(family-name:--font-display) text-[0.9375rem] font-semibold leading-[1.3] text-navy"
        >
          Question {current + 1} of {total}
        </p>
        <p className="text-sm text-grey">{count} answered</p>
      </div>
      <ol aria-hidden="true" className="flex items-center gap-1">
        {Array.from({ length: total }, (_, i) => (
          <li
            key={i}
            className={cx(
              "flex-1 rounded-pill",
              i === current ? "h-2.5 bg-navy" : answered[i] ? "h-1.5 bg-teal-ink" : "h-1.5 bg-line",
            )}
          />
        ))}
      </ol>
    </div>
  );
}

// --- Scenario ----------------------------------------------------------------

/** A scenario: a teal-50 box with an info mark, in italics. */
export function ScenarioBox({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cx(
        "flex gap-3 rounded-[14px] border border-teal-line bg-teal-50 p-3.5 text-[0.9375rem] italic leading-[1.55] text-navy",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-ink"
      >
        <Icon name="info" className="size-4 shrink-0 stroke-[2.25]" />
      </span>
      <span>{children}</span>
    </p>
  );
}

// --- Choosing ----------------------------------------------------------------

/**
 * One choice, a whole-row target at least 56px tall. The native radio or checkbox
 * is still there, visually hidden, so arrow keys, the group and a screen reader's
 * "selected" all work as they do on any form; the row and the pill are drawn from
 * its `:checked` state. Selected is a 2px navy border and a filled navy pill with a
 * check, so it never rests on colour alone.
 */
export function QuizChoice({
  index,
  text,
  name,
  value,
  multi,
  checked,
  onChange,
}: {
  index: number;
  text: string;
  name: string;
  value: string;
  multi: boolean;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cx(
        "group relative flex min-h-14 cursor-pointer items-start gap-3.5 rounded-[14px] border-[1.5px] border-line-strong bg-white px-4 py-3.5 text-base leading-6 hover:bg-teal-50",
        "has-[:checked]:border-2 has-[:checked]:border-navy has-[:checked]:px-[15.5px] has-[:checked]:py-[13.5px]",
        "has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-navy",
      )}
    >
      <input
        type={multi ? "checkbox" : "radio"}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cx(
          PILL,
          "-mt-px border-line-strong bg-white text-navy",
          "group-has-[:checked]:border-navy group-has-[:checked]:bg-navy group-has-[:checked]:text-white",
          multi ? "rounded-[9px]" : "rounded-full",
        )}
      >
        <span className="group-has-[:checked]:hidden">{LETTERS[index]}</span>
        <Icon
          name="check"
          className="hidden size-4 shrink-0 stroke-[2.25] group-has-[:checked]:block"
        />
      </span>
      <span className="min-w-0 flex-1 text-navy">{text}</span>
    </label>
  );
}

// --- Marked ------------------------------------------------------------------

export type MarkedState =
  /** You chose it and it is correct. */
  | "yours-correct"
  /** Correct, and you did not choose it. */
  | "correct-missed"
  /** You chose it and it is not correct. */
  | "yours-not-correct"
  /** Not chosen and not correct. */
  | "not-chosen";

const MARKED_WORDS: Record<MarkedState, string | null> = {
  "yours-correct": "Your answer, correct",
  "correct-missed": "Correct answer",
  "yours-not-correct": "Your answer, not correct",
  "not-chosen": null,
};

/**
 * A choice on a marked paper. The six states of the README's table are these four
 * marked ones plus idle and selected, which `QuizChoice` draws. Every marked state
 * says itself with an icon and words, and the surface and border follow:
 * `teal-50` and `correct` for a right answer, `pink-50` and `incorrect` for yours
 * when it was not, plain white and a hairline for the rest.
 */
export function MarkedChoice({
  index,
  text,
  state,
  multi,
}: {
  index: number;
  text: string;
  state: MarkedState;
  multi: boolean;
}) {
  const ok = state === "yours-correct" || state === "correct-missed";
  const bad = state === "yours-not-correct";
  const words = MARKED_WORDS[state];
  return (
    <div
      className={cx(
        "flex min-h-14 items-start gap-3.5 rounded-[14px] text-base leading-6",
        ok && "border-2 border-correct bg-teal-50 px-[15.5px] py-[13.5px]",
        bad && "border-2 border-incorrect bg-pink-50 px-[15.5px] py-[13.5px]",
        !ok && !bad && "border border-line bg-white px-4 py-3.5",
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          PILL,
          "-mt-px",
          multi ? "rounded-[9px]" : "rounded-full",
          ok && "border-correct bg-correct text-white",
          bad && "border-incorrect bg-incorrect text-white",
          !ok && !bad && "border-line-strong bg-white text-navy",
        )}
      >
        {ok ? (
          <Icon name="check" className="size-4 shrink-0 stroke-[2.25]" />
        ) : bad ? (
          <Icon name="x" className="size-4 shrink-0 stroke-[2.25]" />
        ) : (
          LETTERS[index]
        )}
      </span>
      <span className="min-w-0 flex-1 text-navy">
        {text}
        {words ? (
          <span
            className={cx(
              "mt-1.5 flex items-center gap-1.5 text-sm font-medium",
              ok && "text-correct",
              bad && "text-incorrect",
            )}
          >
            <Icon name={ok ? "check" : "x"} className="size-4 shrink-0 stroke-[2.25]" />
            {words}
          </span>
        ) : null}
      </span>
    </div>
  );
}
