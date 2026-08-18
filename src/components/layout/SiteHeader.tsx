import Link from "next/link";
import { Save7Logo } from "@/components/ui/Save7Logo";
import { ButtonLink, cx } from "@/components/ui/primitives";
import { getSession } from "@/lib/auth";
import { signOutAction } from "@/app/(auth)/actions";

/**
 * The app bar. Uses the horizontal lockup, per the brand guidelines.
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
        "sticky top-0 z-40 border-b border-sand-200 bg-sand-50/85 backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 sm:gap-4 sm:px-8 sm:py-3">
        <Link href="/" className="inline-flex min-h-11 shrink-0 items-center" aria-label="Save7 home">
          <Save7Logo variant="horizontal" className="h-4 w-auto sm:h-5" priority />
        </Link>

        <span aria-hidden="true" className="hidden h-5 w-px bg-sand-300 sm:block" />
        <p className="hidden text-sm font-semibold text-sand-600 sm:block">
          Transplant Alchemy 101
        </p>

        <nav className="ml-auto flex items-center gap-0.5 sm:gap-2">
          {session ? (
            <>
              {session.role === "ADMIN" ? (
                <Link
                  href="/admin"
                  className="inline-flex min-h-11 items-center whitespace-nowrap rounded-pill px-2.5 text-sm font-semibold sm:px-3 text-sand-600 hover:bg-sand-100 hover:text-ink"
                >
                  Admin
                </Link>
              ) : null}
              <Link
                href="/dashboard"
                className="inline-flex min-h-11 items-center whitespace-nowrap rounded-pill px-2.5 text-sm font-semibold sm:px-3 text-sand-600 hover:bg-sand-100 hover:text-ink"
              >
                My progress
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center whitespace-nowrap rounded-pill px-2.5 text-sm font-semibold sm:px-3 text-sand-500 hover:bg-sand-100 hover:text-ink"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center whitespace-nowrap rounded-pill px-2.5 text-sm font-semibold sm:px-3 text-sand-600 hover:bg-sand-100 hover:text-ink"
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
