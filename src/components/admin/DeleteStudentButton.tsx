"use client";

import { useRef, useState, useTransition } from "react";
import { deleteStudentAction } from "@/app/admin/students/actions";

/**
 * "Delete student", shown to the Owner on a Student's page. Deleting is permanent, so
 * it opens an "Are you sure?" dialog that says what goes with the account, and the
 * delete button stays disabled until the Owner types the Student's name. The database
 * checks the same name again, so the rule holds even if this dialog is bypassed.
 */
export function DeleteStudentButton({
  studentId,
  studentName,
  stagesPassed,
  certificates,
}: {
  studentId: string;
  studentName: string;
  stagesPassed: number;
  certificates: number;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const matches = typed.trim().toLowerCase() === studentName.trim().toLowerCase();

  function close() {
    if (pending) return;
    dialog.current?.close();
    setTyped("");
    setError("");
  }

  function confirm() {
    start(async () => {
      const res = await deleteStudentAction(studentId, typed);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="inline-flex min-h-10 items-center whitespace-nowrap rounded-[10px] border-2 border-navy bg-white px-3.5 text-sm font-semibold text-navy hover:bg-line"
      >
        Delete student
      </button>
      <dialog
        ref={dialog}
        onClose={() => {
          setTyped("");
          setError("");
        }}
        aria-labelledby="delete-student-title"
        data-testid="delete-student-dialog"
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border-0 bg-white p-6 text-navy shadow-xl backdrop:bg-navy/40"
      >
        <h2 id="delete-student-title" className="font-display text-xl font-bold">
          Delete {studentName}?
        </h2>
        <div className="mt-3 space-y-2 text-sm text-grey">
          <p>This cannot be undone. Deleting the account removes:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Their sign-in and Progress Record ({stagesPassed} Stage{stagesPassed === 1 ? "" : "s"} passed).</li>
            <li>All quiz attempts and Baseline Sittings.</li>
            <li>
              {certificates} certificate{certificates === 1 ? "" : "s"}. They will no longer verify.
            </li>
          </ul>
          <p>They can sign up again later, but they would start from nothing.</p>
        </div>
        <label className="mt-4 block text-sm font-medium text-navy">
          Type <span className="font-semibold">{studentName}</span> to confirm
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            data-testid="delete-student-confirm-name"
            className="mt-1 block min-h-11 w-full rounded-[10px] border-2 border-line px-3 text-base"
          />
        </label>
        <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-grey">
          {error}
        </p>
        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={close}
            disabled={pending}
            className="inline-flex min-h-10 items-center rounded-[10px] border-2 border-navy bg-white px-4 text-sm font-semibold text-navy hover:bg-line disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!matches || pending}
            data-testid="confirm-delete-student"
            className="inline-flex min-h-10 items-center rounded-[10px] bg-navy px-4 text-sm font-semibold text-white disabled:opacity-40"
          >
            {pending ? "Deleting" : "Delete student"}
          </button>
        </div>
      </dialog>
    </>
  );
}
