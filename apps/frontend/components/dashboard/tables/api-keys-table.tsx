"use client";

import { useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/formatters/date";
import { formatInteger } from "@/lib/formatters/number";
import { formatPercent } from "@/lib/formatters/percent";
import type { ApiKeyRow } from "@/types/dashboard";

type ApiKeysTableProps = {
  rows: ApiKeyRow[];
  onSelect: (keyId: string) => void;
};

const columnHelper = createColumnHelper<ApiKeyRow>();

function getStatus(row: ApiKeyRow) {
  if (row.blockedRate >= 0.35) {
    return { text: "OBSERVE", variant: "warning" as const };
  }

  if (row.lastSeenAt && Date.now() - new Date(row.lastSeenAt).getTime() < 15 * 60 * 1000) {
    return { text: "LIVE", variant: "info" as const };
  }

  return { text: "HEALTHY", variant: "success" as const };
}

export function ApiKeysTable({ rows, onSelect }: ApiKeysTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("keyName", {
        header: "Key",
        cell: (info) => <span className="font-mono text-[11px] text-[var(--mono-accent)]">{info.getValue()}</span>,
      }),
      columnHelper.accessor("configuredRateLimit", {
        header: "Rate Limit",
        cell: (info) => <span className="text-[12px] text-[var(--text-secondary)]">{formatInteger(info.getValue())}</span>,
      }),
      columnHelper.accessor("requestsPerMin", {
        header: "Requests",
        cell: (info) => <span className="text-[12px] text-[var(--text-secondary)]">{formatInteger(info.getValue())}</span>,
      }),
      columnHelper.accessor("blockedRate", {
        header: "Blocked %",
        cell: (info) => <span className="text-[12px] text-[var(--text-secondary)]">{formatPercent(info.getValue())}</span>,
      }),
      columnHelper.accessor("lastSeenAt", {
        header: "Last Seen",
        cell: (info) => <span className="text-[12px] text-[var(--text-secondary)]">{formatDateTime(info.getValue())}</span>,
      }),
      columnHelper.display({
        id: "status",
        header: "Status",
        cell: (info) => {
          const status = getStatus(info.row.original);
          return <Badge variant={status.variant}>{status.text}</Badge>;
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => (
          <Button variant="secondary" className="rounded-[2px] px-2 py-1 text-[11px]" onClick={() => onSelect(info.row.original.keyId)}>
            Inspect
          </Button>
        ),
      }),
    ],
    [onSelect]
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
                <th key={header.id} className="table-header-cell px-3 py-2">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="table-row">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2">
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
