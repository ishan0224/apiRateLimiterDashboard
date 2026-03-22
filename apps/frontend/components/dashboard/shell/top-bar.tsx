"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RangeFilter } from "@/components/dashboard/filters/range-filter";
import type { RangeOption } from "@/hooks/dashboard/useRange";

type TopBarProps = {
  range: RangeOption;
  onRangeChange: (value: RangeOption) => void;
  onRefresh: () => void;
  updatedAt?: string;
};

export function TopBar({ range, onRangeChange, onRefresh, updatedAt }: TopBarProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-6 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">API Rate Limiter Dashboard</h1>
        <p className="text-sm text-slate-500">
          Live telemetry from Redis decisions and async persistence.
          {updatedAt ? ` Last updated ${new Date(updatedAt).toLocaleTimeString()}.` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <RangeFilter value={range} onChange={onRangeChange} />
        <Button variant="secondary" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>
    </header>
  );
}
