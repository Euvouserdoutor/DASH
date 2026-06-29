"use client";

import { useEffect, useState } from "react";

import type { CoinbasePermissionStatus } from "@/types/coinbase";
import { GlassCard } from "@/components/ui/GlassCard";
import { LiveDot } from "@/components/ui/LiveDot";
import { MetricBadge } from "@/components/ui/MetricBadge";

type ApiPayload = { status: CoinbasePermissionStatus };
type SyncPayload = {
  status?: CoinbasePermissionStatus;
  synced?: boolean;
  error?: string;
  message?: string;
};

const defaultStatus: CoinbasePermissionStatus = {
  state: "not_configured",
  connected: false,
  readOnly: false,
  canTrade: false,
  canTransfer: false,
  blocked: true,
  message: "Coinbase não configurada",
  checkedAt: new Date().toISOString(),
};

export function CoinbaseSyncCard() {
  const [status, setStatus] = useState<CoinbasePermissionStatus>(defaultStatus);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/coinbase/permissions", { cache: "no-store" });
        const data = (await res.json()) as ApiPayload;
        if (data.status) setStatus(data.status);
      } catch {
        setStatus(defaultStatus);
      }
    };

    load();
  }, []);

  const badgeVariant = status.state === "ready" ? "success" : status.state === "blocked" ? "danger" : "warning";

  const syncCoinbase = async () => {
    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const res = await fetch("/api/coinbase/sync", { method: "POST", cache: "no-store" });
      const data = (await res.json()) as SyncPayload;
      if (data.status) setStatus(data.status);
      setSyncMessage(data.message ?? (res.ok ? "Coinbase verificada." : "Coinbase indisponível."));
    } catch {
      setSyncMessage("Coinbase indisponível.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-medium">Coinbase</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {status.state === "ready"
              ? "Credenciais somente leitura prontas. Importação real ainda não implementada."
              : "Coinbase não configurada."}
          </p>
        </div>
        <MetricBadge variant={badgeVariant}>{status.state}</MetricBadge>
      </div>

      <div className="mt-4 rounded-xl border border-[var(--card-border)] bg-white/5 p-3">
        <div className="mb-2 flex items-center justify-between">
          <LiveDot isLive={status.state === "ready"} showLabel />
          <button
            type="button"
            onClick={syncCoinbase}
            className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-sm text-[var(--text-muted)] transition hover:bg-white/10 hover:text-[var(--text-primary)]"
          >
            {isSyncing ? "Verificando..." : "Verificar Coinbase"}
          </button>
        </div>
        {syncMessage ? <p className="mb-2 text-xs text-[var(--text-muted)]">{syncMessage}</p> : null}
        <ul className="space-y-1 text-xs text-[var(--text-muted)]">
          <li>- Credenciais apenas no servidor.</li>
          <li>- Permissão de trade desativada.</li>
          <li>- Permissão de transferência desativada.</li>
          <li>- Sem segredos no frontend.</li>
        </ul>
      </div>
    </GlassCard>
  );
}
