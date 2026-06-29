"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { MetricBadge } from "@/components/ui/MetricBadge";
import { useMarketData } from "@/hooks/useMarketData";
import { usePortfolioInsights } from "@/hooks/usePortfolioInsights";

export function MarketRegimeCard() {
  const { assets } = useMarketData();
  const insights = usePortfolioInsights();

  const breadth = assets.length > 0 ? (assets.filter((a) => a.priceChange24hPct >= 0).length / assets.length) * 100 : 0;
  const momentum = insights.avgChange24h;
  const liquidity = insights.stablecoinRatio;

  const score = (breadth - 50) * 0.6 + momentum * 3 + (liquidity - 15) * -0.15;
  const regime =
    score >= 8 ? "Risk-On" : score <= -8 ? "Risk-Off" : "Neutral";
  const variant = regime === "Risk-On" ? "success" : regime === "Risk-Off" ? "danger" : "warning";
  const label = regime === "Risk-On" ? "Risco ligado" : regime === "Risk-Off" ? "Risco desligado" : "Neutro";

  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-medium">Regime de mercado</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Amplitude + momentum + liquidez.</p>
        </div>
        <MetricBadge variant={variant}>{label}</MetricBadge>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)]">Amplitude do mercado</span>
          <span className="display-mono tabular-nums">{breadth.toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)]">Momentum da carteira</span>
          <span className="display-mono tabular-nums">{momentum >= 0 ? "+" : ""}{momentum.toFixed(2)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)]">Liquidez estável</span>
          <span className="display-mono tabular-nums">{liquidity.toFixed(2)}%</span>
        </div>
      </div>
    </GlassCard>
  );
}
