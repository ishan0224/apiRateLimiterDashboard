"use client";

import { Button } from "@/components/ui/button";
import type { RangeOption } from "@/hooks/dashboard/useRange";

type RangeFilterProps = {
  value: RangeOption;
  onChange: (value: RangeOption) => void;
};

const options: RangeOption[] = ["1h", "24h", "7d"];

export function RangeFilter({ value, onChange }: RangeFilterProps) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Time range filter">
      {options.map((option) => (
        <Button
          key={option}
          variant={option === value ? "primary" : "secondary"}
          onClick={() => onChange(option)}
        >
          {option}
        </Button>
      ))}
    </div>
  );
}
