"use client";

import { AllocationCard } from "@/components/dashboard/AllocationCard";
import { AssetChartCard } from "@/components/dashboard/AssetChartCard";
import { AppShell } from "@/components/shell/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";

const metrics = [
  ["Saldo total", "$24.850", "↗ +12,4% vs mês anterior", "text-[var(--profit-green)]", "▣"],
  ["Aporte mensal", "$8.200", "↗ +8,1% vs mês anterior", "text-[var(--profit-green)]", "↗"],
  ["P&L mensal", "$3.740", "↘ -4,3% vs mês anterior", "text-[var(--loss-red)]", "↘"],
  ["Taxa de reserva", "54%", "↗ +6,2% vs mês anterior", "text-[var(--profit-green)]", "%"],
] as const;

const plans = [
  ["Bitcoin", "$920", "$80 restantes", 92, "#ff7a33", "₿"], ["Ethereum", "$1.200", "$0 restantes", 100, "#3478f6", "Ξ"], ["Solana", "$380", "$120 restantes", 76, "#42c6d6", "◎"], ["USDC", "$540", "$60 restantes", 90, "#9a61df", "$"],
  ["Chainlink", "$240", "$60 restantes", 80, "#4cb778", "⛓"], ["Polygon", "$180", "$70 restantes", 72, "#ff5277", "◌"], ["Arbitrum", "$0", "Não iniciado", 0, "#6b7280", "△"], ["Base", "$0", "Não iniciado", 0, "#6b7280", "▣"],
] as const;

function ProgressRing({ value, color }: { value: number; color: string }) {
  return <div className="relative grid size-[48px] shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${color} ${value}%, #2a2a2a ${value}% 100%)` }}><div className="grid size-[39px] place-items-center rounded-full bg-[var(--card-bg)]"><span className="text-[10px] font-medium" style={{ color }}>{value}%</span></div></div>;
}

export default function DashboardPage() {
  return <AppShell title="Visão geral"><div className="space-y-3">
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, change, tone, icon]) => <GlassCard key={label} className="h-[110px] p-3"><div className="flex items-start justify-between"><p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p><span className={`grid size-7 place-items-center rounded-lg bg-white/[0.05] text-xs ${tone}`}>{icon}</span></div><p className="display-mono mt-2 text-[23px] font-semibold leading-none">{value}</p><p className={`mt-1.5 text-[11px] ${tone}`}>{change}</p></GlassCard>)}</section>
    <section className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(310px,1fr)]"><AssetChartCard /><AllocationCard /></section>
    <GlassCard className="p-4"><div><h2 className="text-sm font-semibold">Plano de aportes</h2><p className="mt-0.5 text-xs text-[var(--text-muted)]">Junho 2025</p></div><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{plans.map(([asset, value, helper, progress, color, initial]) => <article key={asset} className="flex min-h-[79px] items-center gap-3 rounded-xl border border-[var(--card-border)] bg-black/[0.12] p-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg text-sm font-semibold" style={{ color, backgroundColor: `${color}22` }}>{initial}</span><div className="min-w-0 flex-1"><p className="truncate text-[11px] text-[var(--text-muted)]">{asset}</p><p className="display-mono mt-0.5 text-base font-semibold leading-none">{value}</p><p className={`mt-1 text-[10px] ${progress === 0 ? "text-[var(--text-muted)]" : "text-[var(--profit-green)]"}`}>{helper}</p></div><ProgressRing value={progress} color={color} /></article>)}</div></GlassCard>
  </div></AppShell>;
}
