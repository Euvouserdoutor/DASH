"use client";
import { useEffect, useState } from "react";
import type { CoinbaseBalance, CoinbasePermissionStatus } from "@/types/coinbase";
import { GlassCard } from "@/components/ui/GlassCard";
import { MetricBadge } from "@/components/ui/MetricBadge";

type Payload = {
  status?: CoinbasePermissionStatus;
  balances?: CoinbaseBalance[];
  syncedAt?: string | null;
  message?: string;
};
export function CoinbaseSyncCard() {
  const [status, setStatus] = useState<CoinbasePermissionStatus | null>(null);
  const [balances, setBalances] = useState<CoinbaseBalance[]>([]);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function refresh(endpoint = "/api/coinbase/balances", method = "GET") {
    setBusy(true);
    try {
      const res = await fetch(endpoint, { method, cache: "no-store" });
      const data = (await res.json()) as Payload;
      setStatus(data.status ?? null);
      setBalances(res.ok ? data.balances ?? [] : []);
      setSyncedAt(res.ok ? data.syncedAt ?? null : null);
      setMessage(data.message ?? data.status?.message ?? (res.ok ? "Consulta concluída." : "Consulta indisponível."));
    } catch {
      setStatus(null);
      setBalances([]);
      setSyncedAt(null);
      setMessage("Falha de conexão. Nenhum saldo foi estimado.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    let active = true;
    fetch("/api/coinbase/balances", { cache: "no-store" })
      .then(async (res) => ({ ok: res.ok, data: (await res.json()) as Payload }))
      .then(({ ok, data }) => {
        if (!active) return;
        setStatus(data.status ?? null);
        setBalances(ok ? data.balances ?? [] : []);
        setSyncedAt(ok ? data.syncedAt ?? null : null);
        setMessage(data.status?.message ?? "");
      })
      .catch(() => { if (active) setMessage("Coinbase não disponível."); });
    return () => { active = false; };
  }, []);
  const connected = status?.state === "ready";
  return (
    <GlassCard className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-medium">Coinbase — somente leitura</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Posições da corretora separadas da carteira manual para evitar contagem duplicada.</p>
        </div>
        <MetricBadge variant={connected ? "success" : status?.state === "blocked" ? "danger" : "warning"}>
          {connected ? "Conectada" : status?.state === "blocked" ? "Bloqueada" : "Não configurada"}
        </MetricBadge>
      </div>
      <p className="mt-3 text-xs text-[var(--text-muted)]">{message || "Verificando conexão..."}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-[var(--text-muted)]">{syncedAt ? "Leitura: " + new Date(syncedAt).toLocaleString("pt-BR") : "Sem leitura confirmada"}</span>
        <button type="button" disabled={busy} onClick={() => void refresh("/api/coinbase/sync", "POST")}
          className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs disabled:opacity-50">
          {busy ? "Consultando..." : "Atualizar saldos"}
        </button>
      </div>
      {connected && (
        balances.length ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {balances.map((balance) => (
              <div key={balance.symbol} className="flex items-center justify-between rounded-lg bg-white/5 p-2 text-xs">
                <strong>{balance.symbol}</strong>
                <span className="tabular-nums">{balance.quantity.toLocaleString("pt-BR", { maximumFractionDigits: 8 })}</span>
              </div>
            ))}
          </div>
        ) : <p className="mt-3 text-xs text-[var(--text-muted)]">Nenhum saldo positivo retornado para este portfólio.</p>
      )}
    </GlassCard>
  );
}
