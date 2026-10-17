"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icons";
import { cx } from "@/components/ui/primitives";

export const ADMIN_NAV: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/admin", label: "Overview", icon: "grid" },
  { href: "/admin/students", label: "Students", icon: "users" },
  { href: "/admin/eligibility", label: "Eligibility rule", icon: "file" },
  { href: "/admin/content-review", label: "Content review", icon: "shield" },
];

/**
 * The Admin sections (#72): a `pink-50` pill with a hairline marks the current one,
 * and `aria-current` says so to a screen reader, so it is never colour alone. A
 * Student's drill-down keeps Students current. On a narrow screen the items wrap
 * across the top bar instead of stacking down a rail.
 */
export function AdminNav({ pathname: forced }: { pathname?: string }) {
  const live = usePathname();
  const pathname = forced ?? live;

  return (
    <nav aria-label="Admin sections" className="w-full min-[900px]:w-auto min-[900px]:flex-1">
      <ul className="m-0 flex list-none flex-wrap gap-x-1 gap-y-0.5 p-0 min-[900px]:flex-col min-[900px]:gap-1">
        {ADMIN_NAV.map((item) => {
          const current = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cx(
                  "flex min-h-11 items-center gap-2.5 whitespace-nowrap rounded-[10px] px-3 text-[0.9375rem] no-underline",
                  current
                    ? "bg-pink-50 font-medium text-pink shadow-[inset_0_0_0_1px_var(--color-pink-line)]"
                    : "font-medium text-grey hover:bg-teal-50 hover:text-navy",
                )}
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
