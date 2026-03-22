"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchIncidents, fetchPipelineHealth } from "@/lib/api/dashboard";
import {
  dashboardQueryConfig,
  queryKeyIncidents,
  queryKeyPipeline,
} from "@/lib/query/dashboard-query";

export function useIncidents(from: string, to: string) {
  return useQuery({
    queryKey: queryKeyIncidents(from, to),
    queryFn: () => fetchIncidents({ from, to }),
    staleTime: dashboardQueryConfig.staleTime,
    gcTime: dashboardQueryConfig.gcTime,
    refetchInterval: dashboardQueryConfig.refetchInterval,
    placeholderData: keepPreviousData,
  });
}

export function usePipelineHealth() {
  return useQuery({
    queryKey: queryKeyPipeline(),
    queryFn: () => fetchPipelineHealth(),
    staleTime: dashboardQueryConfig.staleTime,
    gcTime: dashboardQueryConfig.gcTime,
    refetchInterval: dashboardQueryConfig.refetchInterval,
    placeholderData: keepPreviousData,
  });
}
