"use client";

import { fetchIncidents, fetchPipelineHealth } from "@/lib/api/dashboard";
import { useDashboardQuery } from "./useDashboardQuery";

export function useIncidents(from: string, to: string) {
  return useDashboardQuery(
    `incidents:${from}:${to}`,
    (signal) => fetchIncidents({ from, to }, signal)
  );
}

export function usePipelineHealth() {
  return useDashboardQuery("pipeline-health", (signal) => fetchPipelineHealth(signal));
}
