"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchApiKeyDetail, fetchApiKeys } from "@/lib/api/dashboard";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants/dashboard";
import { dashboardQueryConfig, queryKeyKeys } from "@/lib/query/dashboard-query";

export function useApiKeys(from: string, to: string, page = 1, pageSize = DEFAULT_PAGE_SIZE, search = "") {
  return useQuery({
    queryKey: queryKeyKeys(from, to, page, pageSize, search),
    queryFn: () => fetchApiKeys({ from, to, page, pageSize, search }),
    staleTime: dashboardQueryConfig.staleTime,
    gcTime: dashboardQueryConfig.gcTime,
    refetchInterval: dashboardQueryConfig.refetchInterval,
    placeholderData: keepPreviousData,
  });
}

export function useApiKeyDetail(keyId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ["key-detail", keyId, from, to],
    queryFn: () => {
      if (!keyId) {
        return null;
      }

      return fetchApiKeyDetail(keyId, { from, to });
    },
    enabled: Boolean(keyId),
    staleTime: dashboardQueryConfig.staleTime,
    gcTime: dashboardQueryConfig.gcTime,
    placeholderData: keepPreviousData,
  });
}
