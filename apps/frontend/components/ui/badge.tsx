import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

const styles: Record<BadgeVariant, string> = {
  success: "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]",
  warning: "bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]",
  danger: "bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]",
  info: "bg-[var(--status-info-bg)] text-[var(--status-info-fg)]",
  neutral: "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)]",
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
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.06em]",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
