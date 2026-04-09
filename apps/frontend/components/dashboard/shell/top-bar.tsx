"use client";

import { RefreshCw } from "lucide-react";

import { TimeRangeDropdown } from "@/components/dashboard/filters/time-range-dropdown";
import { Button } from "@/components/ui/button";
import type { ActiveRange, ApplyRangeInput } from "@/hooks/dashboard/useDashboardFilters";

type TopBarProps = {
  activeRange: ActiveRange;
  onApplyRange: (input: ApplyRangeInput) => boolean;
  onRefresh: () => void;
  updatedAt?: string;
  isRefreshing?: boolean;
};

function formatUpdatedAt(updatedAt?: string) {
  if (!updatedAt) {
    return "Waiting for ingest signal";
  }

  return `Last ingest ${new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export function TopBar({
  activeRange,
  onApplyRange,
  onRefresh,
  updatedAt,
  isRefreshing,
}: TopBarProps) {
  return (
    <header className="z-30 border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 md:sticky md:top-0 md:px-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-[18px] font-medium text-[var(--text-primary)]">Rate Limiter Control Plane</h1>
          <p className="mt-1 inline-flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
            <span className="inline-block h-[5px] w-[5px] rounded-full bg-[var(--status-ok)]" aria-hidden="true" />
            <span>Live throughput, contention, and pipeline telemetry.</span>
            <span className="text-[var(--accent-blue-soft)]">{formatUpdatedAt(updatedAt)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TimeRangeDropdown activeRange={activeRange} onApplyRange={onApplyRange} />
          <Button variant="secondary" onClick={onRefresh}>
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            {isRefreshing ? "Refreshing" : "Refresh"}
          </Button>
        </div>
      </div>
    </header>
  );
}

