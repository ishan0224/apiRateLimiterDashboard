"use client";

import { AlertOctagon, CheckCircle2, TimerReset } from "lucide-react";

import { TopBar } from "@/components/dashboard/shell/top-bar";
import { WidgetState } from "@/components/dashboard/states/widget-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useIncidents, usePipelineHealth } from "@/hooks/dashboard/useIncidents";
import { useRange } from "@/hooks/dashboard/useRange";
import { formatDateTime } from "@/lib/formatters/date";
import { formatPercent } from "@/lib/formatters/percent";

function severityToVariant(severity: "low" | "medium" | "high") {
  if (severity === "high") {
    return "danger" as const;
  }

  if (severity === "medium") {
    return "warning" as const;
  }

  return "info" as const;
}

export default function IncidentsPage() {
  const { range, setRange, from, to } = useRange();
  const incidentsQuery = useIncidents(from, to);
  const pipelineQuery = usePipelineHealth();

  return (
    <div>
      <TopBar range={range} onRangeChange={setRange} onRefresh={() => void incidentsQuery.refetch()} />
      <div className="space-y-6 px-4 py-6 md:px-6">
        <section className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-sm text-slate-500">Queue Lag</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {pipelineQuery.data ? `${pipelineQuery.data.queueLagSeconds}s` : "-"}
            </p>
            <TimerReset className="mt-2 h-5 w-5 text-slate-500" aria-hidden="true" />
          </Card>
          <Card className="p-5">
            <p className="text-sm text-slate-500">Lambda Failure Rate</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {pipelineQuery.data ? formatPercent(pipelineQuery.data.lambdaFailureRate) : "-"}
            </p>
            <AlertOctagon className="mt-2 h-5 w-5 text-slate-500" aria-hidden="true" />
          </Card>
          <Card className="p-5">
            <p className="text-sm text-slate-500">Last Ingest</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {pipelineQuery.data ? formatDateTime(pipelineQuery.data.lastIngestAt) : "-"}
            </p>
            <CheckCircle2 className="mt-2 h-5 w-5 text-slate-500" aria-hidden="true" />
          </Card>
        </section>

        {incidentsQuery.isLoading ? <WidgetState state="loading" message="Scanning incidents..." /> : null}
        {incidentsQuery.error ? (
          <WidgetState state="error" message={incidentsQuery.error} onRetry={() => void incidentsQuery.refetch()} />
        ) : null}

        {!incidentsQuery.isLoading && !incidentsQuery.error && incidentsQuery.data ? (
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-slate-900">Incident Timeline</h2>
            <p className="mb-4 text-sm text-slate-500">Detected throttling spikes from request patterns.</p>
            {incidentsQuery.data.incidents.length === 0 ? (
              <p className="text-sm text-slate-500">No incidents detected in selected range.</p>
            ) : (
              <ul className="space-y-3">
                {incidentsQuery.data.incidents.map((incident) => (
                  <li key={incident.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{incident.title}</p>
                      <Badge variant={severityToVariant(incident.severity)}>{incident.severity}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{incident.description}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {new Date(incident.ts).toLocaleString()} • blocked {formatPercent(incident.blockedRate)} • total {incident.totalRequests}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : null}
      </div>
    </div>
  );
}
