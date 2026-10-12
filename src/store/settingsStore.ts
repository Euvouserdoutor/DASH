"use client";

import { useSyncExternalStore } from "react";

import { safeNumber } from "@/lib/formatters";
import { queueCloudWrite } from "@/lib/client/dash-cloud-sync";

const DEFAULT_TARGETS: Record<string, number> = { BTC: 40, ETH: 25, SOL: 10, LINK: 5, USDC: 20 };
const DEFAULT_DRIFT_THRESHOLD = 5;

type DashSettings = {
  targetAllocations: Record<string, number>;
  driftThresholdPct: number;
};

type Listener = () => void;
const listeners = new Set<Listener>();
let state: DashSettings = {
  targetAllocations: DEFAULT_TARGETS,
  driftThresholdPct: DEFAULT_DRIFT_THRESHOLD,
};
const SERVER_SNAPSHOT: DashSettings = {
  targetAllocations: DEFAULT_TARGETS,
  driftThresholdPct: DEFAULT_DRIFT_THRESHOLD,
};

function emit() {
  for (const listener of listeners) listener();
}

function persist() {
  queueCloudWrite("settings", state);
}
export function loadSettingsFromCloud(payload: unknown) {
  const parsed = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Partial<DashSettings> : {};
  const targetAllocations = parsed.targetAllocations && typeof parsed.targetAllocations === "object"
    ? Object.entries(parsed.targetAllocations).reduce<Record<string, number>>((acc, [symbol, value]) => {
      const name = symbol.trim().toUpperCase();
      if (name) acc[name] = Math.max(0, Math.min(100, safeNumber(value)));
      return acc;
    }, {})
    : DEFAULT_TARGETS;
  state = {
    targetAllocations,
    driftThresholdPct: Math.max(0.5, Math.min(30, safeNumber(parsed.driftThresholdPct ?? DEFAULT_DRIFT_THRESHOLD))),
  };
  emit();
}
export function getSettingsCloudPayload() { return state; }

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot(): DashSettings {
  return SERVER_SNAPSHOT;
}

export function useSettingsStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTargetAllocation = (symbol: string, targetPct: number) => {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!cleanSymbol) return;
    const nextTarget = Math.max(0, Math.min(100, safeNumber(targetPct)));
    state = {
      ...state,
      targetAllocations: {
        ...state.targetAllocations,
        [cleanSymbol]: nextTarget,
      },
    };
    persist();
    emit();
  };

  const setDriftThresholdPct = (threshold: number) => {
    state = {
      ...state,
      driftThresholdPct: Math.max(0.5, Math.min(30, safeNumber(threshold))),
    };
    persist();
    emit();
  };

  const resetSettings = () => {
    state = { targetAllocations: DEFAULT_TARGETS, driftThresholdPct: DEFAULT_DRIFT_THRESHOLD };
    persist();
    emit();
  };

  return {
    targetAllocations: snapshot.targetAllocations,
    driftThresholdPct: snapshot.driftThresholdPct,
    setTargetAllocation,
    setDriftThresholdPct,
    resetSettings,
  };
}
