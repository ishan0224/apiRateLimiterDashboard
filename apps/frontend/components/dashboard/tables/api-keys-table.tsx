"use client";

import { useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { formatDateTime } from "@/lib/formatters/date";
import { formatInteger } from "@/lib/formatters/number";
import { formatPercent } from "@/lib/formatters/percent";
import type { ApiKeyRow } from "@/types/dashboard";

type ApiKeysTableProps = {
  rows: ApiKeyRow[];
  onSelect: (keyId: string) => void;
};

const columnHelper = createColumnHelper<ApiKeyRow>();

export function ApiKeysTable({ rows, onSelect }: ApiKeysTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("keyName", {
        header: "Key",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("configuredRateLimit", {
        header: "Rate Limit",
        cell: (info) => formatInteger(info.getValue()),
      }),
      columnHelper.accessor("requestsPerMin", {
        header: "Requests",
        cell: (info) => formatInteger(info.getValue()),
      }),
      columnHelper.accessor("blockedRate", {
        header: "Blocked %",
        cell: (info) => formatPercent(info.getValue()),
      }),
      columnHelper.accessor("lastSeenAt", {
        header: "Last Seen",
        cell: (info) => formatDateTime(info.getValue()),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-[var(--border)] text-left">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]"
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="cursor-pointer border-b border-[var(--border)]/70 hover:bg-[var(--panel-soft)]"
              onClick={() => onSelect(row.original.keyId)}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
