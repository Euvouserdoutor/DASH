"use client";

import { useEffect, useMemo, useState } from "react";

import { fmtCurrency, fmtPct } from "@/lib/formatters";
import { useWatchlistStore } from "@/store/watchlistStore";
import type { MarketAsset } from "@/types/market";
import { GlassCard } from "@/components/ui/GlassCard";
import { LiveDot } from "@/components/ui/LiveDot";
import { MetricBadge } from "@/components/ui/MetricBadge";
import { PriceFlash } from "@/components/ui/PriceFlash";
import { SkeletonCard } from "@/components/ui/SkeletonCard";

type MarketMap = Record<string, MarketAsset>;

export function WatchlistCard() {
  const { assets, remove } = useWatchlistStore();
  const [marketMap, setMarketMap] = useState<MarketMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/market", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { assets?: MarketAsset[] };
        const map: MarketMap = {};
        for (const asset of data.assets ?? []) map[asset.id] = asset;
        setMarketMap(map);
      } catch {
        setMarketMap({});
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const rows = useMemo(
    () =>
      assets.map((asset) => {
        const market = marketMap[asset.id];
        return {
          ...asset,
          currentPrice: market?.currentPrice ?? null,
          change24h: market?.priceChange24hPct ?? null,
        };
      }),
    [assets, marketMap],
  );

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} className="hidden xl:block" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-lg font-medium">Watchlist</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Sua watchlist está vazia. Use Cmd/Ctrl+K para adicionar ativos.</p>
      </GlassCard>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((asset) => {
        const positive = (asset.change24h ?? 0) >= 0;
        return (
          <GlassCard key={asset.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold">{asset.symbol}</p>
                <p className="text-xs text-[var(--text-muted)]">{asset.name}</p>
              </div>
              <button type="button" onClick={() => remove(asset.id)} className="rounded-lg border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--text-muted)]">Remove</button>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="tabular-nums text-xl font-semibold">
                  {asset.currentPrice !== null ? (
                    <PriceFlash value={asset.currentPrice} formattedValue={fmtCurrency(asset.currentPrice)} />
                  ) : (
                    "-"
                  )}
                </p>
                <LiveDot isLive={asset.currentPrice !== null} />
              </div>
              <MetricBadge variant={positive ? "success" : "danger"}>
                {asset.change24h !== null ? fmtPct(asset.change24h) : "No change data"}
              </MetricBadge>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
