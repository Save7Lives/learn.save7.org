import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { Save7Lockup } from "@/components/ui/Save7Lockup";
import { AdminNav } from "./AdminNav";

/**
 * The Admin shell in the Portal Register (#72): a left rail on a wide screen, a top
 * bar under 900px. The wordmark is the vector V7 lockup (#40). The foot holds View
 * course and Sign out, and the staff member's address so the rail says who is in.
 *
 * `signOut` is the server action, passed in so this stays a plain component the
 * layout renders and a test page can render without a session.
 */
export function AdminShell({
  email,
  signOut,
  pathname,
  children,
}: {
  email: string;
  signOut: () => void | Promise<void>;
  /** Only for rendering a page without a router (the audit harness). */
  pathname?: string;
  children: React.ReactNode;
}) {
  const footLink =
    "flex min-h-11 items-center gap-2.5 whitespace-nowrap rounded-[10px] px-3 text-[0.9375rem] font-medium text-grey no-underline hover:bg-teal-50 hover:text-navy";

  return (
    <div className="min-h-dvh bg-white min-[900px]:grid min-[900px]:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="flex flex-wrap items-center gap-x-1 gap-y-0.5 border-b border-line bg-white px-3 py-2.5 min-[900px]:sticky min-[900px]:top-0 min-[900px]:h-dvh min-[900px]:flex-col min-[900px]:items-stretch min-[900px]:flex-nowrap min-[900px]:gap-1 min-[900px]:border-b-0 min-[900px]:border-r min-[900px]:px-3.5 min-[900px]:pb-5 min-[900px]:pt-[18px]">
        <div className="w-full px-2 py-1 min-[900px]:px-2.5 min-[900px]:pb-[18px]">
          <Link href="/" aria-label="Save7 home" className="inline-flex min-h-11 items-center">
            <Save7Lockup surface="white" className="text-lg" />
          </Link>
        </div>

        <AdminNav pathname={pathname} />

        <div className="flex w-full flex-wrap gap-x-1 border-t border-line pt-1 min-[900px]:flex-col min-[900px]:border-t min-[900px]:pt-3">
          <p className="hidden truncate px-3 pb-1 text-[0.8125rem] text-grey min-[900px]:block" title={email}>
            {email}
          </p>
          <Link href="/" className={footLink}>
            <Icon name="book" />
            View course
          </Link>
          <form action={signOut} className="min-[900px]:w-full">
            <button type="submit" className={`${footLink} w-full text-left`}>
              <Icon name="log-out" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main id="main" className="min-w-0 px-4 pb-10 pt-[18px] min-[900px]:px-[30px] min-[900px]:pt-6">
        {children}
      </main>
    </div>
  );
}
