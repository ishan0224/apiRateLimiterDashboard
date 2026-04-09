"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TimePoint } from "@/types/dashboard";
import { resolveTimeZone, type TimeZoneValue } from "@/lib/time-range";

type TrafficChartProps = {
  data: TimePoint[];
  timeZone?: TimeZoneValue;
};

function buildFormatters(data: TimePoint[], timeZone: TimeZoneValue) {
  const resolvedTimeZone = resolveTimeZone(timeZone);
  const timestamps = data
    .map((point) => new Date(point.ts).getTime())
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  const spanMs = timestamps.length > 1 ? timestamps[timestamps.length - 1] - timestamps[0] : 0;
  const oneDayMs = 24 * 60 * 60 * 1000;

  const tickFormatter = new Intl.DateTimeFormat(undefined, {
    timeZone: resolvedTimeZone,
    ...(spanMs > 14 * oneDayMs
      ? { month: "short", day: "2-digit" }
      : spanMs > oneDayMs
        ? { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }
        : { hour: "2-digit", minute: "2-digit", hour12: false }),
  });

  const tooltipFormatter = new Intl.DateTimeFormat(undefined, {
    timeZone: resolvedTimeZone,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return {
    formatTick: (value: string) => tickFormatter.format(new Date(value)),
    formatTooltip: (value: string) => tooltipFormatter.format(new Date(value)),
  };
}

export function TrafficChart({ data, timeZone = "browser" }: TrafficChartProps) {
  const { formatTick, formatTooltip } = useMemo(() => buildFormatters(data, timeZone), [data, timeZone]);

  return (
    <div>
      <div className="h-[280px] w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="ts"
              tickLine={false}
              axisLine={{ stroke: "var(--border-subtle)" }}
              tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "Roboto Mono, monospace" }}
              tickFormatter={(value: string) => formatTick(value)}
              minTickGap={24}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tickCount={5}
              tickLine={false}
              axisLine={false}
              width={28}
              tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "Roboto Mono, monospace" }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "3px",
                color: "var(--text-primary)",
                fontSize: "11px",
              }}
              labelStyle={{ color: "var(--text-secondary)", fontSize: "11px" }}
              labelFormatter={(value) => formatTooltip(String(value))}
              formatter={(value, name) => [Number(value ?? 0), name === "allowed" ? "Allowed" : "Blocked"]}
            />
            <Line
              type="monotone"
              dataKey="allowed"
              stroke="var(--status-ok)"
              strokeWidth={1.8}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0, fill: "var(--status-ok)" }}
            />
            <Line
              type="monotone"
              dataKey="blocked"
              stroke="var(--status-crit)"
              strokeWidth={1.8}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0, fill: "var(--status-crit)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-[var(--text-secondary)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-[2px] w-4 bg-[var(--status-ok)]" aria-hidden="true" />
          Allowed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-[2px] w-4 bg-[var(--status-crit)]" aria-hidden="true" />
          Blocked
        </span>
      </div>
    </div>
  );
}
