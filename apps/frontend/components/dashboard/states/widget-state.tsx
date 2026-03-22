import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type WidgetStateProps = {
  state: "loading" | "error" | "empty";
  message: string;
  onRetry?: () => void;
};

export function WidgetState({ state, message, onRetry }: WidgetStateProps) {
  return (
    <Card className="p-6">
      <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
        {state === "loading" ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-500" aria-hidden="true" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-slate-500" aria-hidden="true" />
        )}
        <p className="text-sm text-slate-600">{message}</p>
        {state === "error" && onRetry ? <Button onClick={onRetry}>Retry</Button> : null}
      </div>
    </Card>
  );
}
