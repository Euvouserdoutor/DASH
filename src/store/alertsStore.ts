"use client";

import { useSyncExternalStore } from "react";

import { safeNumber } from "@/lib/formatters";
import { queueCloudWrite } from "@/lib/client/dash-cloud-sync";
import type { AlertDirection, PriceAlert } from "@/types/ui";


type Snapshot = { alerts: PriceAlert[] };
type Listener = () => void;

const listeners = new Set<Listener>();
let state: Snapshot = { alerts: [] };
const SERVER_SNAPSHOT: Snapshot = { alerts: [] };

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

function persist() {
  queueCloudWrite("alerts", state.alerts);
}
function setAlerts(alerts: PriceAlert[]) {
  state = { alerts };
  persist();
  emit();
}
export function loadAlertsFromCloud(payload: unknown) {
  state = { alerts: normalizeAlerts(Array.isArray(payload) ? payload as PriceAlert[] : []) };
  emit();
}
export function getAlertsCloudPayload() { return state.alerts; }

function buildId() {
  return `a-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeAlerts(alerts: PriceAlert[]) {
  if (!Array.isArray(alerts)) return [];

  return alerts
    .filter((alert) => alert && typeof alert === "object")
    .map((alert) => {
      const symbol = String(alert.symbol || "").trim().toUpperCase();
      const assetId = String(alert.assetId || symbol).trim().toLowerCase();
      return {
        ...alert,
        id: String(alert.id || buildId()),
        assetId,
        symbol,
        targetPrice: safeNumber(alert.targetPrice),
        direction: (alert.direction === "below" ? "below" : "above") as AlertDirection,
        enabled: alert.enabled !== false,
        createdAt: String(alert.createdAt || new Date().toISOString()),
        note: alert.note?.trim() || undefined,
      };
    })
    .filter((alert) => alert.assetId && alert.symbol && alert.targetPrice > 0);
}

export function useAlertsStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addAlert = (input: {
    assetId: string;
    symbol: string;
    targetPrice: number;
    direction: AlertDirection;
    note?: string;
  }) => {
    const next: PriceAlert = {
      id: buildId(),
      assetId: input.assetId.trim().toLowerCase(),
      symbol: input.symbol.trim().toUpperCase(),
      targetPrice: safeNumber(input.targetPrice),
      direction: input.direction,
      note: input.note?.trim() || undefined,
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    if (!next.assetId || !next.symbol || next.targetPrice <= 0) return;

    setAlerts([...state.alerts, next]);
  };

  const removeAlert = (id: string) => {
    setAlerts(state.alerts.filter((alert) => alert.id !== id));
  };

  const toggleAlert = (id: string) => {
    setAlerts(
      state.alerts.map((alert) =>
        alert.id === id
          ? {
              ...alert,
              enabled: !alert.enabled,
            }
          : alert,
      ),
    );
  };

  const replaceAlerts = (nextAlerts: PriceAlert[]) => {
    setAlerts(normalizeAlerts(nextAlerts));
  };

  return {
    alerts: snapshot.alerts,
    addAlert,
    removeAlert,
    toggleAlert,
    replaceAlerts,
  };
}
