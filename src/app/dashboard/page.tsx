"use client";
import { AllocationCard } from "@/components/dashboard/AllocationCard";
import { AssetChartCard } from "@/components/dashboard/AssetChartCard";
import { AlertsOverviewCard } from "@/components/dashboard/AlertsOverviewCard";
import { CoinbaseSyncCard } from "@/components/dashboard/CoinbaseSyncCard";
import { HoldingsTable } from "@/components/dashboard/HoldingsTable";
import { MarketRegimeCard } from "@/components/dashboard/MarketRegimeCard";
import { MarketOverviewCard } from "@/components/dashboard/MarketOverviewCard";
import { PortfolioTrendCard } from "@/components/dashboard/PortfolioTrendCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PortfolioHero } from "@/components/dashboard/PortfolioHero";
import { RiskPulseCard } from "@/components/dashboard/RiskPulseCard";
import { AppShell } from "@/components/shell/AppShell";
import { usePortfolioInsights } from "@/hooks/usePortfolioInsights";
import { usePortfolioStore } from "@/store/portfolioStore";

export default function DashboardPage() {
  const insights = usePortfolioInsights();
  const { holdings } = usePortfolioStore();
  const invested = Math.max(0, insights.summary.totalBalance - insights.summary.totalPnlValue);
  return (
    <AppShell title="Visão geral">
      <div className="space-y-4">
        <PortfolioHero />
        <MarketOverviewCard />
        <p className="text-xs text-[var(--text-muted)]">
          Resultados calculados exclusivamente a partir das posições manuais com cotação confirmada.
          Os saldos Coinbase ficam separados para evitar duplicidade.
        </p>
        {holdings.length === 0 ? (
          <p className="rounded-lg border border-[var(--card-border)] bg-white/[0.025] p-3 text-sm text-[var(--text-muted)]">
            Sua carteira manual está vazia neste navegador. Adicione suas posições para visualizar patrimônio, alocação e desempenho reais. Os gráficos públicos de mercado acima independem da carteira.
          </p>
        ) : null}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Patrimônio cotado" value={insights.summary.totalBalance}
            changeLabel={insights.summary.holdingsCount + " ativos com cotação"} />
          <MetricCard label="Capital investido" value={invested} changeLabel="Base de custo informada" />
          <MetricCard label="Resultado não realizado" value={insights.summary.totalPnlValue}
            changeLabel={insights.summary.totalPnlPct.toFixed(2) + "% da base de custo"}
            changeVariant={insights.summary.totalPnlValue >= 0 ? "success" : "danger"} />
          <MetricCard label="Ativos sem cotação" value={insights.missingQuotes}
            valuePrefix="" changeLabel="Não incluídos no patrimônio"
            changeVariant={insights.missingQuotes ? "warning" : "neutral"} />
        </section>
        <section className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
          <AssetChartCard />
          <AllocationCard />
        </section>
        <section className="grid gap-3 xl:grid-cols-2">
          <CoinbaseSyncCard />
          {insights.rows.length ? (
            <RiskPulseCard concentrationPct={insights.concentration}
              avgChange24h={insights.avgChange24h} healthScore={insights.healthScore}
              warnings={insights.warnings} riskLevel={insights.riskLevel} />
          ) : (
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
              <h3 className="text-base font-medium">Pulso de risco da carteira</h3>
              <p className="mt-3 text-sm text-[var(--text-muted)]">Adicione posições com cotação confirmada para calcular concentração, risco e score. Sem carteira, nenhuma classificação é atribuída.</p>
            </div>
          )}
        </section>
        <section className="grid gap-3 xl:grid-cols-2">
          <MarketRegimeCard />
          <AlertsOverviewCard />
        </section>
        {insights.summary.totalBalance > 0 ? <PortfolioTrendCard totalBalance={insights.summary.totalBalance} /> : null}
        <HoldingsTable />
      </div>
    </AppShell>
  );
}
