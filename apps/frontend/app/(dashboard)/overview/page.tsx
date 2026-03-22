"use client";

import { Ban, CheckCircle2, Clock3, Waves } from "lucide-react";

import { KpiCard } from "@/components/dashboard/cards/kpi-card";
import { TopBar } from "@/components/dashboard/shell/top-bar";
import { WidgetState } from "@/components/dashboard/states/widget-state";
import { TrafficChart } from "@/components/dashboard/charts/traffic-chart";
import { Card } from "@/components/ui/card";
import { useOverview } from "@/hooks/dashboard/useOverview";
import { useRange } from "@/hooks/dashboard/useRange";
import { formatCompact, formatInteger } from "@/lib/formatters/number";
import { formatPercent } from "@/lib/formatters/percent";

export default function OverviewPage() {
  const { range, setRange, from, to } = useRange();
  const { data, isLoading, error, refetch } = useOverview(from, to);

  return (
    <div>
      <TopBar range={range} onRangeChange={setRange} onRefresh={() => void refetch()} updatedAt={data?.updatedAt} />

      <div className="space-y-6 px-4 py-6 md:px-6">
        {isLoading ? <WidgetState state="loading" message="Loading overview metrics..." /> : null}
        {error ? <WidgetState state="error" message={error} onRetry={() => void refetch()} /> : null}
        {!isLoading && !error && data ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Total Requests"
                value={formatCompact(data.totals.requests)}
                subtitle={`${formatInteger(data.totals.requests)} in selected range`}
                icon={<Waves className="h-5 w-5 text-sky-600" aria-hidden="true" />}
              />
              <KpiCard
                label="Blocked Requests"
                value={formatCompact(data.totals.blocked)}
                subtitle={formatPercent(data.totals.requests > 0 ? data.totals.blocked / data.totals.requests : 0)}
                icon={<Ban className="h-5 w-5 text-red-600" aria-hidden="true" />}
              />
              <KpiCard
                label="Allow Rate"
                value={formatPercent(data.totals.allowRate)}
                subtitle="Allowed / Total"
                icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />}
              />
              <KpiCard
                label="P95 Middleware Latency"
                value={data.totals.p95LatencyMs === null ? "N/A" : `${data.totals.p95LatencyMs}ms`}
                subtitle={
                  data.totals.p95LatencyMs === null
                    ? "Metric unavailable in current schema"
                    : "Latency tracking enabled"
                }
                icon={<Clock3 className="h-5 w-5 text-amber-600" aria-hidden="true" />}
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
              <Card className="p-5">
                <h2 className="text-lg font-semibold text-slate-900">Traffic Trend</h2>
                <p className="mb-4 text-sm text-slate-500">Allowed vs blocked request volume over time.</p>
                <TrafficChart data={data.traffic} />
              </Card>

              <Card className="p-5">
                <h2 className="text-lg font-semibold text-slate-900">Top Limited API Keys</h2>
                <p className="mb-4 text-sm text-slate-500">Highest blocked volume in current window.</p>
                {data.topLimitedKeys.length === 0 ? (
                  <p className="text-sm text-slate-500">No throttling data for selected range.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.topLimitedKeys.map((item) => (
                      <li key={item.keyId} className="rounded-lg border border-slate-200 p-3">
                        <p className="text-sm font-semibold text-slate-800">{item.keyName}</p>
                        <p className="mt-1 text-xs text-slate-500">
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
