"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AddHoldingDialog } from "@/components/portfolio/AddHoldingDialog";
import { GlassCard } from "@/components/ui/GlassCard";
import { MetricBadge } from "@/components/ui/MetricBadge";
import { PriceFlash } from "@/components/ui/PriceFlash";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { fmtCurrency, fmtPct, fmtTokenAmount } from "@/lib/formatters";
import { calculateAllocation } from "@/lib/portfolio/calculate-allocation";
import { calculatePnl } from "@/lib/portfolio/calculate-pnl";
import { usePortfolioStore } from "@/store/portfolioStore";
import type { MarketAsset } from "@/types/market";

type TableRow = {
  id: string;
  assetId: string;
  asset: string;
  name: string;
  quantity: number;
  avgBuy: number;
  invested: number;
  currentPrice: number;
  value: number;
  change24h: number;
  pnl: number;
  quoted: boolean;
  allocationPct: number;
};

export function HoldingsTable() {
  const { holdings, removeHolding } = usePortfolioStore();
  const [marketMap, setMarketMap] = useState<Record<string, MarketAsset>>({});
  const [usingFallback, setUsingFallback] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const holdingIds = useMemo(() => [...new Set(holdings.map((holding) => holding.assetId.toLowerCase()).filter(Boolean))].sort().join(","), [holdings]);
  const [sortBy, setSortBy] = useState<"value" | "pnl" | "change24h" | "allocationPct">("value");

  useEffect(() => {
    let cancelled = false;
    if (!holdingIds) {
      setMarketMap({});
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const load = async () => {
      try {
        const res = await fetch("/api/market?ids=" + encodeURIComponent(holdingIds), { cache: "no-store" });
        if (!res.ok) return;

        const data = (await res.json()) as { assets?: MarketAsset[]; source?: "coingecko" | "fallback" };
        if (!data.assets || cancelled) return;

        const map: Record<string, MarketAsset> = {};
        for (const asset of data.assets) {
          map[asset.symbol.toUpperCase()] = asset;
          map[asset.id.toLowerCase()] = asset;
        }

        setMarketMap(map);
        setUsingFallback(data.source !== "coingecko");
      } catch {
        if (!cancelled) { setMarketMap({}); setUsingFallback(true); }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [holdingIds]);

  const rows = useMemo(() => {
    const base = holdings.map((holding) => {
      const bySymbol = marketMap[holding.symbol.toUpperCase()];
      const byId = marketMap[holding.assetId.toLowerCase()];
      const market = bySymbol ?? byId;
      const quoted = Boolean(market && Number.isFinite(market.currentPrice) && market.currentPrice > 0);
      const currentPrice = quoted ? market!.currentPrice : 0;
      const pnl = calculatePnl({
        quantity: holding.quantity,
        avgBuyPrice: holding.avgBuyPrice,
        currentPrice,
        investedAmount: holding.investedAmount,
      });

      return {
        id: holding.id,
        assetId: holding.assetId,
        asset: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        avgBuy: holding.avgBuyPrice,
        invested: holding.investedAmount ?? holding.quantity * holding.avgBuyPrice,
        currentPrice,
        value: quoted ? pnl.currentValue : 0,
        change24h: quoted ? market?.priceChange24hPct ?? 0 : 0,
        pnl: quoted ? pnl.pnlValue : 0,
        quoted,
      };
    });

    const allocated = calculateAllocation(base);
    const term = query.trim().toLowerCase();
    const filtered = term ? allocated.filter((row) => row.asset.toLowerCase().includes(term)) : allocated;

    return [...filtered].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [holdings, marketMap, query, sortBy]);

  if (isLoading) {
    return <SkeletonCard className="p-6" lines={6} />;
  }

  if (rows.length === 0) {
    return (
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium">Posições manuais</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Nenhuma posição manual ainda. Adicione seu primeiro ativo.</p>
          </div>
          <AddHoldingDialog />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-[var(--card-border)] px-4 py-3">
        <div>
          <h3 className="text-base font-medium">Posições</h3>
          <p className="mt-1 text-xs text-[var(--profit-green)]">
            {rows.length} ativos · {rows.filter((row) => row.quoted && row.pnl >= 0).length} positivos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MetricBadge variant={usingFallback ? "warning" : "success"}>{usingFallback ? "Preços fallback" : "Mercado ao vivo"}</MetricBadge>
          <AddHoldingDialog />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--card-border)] px-4 py-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ativo (BTC, ETH...)"
          className="min-w-52 rounded-lg border border-[var(--card-border)] bg-white/5 px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "value" | "pnl" | "change24h" | "allocationPct")}
          className="rounded-lg border border-[var(--card-border)] bg-white/5 px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
        >
          <option value="value">Ordenar: valor</option>
          <option value="pnl">Ordenar: P&amp;L</option>
          <option value="change24h">Ordenar: 24h</option>
          <option value="allocationPct">Ordenar: alocação</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-white/5 text-[var(--text-muted)]">
            <tr>
            {["#", "Ativo", "Quantidade", "Preço médio", "Investido", "Preço atual", "Valor", "Hoje", "P&L", "Carteira", ""].map((h) => (
                <th key={h || "actions"} className="px-4 py-3 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const positive24h = row.change24h >= 0;
              const positivePnl = row.pnl >= 0;

              return (
                <tr
                  key={row.id}
                  className={`border-t border-[var(--card-border)]/60 transition-colors hover:bg-white/5 ${
                    idx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
                  }`}
                >
                  <td className="tabular-nums px-4 py-3 text-[var(--text-muted)]">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/portfolio/${row.asset.toLowerCase()}`} className="group inline-flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-lg bg-[color:var(--accent-violet-blue)] text-xs font-semibold text-white">
                        {row.asset.slice(0, 2)}
                      </span>
                      <span>
                        <span className="block font-medium text-[var(--text-primary)] group-hover:underline">{row.name || row.asset}</span>
                        <span className="block text-xs text-[var(--text-muted)]">{row.asset}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="tabular-nums px-4 py-3">{fmtTokenAmount(row.quantity)}</td>
                  <td className="tabular-nums px-4 py-3">{fmtCurrency(row.avgBuy)}</td>
                  <td className="tabular-nums px-4 py-3">{fmtCurrency(row.invested)}</td>
                  <td className="tabular-nums px-4 py-3">
                    {row.quoted ? <PriceFlash value={row.currentPrice} formattedValue={fmtCurrency(row.currentPrice)} /> : <span className="text-[var(--text-muted)]">Indisponível</span>}
                  </td>
                  <td className="tabular-nums px-4 py-3">
                    {row.quoted ? <PriceFlash value={row.value} formattedValue={fmtCurrency(row.value)} /> : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {row.quoted ? <MetricBadge variant={positive24h ? "success" : "danger"}>{fmtPct(row.change24h)}</MetricBadge> : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {row.quoted ? <div className={positivePnl ? "text-[var(--profit-green)]" : "text-[var(--loss-red)]"}>
                      <p className="tabular-nums font-medium">{fmtCurrency(row.pnl)}</p>
                      <p className="text-xs">{fmtPct(row.invested > 0 ? (row.pnl / row.invested) * 100 : 0)}</p>
                    </div> : "—"}
                  </td>
                  <td className="tabular-nums px-4 py-3">{row.allocationPct.toFixed(2)}%</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => removeHolding(row.id)} className="rounded-lg border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                      Remover
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
