"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";

import { dashboardQueryConfig } from "@/lib/query/dashboard-query";

type DashboardQueryProviderProps = {
  children: ReactNode;
};

export function DashboardQueryProvider({ children }: DashboardQueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: dashboardQueryConfig.staleTime,
            gcTime: dashboardQueryConfig.gcTime,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
