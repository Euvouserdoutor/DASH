"use client";
import { AppShell } from "@/components/shell/AppShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PortfolioTrendCard } from "@/components/dashboard/PortfolioTrendCard";
import { AllocationCard } from "@/components/dashboard/AllocationCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { usePortfolioInsights } from "@/hooks/usePortfolioInsights";
import { fmtCurrency, fmtPct } from "@/lib/formatters";

export default function AnalyticsPage() {
  const insights = usePortfolioInsights();
  const { summary, rows, missingQuotes } = insights;
  const invested = Math.max(0, summary.totalBalance - summary.totalPnlValue);
  const sorted = [...rows].sort((a, b) => b.pnlValue - a.pnlValue);
  const best = sorted[0];
  const worst = sorted.length > 1 ? sorted[sorted.length - 1] : null;
  return (
    <AppShell title="Análises">
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-muted)]">
          Análise das posições manuais com cotação disponível. Histórico construído somente a partir de registros reais salvos neste navegador.
        </p>
        {missingQuotes > 0 && (
          <p className="rounded-lg border border-[var(--card-border)] p-3 text-xs text-[var(--warning-amber)]">
            {missingQuotes} posição(ões) sem preço confirmado foram excluídas dos cálculos.
          </p>
        )}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Patrimônio cotado" value={summary.totalBalance} changeLabel="Posições locais com cotação" />
          <MetricCard label="Base de custo" value={invested} changeLabel="Informada manualmente" />
          <MetricCard label="Resultado não realizado" value={summary.totalPnlValue}
            changeLabel={fmtPct(summary.totalPnlPct)}
            changeVariant={summary.totalPnlValue >= 0 ? "success" : "danger"} />
          <MetricCard label="Moedas com cotação" value={rows.length} valuePrefix=""
            changeLabel="Dados confirmados" />
        </section>
        <section className="grid gap-4 xl:grid-cols-2">
          <PortfolioTrendCard totalBalance={summary.totalBalance} />
          <AllocationCard />
        </section>
        <GlassCard className="p-4">
          <h2 className="text-base font-semibold">Resultado não realizado por ativo</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Sem projeções ou rentabilidades inventadas.</p>
          {sorted.length === 0 ? (
            <p className="mt-5 text-sm text-[var(--text-muted)]">Adicione posições com cotação para obter análises.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {sorted.map((row) => (
                <div key={row.symbol} className="flex items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3 text-sm">
                  <span className="display-mono">{row.symbol}</span>
                  <div className="text-right">
                    <p className={row.pnlValue >= 0 ? "text-[var(--profit-green)]" : "text-[var(--loss-red)]"}>
                      {fmtCurrency(row.pnlValue)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{row.allocationPct.toFixed(1)}% da carteira cotada</p>
                  </div>
                </div>
              ))}
              <p className="text-xs text-[var(--text-muted)]">
                Maior resultado: {best?.symbol ?? "—"}.
                {worst ? " Menor resultado: " + worst.symbol + "." : ""}
              </p>
            </div>
          )}
        </GlassCard>
      </div>
    </AppShell>
  );
}
