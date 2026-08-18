import Link from "next/link";
import { Save7Logo } from "@/components/ui/Save7Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      {/* Ink panel. Teal is legible here, which is the only place the brand
          guidelines permit it to carry text. Hidden on small screens so the form
          is the first thing a phone user sees. */}
      <aside className="on-ink relative hidden flex-col justify-between bg-ink p-12 text-cream lg:flex">
        <Link href="/" className="w-44">
          <Save7Logo variant="horizontal" className="h-auto w-full" priority />
        </Link>

        <div className="max-w-md">
          <p className="font-display text-5xl leading-[0.95] text-cream">
            One decision
            <br />
            can save
            <br />
            <span className="text-teal">seven lives.</span>
          </p>
          <p className="mt-6 text-cream/70">
            Transplant Alchemy 101 is Save7&apos;s organ donation and transplantation
            awareness course. Three levels, each a complete achievement on its own.
          </p>
        </div>

        <p className="text-sm text-cream/50">
          Save7 · A South African organ donation awareness initiative
        </p>
      </aside>

      <main id="main" className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 block w-36 lg:hidden">
            <Save7Logo variant="horizontal" className="h-auto w-full" priority />
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
