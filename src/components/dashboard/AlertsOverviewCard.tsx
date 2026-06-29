"use client";

import { useMemo } from "react";

import { GlassCard } from "@/components/ui/GlassCard";
import { MetricBadge } from "@/components/ui/MetricBadge";
import { useMarketData } from "@/hooks/useMarketData";
import { usePortfolioInsights } from "@/hooks/usePortfolioInsights";
import { useAlertsStore } from "@/store/alertsStore";
import { useSettingsStore } from "@/store/settingsStore";

export function AlertsOverviewCard() {
  const { assets } = useMarketData();
  const { alerts } = useAlertsStore();
  const { rows } = usePortfolioInsights();
  const { targetAllocations, driftThresholdPct } = useSettingsStore();

  const marketBySymbol = useMemo(() => {
    const map = new Map<string, number>();
    for (const asset of assets) map.set(asset.symbol.toUpperCase(), asset.currentPrice);
    return map;
  }, [assets]);

  const priceTriggered = useMemo(
    () =>
      alerts.filter((alert) => {
        const current = marketBySymbol.get(alert.symbol) ?? null;
        if (!alert.enabled || current === null) return false;
        return alert.direction === "above" ? current >= alert.targetPrice : current <= alert.targetPrice;
      }).length,
    [alerts, marketBySymbol],
  );

  const pausedAlerts = alerts.filter((alert) => !alert.enabled).length;

  const driftTriggered = useMemo(
    () =>
      Object.entries(targetAllocations).filter(([symbol, target]) => {
        const current = rows.find((row) => row.symbol.toUpperCase() === symbol)?.allocationPct ?? 0;
        return Math.abs(current - target) >= driftThresholdPct;
      }).length,
    [rows, targetAllocations, driftThresholdPct],
  );

  const totalCritical = priceTriggered + driftTriggered;
  const variant = totalCritical > 0 ? "warning" : "success";

  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-medium">Resumo de alertas</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Preço e desvio de alocação.</p>
        </div>
        <MetricBadge variant={variant}>{totalCritical} ativos</MetricBadge>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)]">Alertas de preço</span>
          <span className="display-mono tabular-nums">{priceTriggered}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)]">Alertas de desvio</span>
          <span className="display-mono tabular-nums">{driftTriggered}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)]">Alertas pausados</span>
          <span className="display-mono tabular-nums">{pausedAlerts}</span>
        </div>
      </div>
    </GlassCard>
  );
}
