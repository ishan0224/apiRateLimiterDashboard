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
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Path</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Total</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Blocked</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Blocked %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.path} className="border-b border-[var(--border)]/70">
              <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{row.path}</td>
              <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{formatInteger(row.total)}</td>
              <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{formatInteger(row.blocked)}</td>
              <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{formatPercent(row.blockedRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
