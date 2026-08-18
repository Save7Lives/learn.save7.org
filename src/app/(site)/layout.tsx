import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * Shell for every public and learner-facing page.
 *
 * The auth pages and the certificate page use their own layouts: one wants a
 * full-bleed split screen, the other wants nothing at all around it so it prints
 * cleanly.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
