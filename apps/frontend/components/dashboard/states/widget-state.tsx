import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type WidgetStateProps = {
  state: "loading" | "error" | "empty";
  message: string;
  onRetry?: () => void;
};

export function WidgetState({ state, message, onRetry }: WidgetStateProps) {
  const iconColor = state === "loading" ? "text-[var(--status-info-fg)]" : "text-[var(--status-warning-fg)]";

  return (
    <Card className="p-6">
      <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--panel-soft)]/60 text-center">
        {state === "loading" ? (
          <Loader2 className={`h-5 w-5 animate-spin ${iconColor}`} aria-hidden="true" />
        ) : (
          <AlertTriangle className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
        )}
        <p className="text-sm text-[var(--text-secondary)]">{message}</p>
        {state === "error" && onRetry ? <Button onClick={onRetry}>Retry Query</Button> : null}
      </div>
    </Card>
  );
}
