"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/authz";
import { supabaseServer } from "@/lib/supabase/server";

export type AdminRoleState = { error?: string; done?: "granted" | "revoked" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Make a Student an Admin, or take it back (T95). Owner only: `requireOwner` is the
 * quiet early exit and `learn_grant_admin` / `learn_revoke_admin` are the check that
 * counts, since they read the caller from the JWT. The Owner cannot be revoked and a
 * Student with no sign-in cannot be granted; the database says so and this passes the
 * sentence on, because those messages are written for a person to read.
 */
export async function setAdminRoleAction(studentId: string, grant: boolean): Promise<AdminRoleState> {
  await requireOwner();
  if (!UUID.test(studentId)) return { error: "That Student could not be found." };

  const supabase = await supabaseServer();
  const { error } = await supabase.rpc(grant ? "learn_grant_admin" : "learn_revoke_admin", {
    p_learner_id: studentId,
  });
  if (error) {
    const known = ["23514", "P0002", "42501"].includes(error.code);
    return { error: known ? error.message : "That did not save. Nothing was changed." };
  }

  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${studentId}`);
  return { done: grant ? "granted" : "revoked" };
}

export type DeleteStudentState = { error?: string };

/**
 * Delete a Student's account and progress. Owner only, and irreversible, so the
 * database insists the Owner typed the Student's name (`learn_delete_student` refuses
 * otherwise); the dialog is the friendly version of a rule that cannot be skipped by
 * calling this action directly.
 */
export async function deleteStudentAction(studentId: string, confirmName: string): Promise<DeleteStudentState> {
  await requireOwner();
  if (!UUID.test(studentId)) return { error: "That Student could not be found." };

  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("learn_delete_student", {
    p_learner_id: studentId,
    p_confirm_name: confirmName,
  });
  if (error) {
    const known = ["23514", "P0002", "42501"].includes(error.code);
    return { error: known ? error.message : "That did not delete. Nothing was changed." };
  }

  revalidatePath("/admin/students");
  redirect("/admin/students");
}
