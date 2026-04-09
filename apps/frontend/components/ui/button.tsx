import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

const styles: Record<ButtonVariant, string> = {
  primary: "border border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white hover:bg-[var(--accent-blue)]/90",
  secondary:
    "border border-[var(--border)] bg-[var(--bg-panel)] text-[var(--text-secondary)] hover:bg-[var(--bg-panel-deep)] hover:text-[var(--text-primary)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-panel-deep)] hover:text-[var(--text-primary)]",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

export function Button({ variant = "secondary", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex min-h-8 items-center justify-center gap-2 rounded-[3px] px-3 py-1.5 text-[11px] font-medium",
        "disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
