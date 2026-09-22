"use server";

import { requireUser } from "@/lib/authz";
import { updateProfile } from "@/lib/profile";

export type ProfileFormState = { error?: string; savedName?: string } | undefined;

/**
 * Save the learner's name.
 *
 * The user id comes from the session, never from the form — a form field would let
 * anyone edit anyone's name by changing a hidden input.
 */
export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser("/profile");

  const result = await updateProfile(user.id, {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
  });

  if (!result.ok) return { error: result.error };

  // The name appears in the header and on the dashboard, both of which are
  // server-rendered, so those need to re-render rather than show the old name.
  // The form calls router.refresh() for that. revalidatePath() would be the other
  // way round, but this route is dynamic — it reads the session cookie — so there
  // is no cached entry for it to invalidate.

  return { savedName: result.name };
}
