"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LiveDot } from "@/components/ui/LiveDot";
import { MetricBadge } from "@/components/ui/MetricBadge";
import { fmtPct } from "@/lib/formatters";

type RiskPulseCardProps = {
  concentrationPct: number;
  avgChange24h: number;
  healthScore: number;
  warnings: string[];
  riskLevel: "low" | "medium" | "high";
};

export function RiskPulseCard({ concentrationPct, avgChange24h, healthScore, warnings, riskLevel }: RiskPulseCardProps) {
  const variant = riskLevel === "high" ? "danger" : riskLevel === "medium" ? "warning" : "success";
  const label = riskLevel === "high" ? "ALTO" : riskLevel === "medium" ? "MÉDIO" : "BAIXO";

  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-medium">Pulso de risco</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Concentração + variação média do portfólio manual.</p>
        </div>
        <MetricBadge variant={variant}>{label}</MetricBadge>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)]">Concentração principal</span>
          <span className="display-mono tabular-nums font-medium">{concentrationPct.toFixed(2)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)]">Movimento médio 24h</span>
          <span className="display-mono tabular-nums font-medium">{fmtPct(avgChange24h)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)]">Score da carteira</span>
          <span className="display-mono tabular-nums font-medium">{healthScore.toFixed(0)}/100</span>
        </div>
      </div>

      {warnings.length > 0 ? (
        <div className="mt-3 space-y-1 rounded-xl border border-[var(--card-border)] bg-white/[0.03] px-3 py-2">
          {warnings.slice(0, 2).map((warning) => (
            <p key={warning} className="text-xs text-[var(--text-muted)]">- {warning}</p>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-white/5 px-3 py-2">
        <LiveDot isLive showLabel />
        <span className="text-xs text-[var(--text-muted)]">Motor de risco ativo</span>
      </div>
    </GlassCard>
  );
}
