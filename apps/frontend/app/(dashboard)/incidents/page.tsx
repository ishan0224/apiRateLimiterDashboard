"use client";

import { AlertOctagon, AlertTriangle, CircleGauge, TimerReset } from "lucide-react";

import { TopBar } from "@/components/dashboard/shell/top-bar";
import { WidgetState } from "@/components/dashboard/states/widget-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useIncidents } from "@/hooks/dashboard/useIncidents";
import { useDashboardFilters } from "@/hooks/dashboard/useDashboardFilters";
import { useOverviewSnapshot } from "@/hooks/dashboard/useOverview";
import type { Incident } from "@/types/dashboard";
import { formatDateTime } from "@/lib/formatters/date";
import { formatPercent } from "@/lib/formatters/percent";

function severityTone(severity: Incident["severity"]) {
  if (severity === "high") {
    return "var(--status-crit)";
  }

  if (severity === "medium") {
    return "var(--status-warn)";
  }

  return "var(--status-info)";
}

function elapsedFrom(ts: string) {
  const ms = Date.now() - new Date(ts).getTime();
  const minutes = Math.max(1, Math.floor(ms / 60000));

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return `${hours}h ${rem}m`;
}

type RuleStatus = "OK" | "CRIT";

type RuleRow = {
  name: string;
  expression: string;
  status: RuleStatus;
};

function buildRules(incidents: Incident[], queueLagSeconds: number, lastIngestAt: string | null): RuleRow[] {
  const hasHigh = incidents.some((incident) => incident.severity === "high");
  const hasMedium = incidents.some((incident) => incident.severity === "medium" || incident.severity === "high");
  const ingestLagMinutes = lastIngestAt ? (Date.now() - new Date(lastIngestAt).getTime()) / 60000 : Infinity;

  return [
    {
      name: "throttle_rate_critical",
      expression: "blocked_rate > 0.50 for 5m",
      status: hasHigh ? "CRIT" : "OK",
    },
    {
      name: "throttle_rate_observe",
      expression: "blocked_rate > 0.35 for 15m",
      status: hasMedium ? "CRIT" : "OK",
    },
    {
      name: "queue_lag_guard",
      expression: "queue_lag_seconds > 60",
      status: queueLagSeconds > 60 ? "CRIT" : "OK",
    },
    {
      name: "ingest_staleness",
      expression: "last_ingest_age_minutes > 10",
      status: ingestLagMinutes > 10 ? "CRIT" : "OK",
    },
  ];
}

