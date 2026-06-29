"use client";

import { AllocationCard } from "@/components/dashboard/AllocationCard";
import { HoldingsTable } from "@/components/dashboard/HoldingsTable";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PortfolioTrendCard } from "@/components/dashboard/PortfolioTrendCard";
import { AppShell } from "@/components/shell/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { usePortfolioInsights } from "@/hooks/usePortfolioInsights";

const palette = ["var(--chart-orange)", "var(--chart-blue)", "var(--profit-green)", "var(--chart-cyan)", "var(--warning-amber)"];

export default function PortfolioPage() {
  const insights = usePortfolioInsights();
  const invested = Math.max(0, insights.summary.totalBalance - insights.summary.totalPnlValue);
  const sortedRows = [...insights.rows].sort((a, b) => b.value - a.value).slice(0, 5);
  const profitableRows = insights.rows.filter((row) => row.change24h >= 0).length;

  return (
    <AppShell title="Investimentos">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Patrimônio acompanhado" value={insights.summary.totalBalance} changeLabel={`${insights.summary.holdingsCount} posições locais`} changeVariant="neutral" />
        <MetricCard label="Resultado não realizado" value={insights.summary.totalPnlValue} changeLabel={`${insights.summary.totalPnlPct >= 0 ? "+" : ""}${insights.summary.totalPnlPct.toFixed(1)}%`} changeVariant={insights.summary.totalPnlValue >= 0 ? "success" : "danger"} />
        <MetricCard label="Capital investido" value={invested} changeLabel="Base de custo" changeVariant="neutral" />
        <MetricCard label="Variação média 24h" value={Math.abs(insights.avgChange24h)} valuePrefix={insights.avgChange24h >= 0 ? "+" : "-"} changeLabel={`${profitableRows}/${insights.rows.length || 0} ativos positivos`} changeVariant={insights.avgChange24h >= 0 ? "success" : "danger"} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <AllocationCard />
        <PortfolioTrendCard totalBalance={insights.summary.totalBalance} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard className="overflow-hidden">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--card-border)] p-4">
            <div>
              <h2 className="text-base font-semibold">Exposição por ativo</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Participação das maiores posições da carteira local.</p>
            </div>
            <span className="text-xs text-[var(--text-muted)]">{insights.rows.length} ativos</span>
          </div>
          {sortedRows.length === 0 ? (
            <div className="p-4 text-sm text-[var(--text-muted)]">Adicione ativos para visualizar a distribuição da carteira.</div>
          ) : (
            <div className="divide-y divide-[var(--card-border)]">
              {sortedRows.map((row, index) => (
                <div key={row.symbol} className="flex items-center gap-3 p-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.07] text-xs font-semibold" style={{ color: palette[index % palette.length] }}>{row.symbol.slice(0, 2)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3"><span className="display-mono text-sm font-medium">{row.symbol}</span><span className="display-mono text-sm">${row.value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span></div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full" style={{ width: `${Math.min(100, row.allocationPct)}%`, backgroundColor: palette[index % palette.length] }} /></div>
                    <div className="mt-1 flex justify-between text-xs text-[var(--text-muted)]"><span>{row.allocationPct.toFixed(1)}% da carteira</span><span className={row.change24h >= 0 ? "text-[var(--profit-green)]" : "text-[var(--loss-red)]"}>{row.change24h >= 0 ? "+" : ""}{row.change24h.toFixed(2)}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-4">
          <h2 className="text-base font-semibold">Leitura de risco</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Indicadores derivados da carteira local.</p>
          <div className="mt-5 space-y-4">
            <div><div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">Saúde da carteira</span><span className="display-mono">{insights.healthScore.toFixed(0)}/100</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-[var(--profit-green)]" style={{ width: `${insights.healthScore}%` }} /></div></div>
            <div className="flex items-center justify-between border-t border-[var(--card-border)] pt-4 text-sm"><span className="text-[var(--text-muted)]">Maior concentração</span><span className="display-mono">{insights.concentration.toFixed(1)}%</span></div>
            <div className="flex items-center justify-between border-t border-[var(--card-border)] pt-4 text-sm"><span className="text-[var(--text-muted)]">Reserva em stablecoins</span><span className="display-mono">{insights.stablecoinRatio.toFixed(1)}%</span></div>
            <div className="border-t border-[var(--card-border)] pt-4"><p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">Sinal atual</p><p className="mt-2 text-sm">{insights.warnings[0] ?? "Alocação dentro dos limites acompanhados."}</p></div>
          </div>
        </GlassCard>
      </section>

      <HoldingsTable />
    </AppShell>
  );
}
