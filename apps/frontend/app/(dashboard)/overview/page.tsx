"use client";

import { KpiCard } from "@/components/dashboard/cards/kpi-card";
import { TrafficChart } from "@/components/dashboard/charts/traffic-chart";
import { TopBar } from "@/components/dashboard/shell/top-bar";
import { WidgetState } from "@/components/dashboard/states/widget-state";
import { Card } from "@/components/ui/card";
import { useDashboardFilters } from "@/hooks/dashboard/useDashboardFilters";
import { useOverviewSnapshot } from "@/hooks/dashboard/useOverview";
import { formatCompact, formatInteger } from "@/lib/formatters/number";
import { formatPercent } from "@/lib/formatters/percent";

function trendLabel(rate: number) {
  if (rate >= 0.5) {
    return { text: "Firing", color: "var(--status-crit)" };
  }

  if (rate >= 0.3) {
    return { text: "Rising", color: "var(--status-warn)" };
  }

  return { text: "Stable", color: "var(--status-ok)" };
}

export default function OverviewPage() {
  const { from, to, activeRange, applyRange } = useDashboardFilters();
  const { data, isLoading, error, refetch, isFetching } = useOverviewSnapshot(from, to);
  const overview = data?.overview;

  const requestsTrend = overview?.traffic.map((point) => point.allowed + point.blocked) ?? [];
  const blockedTrend = overview?.traffic.map((point) => point.blocked) ?? [];
  const allowRateTrend =
    overview?.traffic.map((point) => {
      const total = point.allowed + point.blocked;
      return total > 0 ? point.allowed / total : 0;
    }) ?? [];

  return (
    <div>
      <TopBar
        activeRange={activeRange}
        onApplyRange={applyRange}
        onRefresh={() => void refetch()}
        updatedAt={overview?.updatedAt}
        isRefreshing={isFetching}
      />

      <div className="space-y-5 px-4 py-5 md:px-6">
        {isLoading ? <WidgetState state="loading" message="Loading throughput telemetry..." /> : null}
        {error ? <WidgetState state="error" message={error.message} onRetry={() => void refetch()} /> : null}

        {!isLoading && !error && overview ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="TOTAL REQUESTS"
                value={formatCompact(overview.totals.requests)}
                subtitle={`${formatInteger(overview.totals.requests)} in selected range`}
                status="healthy"
                trend={requestsTrend}
              />
              <KpiCard
                label="BLOCKED REQUESTS"
                value={formatCompact(overview.totals.blocked)}
                subtitle={formatPercent(overview.totals.requests > 0 ? overview.totals.blocked / overview.totals.requests : 0)}
                status={overview.totals.blocked > 0 ? "observe" : "healthy"}
                trend={blockedTrend}
              />
              <KpiCard
                label="ALLOW RATE"
                value={formatPercent(overview.totals.allowRate)}
                subtitle="Allowed / Total"
                status="live"
                trend={allowRateTrend}
              />
              <KpiCard
                label="P95 DECISION LATENCY"
                value={overview.totals.p95LatencyMs === null ? "stream off" : `${overview.totals.p95LatencyMs}ms`}
                valueMode="text"
                subtitle={overview.totals.p95LatencyMs === null ? "Latency metric not wired yet" : "Middleware latency stream active"}
                status="observe"
                trend={blockedTrend}
              />
            </section>

            <section className="grid gap-5 xl:grid-cols-[2fr_1fr]">
              <Card>
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Traffic Trend</h2>
                    <p className="panel-subtitle">Allowed and blocked flow across the selected window</p>
                  </div>
                </div>
                <div className="p-3">
                  <TrafficChart data={overview.traffic} timeZone={activeRange.timeZone} />
                </div>
              </Card>

              <Card>
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Most Contended Keys</h2>
                    <p className="panel-subtitle">Keys generating highest blocked pressure</p>
                  </div>
                </div>

                {overview.topLimitedKeys.length === 0 ? (
                  <p className="p-4 text-[12px] text-[var(--text-muted)]">No throttling data for this range</p>
                ) : (
                  <div className="overflow-x-auto p-3">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)] text-left">
                          <th className="table-header-cell px-2 py-2">Key</th>
                          <th className="table-header-cell px-2 py-2">Blocked</th>
                          <th className="table-header-cell px-2 py-2">Block%</th>
                          <th className="table-header-cell px-2 py-2">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.topLimitedKeys.map((item) => {
                          const trend = trendLabel(item.blockedRate);

                          return (
                            <tr key={item.keyId} className="table-row">
                              <td className="px-2 py-2 font-mono text-[11px] text-[var(--mono-accent)]">{item.keyName}</td>
                              <td className="px-2 py-2 text-[12px] text-[var(--text-secondary)]">{formatInteger(item.blocked)}</td>
                              <td className="px-2 py-2">
                                <div className="relative overflow-hidden rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-panel-deep)] px-2 py-1">
                                  <div
                                    className="absolute inset-y-0 left-0 bg-[var(--status-crit)] opacity-25"
                                    style={{ width: `${Math.min(item.blockedRate * 100, 100)}%` }}
                                  />
                                  <span className="relative text-[12px] text-[var(--text-secondary)]">
                                    {formatPercent(item.blockedRate)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-2 py-2 text-[12px]" style={{ color: trend.color }}>
                                {trend.text}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
