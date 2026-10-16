import Link from "next/link";
import { Save7Lockup } from "@/components/ui/Save7Lockup";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      {/* Ink panel. Teal is legible here, which is the only place the brand
          guidelines permit it to carry text. Hidden on small screens so the form
          is the first thing a phone user sees. */}
      <aside className="on-navy relative hidden flex-col justify-between bg-navy p-12 text-white lg:flex">
        <Link href="/" aria-label="Save7 Learn home" className="inline-flex">
          <Save7Lockup surface="navy" className="text-2xl" />
        </Link>

        <div className="max-w-md">
          <p className="font-display text-5xl leading-[0.95] text-white">
            One decision
            <br />
            can save
            <br />
            <span className="text-teal">seven lives.</span>
          </p>
          <p className="mt-6 text-white/70">
            Save7 Learn is Save7&apos;s organ donation and transplantation
            awareness course. Three levels, each a complete achievement on its own.
          </p>
        </div>

        <p className="text-sm text-white/70">
          Save7 · A South African organ donation awareness initiative
        </p>
      </aside>

      <main id="main" className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" aria-label="Save7 Learn home" className="mb-10 inline-flex lg:hidden">
            <Save7Lockup surface="white" className="text-xl" />
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
