"use client";

import { TopBar } from "@/components/dashboard/shell/top-bar";
import { StatusChart } from "@/components/dashboard/charts/status-chart";
import { TrafficChart } from "@/components/dashboard/charts/traffic-chart";
import { WidgetState } from "@/components/dashboard/states/widget-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboardFilters } from "@/hooks/dashboard/useDashboardFilters";
import { useOverviewSnapshot } from "@/hooks/dashboard/useOverview";
import { useTraffic } from "@/hooks/dashboard/useTraffic";
import { formatInteger } from "@/lib/formatters/number";

export default function TrafficPage() {
  const {
    from,
    to,
    activeRange,
    applyRange,
    granularity,
    setGranularity,
  } = useDashboardFilters();
  const { data, isLoading, isFetching, error, refetch } = useTraffic(from, to, granularity);
  const snapshotQuery = useOverviewSnapshot(from, to);

  const maxEndpointCount = data?.topEndpoints.reduce((max, row) => Math.max(max, row.count), 0) ?? 0;

  return (
    <div>
      <TopBar
        activeRange={activeRange}
        onApplyRange={applyRange}
        onRefresh={() => void refetch()}
        updatedAt={snapshotQuery.data?.overview.updatedAt}
        isRefreshing={isFetching || snapshotQuery.isFetching}
      />

      <div className="space-y-5 px-4 py-5 md:px-6">
        <Card className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="label-upper">Granularity</span>
            <div className="flex items-center gap-1 rounded-[3px] border border-[var(--border)] bg-[var(--bg-panel)] p-1" role="group" aria-label="Granularity control">
              {(["15m", "1h", "1d"] as const).map((option) => (
                <Button
                  key={option}
                  variant={option === granularity ? "primary" : "ghost"}
                  className="min-w-10 rounded-[2px] px-2"
                  onClick={() => setGranularity(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {isLoading ? <WidgetState state="loading" message="Loading traffic analytics..." /> : null}
        {error ? <WidgetState state="error" message={error.message} onRetry={() => void refetch()} /> : null}

        {!isLoading && !error && data ? (
          <section className="space-y-5">
            <Card>
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Throughput Timeline</h2>
                  <p className="panel-subtitle">Allowed and blocked request flow over time</p>
                </div>
              </div>
              <div className="p-3">
                <TrafficChart data={data.series} timeZone={activeRange.timeZone} />
              </div>
            </Card>

            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <Card>
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Status Distribution</h2>
                    <p className="panel-subtitle">Request outcomes grouped by status code</p>
                  </div>
                </div>

                <div className="p-3">
                  {data.statusDistribution.length === 0 ? (
                    <p className="text-[12px] text-[var(--text-muted)]">No requests in selected range</p>
                  ) : (
                    <StatusChart data={data.statusDistribution} />
                  )}
                </div>
              </Card>

              <Card>
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Top Endpoints</h2>
                    <p className="panel-subtitle">Routes driving the highest load</p>
                  </div>
                </div>

                <div className="space-y-2 p-3">
                  {data.topEndpoints.length === 0 ? (
                    <p className="text-[12px] text-[var(--text-muted)]">No endpoint activity in selected range</p>
                  ) : (
                    data.topEndpoints.map((row, index) => {
                      const width = maxEndpointCount > 0 ? (row.count / maxEndpointCount) * 100 : 0;

                      return (
                        <div key={row.path} className="rounded-[3px] border border-[var(--border-subtle)] bg-[var(--bg-panel-deep)] px-2.5 py-2">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="font-mono text-[11px] text-[var(--mono-accent)]">
                              {index + 1}. {row.path}
                            </p>
                            <p className="relative text-[12px] text-[var(--text-secondary)]">
                              <span className="absolute inset-0 -z-10 rounded-[2px] bg-[rgba(26,108,240,0.2)]" style={{ width: `${width}%` }} />
                              {formatInteger(row.count)} req
                            </p>
                          </div>
                          <p className="text-[11px] text-[var(--panel-subtitle)]">Blocked {formatInteger(row.blocked)}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
