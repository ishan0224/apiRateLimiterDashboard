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
    <aside className="sticky top-0 h-screen w-full border-r border-slate-200 bg-white px-4 py-6">
      <p className="mb-6 text-lg font-semibold text-slate-900">Rate Limiter</p>
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
