"use client";

import { useEffect, useMemo, useState } from "react";

import { POLL_INTERVAL_MS } from "@/lib/constants/dashboard";

type QueryState<T> = {
  data: T | null;
  error: string | null;
  isLoading: boolean;
};

export function useDashboardQuery<T>(
  queryKey: string,
  queryFn: (signal: AbortSignal) => Promise<T>,
  pollMs = POLL_INTERVAL_MS
): QueryState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    error: null,
    isLoading: true,
  });

  const stableKey = useMemo(() => queryKey, [queryKey]);

  async function runFetch(signal: AbortSignal) {
    try {
      const result = await queryFn(signal);
      setState({ data: result, error: null, isLoading: false });
    } catch (error) {
      if (signal.aborted) {
        return;
      }

      setState({
        data: null,
        error: error instanceof Error ? error.message : "Failed to load data",
        isLoading: false,
      });
    }
  }

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let activeController: AbortController | null = null;

    const schedule = () => {
      timeoutId = setTimeout(async () => {
        if (cancelled) {
          return;
        }

        activeController = new AbortController();
        await runFetch(activeController.signal);

        if (!cancelled) {
          schedule();
        }
      }, pollMs);
    };

    const init = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      activeController = new AbortController();
      await runFetch(activeController.signal);

      if (!cancelled) {
        schedule();
      }
    };

    void init();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      activeController?.abort();
    };
  }, [stableKey, pollMs]);

  return {
    ...state,
    refetch: async () => {
      const controller = new AbortController();
      setState((prev) => ({ ...prev, isLoading: true }));
      await runFetch(controller.signal);
      controller.abort();
    },
  };
}
