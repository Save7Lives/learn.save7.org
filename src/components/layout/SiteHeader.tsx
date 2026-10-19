import Link from "next/link";
import { Save7Lockup } from "@/components/ui/Save7Lockup";
import { ButtonLink, cx } from "@/components/ui/primitives";
import { getSession } from "@/lib/auth";
import { signOutAction } from "@/app/(auth)/actions";

/** One header link or button: a 44px target, 14px text, Lexend 500. */
const NAV_ITEM =
  "inline-flex min-h-11 items-center whitespace-nowrap rounded-pill px-3 text-sm font-medium text-grey hover:bg-line/50 hover:text-navy";

/**
 * The app bar: the vector mark with a live wordmark (#40).
 *
 * Navigation is intentionally sparse. This is a course, not a portal — the most
 * useful thing on the screen is almost always the next lesson, so the header
 * stays out of the way.
 *
 * Signed in, the links (up to four, for an Admin) do not fit beside the mark at 375px,
 * so below `sm` the nav takes its own row under the mark and the header scrolls away
 * with the page rather than taking a tenth of a phone screen while sticky. From `sm`
 * it is one sticky row. Signed out there are two items and it stays one row.
 */
export async function SiteHeader({ className }: { className?: string }) {
  const session = await getSession();

  return (
    <header
      className={cx(
        "site-header border-b border-line bg-white/85 backdrop-blur",
        session ? "sm:sticky sm:top-0 sm:z-40" : "sticky top-0 z-40",
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-0 px-4 py-2 sm:gap-x-4 sm:px-8 sm:py-3">
        <Link href="/" className="inline-flex min-h-11 shrink-0 items-center gap-2" aria-label="Save7 Learn home">
          <Save7Lockup surface="white" className="text-base sm:text-xl" />
          <span className="hidden text-sm font-medium text-grey sm:inline">Learn</span>
        </Link>

        <nav
          aria-label="Main"
          className={cx(
            "flex flex-wrap items-center sm:ml-auto sm:gap-2",
            session ? "-mx-3 w-full sm:mx-0 sm:w-auto" : "ml-auto gap-0.5",
          )}
        >
          {session ? (
            <>
              <Link href="/" className={NAV_ITEM}>
                Learn
              </Link>
              {session.role === "ADMIN" ? (
                <Link href="/admin" className={NAV_ITEM}>
                  Admin portal
                </Link>
              ) : null}
              <Link href="/dashboard" className={NAV_ITEM}>
                My progress
              </Link>
              <form action={signOutAction}>
                <button type="submit" className={NAV_ITEM}>
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={NAV_ITEM}>
                Sign in
              </Link>
              <ButtonLink href="/register" size="sm">
                Start the course
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
