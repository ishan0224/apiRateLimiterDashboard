import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

const styles: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-sky-50 text-sky-700",
  neutral: "bg-slate-100 text-slate-700",
};

type BadgeProps = {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
};

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", styles[variant], className)}>
      {children}
    </span>
  );
}
