"use client";
import { AllocationCard } from "@/components/dashboard/AllocationCard";
import { AssetChartCard } from "@/components/dashboard/AssetChartCard";
import { AlertsOverviewCard } from "@/components/dashboard/AlertsOverviewCard";
import { CoinbaseSyncCard } from "@/components/dashboard/CoinbaseSyncCard";
import { HoldingsTable } from "@/components/dashboard/HoldingsTable";
import { MarketRegimeCard } from "@/components/dashboard/MarketRegimeCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PortfolioHero } from "@/components/dashboard/PortfolioHero";
import { RiskPulseCard } from "@/components/dashboard/RiskPulseCard";
import { AppShell } from "@/components/shell/AppShell";
import { usePortfolioInsights } from "@/hooks/usePortfolioInsights";

export default function DashboardPage() {
  const insights = usePortfolioInsights();
  const invested = Math.max(0, insights.summary.totalBalance - insights.summary.totalPnlValue);
  return (
    <AppShell title="Visão geral">
      <div className="space-y-4">
        <PortfolioHero />
        <p className="text-xs text-[var(--text-muted)]">
          Resultados calculados exclusivamente a partir das posições manuais com cotação confirmada.
          Os saldos Coinbase ficam separados para evitar duplicidade.
        </p>
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
          <RiskPulseCard concentrationPct={insights.concentration}
            avgChange24h={insights.avgChange24h} healthScore={insights.healthScore}
            warnings={insights.warnings} riskLevel={insights.riskLevel} />
        </section>
        <section className="grid gap-3 xl:grid-cols-2">
          <MarketRegimeCard />
          <AlertsOverviewCard />
        </section>
        <HoldingsTable />
      </div>
    </AppShell>
  );
}
