"use client";

import { useMemo, useState } from "react";

import { MetricCard } from "@/components/dashboard/MetricCard";
import { AppShell } from "@/components/shell/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { usePortfolioInsights } from "@/hooks/usePortfolioInsights";

type Period = "1M" | "6M" | "1A";

const performanceByPeriod: Record<Period, number[]> = {
  "1M": [41, 44, 43, 47, 46, 50, 54, 52, 56, 58, 57, 61],
  "6M": [28, 33, 30, 37, 36, 43, 48, 45, 53, 58, 55, 62],
  "1A": [18, 24, 29, 25, 34, 39, 36, 46, 49, 53, 51, 62],
};

const monthly = [
  { month: "Jan", invested: 900, net: 320 },
  { month: "Fev", invested: 1200, net: 410 },
  { month: "Mar", invested: 700, net: -120 },
  { month: "Abr", invested: 1000, net: 520 },
  { month: "Mai", invested: 1400, net: 680 },
  { month: "Jun", invested: 1250, net: 560 },
];

const assetPerformance = [
  { symbol: "BTC", allocation: 42.1, returnPct: 18.4, returnValue: 2150, color: "var(--chart-orange)" },
  { symbol: "ETH", allocation: 27.8, returnPct: 12.6, returnValue: 1080, color: "var(--chart-blue)" },
  { symbol: "SOL", allocation: 11.4, returnPct: 24.2, returnValue: 740, color: "var(--profit-green)" },
  { symbol: "USDC", allocation: 10.1, returnPct: 0, returnValue: 0, color: "var(--chart-cyan)" },
];

function performancePoints(values: number[]) {
  const width = 640;
  const height = 190;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  return values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("6M");
  const insights = usePortfolioInsights();
  const totalInvested = monthly.reduce((sum, item) => sum + item.invested, 0);
  const totalNet = monthly.reduce((sum, item) => sum + item.net, 0);
  const bestMonth = [...monthly].sort((a, b) => b.net - a.net)[0];
  const chartPoints = useMemo(() => performancePoints(performanceByPeriod[period]), [period]);
  const portfolioValue = insights.summary.totalBalance > 0 ? insights.summary.totalBalance : 28090;
  const returnPct = totalInvested > 0 ? (totalNet / totalInvested) * 100 : 0;

  return (
    <AppShell title="Análises">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Valor acompanhado" value={portfolioValue} changeLabel={insights.summary.totalBalance > 0 ? "Carteira local" : "Valor demonstrativo"} changeVariant="neutral" />
        <MetricCard label="Aportes no período" value={totalInvested} changeLabel="Últimos 6 meses" changeVariant="success" />
        <MetricCard label="Resultado líquido" value={totalNet} changeLabel={`${returnPct.toFixed(1)}% sobre aportes`} changeVariant="success" />
        <MetricCard label="Melhor mês" value={bestMonth.net} changeLabel={bestMonth.month} changeVariant="success" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.75fr]">
        <GlassCard className="square-panel overflow-hidden p-4">
          <div className="flex flex-col gap-3 border-b border-[var(--card-border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">Desempenho da carteira</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Evolução consolidada · dados demonstrativos</p>
            </div>
            <div className="flex rounded-lg border border-[var(--card-border)] bg-black/10 p-0.5">
              {(["1M", "6M", "1A"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPeriod(item)}
                  className={`rounded-md px-2.5 py-1.5 text-xs transition ${period === item ? "bg-white/10 text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 h-64">
            <svg viewBox="0 0 640 190" className="h-full w-full" role="img" aria-label="Gráfico de desempenho demonstrativo da carteira">
              <defs>
                <linearGradient id="analyticsLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--chart-blue)" />
                  <stop offset="100%" stopColor="var(--profit-green)" />
                </linearGradient>
                <linearGradient id="analyticsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-blue)" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="var(--chart-blue)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[38, 76, 114, 152].map((y) => <line key={y} x1="0" x2="640" y1={y} y2={y} stroke="var(--card-border)" strokeDasharray="3 5" />)}
              <polygon fill="url(#analyticsFill)" points={`0,190 ${chartPoints} 640,190`} />
              <polyline fill="none" stroke="url(#analyticsLine)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" points={chartPoints} />
            </svg>
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-[var(--text-muted)]">
            <span>Início</span><span>Mar</span><span>Mai</span><span>Agora</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Retorno por ativo</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Distribuição demonstrativa</p>
            </div>
            <span className="text-xs text-[var(--text-muted)]">6 meses</span>
          </div>
          <div className="mt-5 space-y-4">
            {assetPerformance.map((asset) => (
              <div key={asset.symbol}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ backgroundColor: asset.color }} /><span className="display-mono font-medium">{asset.symbol}</span></span>
                  <span className={asset.returnPct > 0 ? "text-[var(--profit-green)]" : "text-[var(--text-muted)]"}>{asset.returnPct > 0 ? "+" : ""}{asset.returnPct.toFixed(1)}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full" style={{ width: `${asset.allocation}%`, backgroundColor: asset.color }} /></div>
                <div className="mt-1 flex justify-between text-xs text-[var(--text-muted)]"><span>{asset.allocation.toFixed(1)}% da carteira</span><span>{asset.returnValue > 0 ? `+$${asset.returnValue.toLocaleString("pt-BR")}` : "Estável"}</span></div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-[var(--card-border)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Resumo mensal</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Aportes e resultado líquido por mês · demonstração.</p>
          </div>
          <span className="text-xs text-[var(--profit-green)]">+${totalNet.toLocaleString("pt-BR")} no período</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-black/10 text-left text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              <tr className="border-b border-[var(--card-border)]"><th className="px-4 py-3 font-medium">Mês</th><th className="px-4 py-3 text-right font-medium">Aportado</th><th className="px-4 py-3 text-right font-medium">Resultado</th><th className="px-4 py-3 font-medium">Desempenho</th></tr>
            </thead>
            <tbody>
              {monthly.map((item) => {
                const rate = item.invested > 0 ? (item.net / item.invested) * 100 : 0;
                const width = Math.min(100, Math.abs(rate) * 3);
                return <tr key={item.month} className="border-b border-[var(--card-border)] transition-colors hover:bg-white/[0.025] last:border-b-0">
                  <td className="px-4 py-3 font-medium">{item.month}</td>
                  <td className="display-mono px-4 py-3 text-right text-[var(--text-primary)]">${item.invested.toLocaleString("pt-BR")}</td>
                  <td className={`display-mono px-4 py-3 text-right ${item.net >= 0 ? "text-[var(--profit-green)]" : "text-[var(--loss-red)]"}`}>{item.net >= 0 ? "+" : "-"}${Math.abs(item.net).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]"><div className={`h-full rounded-full ${item.net >= 0 ? "bg-[var(--profit-green)]" : "bg-[var(--loss-red)]"}`} style={{ width: `${width}%` }} /></div><span className="w-12 text-right text-xs text-[var(--text-muted)]">{rate.toFixed(1)}%</span></div></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </AppShell>
  );
}
