"use client";

import { useEffect, useMemo, useState } from "react";

import { GlassCard } from "@/components/ui/GlassCard";
import { MetricBadge } from "@/components/ui/MetricBadge";
import { fmtCurrency, fmtPct, fmtTokenAmount } from "@/lib/formatters";
import { calculateAllocation } from "@/lib/portfolio/calculate-allocation";
import { calculatePnl } from "@/lib/portfolio/calculate-pnl";
import { usePortfolioStore } from "@/store/portfolioStore";
import type { MarketAsset } from "@/types/market";

type CoinDetailWorkspaceProps = {
  symbol: string;
};

type DcaState = {
  amount: number;
  intervalWeeks: number;
  months: number;
  expectedReturnPct: number;
};

export function CoinDetailWorkspace({ symbol }: CoinDetailWorkspaceProps) {
  const normalizedSymbol = symbol.toUpperCase();
  const { holdings } = usePortfolioStore();
  const [marketMap, setMarketMap] = useState<Record<string, MarketAsset>>({});
  const [chartPoints, setChartPoints] = useState<number[]>([]);
  const assetId = holdings.find((item) => item.symbol.toUpperCase() === normalizedSymbol)?.assetId || normalizedSymbol.toLowerCase();
  const [dca, setDca] = useState<DcaState>({
    amount: 250,
    intervalWeeks: 1,
    months: 12,
    expectedReturnPct: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/market?ids=" + encodeURIComponent(assetId), { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { assets?: MarketAsset[] };
        if (!data.assets || cancelled) return;

        const map: Record<string, MarketAsset> = {};
        for (const asset of data.assets) {
          map[asset.symbol.toUpperCase()] = asset;
          map[asset.id.toLowerCase()] = asset;
        }
        setMarketMap(map);
      } catch {
        // Manual positions remain usable without live pricing.
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/chart/" + encodeURIComponent(assetId) + "?days=30", { cache: "no-store" })
      .then(async (res) => res.ok ? res.json() as Promise<{ points?: { price: number }[] }> : { points: [] })
      .then((data) => { if (!cancelled) setChartPoints((data.points ?? []).filter((point) => point.price > 0).map((point) => point.price)); })
      .catch(() => { if (!cancelled) setChartPoints([]); });
    return () => { cancelled = true; };
  }, [assetId]);

  const detail = useMemo(() => {
    const related = holdings.filter((holding) => holding.symbol.toUpperCase() === normalizedSymbol);
    const holding = related[0] ?? null;
    const market = holding
      ? marketMap[holding.symbol.toUpperCase()] ?? marketMap[holding.assetId.toLowerCase()]
      : marketMap[normalizedSymbol];

    const currentPrice = market && market.currentPrice > 0 ? market.currentPrice : 0;
    const quoted = currentPrice > 0;
    const quantity = related.reduce((sum, item) => sum + item.quantity, 0);
    const invested = related.reduce((sum, item) => sum + (item.investedAmount ?? item.quantity * item.avgBuyPrice), 0);
    const avgBuy = quantity > 0 ? invested / quantity : 0;
    const pnl = calculatePnl({
      quantity,
      avgBuyPrice: avgBuy,
      currentPrice,
      investedAmount: invested,
    });

    const allRows = holdings.map((item) => {
      const itemMarket = marketMap[item.symbol.toUpperCase()] ?? marketMap[item.assetId.toLowerCase()];
      const itemPrice = itemMarket && itemMarket.currentPrice > 0 ? itemMarket.currentPrice : 0;
      const itemPnl = calculatePnl({
        quantity: item.quantity,
        avgBuyPrice: item.avgBuyPrice,
        currentPrice: itemPrice,
        investedAmount: item.investedAmount,
      });
      return { id: item.id, value: itemPnl.currentValue };
    });
    const relatedIds = new Set(related.map((item) => item.id));
    const allocationPct = calculateAllocation(allRows)
      .filter((row) => relatedIds.has(row.id))
      .reduce((sum, row) => sum + row.allocationPct, 0);

    return {
      holding,
      name: holding?.name ?? market?.name ?? normalizedSymbol,
      currentPrice,
      quoted,
      quantity,
      invested,
      avgBuy,
      currentValue: pnl.currentValue,
      unrealized: quoted ? pnl.pnlValue : 0,
      unrealizedPct: quoted && invested > 0 ? (pnl.pnlValue / invested) * 100 : 0,
      todayPct: market?.priceChange24hPct ?? 0,
      allocationPct,
    };
  }, [holdings, marketMap, normalizedSymbol]);

  const dcaResult = useMemo(() => {
    const payments = Math.max(1, Math.round((dca.months * 4.345) / Math.max(1, dca.intervalWeeks)));
    const totalContribution = payments * dca.amount;
    const projectedValue = totalContribution * (1 + dca.expectedReturnPct / 100);
    const projectedCoins = detail.currentPrice > 0 ? totalContribution / detail.currentPrice : 0;
    const newInvested = detail.invested + totalContribution;
    const newQuantity = detail.quantity + projectedCoins;
    const blendedAvg = newQuantity > 0 ? newInvested / newQuantity : 0;

    return {
      payments,
      totalContribution,
      projectedValue,
      projectedCoins,
      blendedAvg,
    };
  }, [dca, detail.currentPrice, detail.invested, detail.quantity]);

  const positive = detail.unrealized >= 0;

  if (!detail.holding) {
    return (
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold">{normalizedSymbol}</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Esta moeda ainda não existe no portfólio manual.</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-xl bg-[color:var(--accent-violet-blue)] font-semibold text-white">
              {normalizedSymbol.slice(0, 2)}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Área do ativo</p>
              <h2 className="mt-1 text-2xl font-semibold">{detail.name}</h2>
              <p className="text-sm text-[var(--text-muted)]">Estratégia de {normalizedSymbol} e simulador DCA</p>
            </div>
          </div>
          <MetricBadge variant={positive ? "success" : "danger"}>{detail.quoted ? fmtPct(detail.unrealizedPct) + " não realizado" : "Cotação indisponível"}</MetricBadge>
        </div>
      </GlassCard>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Valor atual" value={detail.quoted ? fmtCurrency(detail.currentValue) : "Indisponível"} sub={fmtTokenAmount(detail.quantity)} />
        <MetricTile label="Total investido" value={fmtCurrency(detail.invested)} sub="Custo de aquisição" />
        <MetricTile label="Custo médio" value={fmtCurrency(detail.avgBuy)} sub={detail.quoted ? "Preço " + fmtCurrency(detail.currentPrice) : "Preço indisponível"} />
        <MetricTile label="% da carteira" value={`${detail.allocationPct.toFixed(2)}%`} sub={detail.quoted ? "Hoje " + fmtPct(detail.todayPct) : "Sem cotação"} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Detalhe da posição</h3>
              <p className="text-sm text-[var(--text-muted)]">Retorno não realizado, preço médio e exposição.</p>
            </div>
            <MetricBadge variant={positive ? "success" : "danger"}>{detail.quoted ? fmtCurrency(detail.unrealized) : "Indisponível"}</MetricBadge>
          </div>
          <div className="mt-6 h-52 rounded-xl border border-[var(--card-border)] bg-[linear-gradient(180deg,rgba(59,130,246,0.16),transparent)] p-4">
            <div className="flex h-full items-end gap-2">
              {chartPoints.length > 1 ? chartPoints.filter((_, idx) => idx % Math.max(1, Math.floor(chartPoints.length / 40)) === 0).map((price, idx) => {
                const low = Math.min(...chartPoints);
                const high = Math.max(...chartPoints);
                const height = 10 + ((price - low) / Math.max(1, high - low)) * 90;
                return <div key={idx} className="flex-1 rounded-t bg-[color:var(--accent-violet-blue)]/80" style={{ height: height + "%" }} />;
              }) : <p className="self-center text-sm text-[var(--text-muted)]">Histórico indisponível. Sem gráficos simulados.</p>}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <h3 className="font-semibold">Simulador de DCA Estratégico</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Simulação hipotética de aportes; não representa previsão de retorno.</p>
          <div className="mt-4 grid gap-3">
            <NumberField label="Aporte por ciclo" value={dca.amount} onChange={(amount) => setDca((prev) => ({ ...prev, amount }))} />
            <NumberField label="Intervalo em semanas" value={dca.intervalWeeks} onChange={(intervalWeeks) => setDca((prev) => ({ ...prev, intervalWeeks }))} />
            <NumberField label="Meses" value={dca.months} onChange={(months) => setDca((prev) => ({ ...prev, months }))} />
            <NumberField label="Retorno esperado %" value={dca.expectedReturnPct} onChange={(expectedReturnPct) => setDca((prev) => ({ ...prev, expectedReturnPct }))} />
          </div>
          <div className="mt-4 grid gap-2 rounded-xl border border-[var(--card-border)] bg-white/[0.03] p-3 text-sm">
            <ResultRow label="Aportes" value={`${dcaResult.payments} ciclos`} />
            <ResultRow label="Total aportado" value={fmtCurrency(dcaResult.totalContribution)} />
            <ResultRow label="Moedas estimadas" value={detail.quoted ? fmtTokenAmount(dcaResult.projectedCoins) : "—"} />
            <ResultRow label="Novo custo médio" value={detail.quoted ? fmtCurrency(dcaResult.blendedAvg) : "—"} />
            <ResultRow label="Valor projetado" value={fmtCurrency(dcaResult.projectedValue)} />
          </div>
        </GlassCard>
      </section>
    </div>
  );
}

function MetricTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <GlassCard className="p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{sub}</p>
    </GlassCard>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-[var(--text-muted)]">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-lg border border-[var(--card-border)] bg-white/[0.04] px-3 py-2 text-[var(--text-primary)] outline-none"
      />
    </label>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
