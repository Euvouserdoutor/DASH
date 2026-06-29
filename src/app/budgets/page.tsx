"use client";

import { useMemo, useState } from "react";

import { MetricCard } from "@/components/dashboard/MetricCard";
import { AppShell } from "@/components/shell/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { usePortfolioInsights } from "@/hooks/usePortfolioInsights";
import { useSettingsStore } from "@/store/settingsStore";

const palette = ["var(--chart-orange)", "var(--chart-blue)", "var(--profit-green)", "var(--chart-cyan)", "var(--warning-amber)"];

export default function BudgetsPage() {
  const { rows } = usePortfolioInsights();
  const { targetAllocations, setTargetAllocation } = useSettingsStore();
  const [asset, setAsset] = useState("");
  const [target, setTarget] = useState("");
  const plans = useMemo(() => Array.from(new Set([...Object.keys(targetAllocations), ...rows.map((row) => row.symbol.toUpperCase())])).map((symbol) => { const current = rows.find((row) => row.symbol.toUpperCase() === symbol)?.allocationPct ?? 0; const planned = targetAllocations[symbol] ?? 0; return { symbol, planned, current, progress: planned > 0 ? Math.min(100, (current / planned) * 100) : 0 }; }).sort((a, b) => b.current - a.current), [rows, targetAllocations]);
  const plannedTotal = plans.reduce((sum, plan) => sum + plan.planned, 0);
  const currentTotal = plans.reduce((sum, plan) => sum + plan.current, 0);
  function addTarget(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const symbol = asset.trim().toUpperCase(); const value = Number(target); if (!symbol || !Number.isFinite(value) || value < 0) return; setTargetAllocation(symbol, value); setAsset(""); setTarget(""); }
  return <AppShell title="Plano de aportes">
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Alocação planejada" value={plannedTotal} valuePrefix="" changeLabel="Metas configuradas" changeVariant="neutral" /><MetricCard label="Alocação atual" value={currentTotal} valuePrefix="" changeLabel="Carteira local" changeVariant="success" /><MetricCard label="Ativos no plano" value={plans.length} valuePrefix="" changeLabel="Sincronizados com carteira" changeVariant="neutral" /><MetricCard label="Desvio médio" value={plans.length ? plans.reduce((sum, plan) => sum + Math.abs(plan.current - plan.planned), 0) / plans.length : 0} valuePrefix="" changeLabel="Pontos percentuais" changeVariant="warning" /></section>
    <GlassCard className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-[var(--card-border)] p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-base font-semibold">Metas de alocação</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Cada moeda adicionada à carteira aparece aqui automaticamente.</p></div><span className="text-xs text-[var(--text-muted)]">Total planejado: {plannedTotal.toFixed(1)}%</span></div><div className="grid gap-px bg-[var(--card-border)] sm:grid-cols-2 xl:grid-cols-4">{plans.map((plan, index) => <article key={plan.symbol} className="bg-[var(--card-bg)] p-4"><div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-lg bg-white/[0.07] text-xs font-semibold" style={{ color: palette[index % palette.length] }}>{plan.symbol.slice(0, 2)}</span><span className={Math.abs(plan.current - plan.planned) <= 3 ? "text-xs text-[var(--profit-green)]" : "text-xs text-[var(--warning-amber)]"}>{Math.abs(plan.current - plan.planned) <= 3 ? "No alvo" : "Ajustar"}</span></div><div className="mt-5 flex items-end justify-between"><div><p className="display-mono text-lg font-semibold">{plan.current.toFixed(1)}%</p><p className="mt-0.5 text-xs text-[var(--text-muted)]">meta {plan.planned.toFixed(1)}%</p></div><span className="display-mono text-sm" style={{ color: palette[index % palette.length] }}>{plan.progress.toFixed(0)}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full" style={{ width: `${plan.progress}%`, backgroundColor: palette[index % palette.length] }} /></div><label className="mt-4 flex items-center justify-between text-xs text-[var(--text-muted)]">Meta <input type="number" value={plan.planned} min={0} max={100} step={0.5} onChange={(event) => setTargetAllocation(plan.symbol, Number(event.target.value))} className="display-mono w-16 bg-transparent text-right text-[var(--text-primary)] outline-none" /></label></article>)}</div></GlassCard>
    <GlassCard className="p-4"><h2 className="text-base font-semibold">Adicionar meta</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Uma meta nova também alimenta o rebalanceamento e os alertas.</p><form onSubmit={addTarget} className="mt-4 flex max-w-md gap-2"><input value={asset} onChange={(event) => setAsset(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-[var(--card-border)] bg-black/10 px-3 py-2 text-sm outline-none" placeholder="Símbolo (ex.: BTC)" /><input value={target} onChange={(event) => setTarget(event.target.value)} className="w-24 rounded-lg border border-[var(--card-border)] bg-black/10 px-3 py-2 text-right text-sm outline-none" placeholder="Meta %" inputMode="decimal" /><button type="submit" className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black">Adicionar</button></form></GlassCard>
  </AppShell>;
}
