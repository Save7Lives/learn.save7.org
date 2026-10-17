import Link from "next/link";
import { Save7Lockup } from "@/components/ui/Save7Lockup";

/**
 * The public backdrop (#70): a white page carrying the landing page's corner blobs
 * and circle pair, with one centred card. No navy surface. The blobs are decoration
 * behind an opaque card and carry no text, so contrast is never measured against
 * them. Under 560px only the teal circle remains, smaller.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-white">
      <div aria-hidden="true" className="pointer-events-none">
        <span className="absolute -right-[140px] -top-[130px] z-0 size-[260px] rounded-full bg-teal-100 min-[560px]:-right-[190px] min-[560px]:-top-[230px] min-[560px]:size-[520px]" />
        <span className="absolute -bottom-[200px] -left-[170px] z-0 hidden size-[360px] rounded-full border border-pink-line bg-pink-50 min-[560px]:block" />
        <span className="absolute right-16 top-[52px] z-0 hidden h-[90px] w-[120px] min-[560px]:block">
          <span className="absolute right-0 top-0 size-[72px] rounded-full bg-teal" />
          <span className="absolute bottom-0 left-0 size-10 rounded-full bg-pink" />
        </span>
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col items-center px-4 pb-9 pt-5 min-[560px]:px-8 min-[560px]:pb-14 min-[560px]:pt-[26px]">
        <Link href="/" aria-label="Save7 Learn home" className="-my-2 inline-flex min-h-11 items-center self-start">
          <Save7Lockup surface="white" className="text-2xl" />
        </Link>

        <main
          id="main"
          className="mt-[18px] w-full max-w-[480px] rounded-[20px] border border-line bg-white px-5 py-6 shadow-[0_1px_2px_color-mix(in_srgb,var(--color-navy)_5%,transparent),0_10px_30px_color-mix(in_srgb,var(--color-navy)_6%,transparent)] min-[560px]:mt-[22px] min-[560px]:p-9"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
