"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type StatusDatum = {
  status: number;
  count: number;
};

type StatusChartProps = {
  data: StatusDatum[];
};

const colors = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6"];

export function StatusChart({ data }: StatusChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={96} label>
            {data.map((entry, index) => (
              <Cell key={`${entry.status}-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              typeof value === "number" ? value : Number(value ?? 0),
              `HTTP ${name}`,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
