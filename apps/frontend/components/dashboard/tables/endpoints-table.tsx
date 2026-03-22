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
          <tr className="border-b border-slate-200 text-left">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Path</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Blocked</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Blocked %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.path} className="border-b border-slate-100">
              <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.path}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{formatInteger(row.total)}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{formatInteger(row.blocked)}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{formatPercent(row.blockedRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
