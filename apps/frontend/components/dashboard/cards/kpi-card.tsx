import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

type KpiCardProps = {
  label: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
};

export function KpiCard({ label, value, subtitle, icon }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--kpi-glow),transparent_40%)] opacity-70" />
      <div className="relative flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">{label}</p>
        <div className="text-[var(--status-info-fg)]">{icon}</div>
      </div>
      <p className="relative mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)]">{value}</p>
      {subtitle ? <p className="relative mt-2 text-sm text-[var(--text-secondary)]">{subtitle}</p> : null}
    </Card>
  );
}
