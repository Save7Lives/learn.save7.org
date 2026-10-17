import { StatusPill } from "@/components/portal/Portal";
import type { AdminRole } from "@/lib/constants";

/** The marker an Admin sees on a Student who is an Admin (T95): text and an icon, never colour alone. */
export function AdminRoleMark({ role }: { role: AdminRole }) {
  return (
    <StatusPill tone="done" icon="shield">
      {role === "owner" ? "Owner" : "Admin"}
    </StatusPill>
  );
}
