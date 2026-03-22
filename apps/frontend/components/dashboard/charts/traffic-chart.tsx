"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TimePoint } from "@/types/dashboard";

type TrafficChartProps = {
  data: TimePoint[];
};

export function TrafficChart({ data }: TrafficChartProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="allowedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-allowed-fill-start)" />
              <stop offset="95%" stopColor="var(--chart-allowed-fill-end)" />
            </linearGradient>
            <linearGradient id="blockedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-blocked-fill-start)" />
              <stop offset="95%" stopColor="var(--chart-blocked-fill-end)" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey="ts"
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            tickFormatter={(value: string) =>
              new Date(value).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            }
          />
          <YAxis
            allowDecimals={false}
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--chart-tooltip-bg)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              color: "var(--text-primary)",
            }}
            labelStyle={{ color: "var(--text-secondary)", fontWeight: 600 }}
            labelFormatter={(value) => new Date(String(value)).toLocaleString()}
            formatter={(value, name) => [
              typeof value === "number" ? value : Number(value ?? 0),
              name === "allowed" ? "Allowed" : "Blocked",
            ]}
          />
          <Legend wrapperStyle={{ color: "var(--text-secondary)", fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="allowed"
            stroke="var(--chart-allowed)"
            fill="url(#allowedFill)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Area
            type="monotone"
            dataKey="blocked"
            stroke="var(--chart-blocked)"
            fill="url(#blockedFill)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
