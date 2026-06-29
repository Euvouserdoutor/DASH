"use client";

import { useSyncExternalStore } from "react";

import { safeNumber } from "@/lib/formatters";

const STORAGE_KEY = "dash.manual.portfolio.v1";

export type ManualHolding = {
  id: string;
  assetId: string;
  symbol: string;
  name: string;
  account: string;
  createdAt: string;
  quantity: number;
  avgBuyPrice: number;
  investedAmount?: number;
};

type AddHoldingInput = Omit<ManualHolding, "id" | "createdAt" | "account"> & { account?: string };

type PortfolioSnapshot = {
  holdings: ManualHolding[];
};

type Listener = () => void;

const listeners = new Set<Listener>();
let state: PortfolioSnapshot = { holdings: [] };
let hydrated = false;
const SERVER_SNAPSHOT: PortfolioSnapshot = { holdings: [] };

function emit() {
  for (const listener of listeners) listener();
}

function parseStoredHoldings(raw: string | null): ManualHolding[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as ManualHolding[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        id: String(item.id ?? `h-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`),
        assetId: String(item.assetId ?? ""),
        symbol: String(item.symbol ?? "").toUpperCase(),
        name: String(item.name ?? ""),
        account: String(item.account ?? "Carteira principal").trim() || "Carteira principal",
        createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
        quantity: safeNumber(item.quantity),
        avgBuyPrice: safeNumber(item.avgBuyPrice),
        investedAmount: item.investedAmount !== undefined ? safeNumber(item.investedAmount) : undefined,
      }))
      .filter((item) => item.symbol && item.quantity > 0);
  } catch {
    return [];
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.holdings));
  } catch {
    // Storage can be unavailable in private mode or restricted browser contexts.
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    state = { holdings: parseStoredHoldings(window.localStorage.getItem(STORAGE_KEY)) };
  } catch {
    state = { holdings: [] };
  }
}

function setHoldings(holdings: ManualHolding[]) {
  state = { holdings };
  persist();
  emit();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function buildId() {
  return `h-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function usePortfolioStore() {
  hydrate();

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addHolding = (input: AddHoldingInput) => {
    const next: ManualHolding = {
      id: buildId(),
      assetId: input.assetId.trim().toLowerCase(),
      symbol: input.symbol.trim().toUpperCase(),
      name: input.name.trim() || input.symbol.trim().toUpperCase(),
      account: input.account?.trim() || "Carteira principal",
      createdAt: new Date().toISOString(),
      quantity: safeNumber(input.quantity),
      avgBuyPrice: safeNumber(input.avgBuyPrice),
      investedAmount: input.investedAmount !== undefined ? safeNumber(input.investedAmount) : undefined,
    };

    if (!next.symbol || next.quantity <= 0 || next.avgBuyPrice <= 0) return;

    setHoldings([...state.holdings, next]);
  };

  const removeHolding = (id: string) => {
    setHoldings(state.holdings.filter((holding) => holding.id !== id));
  };

  const clearHoldings = () => {
    setHoldings([]);
  };

  return {
    holdings: snapshot.holdings,
    addHolding,
    removeHolding,
    clearHoldings,
  };
}
