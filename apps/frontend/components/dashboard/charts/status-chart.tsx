"use client";

type StatusDatum = {
  status: number;
  count: number;
};

type StatusChartProps = {
  data: StatusDatum[];
};

function getTone(status: number) {
  if (status >= 500) {
    return "var(--status-crit)";
  }

  if (status === 429) {
    return "var(--status-crit)";
  }

  if (status >= 400) {
    return "var(--status-warn)";
  }

  if (status >= 300) {
    return "var(--status-info)";
  }

  return "var(--status-ok)";
}

export function StatusChart({ data }: StatusChartProps) {
  const total = data.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-2">
      {data.map((row) => {
        const percent = total > 0 ? (row.count / total) * 100 : 0;

        return (
          <div key={row.status} className="grid grid-cols-[70px_1fr_56px] items-center gap-2">
            <span className="font-mono text-[11px] text-[var(--text-secondary)]">HTTP {row.status}</span>
            <div className="relative h-[7px] overflow-hidden rounded-[2px] border border-[var(--border)] bg-[var(--bg-panel-deep)]">
              <div
                className="absolute inset-y-0 left-0"
                style={{ width: `${percent}%`, background: getTone(row.status), opacity: 0.55 }}
              />
            </div>
            <span className="text-right text-[11px] text-[var(--text-secondary)]">{row.count}</span>
          </div>
        );
      })}
    </div>
  );
}
