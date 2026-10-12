"use client";
import { GlassCard } from "@/components/ui/GlassCard";
import { usePortfolioInsights } from "@/hooks/usePortfolioInsights";
import { fmtCurrency } from "@/lib/formatters";

const COLORS = ["#ff7a33", "#3478f6", "#42c6d6", "#9a61df", "#4cb778", "#ff5277", "#71717a"];
export function AllocationCard() {
  const insights = usePortfolioInsights();
  const rows = [...insights.rows].sort((a, b) => b.value - a.value);
  const visible = rows.slice(0, 6);
  const others = rows.slice(6);
  const othersValue = others.reduce((sum, row) => sum + row.value, 0);
  const total = insights.summary.totalBalance;
  const display = others.length
    ? [...visible, { symbol: "Outros", value: othersValue, allocationPct: total ? (othersValue / total) * 100 : 0 }]
    : visible;
  let progress = 0;
  const segments = display.map((row, index) => {
    const start = progress;
    progress += row.allocationPct;
    return COLORS[index % COLORS.length] + " " + start + "% " + Math.min(100, progress) + "%";
  });
  return (
    <GlassCard className="min-h-[278px] p-4">
      <h3 className="text-sm font-semibold">Alocação por ativo</h3>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Somente posições com cotação disponível</p>
      {display.length === 0 ? (
        <div className="grid h-44 place-items-center text-center text-sm text-[var(--text-muted)]">
          Nenhuma posição com preço confirmado. Adicione ativos para acompanhar sua alocação.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-[130px_minmax(0,1fr)]">
          <div className="relative mx-auto grid size-[128px] place-items-center rounded-full"
            style={{ background: "conic-gradient(" + segments.join(",") + ")" }}>
            <div className="grid size-[90px] place-items-center rounded-full bg-[var(--card-bg)] text-center">
              <div>
                <p className="display-mono text-sm font-semibold">{fmtCurrency(total)}</p>
                <p className="text-[10px] text-[var(--text-muted)]">Cotado</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {display.map((row, index) => (
              <div key={row.symbol} className="grid grid-cols-[minmax(0,1fr)_auto_48px] items-center gap-2 text-[11px]">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="truncate">{row.symbol}</span>
                </span>
                <span className="tabular-nums">{fmtCurrency(row.value)}</span>
                <span className="text-right text-[var(--text-muted)]">{row.allocationPct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
