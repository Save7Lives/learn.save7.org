"use client";

import { useActionState } from "react";
import { setAdminRoleAction, type AdminRoleState } from "@/app/admin/students/actions";
import { cx } from "@/components/ui/primitives";

/**
 * "Make admin" / "Remove admin", shown to the Owner only (T95). A plain form that posts
 * a server action, so it works before the page has hydrated. `relative z-10` lifts it
 * above the table row's stretched link, so pressing it never opens the drill-down.
 * The outcome is announced in a live region, never by colour alone.
 */
export function AdminRoleButton({
  studentId,
  studentName,
  isAdmin,
  className,
}: {
  studentId: string;
  studentName: string;
  isAdmin: boolean;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState<AdminRoleState>(
    () => setAdminRoleAction(studentId, !isAdmin),
    {},
  );

  return (
    <form action={formAction} className={cx("relative z-10 inline-flex flex-col items-start gap-1", className)}>
      <button
        type="submit"
        disabled={pending}
        aria-label={isAdmin ? `Remove admin from ${studentName}` : `Make ${studentName} an admin`}
        className="inline-flex min-h-10 items-center whitespace-nowrap rounded-[10px] border-2 border-navy bg-white px-3.5 text-sm font-semibold text-navy hover:bg-line disabled:opacity-60"
      >
        {pending ? "Saving" : isAdmin ? "Remove admin" : "Make admin"}
      </button>
      <span role="status" aria-live="polite" className="max-w-[16rem] whitespace-normal text-xs text-grey">
        {state.error ?? ""}
      </span>
    </form>
  );
}
