import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--panel)]",
        "shadow-[0_1px_0_rgba(255,255,255,0.02),0_20px_45px_-30px_rgba(10,25,45,0.65)]",
        "transition-shadow duration-200 hover:shadow-[0_6px_30px_-20px_var(--kpi-glow)]",
        className
      )}
    >
      {children}
    </section>
  );
}
