"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type StatusDatum = {
  status: number;
  count: number;
};

type StatusChartProps = {
  data: StatusDatum[];
};

const colors = [
  "var(--status-info-fg)",
  "var(--status-success-fg)",
  "var(--status-warning-fg)",
  "var(--status-danger-fg)",
  "#826ef9",
  "#2bbfb6",
];

export function StatusChart({ data }: StatusChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={96}
            label
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`${entry.status}-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--chart-tooltip-bg)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              color: "var(--text-primary)",
            }}
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
