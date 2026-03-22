"use client";

import { AlertOctagon, CheckCircle2, TimerReset } from "lucide-react";

import { TopBar } from "@/components/dashboard/shell/top-bar";
import { WidgetState } from "@/components/dashboard/states/widget-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useIncidents } from "@/hooks/dashboard/useIncidents";
import { useDashboardFilters } from "@/hooks/dashboard/useDashboardFilters";
import { useOverviewSnapshot } from "@/hooks/dashboard/useOverview";
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
  const { range, setRange, from, to } = useDashboardFilters();
  const incidentsQuery = useIncidents(from, to);
  const snapshotQuery = useOverviewSnapshot(from, to);
  const pipelineHealth = snapshotQuery.data?.pipelineHealth;

  return (
    <div>
      <TopBar
        range={range}
        onRangeChange={setRange}
        onRefresh={() => void incidentsQuery.refetch()}
        updatedAt={snapshotQuery.data?.overview.updatedAt}
        isRefreshing={incidentsQuery.isFetching || snapshotQuery.isFetching}
      />
      <div className="space-y-6 px-4 py-6 md:px-6">
        <section className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Queue Lag</p>
            <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
              {pipelineHealth ? `${pipelineHealth.queueLagSeconds}s` : "-"}
            </p>
            <TimerReset className="mt-2 h-5 w-5 text-[var(--status-warning-fg)]" aria-hidden="true" />
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Lambda Failure Rate</p>
            <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
              {pipelineHealth ? formatPercent(pipelineHealth.lambdaFailureRate) : "-"}
            </p>
            <AlertOctagon className="mt-2 h-5 w-5 text-[var(--status-danger-fg)]" aria-hidden="true" />
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Last Ingest</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
              {pipelineHealth ? formatDateTime(pipelineHealth.lastIngestAt) : "-"}
            </p>
            <CheckCircle2 className="mt-2 h-5 w-5 text-[var(--status-success-fg)]" aria-hidden="true" />
          </Card>
        </section>

        {incidentsQuery.isLoading ? <WidgetState state="loading" message="Scanning for throttling incidents..." /> : null}
        {incidentsQuery.error ? (
          <WidgetState state="error" message={incidentsQuery.error.message} onRetry={() => void incidentsQuery.refetch()} />
        ) : null}

        {!incidentsQuery.isLoading && !incidentsQuery.error && incidentsQuery.data ? (
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Incident Timeline</h2>
            <p className="mb-4 text-sm text-[var(--text-secondary)]">Detected throttling spikes from request behavior.</p>
            {incidentsQuery.data.incidents.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No incidents detected in selected range.</p>
            ) : (
              <ul className="space-y-3">
                {incidentsQuery.data.incidents.map((incident) => (
                  <li key={incident.id} className="rounded-lg border border-[var(--border)] bg-[var(--panel-soft)] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{incident.title}</p>
                      <Badge variant={severityToVariant(incident.severity)}>{incident.severity}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{incident.description}</p>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
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
