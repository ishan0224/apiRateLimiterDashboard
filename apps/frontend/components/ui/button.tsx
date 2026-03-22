import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

const styles: Record<ButtonVariant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-800",
  secondary: "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

export function Button({ variant = "secondary", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
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
