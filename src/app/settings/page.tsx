"use client";

import { AppShell } from "@/components/shell/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { useSettingsStore } from "@/store/settingsStore";

export default function SettingsPage() {
  const {
    targetAllocations,
    driftThresholdPct,
    setTargetAllocation,
    setDriftThresholdPct,
    resetSettings,
  } = useSettingsStore();

  const entries = Object.entries(targetAllocations).sort(([a], [b]) => a.localeCompare(b));

  return (
    <AppShell title="Configurações">
      <div className="space-y-4">
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold">Configurações de risco da carteira</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Configure a alocação-alvo e o limite de desvio para sugestões de rebalanceamento.</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {entries.map(([symbol, value]) => (
              <label key={symbol} className="flex items-center justify-between rounded-lg border border-[var(--card-border)] bg-white/[0.03] px-3 py-2 text-sm">
                <span className="display-mono">{symbol}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={Number.isFinite(value) ? value : 0}
                  onChange={(e) => setTargetAllocation(symbol, Number(e.target.value))}
                  className="w-24 rounded-md border border-[var(--card-border)] bg-white/5 px-2 py-1 text-right tabular-nums"
                />
              </label>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-base font-semibold">Limite de alerta de desvio</h3>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="number"
              min={0.5}
              max={30}
              step={0.5}
              value={driftThresholdPct}
              onChange={(e) => setDriftThresholdPct(Number(e.target.value))}
              className="w-28 rounded-md border border-[var(--card-border)] bg-white/5 px-2 py-1 text-right tabular-nums"
            />
            <span className="text-sm text-[var(--text-muted)]">Exibir sugestões quando o desvio ultrapassar este %</span>
          </div>
          <button
            type="button"
            onClick={resetSettings}
            className="mt-4 rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Restaurar padrões
          </button>
        </GlassCard>
      </div>
    </AppShell>
  );
}
