"use client";

import { createContext, useContext } from "react";
import { Icon } from "@/components/ui/icons";

/**
 * Lets a step's server-rendered content move the runner to another step.
 *
 * The Finish step's card links to the Check step, but the steps are one client
 * runner's state, not routes, so a plain link cannot reach it. The runner provides
 * `goToKind`; this is the only thing in step content that talks back to it.
 */
export const StepNavContext = createContext<{ goToKind: (kind: string) => void } | null>(null);

export function GoToStepLink({ kind, children }: { kind: string; children: React.ReactNode }) {
  const nav = useContext(StepNavContext);
  if (!nav) return null;
  return (
    <button
      type="button"
      onClick={() => nav.goToKind(kind)}
      className="inline-flex min-h-11 items-center gap-1.5 text-base font-medium text-pink underline underline-offset-4 hover:text-navy"
    >
      {children}
      <Icon name="arrow" className="size-4 shrink-0 stroke-[2.25]" />
    </button>
  );
}
