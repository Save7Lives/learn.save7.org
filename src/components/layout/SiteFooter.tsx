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

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 text-sm">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-cream/40">
                Course
              </p>
              <FooterLink href="/">Choose a level</FooterLink>
              <FooterLink href="/course/introduction">Introduction</FooterLink>
              <FooterLink href="/dashboard">My progress</FooterLink>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-cream/40">
                Save7
              </p>
              <FooterLink href="https://save7.org" external>
                save7.org
              </FooterLink>
              <FooterLink href="https://save7.org/register" external>
                Register as a donor
              </FooterLink>
              <FooterLink href="/privacy">Privacy &amp; POPIA</FooterLink>
            </div>
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

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const className = "inline-flex min-h-11 items-center text-cream/70 hover:text-teal";
  if (external) {
    return (
      <a href={href} className={className} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
