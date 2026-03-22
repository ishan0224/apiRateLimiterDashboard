import type {
  ApiKeyDetailResponse,
  ApiKeysResponse,
  DashboardSnapshotResponse,
  IncidentsResponse,
  OverviewResponse,
  PipelineHealthResponse,
  TrafficResponse,
} from "@/types/dashboard";
import { apiGet } from "./client";

type RangeParams = {
  from: string;
  to: string;
};

function withParams(path: string, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") {
      continue;
    }

    search.set(key, String(value));
  }

  return `${path}?${search.toString()}`;
}

export function fetchOverview(params: RangeParams, signal?: AbortSignal) {
  return apiGet<OverviewResponse>(withParams("/api/dashboard/overview", params), signal);
}

export function fetchApiKeys(
  params: RangeParams & { page: number; pageSize: number; search?: string },
  signal?: AbortSignal
) {
  return apiGet<ApiKeysResponse>(withParams("/api/dashboard/keys", params), signal);
}

export function fetchApiKeyDetail(keyId: string, params: RangeParams, signal?: AbortSignal) {
  return apiGet<ApiKeyDetailResponse>(withParams(`/api/dashboard/keys/${keyId}`, params), signal);
}

export function fetchTraffic(
  params: RangeParams & { granularity: "15m" | "1h" | "1d" },
  signal?: AbortSignal
) {
  return apiGet<TrafficResponse>(withParams("/api/dashboard/traffic", params), signal);
}

export function fetchIncidents(params: RangeParams, signal?: AbortSignal) {
  return apiGet<IncidentsResponse>(withParams("/api/dashboard/incidents", params), signal);
}

export function fetchPipelineHealth(signal?: AbortSignal) {
  return apiGet<PipelineHealthResponse>("/api/dashboard/pipeline-health", signal);
}

export function fetchSnapshot(params: RangeParams, signal?: AbortSignal) {
  return apiGet<DashboardSnapshotResponse>(withParams("/api/dashboard/snapshot", params), signal);
}
