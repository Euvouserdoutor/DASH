"use client";

import { useSyncExternalStore } from "react";

export type WatchlistAsset = {
  id: string;
  symbol: string;
  name: string;
};

const STORAGE_KEY = "dash.watchlist.v1";
type Snapshot = { assets: WatchlistAsset[] };
type Listener = () => void;

const listeners = new Set<Listener>();
let state: Snapshot = { assets: [] };
let hydrated = false;
const SERVER_SNAPSHOT: Snapshot = { assets: [] };

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot(): Snapshot {
  return SERVER_SNAPSHOT;
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as WatchlistAsset[]) : [];
    state = {
      assets: Array.isArray(parsed)
        ? parsed
            .filter((asset) => asset && typeof asset === "object")
            .map((asset) => ({
              id: String(asset.id ?? "").trim().toLowerCase(),
              symbol: String(asset.symbol ?? "").trim().toUpperCase(),
              name: String(asset.name ?? "").trim(),
            }))
            .filter((asset) => asset.id && asset.symbol)
        : [],
    };
  } catch {
    state = { assets: [] };
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.assets));
  } catch {
    // Storage can be unavailable in private mode or restricted browser contexts.
  }
}

function setAssets(assets: WatchlistAsset[]) {
  state = { assets };
  persist();
  emit();
}

export function useWatchlistStore() {
  hydrate();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = (asset: WatchlistAsset) => {
    const next = {
      id: asset.id.trim().toLowerCase(),
      symbol: asset.symbol.trim().toUpperCase(),
      name: asset.name.trim() || asset.symbol.trim().toUpperCase(),
    };
    if (!next.id || !next.symbol || state.assets.some((a) => a.id === next.id)) return;
    setAssets([...state.assets, next]);
  };

  const remove = (id: string) => {
    setAssets(state.assets.filter((a) => a.id !== id));
  };

  const has = (id: string) => state.assets.some((a) => a.id === id);

  return { assets: snapshot.assets, add, remove, has };
}
