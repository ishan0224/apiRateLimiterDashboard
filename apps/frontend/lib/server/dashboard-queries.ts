import { getPool } from "./db";
import { fetchQueueLagSeconds } from "./sqs-metrics";
import type {
  ApiKeyDetailResponse,
  ApiKeysResponse,
  Incident,
  IncidentsResponse,
  OverviewResponse,
  PipelineHealthResponse,
  TrafficResponse,
} from "@/types/dashboard";

function getOverviewStepMinutes(from: Date, to: Date): number {
  const diffMs = to.getTime() - from.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours <= 2) {
    return 5;
  }

  if (diffHours <= 48) {
    return 60;
  }

  return 24 * 60;
}

export async function fetchOverview(from: Date, to: Date): Promise<OverviewResponse> {
  const stepMinutes = getOverviewStepMinutes(from, to);

  const trafficRes = await getPool().query<{
    ts: string;
    allowed: string;
    blocked: string;
  }>(
    `
      WITH buckets AS (
        SELECT generate_series(
          $1::timestamptz,
          $2::timestamptz,
          make_interval(mins => $3::int)
        ) AS ts
      )
      SELECT
        b.ts::text AS ts,
        COUNT(u.id) FILTER (WHERE u.status <> 429)::text AS allowed,
        COUNT(u.id) FILTER (WHERE u.status = 429)::text AS blocked
      FROM buckets b
      LEFT JOIN "UsageLog" u
        ON u.timestamp >= b.ts
        AND u.timestamp < b.ts + make_interval(mins => $3::int)
      GROUP BY b.ts
      ORDER BY b.ts ASC
    `,
    [from, to, stepMinutes]
  );

  const topKeysRes = await getPool().query<{
    key_id: string;
    key_name: string | null;
    blocked: string;
    total: string;
  }>(
    `
      SELECT
        u."apiKeyId" AS key_id,
        a.name AS key_name,
        COUNT(*) FILTER (WHERE u.status = 429)::text AS blocked,
        COUNT(*)::text AS total
      FROM "UsageLog" u
      LEFT JOIN "ApiKey" a ON a.id = u."apiKeyId"
      WHERE u.timestamp >= $1 AND u.timestamp <= $2
      GROUP BY u."apiKeyId", a.name
      ORDER BY COUNT(*) FILTER (WHERE u.status = 429) DESC, COUNT(*) DESC
      LIMIT 5
    `,
    [from, to]
  );

  const traffic = trafficRes.rows.map((row) => ({
    ts: new Date(row.ts).toISOString(),
    allowed: Number(row.allowed),
    blocked: Number(row.blocked),
  }));
  const totalAllowed = traffic.reduce((sum, point) => sum + point.allowed, 0);
  const totalBlocked = traffic.reduce((sum, point) => sum + point.blocked, 0);
  const totalRequests = totalAllowed + totalBlocked;

  return {
    totals: {
      requests: totalRequests,
      blocked: totalBlocked,
      allowRate: totalRequests > 0 ? totalAllowed / totalRequests : 0,
      p95LatencyMs: null,
    },
    traffic,
    topLimitedKeys: topKeysRes.rows.map((row) => {
      const rowTotal = Number(row.total);
      const rowBlocked = Number(row.blocked);

      return {
        keyId: row.key_id,
        keyName: row.key_name ?? `API Key ${row.key_id.slice(0, 8)}`,
        blocked: rowBlocked,
        total: rowTotal,
        blockedRate: rowTotal > 0 ? rowBlocked / rowTotal : 0,
      };
    }),
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchApiKeys(
  from: Date,
  to: Date,
  page: number,
  pageSize: number,
  search?: string
): Promise<ApiKeysResponse> {
  const offset = (page - 1) * pageSize;

  const searchSql = search ? `AND a.name ILIKE $5` : "";

  const rowsRes = await getPool().query<{
    key_id: string;
    key_name: string;
    configured_rate_limit: number;
    total_requests: string;
    blocked_requests: string;
    last_seen_at: string | null;
  }>(
    `
      SELECT
        a.id AS key_id,
        a.name AS key_name,
        a."rateLimit" AS configured_rate_limit,
        COUNT(u.id)::text AS total_requests,
        COUNT(u.id) FILTER (WHERE u.status = 429)::text AS blocked_requests,
        MAX(u.timestamp)::text AS last_seen_at
      FROM "ApiKey" a
      LEFT JOIN "UsageLog" u
        ON u."apiKeyId" = a.id
        AND u.timestamp >= $1
        AND u.timestamp <= $2
      WHERE 1 = 1
      ${searchSql}
      GROUP BY a.id, a.name, a."rateLimit"
      ORDER BY MAX(u.timestamp) DESC NULLS LAST, a.name ASC
      LIMIT $3 OFFSET $4
    `,
    search ? [from, to, pageSize, offset, `%${search}%`] : [from, to, pageSize, offset]
  );

  const countRes = await getPool().query<{ total: string }>(
    `
      SELECT COUNT(*)::text AS total
      FROM "ApiKey" a
      WHERE 1 = 1
      ${search ? "AND a.name ILIKE $1" : ""}
    `,
    search ? [`%${search}%`] : []
  );

  return {
    items: rowsRes.rows.map((row) => {
      const totalRequests = Number(row.total_requests);
      const blockedRequests = Number(row.blocked_requests);

      return {
        keyId: row.key_id,
        keyName: row.key_name,
        configuredRateLimit: row.configured_rate_limit,
        requestsPerMin: totalRequests,
        blockedRate: totalRequests > 0 ? blockedRequests / totalRequests : 0,
        lastSeenAt: row.last_seen_at,
      };
    }),
    page,
    pageSize,
    total: Number(countRes.rows[0]?.total ?? 0),
  };
}

export async function fetchApiKeyDetail(
  keyId: string,
  from: Date,
  to: Date
): Promise<ApiKeyDetailResponse | null> {
  const stepMinutes = getOverviewStepMinutes(from, to);

  const keyRes = await getPool().query<{ id: string; name: string; rate_limit: number }>(
    `
      SELECT id, name, "rateLimit" AS rate_limit
      FROM "ApiKey"
      WHERE id = $1
      LIMIT 1
    `,
    [keyId]
  );

  const key = keyRes.rows[0];

  if (!key) {
    return null;
  }

  const summaryRes = await getPool().query<{ total: string; blocked: string }>(
    `
      SELECT
        COUNT(*)::text AS total,
        COUNT(*) FILTER (WHERE status = 429)::text AS blocked
      FROM "UsageLog"
      WHERE "apiKeyId" = $1 AND timestamp >= $2 AND timestamp <= $3
    `,
    [keyId, from, to]
  );

  const trafficRes = await getPool().query<{ ts: string; allowed: string; blocked: string }>(
    `
      WITH buckets AS (
        SELECT generate_series(
          $2::timestamptz,
          $3::timestamptz,
          make_interval(mins => $4::int)
        ) AS ts
      )
      SELECT
        b.ts::text AS ts,
        COUNT(u.id) FILTER (WHERE u.status <> 429)::text AS allowed,
        COUNT(u.id) FILTER (WHERE u.status = 429)::text AS blocked
      FROM buckets b
      LEFT JOIN "UsageLog" u
        ON u.timestamp >= b.ts
        AND u.timestamp < b.ts + make_interval(mins => $4::int)
        AND u."apiKeyId" = $1
      GROUP BY b.ts
      ORDER BY b.ts ASC
    `,
    [keyId, from, to, stepMinutes]
  );

  const endpointsRes = await getPool().query<{ path: string; total: string; blocked: string }>(
    `
      SELECT
        path,
        COUNT(*)::text AS total,
        COUNT(*) FILTER (WHERE status = 429)::text AS blocked
      FROM "UsageLog"
      WHERE "apiKeyId" = $1 AND timestamp >= $2 AND timestamp <= $3
      GROUP BY path
      ORDER BY COUNT(*) DESC
      LIMIT 20
    `,
    [keyId, from, to]
  );

  const total = Number(summaryRes.rows[0]?.total ?? 0);
  const blocked = Number(summaryRes.rows[0]?.blocked ?? 0);

  return {
    keyId: key.id,
    keyName: key.name,
    configuredRateLimit: key.rate_limit,
    summary: {
      totalRequests: total,
      blockedRequests: blocked,
      blockedRate: total > 0 ? blocked / total : 0,
    },
    traffic: trafficRes.rows.map((row) => ({
      ts: new Date(row.ts).toISOString(),
      allowed: Number(row.allowed),
      blocked: Number(row.blocked),
    })),
    endpoints: endpointsRes.rows.map((row) => {
      const endpointTotal = Number(row.total);
      const endpointBlocked = Number(row.blocked);

      return {
        path: row.path,
        total: endpointTotal,
        blocked: endpointBlocked,
        blockedRate: endpointTotal > 0 ? endpointBlocked / endpointTotal : 0,
      };
    }),
  };
}

export async function fetchTraffic(
  from: Date,
  to: Date,
  granularity: "15m" | "1h" | "1d"
): Promise<TrafficResponse> {
  const stepMinutes = granularity === "15m" ? 15 : granularity === "1d" ? 24 * 60 : 60;

  const trafficRes = await getPool().query<{ ts: string; allowed: string; blocked: string }>(
    `
      WITH buckets AS (
        SELECT generate_series(
          $1::timestamptz,
          $2::timestamptz,
          make_interval(mins => $3::int)
        ) AS ts
      )
      SELECT
        b.ts::text AS ts,
        COUNT(u.id) FILTER (WHERE u.status <> 429)::text AS allowed,
        COUNT(u.id) FILTER (WHERE u.status = 429)::text AS blocked
      FROM buckets b
      LEFT JOIN "UsageLog" u
        ON u.timestamp >= b.ts
        AND u.timestamp < b.ts + make_interval(mins => $3::int)
      GROUP BY b.ts
      ORDER BY b.ts ASC
    `,
    [from, to, stepMinutes]
  );

  const statusRes = await getPool().query<{ status: number; count: string }>(
    `
      SELECT status, COUNT(*)::text AS count
      FROM "UsageLog"
      WHERE timestamp >= $1 AND timestamp <= $2
      GROUP BY status
      ORDER BY count DESC
    `,
    [from, to]
  );

  const endpointRes = await getPool().query<{ path: string; count: string; blocked: string }>(
    `
      SELECT
        path,
        COUNT(*)::text AS count,
        COUNT(*) FILTER (WHERE status = 429)::text AS blocked
      FROM "UsageLog"
      WHERE timestamp >= $1 AND timestamp <= $2
      GROUP BY path
      ORDER BY COUNT(*) DESC
      LIMIT 15
    `,
    [from, to]
  );

  return {
    series: trafficRes.rows.map((row) => ({
      ts: new Date(row.ts).toISOString(),
      allowed: Number(row.allowed),
      blocked: Number(row.blocked),
    })),
    statusDistribution: statusRes.rows.map((row) => ({
      status: Number(row.status),
      count: Number(row.count),
    })),
    topEndpoints: endpointRes.rows.map((row) => ({
      path: row.path,
      count: Number(row.count),
      blocked: Number(row.blocked),
    })),
  };
}

export async function fetchIncidents(from: Date, to: Date): Promise<IncidentsResponse> {
  const rowsRes = await getPool().query<{
    ts: string;
    total: string;
    blocked: string;
  }>(
    `
      SELECT
        DATE_TRUNC('hour', timestamp) AS ts,
        COUNT(*)::text AS total,
        COUNT(*) FILTER (WHERE status = 429)::text AS blocked
      FROM "UsageLog"
      WHERE timestamp >= $1 AND timestamp <= $2
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 48
    `,
    [from, to]
  );

  const incidents: Incident[] = rowsRes.rows
    .map((row) => {
      const total = Number(row.total);
      const blocked = Number(row.blocked);
      const blockedRate = total > 0 ? blocked / total : 0;

      if (total < 20 || blockedRate < 0.2) {
        return null;
      }

      const severity = blockedRate >= 0.5 ? "high" : blockedRate >= 0.35 ? "medium" : "low";

      return {
        id: `${row.ts}-${severity}`,
        ts: row.ts,
        severity,
        title: "Throttling spike detected",
        description: `Blocked ratio reached ${(blockedRate * 100).toFixed(1)}% for this hour window.`,
        blockedRate,
        totalRequests: total,
      } as Incident;
    })
    .filter((incident): incident is Incident => Boolean(incident));

  return { incidents };
}

export async function fetchPipelineHealth(): Promise<PipelineHealthResponse> {
  const [latestIngestRes, sqsLagSeconds] = await Promise.all([
    getPool().query<{ ts: string | null }>(
      `
        SELECT MAX(timestamp)::text AS ts
        FROM "UsageLog"
      `
    ),
    fetchQueueLagSeconds(),
  ]);

  const lastIngest = latestIngestRes.rows[0]?.ts ? new Date(latestIngestRes.rows[0].ts) : null;

  return {
    lambdaFailureRate: 0,
    queueLagSeconds: sqsLagSeconds ?? 0,
    lastIngestAt: lastIngest?.toISOString() ?? null,
  };
}
