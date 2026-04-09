import { formatInteger } from "@/lib/formatters/number";
import { formatPercent } from "@/lib/formatters/percent";

type EndpointRow = {
  path: string;
  total: number;
  blocked: number;
  blockedRate: number;
};

type EndpointsTableProps = {
  rows: EndpointRow[];
};

export function EndpointsTable({ rows }: EndpointsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)] text-left">
            <th className="table-header-cell px-3 py-2">Path</th>
            <th className="table-header-cell px-3 py-2">Total</th>
            <th className="table-header-cell px-3 py-2">Blocked</th>
            <th className="table-header-cell px-3 py-2">Blocked %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.path} className="table-row">
              <td className="px-3 py-2 font-mono text-[11px] text-[var(--mono-accent)]">{row.path}</td>
              <td className="px-3 py-2 text-[12px] text-[var(--text-secondary)]">{formatInteger(row.total)}</td>
              <td className="px-3 py-2 text-[12px] text-[var(--text-secondary)]">{formatInteger(row.blocked)}</td>
              <td className="px-3 py-2 text-[12px] text-[var(--text-secondary)]">{formatPercent(row.blockedRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
