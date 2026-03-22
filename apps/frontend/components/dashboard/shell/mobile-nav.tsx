"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white px-3 py-2 md:hidden">
      <ul className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-medium",
                  active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
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
