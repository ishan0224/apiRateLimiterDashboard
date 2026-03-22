"use client";

import { fetchOverview } from "@/lib/api/dashboard";
import { useDashboardQuery } from "./useDashboardQuery";

export function useOverview(from: string, to: string) {
  return useDashboardQuery(
    `overview:${from}:${to}`,
    (signal) => fetchOverview({ from, to }, signal)
  );
}
