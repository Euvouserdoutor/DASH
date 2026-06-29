"use client";

import { useMemo, useState } from "react";

import { AppShell } from "@/components/shell/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { LiveDot } from "@/components/ui/LiveDot";
import { MetricBadge } from "@/components/ui/MetricBadge";
import { PriceFlash } from "@/components/ui/PriceFlash";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { fmtCurrency, fmtPct } from "@/lib/formatters";
import { useMarketData } from "@/hooks/useMarketData";

export default function MarketPage() {
  const { assets, isLoading } = useMarketData();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? assets.filter(
          (asset) =>
            asset.symbol.toLowerCase().includes(q) ||
            asset.name.toLowerCase().includes(q) ||
            asset.id.toLowerCase().includes(q),
        )
      : assets;

    return [...base].sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
  }, [assets, query]);

  return (
    <AppShell title="Mercado">
      <div className="space-y-4">
        <GlassCard className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Inteligência de mercado</p>
              <h2 className="mt-1 text-2xl font-semibold">Coin Radar</h2>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar BTC, ETH, SOL..."
              className="w-full max-w-xs rounded-xl border border-[var(--card-border)] bg-white/5 px-3 py-2 text-sm"
            />
          </div>
        </GlassCard>

        {isLoading ? (
          <SkeletonCard className="p-6" lines={8} />
        ) : (
          <GlassCard className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-white/5 text-[var(--text-muted)]">
                  <tr>
                    {["#", "Ativo", "Preço", "24h", "Capitalização", "Volume 24h", "Sinal"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((asset, index) => {
                    const positive = asset.priceChange24hPct >= 0;
                    const signal =
                      Math.abs(asset.priceChange24hPct) > 5
                        ? "High Volatility"
                        : Math.abs(asset.priceChange24hPct) > 2
                          ? "Momentum"
                          : "Stable";
                    const signalVariant =
                      signal === "High Volatility"
                        ? "warning"
                        : signal === "Momentum"
                          ? positive
                            ? "success"
                            : "danger"
                          : "neutral";

                    return (
                      <tr key={asset.id} className={`border-t border-[var(--card-border)]/60 ${index % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                        <td className="tabular-nums px-4 py-3 text-[var(--text-muted)]">{index + 1}</td>
                        <td className="px-4 py-3">
                          <p className="display-mono font-semibold">{asset.symbol}</p>
                          <p className="text-xs text-[var(--text-muted)]">{asset.name}</p>
                        </td>
                        <td className="tabular-nums px-4 py-3">
                          <div className="flex items-center gap-2">
                            <PriceFlash value={asset.currentPrice} formattedValue={fmtCurrency(asset.currentPrice)} />
                            <LiveDot isLive />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <MetricBadge variant={positive ? "success" : "danger"}>{fmtPct(asset.priceChange24hPct)}</MetricBadge>
                        </td>
                        <td className="tabular-nums px-4 py-3">{asset.marketCap ? fmtCurrency(asset.marketCap) : "-"}</td>
                        <td className="tabular-nums px-4 py-3">{asset.volume24h ? fmtCurrency(asset.volume24h) : "-"}</td>
                        <td className="px-4 py-3">
                          <MetricBadge variant={signalVariant}>{signal}</MetricBadge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}
