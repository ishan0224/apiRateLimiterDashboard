"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  computeQuickRange,
  formatRangeLabel,
  isQuickRangeKey,
  isValidRange,
  MAX_RANGE_WINDOW_MS,
  type TimeZoneValue,
  type QuickRangeKey,
} from "@/lib/time-range";

export type GranularityOption = "15m" | "1h" | "1d";
const CUSTOM_RANGE_TOKEN = "custom";

export type ActiveRange = {
  from: Date;
  to: Date;
  label: string;
  quickRangeKey: QuickRangeKey | null;
  timeZone: TimeZoneValue;
};

export type ApplyRangeInput = {
  from: Date;
  to: Date;
  quickRangeKey?: QuickRangeKey | null;
  timeZone?: TimeZoneValue;
};

function normalizeGranularity(value: string | null): GranularityOption {
  if (value === "15m" || value === "1h" || value === "1d") {
    return value;
  }

  return "1h";
}

function parseDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function normalizeTimeZone(value: string | null): TimeZoneValue {
  if (!value) {
    return "browser";
  }

  return value;
}

function defaultRange(timeZone: TimeZoneValue) {
  const quickRangeKey: QuickRangeKey = "last_5_minutes";
  const computed = computeQuickRange(quickRangeKey, new Date(), timeZone);
  return {
    from: computed.from,
    to: computed.to,
    quickRangeKey,
  };
}

function resolveActiveRange(searchParams: URLSearchParams): ActiveRange {
  const timeZone = normalizeTimeZone(searchParams.get("tz"));
  const quickRangeKeyRaw = searchParams.get("quickRange");
  const isCustomRange = quickRangeKeyRaw === CUSTOM_RANGE_TOKEN;
  const quickRangeKey = isQuickRangeKey(quickRangeKeyRaw) ? quickRangeKeyRaw : null;

  const parsedFrom = parseDate(searchParams.get("from"));
  const parsedTo = parseDate(searchParams.get("to"));

  if (quickRangeKey) {
    const resolved = computeQuickRange(quickRangeKey, new Date(), timeZone);
    return {
      from: resolved.from,
      to: resolved.to,
      quickRangeKey,
      timeZone,
      label: formatRangeLabel(resolved.from, resolved.to, quickRangeKey, timeZone),
    };
  }

  if (isCustomRange && parsedFrom && parsedTo && isValidRange(parsedFrom, parsedTo, MAX_RANGE_WINDOW_MS)) {
    return {
      from: parsedFrom,
      to: parsedTo,
      quickRangeKey: null,
      timeZone,
      label: formatRangeLabel(parsedFrom, parsedTo, null, timeZone),
    };
  }

  const fallback = defaultRange(timeZone);
  return {
    from: fallback.from,
    to: fallback.to,
    quickRangeKey: fallback.quickRangeKey,
    timeZone,
    label: formatRangeLabel(fallback.from, fallback.to, fallback.quickRangeKey, timeZone),
  };
}

export function useDashboardFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsText = searchParams.toString();
  const activeRange = useMemo(
    () => resolveActiveRange(new URLSearchParams(searchParamsText)),
    [searchParamsText]
  );

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (!value) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const applyRange = useCallback(
    ({ from, to, quickRangeKey = null, timeZone = activeRange.timeZone }: ApplyRangeInput): boolean => {
      if (!isValidRange(from, to, MAX_RANGE_WINDOW_MS)) {
        return false;
      }

      updateParams({
        from: from.toISOString(),
        to: to.toISOString(),
        quickRange: quickRangeKey ?? CUSTOM_RANGE_TOKEN,
        tz: timeZone,
      });

      return true;
    },
    [activeRange.timeZone, updateParams]
  );

  const granularity = normalizeGranularity(searchParams.get("granularity"));

  return {
    from: activeRange.from.toISOString(),
    to: activeRange.to.toISOString(),
    activeRange,
    applyRange,
    granularity,
    setGranularity: (value: GranularityOption) => updateParams({ granularity: value }),
  };
}
