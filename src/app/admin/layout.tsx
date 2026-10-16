import Link from "next/link";
import { requireAdmin } from "@/lib/authz";
import { Save7Lockup } from "@/components/ui/Save7Lockup";
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
    <div className="flex min-h-dvh flex-col bg-line/40">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-5 py-3 sm:px-8">
          <Link href="/" aria-label="Save7 home" className="inline-flex min-h-11 items-center">
            <Save7Lockup surface="white" className="text-base" />
          </Link>
          <span aria-hidden="true" className="h-5 w-px bg-line-strong" />
          <p className="text-sm font-bold text-navy">Save7 admin</p>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-grey sm:inline">{admin.email}</span>
            <Link href="/" className="font-semibold text-grey hover:text-navy">
              View course
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="font-semibold text-grey hover:text-navy"
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
                  className="inline-flex min-h-11 items-center border-b-2 border-transparent px-3 text-sm font-semibold text-grey hover:border-line-strong hover:text-navy"
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
