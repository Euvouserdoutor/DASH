"use client";

import { useEffect, useMemo, useState } from "react";

import type { MarketAsset } from "@/types/market";

type ChartPoint = { timestamp: string; price: number };
type ChartRange = "1" | "7" | "30";

type UseMarketDataResult = {
  assets: MarketAsset[];
  isLoading: boolean;
  hasError: boolean;
  marketSource: "coingecko" | "fallback" | null;
  marketWarning: string | null;
  topGainers: MarketAsset[];
  topLosers: MarketAsset[];
  btcChart: ChartPoint[];
  isChartLoading: boolean;
  lastUpdatedAt: string | null;
  chartRange: ChartRange;
  setChartRange: (range: ChartRange) => void;
};

export function useMarketData(): UseMarketDataResult {
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [marketSource, setMarketSource] = useState<"coingecko" | "fallback" | null>(null);
  const [marketWarning, setMarketWarning] = useState<string | null>(null);
  const [btcChart, setBtcChart] = useState<ChartPoint[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<ChartRange>("1");

  useEffect(() => {
    let cancelled = false;

    const loadMarket = async (initial = false) => {
      if (initial) setIsLoading(true);
      try {
        const res = await fetch("/api/market", { cache: "no-store" });
        if (!res.ok || cancelled) {
          setHasError(true);
          return;
        }
        const data = (await res.json()) as {
          assets?: MarketAsset[];
          source?: "coingecko" | "fallback";
          warning?: string;
        };
        setAssets(data.assets ?? []);
        setMarketSource(data.source ?? null);
        setMarketWarning(data.warning ?? null);
        setHasError(data.source === "fallback");
        setLastUpdatedAt(new Date().toISOString());
      } catch {
        if (!cancelled) {
          setHasError(true);
          setMarketWarning("market_request_failed");
        }
      } finally {
        if (!cancelled && initial) setIsLoading(false);
      }
    };

    const loadChart = async (initial = false) => {
      if (initial) setIsChartLoading(true);
      try {
        const res = await fetch(`/api/chart/bitcoin?days=${chartRange}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { points?: ChartPoint[] };
        setBtcChart(data.points ?? []);
      } catch {
        if (!cancelled) setBtcChart([]);
      } finally {
        if (!cancelled && initial) setIsChartLoading(false);
      }
    };

    loadMarket(true);
    loadChart(true);

    const interval = window.setInterval(() => {
      if (cancelled) return;
      loadMarket(false);
      loadChart(false);
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [chartRange]);

  const { topGainers, topLosers } = useMemo(() => {
    const sorted = [...assets].sort((a, b) => b.priceChange24hPct - a.priceChange24hPct);
    return {
      topGainers: sorted.slice(0, 3),
      topLosers: [...sorted].reverse().slice(0, 3),
    };
  }, [assets]);

  return {
    assets,
    isLoading,
    hasError,
    marketSource,
    marketWarning,
    topGainers,
    topLosers,
    btcChart,
    isChartLoading,
    lastUpdatedAt,
    chartRange,
    setChartRange,
  };
}
