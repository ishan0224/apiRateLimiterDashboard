"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchSnapshot } from "@/lib/api/dashboard";
import { dashboardQueryConfig, queryKeySnapshot } from "@/lib/query/dashboard-query";

export function useOverviewSnapshot(from: string, to: string) {
  return useQuery({
    queryKey: queryKeySnapshot(from, to),
    queryFn: () => fetchSnapshot({ from, to }),
    staleTime: dashboardQueryConfig.staleTime,
    gcTime: dashboardQueryConfig.gcTime,
    refetchInterval: dashboardQueryConfig.refetchInterval,
    placeholderData: keepPreviousData,
  });
}
