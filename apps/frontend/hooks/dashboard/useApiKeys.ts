"use client";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants/dashboard";
import { fetchApiKeys, fetchApiKeyDetail } from "@/lib/api/dashboard";
import { useDashboardQuery } from "./useDashboardQuery";

export function useApiKeys(from: string, to: string, page = 1, pageSize = DEFAULT_PAGE_SIZE, search = "") {
  return useDashboardQuery(
    `keys:${from}:${to}:${page}:${pageSize}:${search}`,
    (signal) => fetchApiKeys({ from, to, page, pageSize, search }, signal)
  );
}

export function useApiKeyDetail(keyId: string | null, from: string, to: string) {
  return useDashboardQuery(
    `key-detail:${keyId ?? "none"}:${from}:${to}`,
    (signal) => {
      if (!keyId) {
        return Promise.resolve(null);
      }

      return fetchApiKeyDetail(keyId, { from, to }, signal);
    }
  );
}
