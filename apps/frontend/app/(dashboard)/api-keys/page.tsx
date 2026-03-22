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
  const { range, setRange, from, to } = useDashboardFilters();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const keysQuery = useApiKeys(from, to, 1, 20, "");
  const detailQuery = useApiKeyDetail(selectedKey, from, to);
  const snapshotQuery = useOverviewSnapshot(from, to);

  const selectedTitle = useMemo(() => detailQuery.data?.keyName ?? "Select an API key", [detailQuery.data]);

  return (
    <div>
      <TopBar
        range={range}
        onRangeChange={setRange}
        onRefresh={() => void keysQuery.refetch()}
        updatedAt={snapshotQuery.data?.overview.updatedAt}
        isRefreshing={keysQuery.isFetching || snapshotQuery.isFetching}
      />

      <div className="space-y-6 px-4 py-6 md:px-6">
        {keysQuery.isLoading ? <WidgetState state="loading" message="Loading API keys..." /> : null}
        {keysQuery.error ? <WidgetState state="error" message={keysQuery.error.message} onRetry={() => void keysQuery.refetch()} /> : null}
        {!keysQuery.isLoading && !keysQuery.error && keysQuery.data ? (
          <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <Card className="p-0">
              {keysQuery.data.items.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">No API keys found.</div>
              ) : (
                <ApiKeysTable rows={keysQuery.data.items} onSelect={setSelectedKey} />
              )}
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-semibold text-slate-900">{selectedTitle}</h2>
              {!selectedKey ? (
                <p className="mt-3 text-sm text-slate-500">Click a row to inspect key-level behavior.</p>
              ) : null}
              {selectedKey && detailQuery.isLoading ? (
                <p className="mt-3 text-sm text-slate-500">Loading key details...</p>
              ) : null}
              {selectedKey && detailQuery.error ? (
                <p className="mt-3 text-sm text-red-600">{detailQuery.error.message}</p>
              ) : null}
              {selectedKey && detailQuery.data ? (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">Total</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {formatInteger(detailQuery.data.summary.totalRequests)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">Blocked</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {formatInteger(detailQuery.data.summary.blockedRequests)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={detailQuery.data.summary.blockedRate > 0.35 ? "danger" : "info"}>
                    Blocked rate {formatPercent(detailQuery.data.summary.blockedRate)}
                  </Badge>
                </div>
              ) : null}
            </Card>
          </section>
        ) : null}

        {detailQuery.data ? (
          <Card className="p-5">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Endpoint Breakdown</h2>
            <EndpointsTable rows={detailQuery.data.endpoints} />
          </Card>
        ) : null}
      </div>
    </div>
  );
}
