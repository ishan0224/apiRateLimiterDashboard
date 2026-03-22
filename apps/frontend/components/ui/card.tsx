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
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        "transition-shadow duration-150 hover:shadow-md",
        className
      )}
    >
      {children}
    </section>
  );
}
