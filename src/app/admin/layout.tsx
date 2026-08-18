import Link from "next/link";
import { requireAdmin } from "@/lib/authz";
import { Save7Logo } from "@/components/ui/Save7Logo";
import { signOutAction } from "@/app/(auth)/actions";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/knowledge", label: "Knowledge impact" },
  { href: "/admin/engagement", label: "Engagement" },
  { href: "/admin/learners", label: "Learners" },
  { href: "/admin/certificates", label: "Certificates" },
  { href: "/admin/content-review", label: "Content review" },
];

/**
 * Admin shell.
 *
 * `requireAdmin` runs in the layout, so every page beneath it is guarded even if a
 * new one is added without remembering to check. A non-admin gets a 404 rather than
 * a 403 — there is no reason to confirm that Save7's analytics live at this path.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col bg-sand-100/50">
      <header className="border-b border-sand-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-5 py-3 sm:px-8">
          <Link href="/" aria-label="Save7 home" className="inline-flex min-h-11 items-center">
            <Save7Logo variant="horizontal" className="h-4 w-auto" priority />
          </Link>
          <span aria-hidden="true" className="h-5 w-px bg-sand-300" />
          <p className="text-sm font-bold text-ink">Save7 admin</p>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-sand-500 sm:inline">{admin.email}</span>
            <Link href="/" className="font-semibold text-sand-600 hover:text-ink">
              View course
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="font-semibold text-sand-500 hover:text-ink"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        <nav aria-label="Admin sections" className="mx-auto max-w-7xl px-5 sm:px-8">
          <ul className="-mb-px flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <li key={tab.href} className="shrink-0">
                <Link
                  href={tab.href}
                  className="inline-flex min-h-11 items-center border-b-2 border-transparent px-3 text-sm font-semibold text-sand-600 hover:border-sand-300 hover:text-ink"
                >
                  {tab.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8">
        {children}
      </main>
    </div>
  );
}
