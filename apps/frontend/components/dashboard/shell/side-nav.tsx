"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, Gauge, KeyRound, ShieldAlert } from "lucide-react";

import {
  fetchApiKeys,
  fetchIncidents,
  fetchPipelineHealth,
  fetchSnapshot,
  fetchTraffic,
} from "@/lib/api/dashboard";
import { useDashboardFilters } from "@/hooks/dashboard/useDashboardFilters";
import {
  queryKeyIncidents,
  queryKeyKeys,
  queryKeyPipeline,
  queryKeySnapshot,
  queryKeyTraffic,
} from "@/lib/query/dashboard-query";
import { cn } from "@/lib/utils/cn";

const sections = [
  {
    title: "OBSERVE",
    items: [
      { href: "/overview", label: "Overview", icon: Gauge },
      { href: "/traffic", label: "Traffic", icon: Activity },
      { href: "/api-keys", label: "API Keys", icon: KeyRound },
    ],
  },
  {
    title: "PROBLEMS",
    items: [{ href: "/incidents", label: "Incidents", icon: ShieldAlert }],
  },
] as const;

export function SideNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { from, to, granularity } = useDashboardFilters();

  const prefetchByRoute = async (href: string) => {
    if (href === "/overview") {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: queryKeySnapshot(from, to),
          queryFn: () => fetchSnapshot({ from, to }),
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeyTraffic(from, to, granularity),
          queryFn: () => fetchTraffic({ from, to, granularity }),
        }),
      ]);
      return;
    }

    if (href === "/api-keys") {
      await queryClient.prefetchQuery({
        queryKey: queryKeyKeys(from, to),
        queryFn: () => fetchApiKeys({ from, to, page: 1, pageSize: 20 }),
      });
      return;
    }

    if (href === "/traffic") {
      await queryClient.prefetchQuery({
        queryKey: queryKeyTraffic(from, to, granularity),
        queryFn: () => fetchTraffic({ from, to, granularity }),
      });
      return;
    }

    if (href === "/incidents") {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: queryKeyIncidents(from, to),
          queryFn: () => fetchIncidents({ from, to }),
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeyPipeline(),
          queryFn: () => fetchPipelineHealth(),
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeySnapshot(from, to),
          queryFn: () => fetchSnapshot({ from, to }),
        }),
      ]);
    }
  };

  return (
    <aside className="sticky top-0 h-screen border-r border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="flex h-full flex-col px-3 py-4">
        <div className="mb-6 flex items-center gap-2 px-1">
          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] bg-[var(--brand-orange)] text-[12px] font-semibold text-white">
            G
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Control Plane</p>
            <p className="text-[12px] font-semibold text-[var(--text-primary)]">Rate Limiter</p>
          </div>
        </div>

        <nav className="space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-2 text-[11px] uppercase tracking-[0.1em] text-[var(--panel-subtitle)]">{section.title}</p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const active = pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={`${item.href}?${searchParams.toString()}`}
                        onMouseEnter={() => {
                          void prefetchByRoute(item.href);
                        }}
                        onFocus={() => {
                          void prefetchByRoute(item.href);
                        }}
                        className={cn(
                          "focus-ring flex items-center gap-2.5 border-l-[3px] px-2.5 py-2 text-[12px] font-medium",
                          active
                            ? "border-l-[var(--brand-orange)] bg-[rgba(240,90,40,0.12)] text-[var(--brand-orange)]"
                            : "border-l-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-panel-deep)] hover:text-[var(--text-primary)]"
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
