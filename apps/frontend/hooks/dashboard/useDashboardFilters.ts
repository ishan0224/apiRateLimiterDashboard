"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { DEFAULT_RANGE_HOURS } from "@/lib/constants/dashboard";

export type RangeOption = "1h" | "24h" | "7d";
export type GranularityOption = "15m" | "1h" | "1d";

function normalizeRange(value: string | null): RangeOption {
  if (value === "1h" || value === "7d" || value === "24h") {
    return value;
  }

  return "24h";
}

function normalizeGranularity(value: string | null): GranularityOption {
  if (value === "15m" || value === "1h" || value === "1d") {
    return value;
  }

  return "1h";
}

function toRange(range: RangeOption) {
  const anchor = new Date();
  const from = new Date(anchor);

  if (range === "1h") {
    from.setHours(anchor.getHours() - 1);
  } else if (range === "7d") {
    from.setDate(anchor.getDate() - 7);
  } else {
    from.setHours(anchor.getHours() - DEFAULT_RANGE_HOURS);
  }

  return { from: from.toISOString(), to: anchor.toISOString() };
}

export function useDashboardFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const [queryString, setQueryString] = useState("");
  const searchParams = useMemo(() => new URLSearchParams(queryString), [queryString]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const sync = () => {
      setQueryString(window.location.search.slice(1));
    };

    sync();
    window.addEventListener("popstate", sync);

    return () => {
      window.removeEventListener("popstate", sync);
    };
  }, []);

  const range = normalizeRange(searchParams.get("range"));
  const granularity = normalizeGranularity(searchParams.get("granularity"));

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      const nextQuery = params.toString();
      setQueryString(nextQuery);
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const rangeValues = useMemo(() => toRange(range), [range]);

  return {
    range,
    setRange: (value: RangeOption) => setParam("range", value),
    granularity,
    setGranularity: (value: GranularityOption) => setParam("granularity", value),
    ...rangeValues,
  };
}
