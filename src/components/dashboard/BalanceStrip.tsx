"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { MetricBadge } from "@/components/ui/MetricBadge";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { fmtCurrency, fmtPct } from "@/lib/formatters";
import { useMarketData } from "@/hooks/useMarketData";
import { usePortfolioInsights } from "@/hooks/usePortfolioInsights";

function Row({ symbol, price, change }: { symbol: string; price: number; change: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--card-border)] bg-white/[0.03] px-3 py-2">
      <div>
        <p className="display-mono text-sm font-semibold">{symbol}</p>
        <p className="tabular-nums text-xs text-[var(--text-muted)]">{fmtCurrency(price)}</p>
      </div>
      <MetricBadge variant={change >= 0 ? "success" : "danger"}>{fmtPct(change)}</MetricBadge>
    </div>
  );
}

function InsightRow({ label, value, variant }: { label: string; value: string; variant: "success" | "danger" | "warning" | "neutral" }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--card-border)] bg-white/[0.03] px-3 py-2">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <MetricBadge variant={variant}>{value}</MetricBadge>
    </div>
  );
}

export function BalanceStrip() {
  const { assets, topGainers, topLosers, isLoading, hasError, marketSource, marketWarning, lastUpdatedAt } = useMarketData();
  const insights = usePortfolioInsights();

  if (isLoading) return <SkeletonCard className="p-4" lines={4} />;

  const concentrationVariant = insights.concentration >= 55 ? "danger" : insights.concentration >= 35 ? "warning" : "success";
  const marketBreadth = assets.length > 0 ? (assets.filter((asset) => asset.priceChange24hPct >= 0).length / assets.length) * 100 : 0;
  const breadthVariant = marketBreadth >= 60 ? "success" : marketBreadth >= 40 ? "warning" : "danger";
  const mostVolatile = [...assets].sort((a, b) => Math.abs(b.priceChange24hPct) - Math.abs(a.priceChange24hPct)).slice(0, 3);

  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MetricBadge variant={hasError ? "warning" : "success"}>
            {marketSource === "fallback" ? "Preços fallback" : hasError ? "Feed atrasado" : "Atualiza 60s"}
          </MetricBadge>
          {marketWarning ? <MetricBadge variant="warning">{marketWarning.replaceAll("_", " ")}</MetricBadge> : null}
          <MetricBadge variant={breadthVariant}>Breadth {marketBreadth.toFixed(0)}%</MetricBadge>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          {lastUpdatedAt ? `Atualizado: ${new Date(lastUpdatedAt).toLocaleTimeString()}` : "Aguardando mercado"}
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Maiores altas</p>
          <div className="space-y-2">
            {topGainers.map((asset) => (
              <Row key={asset.id} symbol={asset.symbol} price={asset.currentPrice} change={asset.priceChange24hPct} />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Maiores quedas</p>
          <div className="space-y-2">
            {topLosers.map((asset) => (
              <Row key={asset.id} symbol={asset.symbol} price={asset.currentPrice} change={asset.priceChange24hPct} />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Sinais da carteira</p>
          <div className="space-y-2">
            <InsightRow
              label="Risco de concentração"
              value={`${insights.concentration.toFixed(2)}%`}
              variant={concentrationVariant}
            />
            <InsightRow
              label="Movimento médio 24h"
              value={fmtPct(insights.avgChange24h)}
              variant={insights.avgChange24h >= 0 ? "success" : "danger"}
            />
            <InsightRow
              label="Cobertura da watchlist"
              value={`${insights.watchlistLiveCount}/${insights.watchlistCount}`}
              variant={insights.watchlistCount > 0 ? "neutral" : "warning"}
            />
            <div className="rounded-lg border border-[var(--card-border)] bg-white/[0.03] px-3 py-2">
              <p className="mb-1 text-xs text-[var(--text-muted)]">Maior volatilidade</p>
              <div className="space-y-1">
                {mostVolatile.length > 0 ? (
                  mostVolatile.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between text-xs">
                      <span className="display-mono">{asset.symbol}</span>
                      <MetricBadge variant={Math.abs(asset.priceChange24hPct) >= 5 ? "warning" : asset.priceChange24hPct >= 0 ? "success" : "danger"}>
                        {fmtPct(asset.priceChange24hPct)}
                      </MetricBadge>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--text-muted)]">Sem dados de volatilidade</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
