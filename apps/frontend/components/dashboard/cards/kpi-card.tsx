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
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
    </Card>
  );
}
