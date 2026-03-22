import type { QueryKey } from "@tanstack/react-query";

import {
  fetchApiKeys,
  fetchIncidents,
  fetchPipelineHealth,
  fetchSnapshot,
  fetchTraffic,
} from "@/lib/api/dashboard";
import { DEFAULT_PAGE_SIZE, POLL_INTERVAL_MS } from "@/lib/constants/dashboard";

export const dashboardQueryConfig = {
  staleTime: POLL_INTERVAL_MS,
  gcTime: 5 * 60 * 1000,
  refetchInterval: POLL_INTERVAL_MS,
};

export function queryKeySnapshot(from: string, to: string): QueryKey {
  return ["snapshot", from, to];
}

export function queryKeyTraffic(from: string, to: string, granularity: "15m" | "1h" | "1d"): QueryKey {
  return ["traffic", from, to, granularity];
}

export function queryKeyKeys(from: string, to: string, page = 1, pageSize = DEFAULT_PAGE_SIZE, search = ""): QueryKey {
  return ["keys", from, to, page, pageSize, search];
}

export function queryKeyIncidents(from: string, to: string): QueryKey {
  return ["incidents", from, to];
}

export function queryKeyPipeline(): QueryKey {
  return ["pipeline-health"];
}

export async function prefetchOverviewBundle(
  from: string,
  to: string,
  granularity: "15m" | "1h" | "1d"
) {
  return Promise.all([
    fetchSnapshot({ from, to }),
    fetchTraffic({ from, to, granularity }),
    fetchIncidents({ from, to }),
    fetchPipelineHealth(),
  ]);
}

export async function prefetchApiKeysBundle(from: string, to: string) {
  return Promise.all([
    fetchApiKeys({ from, to, page: 1, pageSize: DEFAULT_PAGE_SIZE }),
    fetchSnapshot({ from, to }),
  ]);
}

export async function prefetchTrafficBundle(from: string, to: string, granularity: "15m" | "1h" | "1d") {
  return Promise.all([
    fetchTraffic({ from, to, granularity }),
    fetchSnapshot({ from, to }),
  ]);
}

export async function prefetchIncidentsBundle(from: string, to: string) {
  return Promise.all([fetchIncidents({ from, to }), fetchPipelineHealth(), fetchSnapshot({ from, to })]);
}
