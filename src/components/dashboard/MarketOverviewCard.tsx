"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { useMarketData } from "@/hooks/useMarketData";
import { fmtCurrency, fmtPct } from "@/lib/formatters";

function SevenDaySparkline({ prices, positive, symbol }: { prices?: number[]; positive: boolean; symbol: string }) {
  const clean = (prices ?? []).filter((price) => Number.isFinite(price) && price > 0);
  if (clean.length < 2) {
    return <span className="text-xs text-[var(--text-muted)]">Gráfico 7d indisponível</span>;
  }
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const span = Math.max(max - min, max * 0.001, 0.0000001);
  const points = clean.map((price, index) => {
    const x = (index / (clean.length - 1)) * 180;
    const y = 50 - ((price - min) / span) * 46;
    return x.toFixed(1) + "," + y.toFixed(1);
  }).join(" ");
  return (
    <svg viewBox="0 0 180 54" className="h-14 w-full" role="img"
      aria-label={`Cotação de ${symbol}: amostras reais dos últimos 7 dias`}>
      <line x1="0" y1="52" x2="180" y2="52" stroke="var(--card-border)" />
      <polyline points={points} fill="none"
        stroke={positive ? "var(--profit-green)" : "var(--loss-red)"}
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MarketOverviewCard() {
  const { assets, isLoading, marketSource, marketWarning, lastUpdatedAt } = useMarketData();
  const quoted = assets.filter((asset) => Number.isFinite(asset.currentPrice) && asset.currentPrice > 0);
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Mercado cripto — preços e tendências</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Cotações e gráficos de 7 dias fornecidos pelo CoinGecko · USD · Sem dados simulados
          </p>
        </div>
        <Link href="/market" className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-white/10">
          Explorar mercado ↗
        </Link>
      </div>

      {quoted.length ? (
        <>
          <div className="mt-3 flex flex-wrap gap-4 border-b border-[var(--card-border)] pb-3 text-xs text-[var(--text-muted)]">
            <span>{quoted.length} ativos com cotação</span>
            <span>{quoted.filter((asset) => asset.priceChange24hPct >= 0).length} em alta nas últimas 24h</span>
            {lastUpdatedAt ? <span>Consultado: {new Date(lastUpdatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span> : null}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {quoted.slice(0, 6).map((asset) => {
              const positive = asset.priceChange24hPct >= 0;
              return (
                <div key={asset.id} className="rounded-xl border border-[var(--card-border)] bg-white/[0.025] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="display-mono text-sm font-semibold">{asset.symbol}</span>
                      <p className="truncate text-[11px] text-[var(--text-muted)]">{asset.name}</p>
                    </div>
                    <span className={positive ? "text-xs text-[var(--profit-green)]" : "text-xs text-[var(--loss-red)]"}>
                      {fmtPct(asset.priceChange24hPct)}
                    </span>
                  </div>
                  <p className="display-mono mt-3 text-lg font-semibold tabular-nums">{fmtCurrency(asset.currentPrice)}</p>
                  <div className="mt-2"><SevenDaySparkline prices={asset.sparkline7d} positive={positive} symbol={asset.symbol} /></div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-[var(--text-muted)]">
                    <span>Cap. mercado</span>
                    <span className="tabular-nums">{asset.marketCap ? fmtCurrency(asset.marketCap) : "Indisponível"}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-[var(--text-muted)]">
                    <span>Volume 24h</span>
                    <span className="tabular-nums">{asset.volume24h ? fmtCurrency(asset.volume24h) : "Indisponível"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-[var(--card-border)] bg-white/[0.025] p-5 text-sm text-[var(--text-muted)]">
          {isLoading ? "Consultando cotações e históricos reais..." :
            "Cotações indisponíveis no momento. Verifique a conectividade com o CoinGecko. Nenhum preço ou gráfico fictício será exibido."}
        </div>
      )}
      {marketSource === "fallback" || marketWarning ? (
        <p className="mt-3 text-xs text-[var(--warning-amber)]">O provedor de mercado não respondeu normalmente. Os dados indisponíveis não são estimados.</p>
      ) : null}
    </GlassCard>
  );
}
