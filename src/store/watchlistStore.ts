"use client";

import { useSyncExternalStore } from "react";
import { queueCloudWrite } from "@/lib/client/dash-cloud-sync";

export type WatchlistAsset = {
  id: string;
  symbol: string;
  name: string;
};

type Snapshot = { assets: WatchlistAsset[] };
type Listener = () => void;

const listeners = new Set<Listener>();
let state: Snapshot = { assets: [] };
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

function normalizeAssets(payload: unknown): WatchlistAsset[] {
  if (!Array.isArray(payload)) return [];
  return payload.filter((item) => item && typeof item === "object").map((item) => ({
    id: String(item.id ?? "").trim().toLowerCase(),
    symbol: String(item.symbol ?? "").trim().toUpperCase(),
    name: String(item.name ?? "").trim(),
  })).filter((item) => item.id && item.symbol);
}
function persist() {
  queueCloudWrite("watchlist", state.assets);
}
export function loadWatchlistFromCloud(payload: unknown) {
  state = { assets: normalizeAssets(payload) };
  emit();
}
export function getWatchlistCloudPayload() { return state.assets; }

function setAssets(assets: WatchlistAsset[]) {
  state = { assets };
  persist();
  emit();
}

export function useWatchlistStore() {
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
