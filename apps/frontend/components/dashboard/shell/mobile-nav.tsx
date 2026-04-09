"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Activity, Gauge, KeyRound, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/overview", label: "Overview", icon: Gauge },
  { href: "/traffic", label: "Traffic", icon: Activity },
  { href: "/api-keys", label: "Keys", icon: KeyRound },
  { href: "/incidents", label: "Problems", icon: ShieldAlert },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg-surface)] px-2 py-2 md:hidden">
      <ul className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={`${item.href}?${searchParams.toString()}`}
                className={cn(
                  "focus-ring flex flex-col items-center gap-1 border-l-[3px] px-1 py-1.5 text-[11px] font-medium",
                  active
                    ? "border-l-[var(--brand-orange)] bg-[rgba(240,90,40,0.12)] text-[var(--brand-orange)]"
                    : "border-l-transparent text-[var(--text-secondary)]"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
