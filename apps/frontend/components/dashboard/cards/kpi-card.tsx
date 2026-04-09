import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type KpiStatus = "healthy" | "observe" | "live" | "neutral";

type KpiCardProps = {
  label: string;
  value: string;
  subtitle?: string;
  status?: KpiStatus;
  trend?: number[];
  valueMode?: "number" | "text";
};

function getStatusBadge(status: KpiStatus) {
  if (status === "healthy") {
    return { text: "HEALTHY", variant: "success" as const };
  }

  if (status === "observe") {
    return { text: "OBSERVE", variant: "warning" as const };
  }

  if (status === "live") {
    return { text: "LIVE", variant: "info" as const };
  }

  return { text: "STABLE", variant: "neutral" as const };
}

function getValueColor(status: KpiStatus) {
  if (status === "healthy") {
    return "var(--status-ok)";
  }

  if (status === "observe") {
    return "var(--status-warn)";
  }

  return "var(--text-primary)";
}

function getTrendColor(status: KpiStatus) {
  if (status === "healthy") {
    return "var(--status-ok)";
  }

  if (status === "observe") {
    return "var(--status-warn)";
  }

  if (status === "live") {
    return "var(--status-info)";
  }

  return "var(--accent-blue-soft)";
}

function makeSparkPath(values: number[], width: number, height: number) {
  if (values.length === 0) {
    return "";
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / Math.max(values.length - 1, 1);

  return values
    .map((point, index) => {
      const x = index * stepX;
      const y = height - ((point - min) / range) * height;
      const command = index === 0 ? "M" : "L";
      return `${command}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function KpiCard({
  label,
  value,
  subtitle,
  status = "neutral",
  trend = [],
  valueMode = "number",
}: KpiCardProps) {
  const badge = getStatusBadge(status);
  const sparkValues = trend.length > 1 ? trend : [1, 2, 1.6, 2.2, 2.1, 2.6, 2.3, 2.9];
  const path = useMemo(() => makeSparkPath(sparkValues, 320, 26), [sparkValues]);

  return (
    <Card className="p-3.5">
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <p className="label-xs">{label}</p>
        <Badge variant={badge.variant} className="px-1.5 py-0.5 text-[11px]">
          {badge.text}
        </Badge>
      </div>

      <p
        className={valueMode === "number" ? "value-number" : "value-text"}
        style={{ color: getValueColor(status) }}
      >
        {value}
      </p>

      {subtitle ? <p className="mt-1 text-[11px] text-[var(--panel-subtitle)]">{subtitle}</p> : null}

      <div className="mt-3 h-[26px]">
        <svg viewBox="0 0 320 26" className="h-[26px] w-full" role="img" aria-label={`${label} trend`}>
          <path
            d={path}
            fill="none"
            stroke={getTrendColor(status)}
            strokeOpacity="0.65"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </Card>
  );
}
