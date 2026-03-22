"use client";

import { useMemo, useState } from "react";

import { DEFAULT_RANGE_HOURS } from "@/lib/constants/dashboard";

export type RangeOption = "1h" | "24h" | "7d";

function toRange(range: RangeOption) {
  const now = new Date();

  const from = new Date(now);

  if (range === "1h") {
    from.setHours(now.getHours() - 1);
  } else if (range === "7d") {
    from.setDate(now.getDate() - 7);
  } else {
    from.setHours(now.getHours() - DEFAULT_RANGE_HOURS);
  }

  return { from: from.toISOString(), to: now.toISOString() };
}

export function useRange() {
  const [range, setRange] = useState<RangeOption>("24h");

  const value = useMemo(() => toRange(range), [range]);

  return {
    range,
    setRange,
    ...value,
  };
}
