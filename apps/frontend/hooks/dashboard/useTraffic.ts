"use client";

import { fetchTraffic } from "@/lib/api/dashboard";
import { useDashboardQuery } from "./useDashboardQuery";

export function useTraffic(from: string, to: string, granularity: "15m" | "1h" | "1d") {
  return useDashboardQuery(
    `traffic:${from}:${to}:${granularity}`,
    (signal) => fetchTraffic({ from, to, granularity }, signal)
  );
}
