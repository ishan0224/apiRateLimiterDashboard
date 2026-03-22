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
              <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#0284c7" stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="blockedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#dc2626" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis
            dataKey="ts"
            tickFormatter={(value: string) =>
              new Date(value).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            }
          />
          <YAxis allowDecimals={false} />
          <Tooltip
            labelFormatter={(value) => new Date(String(value)).toLocaleString()}
            formatter={(value, name) => [
              typeof value === "number" ? value : Number(value ?? 0),
              name === "allowed" ? "Allowed" : "Blocked",
            ]}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="allowed"
            stroke="#0284c7"
            fill="url(#allowedFill)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Area
            type="monotone"
            dataKey="blocked"
            stroke="#dc2626"
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
