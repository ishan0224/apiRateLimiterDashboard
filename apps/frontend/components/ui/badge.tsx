import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

const styles: Record<BadgeVariant, string> = {
  success: "border border-[rgba(115,191,105,0.35)] bg-[rgba(115,191,105,0.12)] text-[var(--status-ok)]",
  warning: "border border-[rgba(242,204,12,0.35)] bg-[rgba(242,204,12,0.12)] text-[var(--status-warn)]",
  danger: "border border-[rgba(245,95,62,0.35)] bg-[rgba(245,95,62,0.12)] text-[var(--status-crit)]",
  info: "border border-[rgba(87,148,242,0.35)] bg-[rgba(87,148,242,0.12)] text-[var(--status-info)]",
  neutral: "border border-[var(--border)] bg-[var(--bg-panel-deep)] text-[var(--text-secondary)]",
};

type BadgeProps = {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
};

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[2px] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.04em]",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
