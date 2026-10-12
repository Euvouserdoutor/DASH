"use client";
import { GlassCard } from "@/components/ui/GlassCard";
import { useMarketData } from "@/hooks/useMarketData";
import { fmtCurrency } from "@/lib/formatters";

export function AssetChartCard() {
  const { btcChart, chartRange, setChartRange, isChartLoading, marketSource } = useMarketData();
  const valid = btcChart.filter((point) => Number.isFinite(point.price) && point.price > 0);
  const min = valid.length ? Math.min(...valid.map((point) => point.price)) : 0;
  const max = valid.length ? Math.max(...valid.map((point) => point.price)) : 0;
  const span = Math.max(max - min, max * 0.001, 1);
  const points = valid.map((point, index) => {
    const x = valid.length < 2 ? 0 : (index / (valid.length - 1)) * 660;
    const y = 136 - ((point.price - min) / span) * 118;
    return x.toFixed(2) + "," + y.toFixed(2);
  }).join(" ");
  return (
    <GlassCard className="min-h-[278px] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Bitcoin — histórico de preços</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            CoinGecko · {marketSource === "fallback" ? "cotação indisponível" : "USD"}
          </p>
        </div>
        <div className="flex gap-1">
          {(["1", "7", "30"] as const).map((range) => (
            <button type="button" key={range} onClick={() => setChartRange(range)}
              aria-pressed={chartRange === range}
              className={"rounded-md px-2 py-1 text-xs " +
                (chartRange === range ? "bg-white/15 text-white" : "text-[var(--text-muted)] hover:bg-white/5")}>
              {range}d
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 grid h-[165px] place-items-center">
        {valid.length > 1 ? (
          <svg viewBox="0 0 660 148" className="h-full w-full" role="img" aria-label="Histórico real da cotação do Bitcoin">
            <line x1="0" x2="660" y1="136" y2="136" stroke="var(--card-border)" />
            <line x1="0" x2="660" y1="18" y2="18" stroke="var(--card-border)" strokeDasharray="4 4" />
            <polyline points={points} fill="none" stroke="var(--chart-blue)" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <span className="text-sm text-[var(--text-muted)]">
            {isChartLoading ? "Carregando histórico..." : "Histórico indisponível. Nenhuma curva simulada."}
          </span>
        )}
      </div>
      <div className="flex justify-between text-xs text-[var(--text-muted)]">
        <span>Mínimo: {valid.length ? fmtCurrency(min) : "—"}</span>
        <span>Máximo: {valid.length ? fmtCurrency(max) : "—"}</span>
      </div>
    </GlassCard>
  );
}