export default function IncidentsPage() {
  const { from, to, activeRange, applyRange } = useDashboardFilters();
  const incidentsQuery = useIncidents(from, to);
  const snapshotQuery = useOverviewSnapshot(from, to);
  const pipelineHealth = snapshotQuery.data?.pipelineHealth;

  const incidents = incidentsQuery.data?.incidents ?? [];
  const rules = buildRules(incidents, pipelineHealth?.queueLagSeconds ?? 0, pipelineHealth?.lastIngestAt ?? null);

  return (
    <div>
      <TopBar
        activeRange={activeRange}
        onApplyRange={applyRange}
        onRefresh={() => void incidentsQuery.refetch()}
        updatedAt={snapshotQuery.data?.overview.updatedAt}
        isRefreshing={incidentsQuery.isFetching || snapshotQuery.isFetching}
      />

      <div className="space-y-5 px-4 py-5 md:px-6">
        <section className="grid gap-3 sm:grid-cols-3">
          <Card className="p-3.5">
            <p className="label-upper">Queue Lag</p>
            <p className="mt-1 value-number" style={{ color: "var(--status-warn)" }}>
              {pipelineHealth ? `${pipelineHealth.queueLagSeconds}s` : "-"}
            </p>
            <TimerReset className="mt-1 h-4 w-4 text-[var(--status-warn)]" aria-hidden="true" />
          </Card>
          <Card className="p-3.5">
            <p className="label-upper">Lambda Failure Rate</p>
            <p className="mt-1 value-number" style={{ color: "var(--status-crit)" }}>
              {pipelineHealth ? formatPercent(pipelineHealth.lambdaFailureRate) : "-"}
            </p>
            <AlertOctagon className="mt-1 h-4 w-4 text-[var(--status-crit)]" aria-hidden="true" />
          </Card>
          <Card className="p-3.5">
            <p className="label-upper">Last Ingest</p>
            <p className="mt-1 value-text">{pipelineHealth ? formatDateTime(pipelineHealth.lastIngestAt) : "-"}</p>
            <CircleGauge className="mt-1 h-4 w-4 text-[var(--status-info)]" aria-hidden="true" />
          </Card>
        </section>

        {incidentsQuery.isLoading ? <WidgetState state="loading" message="Scanning for throttling incidents..." /> : null}
        {incidentsQuery.error ? (
          <WidgetState state="error" message={incidentsQuery.error.message} onRetry={() => void incidentsQuery.refetch()} />
        ) : null}

        {!incidentsQuery.isLoading && !incidentsQuery.error ? (
          <>
            <Card>
              <div className="panel-header">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="panel-title">Problem feed</h2>
                    <p className="panel-subtitle">Throttling incidents detected from request behavior</p>
                  </div>
                  <Badge variant="danger" className="gap-1 normal-case">
                    <span className="h-[6px] w-[6px] rounded-full bg-[var(--status-crit)]" aria-hidden="true" />
                    {incidents.length} open problems
                  </Badge>
                </div>
              </div>

              {incidents.length === 0 ? (
                <p className="p-4 text-[12px] text-[var(--text-muted)]">No incidents detected in selected range</p>
              ) : (
                <ul className="divide-y divide-[var(--border-subtle)]">
                  {incidents.map((incident) => {
                    const tone = severityTone(incident.severity);

                    return (
                      <li key={incident.id} className="grid grid-cols-[3px_34px_1fr_auto] gap-3 px-3 py-3.5">
                        <div style={{ background: tone }} aria-hidden="true" />

                        <div className="flex items-start justify-center">
                          <span
                            className="flex h-5 w-5 items-center justify-center rounded-full border"
                            style={{
                              background: incident.severity === "high" ? "rgba(255,85,64,0.15)" : "rgba(255,184,28,0.14)",
                              borderColor: incident.severity === "high" ? "rgba(255,85,64,0.3)" : "rgba(255,184,28,0.28)",
                              color: tone,
                            }}
                          >
                            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-medium text-[var(--text-primary)]">{incident.title}</p>
                            <Badge variant={incident.severity === "high" ? "danger" : incident.severity === "medium" ? "warning" : "info"}>
                              {incident.severity}
                            </Badge>
                          </div>

                          <p className="mt-1 text-[11px] leading-[1.55] text-[var(--text-label)]">{incident.description}</p>

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="mono-tag">
                              <span className="mono-tag-key">blocked_rate</span>=
                              {formatPercent(incident.blockedRate)}
                            </span>
                            <span className="mono-tag">
                              <span className="mono-tag-key">total</span>=
                              {incident.totalRequests}
                            </span>
                            <span className="mono-tag">
                              <span className="mono-tag-key">window</span>=1h
                            </span>
                          </div>
                        </div>

                        <div className="text-right text-[11px] text-[var(--panel-subtitle)]">
                          <p>{new Date(incident.ts).toLocaleString()}</p>
                          <p className="mt-1 text-[var(--status-crit)]">open · {elapsedFrom(incident.ts)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card>
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Alert rules</h2>
                  <p className="panel-subtitle">Current status for core incident rules</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2">
                {rules.map((rule, index) => (
                  <div
                    key={rule.name}
                    className="flex items-center justify-between gap-2 border-b border-r border-[var(--bg-panel-deep)] px-[14px] py-[9px]"
                    style={{ borderRightWidth: index % 2 === 0 ? "1px" : "0px" }}
                  >
                    <div>
                      <p className="flex items-center gap-2 text-[12px] text-[var(--rule-text)]">
                        <span
                          className="h-[6px] w-[6px] rounded-full"
                          style={{ background: rule.status === "CRIT" ? "var(--status-crit)" : "var(--status-ok)" }}
                          aria-hidden="true"
                        />
                        {rule.name}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-[var(--panel-subtitle)]">{rule.expression}</p>
                    </div>
                    <Badge variant={rule.status === "CRIT" ? "danger" : "success"}>{rule.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
