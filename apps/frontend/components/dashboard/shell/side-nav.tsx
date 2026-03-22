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

const items = [
  { href: "/overview", label: "Overview", icon: Gauge },
  { href: "/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/traffic", label: "Traffic", icon: Activity },
  { href: "/incidents", label: "Incidents", icon: ShieldAlert },
] as const;

export function SideNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { from, to, granularity } = useDashboardFilters();

  const prefetchByRoute = async (href: (typeof items)[number]["href"]) => {
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
    <aside className="sticky top-0 h-screen w-full border-r border-[var(--border)] bg-[color:color-mix(in_oklab,var(--bg-elevated)_88%,transparent)] px-4 py-6 backdrop-blur-sm">
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Observability</p>
      <p className="mb-6 text-lg font-bold text-[var(--text-primary)]">Limiter Console</p>
      <nav className="space-y-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={`${item.href}?${searchParams.toString()}`}
              onMouseEnter={() => {
                void prefetchByRoute(item.href);
              }}
              onFocus={() => {
                void prefetchByRoute(item.href);
              }}
              className={cn(
                "group flex items-center gap-3 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                active
                  ? "border-[var(--status-info-fg)] bg-[var(--status-info-bg)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[var(--panel-soft)] hover:text-[var(--text-primary)]"
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
