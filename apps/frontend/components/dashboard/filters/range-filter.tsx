"use client";

import { Button } from "@/components/ui/button";
import type { RangeOption } from "@/hooks/dashboard/useDashboardFilters";

type RangeFilterProps = {
  value: RangeOption;
  onChange: (value: RangeOption) => void;
};

const options: RangeOption[] = ["1h", "24h", "7d"];

export function RangeFilter({ value, onChange }: RangeFilterProps) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel-soft)] px-2 py-1"
      role="group"
      aria-label="Time range filter"
    >
      {options.map((option) => (
        <Button
          key={option}
          variant={option === value ? "primary" : "ghost"}
          className="min-w-12"
          onClick={() => onChange(option)}
        >
          {option}
        </Button>
      ))}
    </div>
  );
}
