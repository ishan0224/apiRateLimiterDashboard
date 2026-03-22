"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchTraffic } from "@/lib/api/dashboard";
import { dashboardQueryConfig, queryKeyTraffic } from "@/lib/query/dashboard-query";

export function useTraffic(from: string, to: string, granularity: "15m" | "1h" | "1d") {
  return useQuery({
    queryKey: queryKeyTraffic(from, to, granularity),
    queryFn: () => fetchTraffic({ from, to, granularity }),
    staleTime: dashboardQueryConfig.staleTime,
    gcTime: dashboardQueryConfig.gcTime,
    refetchInterval: dashboardQueryConfig.refetchInterval,
    placeholderData: keepPreviousData,
  });
}
