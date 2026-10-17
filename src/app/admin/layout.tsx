import { requireAdmin } from "@/lib/authz";
import { signOutAction } from "@/app/(auth)/actions";
import { AdminShell } from "@/components/admin/AdminShell";

/**
 * Admin shell.
 *
 * `requireAdmin` runs in the layout, so every page beneath it is guarded even if a
 * new one is added without remembering to check. A non-admin gets a 404 rather than
 * a 403: there is no reason to confirm that Save7's analytics live at this path.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <AdminShell email={admin.email} signOut={signOutAction}>
      {children}
    </AdminShell>
  );
}
