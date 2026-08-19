import Link from "next/link";
import { Save7Logo } from "@/components/ui/Save7Logo";

export function SiteFooter() {
  return (
    <footer className="on-ink mt-24 bg-ink text-cream">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <Save7Logo variant="horizontal" className="h-5 w-auto" />
            <p className="mt-5 font-display text-2xl leading-tight text-cream">
              One decision can save <span className="text-teal">seven lives.</span>
            </p>
            <p className="mt-4 text-sm text-cream/60">
              Save7 is a South African organ donation awareness initiative.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-1 gap-x-16 gap-y-8 text-sm sm:grid-cols-2"
          >
            <FooterColumn title="Course">
              <FooterLink href="/">Choose a level</FooterLink>
              <FooterLink href="/course/introduction">Introduction</FooterLink>
              <FooterLink href="/dashboard">My progress</FooterLink>
            </FooterColumn>
            <FooterColumn title="Save7">
              <FooterLink href="https://save7.org" external>
                save7.org
              </FooterLink>
              <FooterLink href="https://save7.org/register" external>
                Register as a donor
              </FooterLink>
              <FooterLink href="/privacy">Privacy &amp; POPIA</FooterLink>
            </FooterColumn>
          </nav>
        </div>

        <div className="mt-14 border-t border-cream/10 pt-6">
          <p className="text-xs text-cream/40">
            Educational material. This course provides general information about organ
            donation and transplantation and is not medical or legal advice. For advice
            about your own circumstances, speak to a healthcare professional.
          </p>
        </div>
      </div>
    </footer>
  );
}

/** A titled group of footer links, as a real list so it announces as one. */
function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-cream/40">
        {title}
      </h2>
      <ul className="flex flex-col">{children}</ul>
    </div>
  );
}

/**
 * One footer link, on its own line.
 *
 * `flex` rather than `inline-flex` is the whole point: as inline elements these
 * ran together on a single row with no gap between them, so "Choose a level" and
 * "Introduction" touched and read as one string. Each link now owns its row, and
 * min-h-11 keeps the 44px tap target the accessibility pass requires — which only
 * works when the target is a full row rather than a word in a queue.
 */
function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const className =
    "flex min-h-11 items-center text-cream/70 transition-colors hover:text-teal";
  return (
    <li>
      {external ? (
        <a href={href} className={className} target="_blank" rel="noreferrer">
          {children}
        </a>
      ) : (
        <Link href={href} className={className}>
          {children}
        </Link>
      )}
    </li>
  );
}
