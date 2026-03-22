"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Gauge, KeyRound, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/overview", label: "Overview", icon: Gauge },
  { href: "/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/traffic", label: "Traffic", icon: Activity },
  { href: "/incidents", label: "Incidents", icon: ShieldAlert },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-full border-r border-slate-200 bg-white px-4 py-6">
      <p className="mb-6 text-lg font-semibold text-slate-900">Rate Limiter</p>
      <nav className="space-y-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
