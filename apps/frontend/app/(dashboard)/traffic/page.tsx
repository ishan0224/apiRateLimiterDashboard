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
  const { range, setRange, from, to, granularity, setGranularity } = useDashboardFilters();
  const { data, isLoading, isFetching, error, refetch } = useTraffic(from, to, granularity);
  const snapshotQuery = useOverviewSnapshot(from, to);

  return (
    <div>
      <TopBar
        range={range}
        onRangeChange={setRange}
        onRefresh={() => void refetch()}
        updatedAt={snapshotQuery.data?.overview.updatedAt}
        isRefreshing={isFetching || snapshotQuery.isFetching}
      />
      <div className="space-y-6 px-4 py-6 md:px-6">
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Granularity</span>
            {(["15m", "1h", "1d"] as const).map((option) => (
              <Button
                key={option}
                variant={option === granularity ? "primary" : "secondary"}
                onClick={() => setGranularity(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </Card>

        {isLoading ? <WidgetState state="loading" message="Loading traffic analytics..." /> : null}
        {error ? <WidgetState state="error" message={error.message} onRetry={() => void refetch()} /> : null}

        {!isLoading && !error && data ? (
          <section className="space-y-6">
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Throughput Timeline</h2>
              <p className="mb-4 text-sm text-[var(--text-secondary)]">Allowed and blocked request flow over time.</p>
              <TrafficChart data={data.series} />
            </Card>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <Card className="p-5">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Status Distribution</h2>
                <p className="mb-4 text-sm text-[var(--text-secondary)]">Request outcomes grouped by HTTP status code.</p>
                {data.statusDistribution.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No requests in selected range.</p>
                ) : (
                  <StatusChart data={data.statusDistribution} />
                )}
              </Card>

              <Card className="p-5">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Top Endpoints</h2>
                <p className="mb-4 text-sm text-[var(--text-secondary)]">Routes driving the highest load.</p>
                <ul className="space-y-3">
                  {data.topEndpoints.map((row) => (
                    <li key={row.path} className="rounded-lg border border-[var(--border)] bg-[var(--panel-soft)] p-3">
                      <p className="font-mono text-xs text-[var(--text-secondary)]">{row.path}</p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {formatInteger(row.count)} requests, {formatInteger(row.blocked)} blocked
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
