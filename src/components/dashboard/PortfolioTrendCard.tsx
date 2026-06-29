"use client";

import { useEffect, useMemo, useState } from "react";

import { GlassCard } from "@/components/ui/GlassCard";
import { MetricBadge } from "@/components/ui/MetricBadge";
import { fmtCurrency } from "@/lib/formatters";

type PortfolioTrendCardProps = {
  totalBalance: number;
};

type Snapshot = {
  at: string;
  balance: number;
};

const STORAGE_KEY = "dash.portfolio.timeline.v1";

function readSnapshots(): Snapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Snapshot[]) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item) => item && typeof item.balance === "number" && typeof item.at === "string")
      : [];
  } catch {
    return [];
  }
}

export function PortfolioTrendCard({ totalBalance }: PortfolioTrendCardProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  useEffect(() => {
    const current = readSnapshots();
    setSnapshots(current);
  }, []);

  useEffect(() => {
    if (!Number.isFinite(totalBalance) || totalBalance <= 0) return;

    const current = readSnapshots();
    const last = current[current.length - 1];
    const shouldAppend =
      !last ||
      Math.abs(last.balance - totalBalance) / Math.max(1, last.balance) >= 0.002 ||
      Date.now() - new Date(last.at).getTime() > 60_000;

    if (!shouldAppend) return;

    const next = [...current, { at: new Date().toISOString(), balance: totalBalance }].slice(-180);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage can be unavailable in private mode or restricted browser contexts.
    }
    setSnapshots(next);
  }, [totalBalance]);

  const chart = useMemo(() => {
    if (snapshots.length < 2) return null;
    const width = 560;
    const height = 160;
    const values = snapshots.map((item) => item.balance);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);
    const points = snapshots
      .map((item, index) => {
        const x = (index / (snapshots.length - 1)) * width;
        const y = height - ((item.balance - min) / range) * height;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");

    const first = snapshots[0]?.balance ?? totalBalance;
    const last = snapshots[snapshots.length - 1]?.balance ?? totalBalance;
    const changePct = first > 0 ? ((last - first) / first) * 100 : 0;

    return { points, changePct, first, last };
  }, [snapshots, totalBalance]);

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium">Tendência da carteira</h3>
        <MetricBadge variant={chart ? (chart.changePct >= 0 ? "success" : "danger") : "neutral"}>
          {chart ? `${chart.changePct >= 0 ? "+" : ""}${chart.changePct.toFixed(2)}%` : "Coletando"}
        </MetricBadge>
      </div>

      <div className="mt-3 h-40 rounded-xl border border-[var(--card-border)] bg-white/[0.03] p-2">
        {chart ? (
          <svg viewBox="0 0 560 160" className="h-full w-full">
            <polyline fill="none" stroke="url(#portfolioTrendGradient)" strokeWidth="3" points={chart.points} />
            <defs>
              <linearGradient id="portfolioTrendGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
          </svg>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
            Criando histórico local...
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>Início: {chart ? fmtCurrency(chart.first) : "-"}</span>
        <span>Agora: {fmtCurrency(totalBalance)}</span>
      </div>
    </GlassCard>
  );
}
