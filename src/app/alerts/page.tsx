"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getActiveCloudUserId } from "@/lib/client/dash-cloud-sync";

import { AppShell } from "@/components/shell/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { MetricBadge } from "@/components/ui/MetricBadge";
import { fmtCurrency } from "@/lib/formatters";
import { usePortfolioInsights } from "@/hooks/usePortfolioInsights";
import { useMarketData } from "@/hooks/useMarketData";
import { useAlertsStore } from "@/store/alertsStore";
import { useSettingsStore } from "@/store/settingsStore";
import type { AlertDirection } from "@/types/ui";

type TimelineItem = {
  id: string;
  kind: "price" | "drift";
  symbol: string;
  severity: "high" | "medium";
  message: string;
  eventAt: string;
  suggestedDirection: AlertDirection;
};
type SnoozeMap = Record<string, string>;
const SNOOZE_KEY = "dash.alerts.timeline.snooze.v1";
const ALERTS_EXPORT_VERSION = 1;
const ALERTS_EXPORT_SCHEMA = "dash-alerts";

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function AlertsPage() {
  const { assets } = useMarketData();
  const { alerts, addAlert, removeAlert, toggleAlert, replaceAlerts } = useAlertsStore();
  const { rows } = usePortfolioInsights();
  const { targetAllocations, driftThresholdPct } = useSettingsStore();

  const [symbol, setSymbol] = useState("BTC");
  const [targetPrice, setTargetPrice] = useState("");
  const [direction, setDirection] = useState<AlertDirection>("above");
  const [note, setNote] = useState("");
  const [view, setView] = useState<"all" | "price" | "drift">("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | "high" | "medium">("all");
  const [showSnoozed, setShowSnoozed] = useState(false);
  const [snoozedUntilById, setSnoozedUntilById] = useState<SnoozeMap>({});
  const [toast, setToast] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SNOOZE_KEY + "." + getActiveCloudUserId());
      if (!raw) return;
      const parsed = JSON.parse(raw) as SnoozeMap;
      if (parsed && typeof parsed === "object") setSnoozedUntilById(parsed);
    } catch {
      setSnoozedUntilById({});
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SNOOZE_KEY + "." + getActiveCloudUserId(), JSON.stringify(snoozedUntilById));
    } catch {
      // Storage can be unavailable in private mode or restricted browser contexts.
    }
  }, [snoozedUntilById]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const marketMap = useMemo(() => {
    const map = new Map<string, { id: string; symbol: string; price: number }>();
    for (const asset of assets) {
      map.set(asset.symbol.toUpperCase(), {
        id: asset.id,
        symbol: asset.symbol.toUpperCase(),
        price: asset.currentPrice,
      });
    }
    return map;
  }, [assets]);

  const triggered = useMemo(
    () =>
      alerts.filter((alert) => {
        const current = marketMap.get(alert.symbol)?.price ?? null;
        if (!alert.enabled || current === null) return false;
        return alert.direction === "above" ? current >= alert.targetPrice : current <= alert.targetPrice;
      }),
    [alerts, marketMap],
  );

  const driftAlerts = useMemo(
    () =>
      Object.entries(targetAllocations)
        .map(([symbol, target]) => {
          const current = rows.find((row) => row.symbol.toUpperCase() === symbol)?.allocationPct ?? 0;
          const drift = current - target;
          return { symbol, target, current, drift };
        })
        .filter((item) => Math.abs(item.drift) >= driftThresholdPct)
        .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift)),
    [rows, targetAllocations, driftThresholdPct],
  );

  const timeline = useMemo<TimelineItem[]>(() => {
    const fromPrice: TimelineItem[] = triggered.map((alert) => ({
      id: `price-${alert.id}`,
      kind: "price",
      symbol: alert.symbol,
      severity: "high",
      message: `${alert.symbol} ${alert.direction === "above" ? "crossed above" : "dropped below"} ${fmtCurrency(alert.targetPrice)}`,
      eventAt: alert.createdAt,
      suggestedDirection: alert.direction,
    }));

    const fromDrift: TimelineItem[] = driftAlerts.map((item) => ({
      id: `drift-${item.symbol}`,
      kind: "drift",
      symbol: item.symbol,
      severity: Math.abs(item.drift) >= driftThresholdPct * 1.8 ? "high" : "medium",
      message: `${item.symbol} ${item.drift > 0 ? "overweight" : "underweight"} by ${Math.abs(item.drift).toFixed(2)}%`,
      eventAt: new Date().toISOString(),
      suggestedDirection: item.drift > 0 ? "below" : "above",
    }));

    return [...fromPrice, ...fromDrift]
      .sort((a, b) => {
        if (a.severity !== b.severity) return a.severity === "high" ? -1 : 1;
        return new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime();
      })
      .slice(0, 8);
  }, [triggered, driftAlerts, driftThresholdPct]);

  const visibleTimeline = useMemo(() => {
    const now = Date.now();
    return timeline.filter((item) => {
      const until = snoozedUntilById[item.id];
      const passesSnooze = showSnoozed ? true : !until || new Date(until).getTime() <= now;
      const passesSeverity = severityFilter === "all" ? true : item.severity === severityFilter;
      return passesSnooze && passesSeverity;
    });
  }, [timeline, snoozedUntilById, severityFilter, showSnoozed]);

  const snoozedActive = useMemo(() => {
    const now = Date.now();
    return timeline
      .map((item) => ({ item, until: snoozedUntilById[item.id] }))
      .filter((entry) => entry.until && new Date(entry.until).getTime() > now) as Array<{ item: TimelineItem; until: string }>;
  }, [timeline, snoozedUntilById]);

  const nextUnsnoozeAt = useMemo(() => {
    if (snoozedActive.length === 0) return null;
    return [...snoozedActive]
      .sort((a, b) => new Date(a.until).getTime() - new Date(b.until).getTime())[0]
      ?.until;
  }, [snoozedActive]);

  const pinnedCritical = useMemo(
    () => visibleTimeline.find((item) => item.severity === "high") ?? null,
    [visibleTimeline],
  );

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const found = marketMap.get(symbol.toUpperCase());
    const assetId = found?.id ?? symbol.toLowerCase();

    addAlert({
      assetId,
      symbol: symbol.toUpperCase(),
      targetPrice: Number(targetPrice),
      direction,
      note,
    });

    setTargetPrice("");
    setNote("");
  };

  const applyTimelineQuickAction = (item: TimelineItem) => {
    const current = marketMap.get(item.symbol)?.price ?? 0;
    const target = current > 0 ? current : 0;

    setSymbol(item.symbol);
    setDirection(item.suggestedDirection);
    setTargetPrice(target > 0 ? target.toFixed(2) : "");
    setView("price");
  };

  const snoozeItem = (id: string, minutes: number) => {
    const until = new Date(Date.now() + minutes * 60_000).toISOString();
    setSnoozedUntilById((prev) => ({ ...prev, [id]: until }));
  };

  const unsnoozeItem = (id: string) => {
    setSnoozedUntilById((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setToast("Alert unsnoozed");
  };

  const clearAllSnooze = () => {
    setSnoozedUntilById({});
    setToast("Snooze cleared");
  };

  const exportAlertsJson = async () => {
    const payloadCore = {
      schema: ALERTS_EXPORT_SCHEMA,
      version: ALERTS_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      priceAlerts: alerts,
      snoozedUntilById,
      driftAlerts,
      timeline: visibleTimeline,
    };
    const checksum = await sha256Hex(JSON.stringify(payloadCore));
    const payload = { ...payloadCore, checksum };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `dash-alerts-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setToast("Alerts exported");
  };

  const downloadSampleBackup = () => {
    const sample = {
      schema: ALERTS_EXPORT_SCHEMA,
      version: ALERTS_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      priceAlerts: [
        {
          id: "sample-btc-above",
          assetId: "bitcoin",
          symbol: "BTC",
          targetPrice: 100000,
          direction: "above",
          note: "Breakout trigger sample",
          enabled: true,
          createdAt: new Date().toISOString(),
        },
      ],
      driftAlerts: [],
      timeline: [],
    };
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "dash-alerts-sample-v1.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setToast("Sample backup downloaded");
  };

  const importAlertsJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        schema?: string;
        version?: number;
        priceAlerts?: typeof alerts;
        snoozedUntilById?: SnoozeMap;
        driftAlerts?: unknown;
        timeline?: unknown;
        exportedAt?: string;
        checksum?: string;
      };
      const importVersion = parsed.version ?? 0;
      if (importVersion > 0 && parsed.schema !== ALERTS_EXPORT_SCHEMA) {
        setToast("Invalid schema");
        return;
      }
      if (importVersion !== 0 && importVersion !== ALERTS_EXPORT_VERSION) {
        setToast("Unsupported export version");
        return;
      }
      if (importVersion === ALERTS_EXPORT_VERSION) {
        const providedChecksum = parsed.checksum;
        if (!providedChecksum) {
          setToast("Missing checksum");
          return;
        }
        const payloadCore = {
          schema: parsed.schema,
          version: parsed.version,
          exportedAt: parsed.exportedAt,
          priceAlerts: parsed.priceAlerts,
          snoozedUntilById: parsed.snoozedUntilById,
          driftAlerts: parsed.driftAlerts,
          timeline: parsed.timeline,
        };
        const expectedChecksum = await sha256Hex(JSON.stringify(payloadCore));
        if (expectedChecksum !== providedChecksum) {
          setToast("Checksum mismatch");
          return;
        }
      }
      if (!Array.isArray(parsed.priceAlerts)) {
        setToast("Invalid JSON file");
        return;
      }
      replaceAlerts(parsed.priceAlerts);
      if (parsed.snoozedUntilById && typeof parsed.snoozedUntilById === "object") {
        setSnoozedUntilById(parsed.snoozedUntilById);
      }
      setToast(importVersion === 0 ? "Legacy alerts migrated" : "Alerts imported");
    } catch {
      setToast("Import failed");
    }
  };

  return (
    <AppShell title="Alertas">
      <div className="space-y-4">
        {toast ? (
          <div className="fixed right-4 top-4 z-50 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-xs text-[var(--text-primary)] shadow-lg">
            {toast}
          </div>
        ) : null}
        <GlassCard className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "all", label: "Todos os alertas" },
              { key: "price", label: "Alertas de preço" },
              { key: "drift", label: "Alertas de desvio" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key as "all" | "price" | "drift")}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  view === item.key
                    ? "border-[color:var(--purple-neon)] bg-[color:var(--purple-neon)]/15 text-[var(--text-primary)]"
                    : "border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {item.label}
              </button>
            ))}
            <MetricBadge variant={triggered.length > 0 ? "warning" : "neutral"}>{triggered.length} alertas de preço</MetricBadge>
            <MetricBadge variant={driftAlerts.length > 0 ? "warning" : "success"}>{driftAlerts.length} alertas de desvio</MetricBadge>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Linha do tempo de alertas</h2>
            <div className="flex items-center gap-2">
              <MetricBadge variant={visibleTimeline.length > 0 ? "warning" : "neutral"}>{visibleTimeline.length} eventos</MetricBadge>
              {snoozedActive.length > 0 ? (
                <MetricBadge variant="neutral">
                  {snoozedActive.length} adiados
                  {nextUnsnoozeAt ? ` · próximo ${new Date(nextUnsnoozeAt).toLocaleTimeString()}` : ""}
                </MetricBadge>
              ) : null}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as "all" | "high" | "medium")}
                className="rounded-lg border border-[var(--card-border)] bg-white/5 px-2 py-1 text-xs text-[var(--text-muted)]"
              >
                <option value="all">Severidade: todas</option>
                <option value="high">Severidade: alta</option>
                <option value="medium">Severidade: média</option>
              </select>
              <button
                type="button"
                onClick={() => setShowSnoozed((prev) => !prev)}
                className={`rounded-lg border px-2 py-1 text-xs ${
                  showSnoozed
                    ? "border-[color:var(--purple-neon)] bg-[color:var(--purple-neon)]/15 text-[var(--text-primary)]"
                    : "border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {showSnoozed ? "Ocultar adiados" : "Mostrar adiados"}
              </button>
              <button
                type="button"
                onClick={clearAllSnooze}
                className="rounded-lg border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Restaurar todos
              </button>
              <button
                type="button"
                onClick={exportAlertsJson}
                className="rounded-lg border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Exportar JSON
              </button>
              <button
                type="button"
                onClick={() => importRef.current?.click()}
                className="rounded-lg border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Importar JSON
              </button>
              <button
                type="button"
                onClick={downloadSampleBackup}
                className="rounded-lg border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Baixar exemplo
              </button>
              <input
                ref={importRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void importAlertsJson(file);
                  e.currentTarget.value = "";
                }}
              />
            </div>
          </div>
          {pinnedCritical ? (
            <div className="mb-3 rounded-lg border border-[var(--card-border)] bg-white/[0.04] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">Crítico fixado</p>
              <p className="mt-1 text-sm">{pinnedCritical.message}</p>
            </div>
          ) : null}
          {visibleTimeline.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Nenhum evento ativo na linha do tempo.</p>
          ) : (
            <div className="space-y-2">
              {visibleTimeline.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--card-border)] bg-white/[0.03] px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{item.message}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {item.kind.toUpperCase()} · {new Date(item.eventAt).toLocaleTimeString()}
                      {snoozedUntilById[item.id] && new Date(snoozedUntilById[item.id]).getTime() > Date.now()
                        ? ` · adiado até ${new Date(snoozedUntilById[item.id]).toLocaleTimeString()}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MetricBadge variant={item.severity === "high" ? "danger" : "warning"}>
                      {item.severity.toUpperCase()}
                    </MetricBadge>
                    <button
                      type="button"
                      onClick={() => applyTimelineQuickAction(item)}
                      className="rounded-lg border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      Criar alerta de proteção
                    </button>
                    {snoozedUntilById[item.id] && new Date(snoozedUntilById[item.id]).getTime() > Date.now() ? (
                      <button
                        type="button"
                        onClick={() => unsnoozeItem(item.id)}
                        className="rounded-lg border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      >
                        Restaurar
                      </button>
                    ) : null}
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value > 0) snoozeItem(item.id, value);
                        e.currentTarget.value = "";
                      }}
                      className="rounded-lg border border-[var(--card-border)] bg-white/5 px-2 py-1 text-xs text-[var(--text-muted)]"
                    >
                      <option value="">Adiar</option>
                      <option value="15">15m</option>
                      <option value="60">1h</option>
                      <option value="1440">24h</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {view !== "drift" ? (
        <GlassCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Alertas de preço</h2>
            <MetricBadge variant={triggered.length > 0 ? "warning" : "neutral"}>{triggered.length} acionados</MetricBadge>
          </div>

          <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Símbolo (BTC)"
              className="rounded-xl border border-[var(--card-border)] bg-white/5 px-3 py-2 text-sm"
            />
            <input
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="Preço-alvo"
              className="tabular-nums rounded-xl border border-[var(--card-border)] bg-white/5 px-3 py-2 text-sm"
            />
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as AlertDirection)}
              className="rounded-xl border border-[var(--card-border)] bg-white/5 px-3 py-2 text-sm"
            >
              <option value="above">Acionar quando subir</option>
              <option value="below">Acionar quando cair</option>
            </select>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nota (opcional)"
              className="rounded-xl border border-[var(--card-border)] bg-white/5 px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-xl bg-[color:var(--purple-neon)] px-3 py-2 text-sm font-medium text-white">
              Adicionar alerta
            </button>
          </form>
        </GlassCard>
        ) : null}

        {view !== "drift" ? (
        <GlassCard className="overflow-hidden p-0">
          <div className="border-b border-[var(--card-border)] px-4 py-3">
            <h3 className="text-base font-medium">Alertas ativos</h3>
          </div>
          {alerts.length === 0 ? (
            <p className="px-4 py-5 text-sm text-[var(--text-muted)]">Ainda não há alertas. Crie um acima.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-white/5 text-[var(--text-muted)]">
                  <tr>
                    {['Ativo', 'Atual', 'Regra', 'Alvo', 'Nota', 'Status', 'Ações'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => {
                    const current = marketMap.get(alert.symbol)?.price ?? null;
                    const isTriggered =
                      current !== null &&
                      alert.enabled &&
                      (alert.direction === 'above' ? current >= alert.targetPrice : current <= alert.targetPrice);

                    return (
                      <tr key={alert.id} className="border-t border-[var(--card-border)]/60">
                        <td className="px-4 py-3 font-medium">{alert.symbol}</td>
                        <td className="tabular-nums px-4 py-3">{current !== null ? fmtCurrency(current) : '-'}</td>
                        <td className="px-4 py-3">{alert.direction === 'above' ? 'Acima' : 'Abaixo'}</td>
                        <td className="tabular-nums px-4 py-3">{fmtCurrency(alert.targetPrice)}</td>
                        <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{alert.note || "-"}</td>
                        <td className="px-4 py-3">
                          <MetricBadge variant={isTriggered ? 'warning' : alert.enabled ? 'neutral' : 'danger'}>
                            {isTriggered ? 'Acionado' : alert.enabled ? 'Monitorando' : 'Pausado'}
                          </MetricBadge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleAlert(alert.id)}
                              className="rounded-lg border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--text-muted)]"
                            >
                              {alert.enabled ? 'Pausar' : 'Retomar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeAlert(alert.id)}
                              className="rounded-lg border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--text-muted)]"
                            >
                              Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
        ) : null}

        {view !== "price" ? (
        <GlassCard className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--card-border)] px-4 py-3">
            <h3 className="text-base font-medium">Alertas automáticos de desvio</h3>
            <MetricBadge variant={driftAlerts.length > 0 ? "warning" : "success"}>
              {driftAlerts.length} acionados
            </MetricBadge>
          </div>
          {driftAlerts.length === 0 ? (
            <p className="px-4 py-5 text-sm text-[var(--text-muted)]">Nenhum desvio de alocação acima do limite.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-white/5 text-[var(--text-muted)]">
                  <tr>
                    {["Ativo", "Atual", "Alvo", "Desvio", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {driftAlerts.map((item) => (
                    <tr key={item.symbol} className="border-t border-[var(--card-border)]/60">
                      <td className="px-4 py-3 font-medium">{item.symbol}</td>
                      <td className="tabular-nums px-4 py-3">{item.current.toFixed(2)}%</td>
                      <td className="tabular-nums px-4 py-3">{item.target.toFixed(2)}%</td>
                      <td className="tabular-nums px-4 py-3">{item.drift > 0 ? "+" : ""}{item.drift.toFixed(2)}%</td>
                      <td className="px-4 py-3">
                        <MetricBadge variant={item.drift > 0 ? "warning" : "success"}>
                          {item.drift > 0 ? "Acima do alvo" : "Abaixo do alvo"}
                        </MetricBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="border-t border-[var(--card-border)] px-4 py-3">
            <Link href="/settings" className="text-xs text-[var(--text-muted)] underline underline-offset-4 hover:text-[var(--text-primary)]">
              Ajustar metas e limite
            </Link>
          </div>
        </GlassCard>
        ) : null}
      </div>
    </AppShell>
  );
}
