"use client";

import { useEffect, useMemo, useState } from "react";

import { calculateAllocation } from "@/lib/portfolio/calculate-allocation";
import { calculatePnl } from "@/lib/portfolio/calculate-pnl";
import { calculateSummary } from "@/lib/portfolio/calculate-summary";
import { usePortfolioStore } from "@/store/portfolioStore";
import { useWatchlistStore } from "@/store/watchlistStore";
import type { MarketAsset } from "@/types/market";

type InsightHolding = {
  symbol: string;
  value: number;
  allocationPct: number;
  change24h: number;
};

type InsightBaseRow = {
  symbol: string;
  source: "manual";
  value: number;
  pnlValue: number;
  currentPrice: number;
  change24h: number;
};

type RiskLevel = "low" | "medium" | "high";
const STABLE_SYMBOLS = new Set(["USDC", "USDT", "DAI", "FDUSD", "TUSD", "USDE"]);

export function usePortfolioInsights() {
  const { holdings } = usePortfolioStore();
  const { assets: watchlist } = useWatchlistStore();
  const [marketMap, setMarketMap] = useState<Record<string, MarketAsset>>({});
  const idsParam = useMemo(() => [...new Set(holdings.map((item) => item.assetId.trim().toLowerCase()).filter(Boolean))].sort().join(","), [holdings]);

  useEffect(() => {
    let cancelled = false;
    if (!idsParam) {
      setMarketMap({});
      return;
    }

    const load = async () => {
      try {
        const res = await fetch("/api/market?ids=" + encodeURIComponent(idsParam), { cache: "no-store" });
        if (!res.ok) return;

        const data = (await res.json()) as { assets?: MarketAsset[] };
        if (!data.assets || cancelled) return;

        const map: Record<string, MarketAsset> = {};
        for (const asset of data.assets) {
          map[asset.id.toLowerCase()] = asset;
          map[asset.symbol.toUpperCase()] = asset;
        }
        setMarketMap(map);
      } catch {
        if (!cancelled) setMarketMap({});
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [idsParam]);

  const enriched = useMemo(() => {
    const grouped = holdings.reduce<Record<string, InsightBaseRow>>((acc, holding) => {
      const market = marketMap[holding.assetId.toLowerCase()] ?? marketMap[holding.symbol.toUpperCase()];
      if (!market || !Number.isFinite(market.currentPrice) || market.currentPrice <= 0) return acc;
      const currentPrice = market.currentPrice;
      const pnl = calculatePnl({
        quantity: holding.quantity,
        avgBuyPrice: holding.avgBuyPrice,
        currentPrice,
        investedAmount: holding.investedAmount,
      });
      const symbol = holding.symbol.toUpperCase();
      const current = acc[symbol] ?? {
        symbol,
        source: "manual" as const,
        value: 0,
        pnlValue: 0,
        currentPrice,
        change24h: market?.priceChange24hPct ?? 0,
      };

      current.value += pnl.currentValue;
      current.pnlValue += pnl.pnlValue;
      current.currentPrice = currentPrice;
      current.change24h = market?.priceChange24hPct ?? current.change24h;
      acc[symbol] = current;
      return acc;
    }, {});

    const missingQuotes = holdings.filter((holding) => {
      const quote = marketMap[holding.assetId.toLowerCase()] ?? marketMap[holding.symbol.toUpperCase()];
      return !quote || !Number.isFinite(quote.currentPrice) || quote.currentPrice <= 0;
    }).length;
    const withAllocation = calculateAllocation(Object.values(grouped));
    const summary = calculateSummary(
      withAllocation.map((row) => ({
        id: row.symbol.toLowerCase(),
        assetId: row.symbol.toLowerCase(),
        symbol: row.symbol,
        name: row.symbol,
        quantity: 0,
        avgBuyPrice: 0,
        currentPrice: row.currentPrice,
        value: row.value,
        pnlValue: row.pnlValue,
        pnlPct: 0,
        allocationPct: row.allocationPct,
        source: row.source,
      })),
    );

    const topHolding = [...withAllocation].sort((a, b) => b.value - a.value)[0] ?? null;
    const concentration = topHolding?.allocationPct ?? 0;
    const avgChange24h =
      withAllocation.length > 0
        ? withAllocation.reduce((sum, row) => sum + row.change24h, 0) / withAllocation.length
        : 0;

    const watchlistLiveCount = watchlist.filter((asset) => Boolean(marketMap[asset.id.toLowerCase()])).length;
    const stablecoinValue = withAllocation
      .filter((row) => STABLE_SYMBOLS.has(row.symbol.toUpperCase()))
      .reduce((sum, row) => sum + row.value, 0);
    const stablecoinRatio = summary.totalBalance > 0 ? (stablecoinValue / summary.totalBalance) * 100 : 0;

    const riskLevel: RiskLevel =
      concentration >= 55 ? "high" : concentration >= 35 ? "medium" : "low";
    const warnings: string[] = [];
    if (concentration >= 55) warnings.push("Alta concentração em um único ativo");
    if (stablecoinRatio < 10) warnings.push("Baixa reserva em stablecoins");
    if (summary.totalPnlPct <= -15) warnings.push("Perda não realizada superior a 15%");
    if (avgChange24h <= -4) warnings.push("Momentum 24h muito negativo");

    const healthScore = Math.max(
      0,
      Math.min(
        100,
        100
          - Math.max(0, concentration - 30) * 0.9
          - Math.max(0, 10 - stablecoinRatio) * 1.2
          - Math.max(0, -summary.totalPnlPct) * 0.8,
      ),
    );

    return {
      rows: withAllocation as InsightHolding[],
      missingQuotes,
      summary,
      topHolding,
      concentration,
      avgChange24h,
      watchlistCount: watchlist.length,
      watchlistLiveCount,
      stablecoinValue,
      stablecoinRatio,
      healthScore,
      warnings,
      riskLevel,
    };
  }, [holdings, marketMap, watchlist]);

  return enriched;
}
