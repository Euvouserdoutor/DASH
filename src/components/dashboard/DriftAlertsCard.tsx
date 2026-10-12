"use client";

import Link from "next/link";
import { useMemo } from "react";

import { usePortfolioInsights } from "@/hooks/usePortfolioInsights";
import { useSettingsStore } from "@/store/settingsStore";
import { GlassCard } from "@/components/ui/GlassCard";
import { MetricBadge } from "@/components/ui/MetricBadge";

export function DriftAlertsCard() {
  const { rows } = usePortfolioInsights();
  const { targetAllocations, driftThresholdPct } = useSettingsStore();

  const triggered = useMemo(() => {
    return (rows.length ? Object.entries(targetAllocations) : [])
      .map(([symbol, target]) => {
        const current = rows.find((row) => row.symbol.toUpperCase() === symbol)?.allocationPct ?? 0;
        const drift = current - target;
        return { symbol, target, current, drift };
      })
      .filter((item) => Math.abs(item.drift) >= driftThresholdPct)
      .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))
      .slice(0, 4);
  }, [rows, targetAllocations, driftThresholdPct]);

  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-medium">Alertas de desvio</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Limite: {driftThresholdPct.toFixed(1)}%</p>
        </div>
        <MetricBadge variant={triggered.length > 0 ? "warning" : "success"}>
          {triggered.length} ativos
        </MetricBadge>
      </div>

      {triggered.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-muted)]">Nenhum desvio acima do limite.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {triggered.map((item) => (
            <div key={item.symbol} className="flex items-center justify-between rounded-lg border border-[var(--card-border)] bg-white/[0.03] px-3 py-2 text-sm">
              <span className="display-mono">{item.symbol}</span>
              <MetricBadge variant={item.drift > 0 ? "warning" : "success"}>
                {item.drift > 0 ? "Acima do alvo" : "Abaixo do alvo"} {Math.abs(item.drift).toFixed(1)}%
              </MetricBadge>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Link href="/settings" className="text-xs text-[var(--text-muted)] underline underline-offset-4 hover:text-[var(--text-primary)]">
          Ajustar metas de alocação
        </Link>
      </div>
    </GlassCard>
  );
}
