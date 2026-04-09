import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type WidgetStateProps = {
  state: "loading" | "error" | "empty";
  message: string;
  onRetry?: () => void;
};

export function WidgetState({ state, message, onRetry }: WidgetStateProps) {
  const iconColor = state === "loading" ? "var(--status-info)" : "var(--status-warn)";

  return (
    <Card className="p-4">
      <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-[3px] border border-[var(--border-subtle)] bg-[var(--bg-panel-deep)] text-center">
        {state === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: iconColor }} aria-hidden="true" />
        ) : (
          <AlertTriangle className="h-4 w-4" style={{ color: iconColor }} aria-hidden="true" />
        )}
        <p className="text-[11px] text-[var(--text-secondary)]">{message}</p>
        {state === "error" && onRetry ? (
          <Button variant="secondary" onClick={onRetry}>
            Retry Query
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
