import Link from "next/link";
import { Save7Lockup } from "@/components/ui/Save7Lockup";
import { ButtonLink, cx } from "@/components/ui/primitives";
import { getSession } from "@/lib/auth";
import { signOutAction } from "@/app/(auth)/actions";

/**
 * The app bar: the vector mark with a live wordmark (#40).
 *
 * Navigation is intentionally sparse. This is a course, not a portal — the most
 * useful thing on the screen is almost always the next lesson, so the header
 * stays out of the way.
 */
export async function SiteHeader({ className }: { className?: string }) {
  const session = await getSession();

  return (
    <header
      className={cx(
        "sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 sm:gap-4 sm:px-8 sm:py-3">
        <Link href="/" className="inline-flex min-h-11 shrink-0 items-center gap-2" aria-label="Save7 Learn home">
          <Save7Lockup surface="white" className="text-lg sm:text-xl" />
          <span className="hidden text-sm font-semibold text-grey sm:inline">Learn</span>
        </Link>

        <nav className="ml-auto flex items-center gap-0.5 sm:gap-2">
          {session ? (
            <>
              {session.role === "ADMIN" ? (
                <Link
                  href="/admin"
                  className="inline-flex min-h-11 items-center whitespace-nowrap rounded-pill px-2.5 text-sm font-semibold sm:px-3 text-grey hover:bg-line/50 hover:text-navy"
                >
                  Admin
                </Link>
              ) : null}
              <Link
                href="/dashboard"
                className="inline-flex min-h-11 items-center whitespace-nowrap rounded-pill px-2.5 text-sm font-semibold sm:px-3 text-grey hover:bg-line/50 hover:text-navy"
              >
                My progress
              </Link>
              <Link
                href="/profile"
                className="inline-flex min-h-11 items-center whitespace-nowrap rounded-pill px-2.5 text-sm font-semibold sm:px-3 text-grey hover:bg-line/50 hover:text-navy"
              >
                Profile
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center whitespace-nowrap rounded-pill px-2.5 text-sm font-semibold sm:px-3 text-grey hover:bg-line/50 hover:text-navy"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center whitespace-nowrap rounded-pill px-2.5 text-sm font-semibold sm:px-3 text-grey hover:bg-line/50 hover:text-navy"
              >
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
