"use client";

import { RefreshCw } from "lucide-react";

import { RangeFilter } from "@/components/dashboard/filters/range-filter";
import { ThemeToggle } from "@/components/dashboard/shell/theme-toggle";
import { Button } from "@/components/ui/button";
import type { RangeOption } from "@/hooks/dashboard/useDashboardFilters";

type TopBarProps = {
  range: RangeOption;
  onRangeChange: (value: RangeOption) => void;
  onRefresh: () => void;
  updatedAt?: string;
  isRefreshing?: boolean;
};

export function TopBar({ range, onRangeChange, onRefresh, updatedAt, isRefreshing }: TopBarProps) {
  return (
    <header className="z-30 border-b border-[var(--border)] bg-[color:color-mix(in_oklab,var(--bg-elevated)_88%,transparent)] px-6 py-4 backdrop-blur-md md:sticky md:top-0 md:flex md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Rate Limiter Control Plane</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Live throughput, contention, and pipeline telemetry.
          {updatedAt ? ` Last ingest ${new Date(updatedAt).toLocaleTimeString()}.` : " Waiting for ingest signal."}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 md:mt-0">
        <RangeFilter value={range} onChange={onRangeChange} />
        <Button variant="secondary" onClick={onRefresh}>
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
          {isRefreshing ? "Refreshing" : "Refresh"}
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
