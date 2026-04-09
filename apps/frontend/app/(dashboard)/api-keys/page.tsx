"use client";

import { useMemo, useState } from "react";

import { TopBar } from "@/components/dashboard/shell/top-bar";
import { WidgetState } from "@/components/dashboard/states/widget-state";
import { ApiKeysTable } from "@/components/dashboard/tables/api-keys-table";
import { EndpointsTable } from "@/components/dashboard/tables/endpoints-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useApiKeyDetail, useApiKeys } from "@/hooks/dashboard/useApiKeys";
import { useDashboardFilters } from "@/hooks/dashboard/useDashboardFilters";
import { useOverviewSnapshot } from "@/hooks/dashboard/useOverview";
import { formatInteger } from "@/lib/formatters/number";
import { formatPercent } from "@/lib/formatters/percent";

export default function ApiKeysPage() {
  const { from, to, activeRange, applyRange } = useDashboardFilters();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const keysQuery = useApiKeys(from, to, 1, 20, "");
  const detailQuery = useApiKeyDetail(selectedKey, from, to);
  const snapshotQuery = useOverviewSnapshot(from, to);

  const selectedTitle = useMemo(() => detailQuery.data?.keyName ?? "Select an API key", [detailQuery.data]);

  return (
    <div>
      <TopBar
        activeRange={activeRange}
        onApplyRange={applyRange}
        onRefresh={() => void keysQuery.refetch()}
        updatedAt={snapshotQuery.data?.overview.updatedAt}
        isRefreshing={keysQuery.isFetching || snapshotQuery.isFetching}
      />

      <div className="space-y-5 px-4 py-5 md:px-6">
        {keysQuery.isLoading ? <WidgetState state="loading" message="Loading API key pressure map..." /> : null}
        {keysQuery.error ? (
          <WidgetState state="error" message={keysQuery.error.message} onRetry={() => void keysQuery.refetch()} />
        ) : null}

        {!keysQuery.isLoading && !keysQuery.error && keysQuery.data ? (
          <section className="grid gap-5 xl:grid-cols-[2fr_1fr]">
            <Card>
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">API Keys</h2>
                  <p className="panel-subtitle">Current request pressure and block characteristics</p>
                </div>
              </div>

              {keysQuery.data.items.length === 0 ? (
                <p className="p-4 text-[12px] text-[var(--text-muted)]">No API keys found</p>
              ) : (
                <ApiKeysTable rows={keysQuery.data.items} onSelect={setSelectedKey} />
              )}
            </Card>

            <Card>
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Key Detail</h2>
                  <p className="panel-subtitle">Focused inspection for selected key</p>
                </div>
              </div>

              <div className="space-y-3 p-3">
                <p className="font-mono text-[11px] text-[var(--mono-accent)]">{selectedTitle}</p>

                {!selectedKey ? <p className="text-[12px] text-[var(--text-muted)]">Select a key from the table</p> : null}
                {selectedKey && detailQuery.isLoading ? (
                  <p className="text-[12px] text-[var(--text-secondary)]">Loading key details...</p>
                ) : null}
                {selectedKey && detailQuery.error ? (
                  <p className="text-[12px] text-[var(--status-crit)]">{detailQuery.error.message}</p>
                ) : null}

                {selectedKey && detailQuery.data ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-[3px] border border-[var(--border-subtle)] bg-[var(--bg-panel-deep)] p-2.5">
                        <p className="label-upper">Total</p>
                        <p className="mt-1 value-text">{formatInteger(detailQuery.data.summary.totalRequests)}</p>
                      </div>
                      <div className="rounded-[3px] border border-[var(--border-subtle)] bg-[var(--bg-panel-deep)] p-2.5">
                        <p className="label-upper">Blocked</p>
                        <p className="mt-1 value-text" style={{ color: "var(--status-crit)" }}>
                          {formatInteger(detailQuery.data.summary.blockedRequests)}
                        </p>
                      </div>
                    </div>

                    <Badge variant={detailQuery.data.summary.blockedRate > 0.35 ? "warning" : "info"}>
                      Blocked rate {formatPercent(detailQuery.data.summary.blockedRate)}
                    </Badge>
                  </>
                ) : null}
              </div>
            </Card>
          </section>
        ) : null}

        {detailQuery.data ? (
          <Card>
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Endpoint Breakdown</h2>
                <p className="panel-subtitle">Per-route totals and blocked percentage</p>
              </div>
            </div>
            <EndpointsTable rows={detailQuery.data.endpoints} />
          </Card>
        ) : null}
      </div>
    </div>
  );
}
