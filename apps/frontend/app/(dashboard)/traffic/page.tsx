"use client";

import { useState } from "react";

import { TopBar } from "@/components/dashboard/shell/top-bar";
import { StatusChart } from "@/components/dashboard/charts/status-chart";
import { TrafficChart } from "@/components/dashboard/charts/traffic-chart";
import { WidgetState } from "@/components/dashboard/states/widget-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRange } from "@/hooks/dashboard/useRange";
import { useTraffic } from "@/hooks/dashboard/useTraffic";
import { formatInteger } from "@/lib/formatters/number";

export default function TrafficPage() {
  const { range, setRange, from, to } = useRange();
  const [granularity, setGranularity] = useState<"15m" | "1h" | "1d">("1h");
  const { data, isLoading, error, refetch } = useTraffic(from, to, granularity);

  return (
    <div>
      <TopBar range={range} onRangeChange={setRange} onRefresh={() => void refetch()} />
      <div className="space-y-6 px-4 py-6 md:px-6">
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Granularity</span>
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
        {error ? <WidgetState state="error" message={error} onRetry={() => void refetch()} /> : null}

        {!isLoading && !error && data ? (
          <section className="space-y-6">
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-slate-900">Throughput Timeline</h2>
              <p className="mb-4 text-sm text-slate-500">Allowed and blocked requests across selected window.</p>
              <TrafficChart data={data.series} />
            </Card>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <Card className="p-5">
                <h2 className="text-lg font-semibold text-slate-900">Status Distribution</h2>
                <p className="mb-4 text-sm text-slate-500">Request outcomes by HTTP status.</p>
                {data.statusDistribution.length === 0 ? (
                  <p className="text-sm text-slate-500">No requests in selected range.</p>
                ) : (
                  <StatusChart data={data.statusDistribution} />
                )}
              </Card>

              <Card className="p-5">
                <h2 className="text-lg font-semibold text-slate-900">Top Endpoints</h2>
                <p className="mb-4 text-sm text-slate-500">Highest request volume routes.</p>
                <ul className="space-y-3">
                  {data.topEndpoints.map((row) => (
                    <li key={row.path} className="rounded-lg border border-slate-200 p-3">
                      <p className="font-mono text-xs text-slate-700">{row.path}</p>
                      <p className="mt-1 text-sm text-slate-600">
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
