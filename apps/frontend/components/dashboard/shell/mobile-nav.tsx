"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Activity, Gauge, KeyRound, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/overview", label: "Overview", icon: Gauge },
  { href: "/api-keys", label: "Keys", icon: KeyRound },
  { href: "/traffic", label: "Traffic", icon: Activity },
  { href: "/incidents", label: "Incidents", icon: ShieldAlert },
];

export function MobileNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color:color-mix(in_oklab,var(--bg-elevated)_88%,transparent)] px-3 py-2 backdrop-blur-md md:hidden">
      <ul className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={`${item.href}?${searchParams.toString()}`}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[11px] font-semibold",
                  active
                    ? "border-[var(--status-info-fg)] bg-[var(--status-info-bg)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[var(--panel-soft)]"
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
