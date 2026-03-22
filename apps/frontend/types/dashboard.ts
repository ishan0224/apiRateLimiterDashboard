export type TimePoint = {
  ts: string;
  allowed: number;
  blocked: number;
};

export type OverviewResponse = {
  totals: {
    requests: number;
    blocked: number;
    allowRate: number;
    p95LatencyMs: number | null;
  };
  traffic: TimePoint[];
  topLimitedKeys: Array<{
    keyId: string;
    keyName: string;
    blocked: number;
    total: number;
    blockedRate: number;
  }>;
  updatedAt: string;
};

export type ApiKeyRow = {
  keyId: string;
  keyName: string;
  configuredRateLimit: number;
  requestsPerMin: number;
  blockedRate: number;
  lastSeenAt: string | null;
};

export type ApiKeysResponse = {
  items: ApiKeyRow[];
  page: number;
  pageSize: number;
  total: number;
};

export type ApiKeyDetailResponse = {
  keyId: string;
  keyName: string;
  configuredRateLimit: number;
  summary: {
    totalRequests: number;
    blockedRequests: number;
    blockedRate: number;
  };
  traffic: TimePoint[];
  endpoints: Array<{
    path: string;
    total: number;
    blocked: number;
    blockedRate: number;
  }>;
};

export type TrafficResponse = {
  series: TimePoint[];
  statusDistribution: Array<{
    status: number;
    count: number;
  }>;
  topEndpoints: Array<{
    path: string;
    count: number;
    blocked: number;
  }>;
};

export type IncidentSeverity = "low" | "medium" | "high";

export type Incident = {
  id: string;
  ts: string;
  severity: IncidentSeverity;
  title: string;
  description: string;
  blockedRate: number;
  totalRequests: number;
};

export type IncidentsResponse = {
  incidents: Incident[];
};

export type PipelineHealthResponse = {
  lambdaFailureRate: number;
  queueLagSeconds: number;
  lastIngestAt: string | null;
};
