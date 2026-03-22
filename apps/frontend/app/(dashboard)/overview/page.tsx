"use client";

import { Ban, CheckCircle2, Clock3, Waves } from "lucide-react";

import { KpiCard } from "@/components/dashboard/cards/kpi-card";
import { TrafficChart } from "@/components/dashboard/charts/traffic-chart";
import { TopBar } from "@/components/dashboard/shell/top-bar";
import { WidgetState } from "@/components/dashboard/states/widget-state";
import { Card } from "@/components/ui/card";
import { useDashboardFilters } from "@/hooks/dashboard/useDashboardFilters";
import { useOverviewSnapshot } from "@/hooks/dashboard/useOverview";
import { formatCompact, formatInteger } from "@/lib/formatters/number";
import { formatPercent } from "@/lib/formatters/percent";

export default function OverviewPage() {
  const { range, setRange, from, to } = useDashboardFilters();
  const { data, isLoading, error, refetch, isFetching } = useOverviewSnapshot(from, to);
  const overview = data?.overview;

  return (
    <div>
      <TopBar
        range={range}
        onRangeChange={setRange}
        onRefresh={() => void refetch()}
        updatedAt={overview?.updatedAt}
        isRefreshing={isFetching}
      />

      <div className="space-y-6 px-4 py-6 md:px-6">
        {isLoading ? <WidgetState state="loading" message="Loading throughput telemetry..." /> : null}
        {error ? <WidgetState state="error" message={error.message} onRetry={() => void refetch()} /> : null}
        {!isLoading && !error && overview ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Total Requests"
                value={formatCompact(overview.totals.requests)}
                subtitle={`${formatInteger(overview.totals.requests)} in selected range`}
                icon={<Waves className="h-5 w-5" aria-hidden="true" />}
              />
              <KpiCard
                label="Blocked Requests"
                value={formatCompact(overview.totals.blocked)}
                subtitle={formatPercent(overview.totals.requests > 0 ? overview.totals.blocked / overview.totals.requests : 0)}
                icon={<Ban className="h-5 w-5 text-[var(--status-danger-fg)]" aria-hidden="true" />}
              />
              <KpiCard
                label="Allow Rate"
                value={formatPercent(overview.totals.allowRate)}
                subtitle="Allowed / Total"
                icon={<CheckCircle2 className="h-5 w-5 text-[var(--status-success-fg)]" aria-hidden="true" />}
              />
              <KpiCard
                label="P95 Decision Latency"
                value={overview.totals.p95LatencyMs === null ? "N/A" : `${overview.totals.p95LatencyMs}ms`}
                subtitle={
                  overview.totals.p95LatencyMs === null
                    ? "Latency metric not wired yet"
                    : "Middleware latency stream active"
                }
                icon={<Clock3 className="h-5 w-5 text-[var(--status-warning-fg)]" aria-hidden="true" />}
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
              <Card className="p-5">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Traffic Trend</h2>
                <p className="mb-4 text-sm text-[var(--text-secondary)]">
                  Allowed and blocked flow across the selected window.
                </p>
                <TrafficChart data={overview.traffic} />
              </Card>

              <Card className="p-5">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Most Contended Keys</h2>
                <p className="mb-4 text-sm text-[var(--text-secondary)]">
                  Keys generating the highest blocked pressure.
                </p>
                {overview.topLimitedKeys.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No throttling data for this range.</p>
                ) : (
                  <ul className="space-y-3">
                    {overview.topLimitedKeys.map((item) => (
                      <li key={item.keyId} className="rounded-lg border border-[var(--border)] bg-[var(--panel-soft)] p-3">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{item.keyName}</p>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          {item.blocked} blocked / {item.total} total ({formatPercent(item.blockedRate)})
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
