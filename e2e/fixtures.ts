import { test as base, expect, type Locator, type Page } from "@playwright/test";
import type { Client } from "pg";

import { choicesFor } from "./support/answer-key";
import { openRunDatabase } from "./support/database";

/**
 * What every test gets.
 *
 *   db     a superuser connection to the run's database, for arranging state and for
 *          the answer key. Never for assertions.
 *   quiz   fills in a question paper (a Baseline Sitting or a Stage Quiz) the way a
 *          person would, with the answers a test chooses.
 *
 * Add a journey as a new file in e2e/tests/ that imports `test` and `expect` from here.
 * People to sign in as live in ./support/people.ts.
 */
export type AnswerMode =
  /** Every question right. */
  | "correct"
  /** Every question wrong. */
  | "wrong"
  /** The first choice of every question, whatever it is. */
  | "first";

export type QuizDriver = {
  /** Answer every question on the page and press Submit; resolves once submitted. */
  complete(page: Page, mode: AnswerMode, submitLabel: RegExp | string): Promise<void>;
};

async function textsOf(labels: Locator): Promise<string[]> {
  const count = await labels.count();
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    // The label holds the letter pill, the tick icon and the choice text.
    const text = await labels.nth(i).locator("span").last().innerText();
    out.push(text.trim());
  }
  return out;
}

function quizDriver(db: Client): QuizDriver {
  return {
    async complete(page, mode, submitLabel) {
      for (;;) {
        const fieldset = page.locator("fieldset").first();
        await expect(fieldset).toBeVisible();
        const prompt = (await fieldset.locator("legend").innerText()).trim();
        const labels = fieldset.locator("label");
        const shown = await textsOf(labels);

        let toPick: string[];
        if (mode === "first") {
          toPick = [shown[0]];
        } else {
          const choices = await choicesFor(db, prompt, shown);
          toPick =
            mode === "correct"
              ? choices.filter((c) => c.isCorrect).map((c) => c.text)
              : [choices.find((c) => !c.isCorrect)!.text];
        }

        for (const text of toPick) {
          await labels.filter({ has: page.getByText(text, { exact: true }) }).first().click();
        }

        const next = page.getByRole("button", { name: "Next", exact: true });
        if (await next.isVisible()) {
          await next.click();
        } else {
          await page.getByRole("button", { name: "Review answers" }).click();
          break;
        }
      }
      await expect(page.getByRole("heading", { name: "Check before you submit" })).toBeVisible();
      await expect(page.getByText("All questions answered.")).toBeVisible();
      await page.getByRole("button", { name: submitLabel }).click();
    },
  };
}

/**
 * Open an Admin page and wait until React has revealed it.
 *
 * Admin pages stream in behind `src/app/admin/loading.tsx`, and React reveals the page a
 * moment after the load event that `page.goto` resolves on. A one-off read straight
 * after `goto` (`.count()`, `.innerText()`) can run while the page is still hidden and
 * see nothing. Use this for any Admin page a test then reads.
 */
export async function gotoAdmin(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.getByRole("status").filter({ hasText: "Loading" })).toHaveCount(0);
}

export const test = base.extend<{ db: Client; quiz: QuizDriver }>({
  db: async ({}, provide) => {
    const db = await openRunDatabase();
    await provide(db);
    await db.end();
  },
  quiz: async ({ db }, provide) => {
    await provide(quizDriver(db));
  },
});

export { expect };
