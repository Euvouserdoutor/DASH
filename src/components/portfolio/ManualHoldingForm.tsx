"use client";

import { type FormEvent, useState } from "react";

import { safeNumber } from "@/lib/formatters";
import type { ManualHolding } from "@/store/portfolioStore";

type ManualHoldingFormProps = {
  onSubmit: (input: Omit<ManualHolding, "id" | "createdAt">) => void;
  onCancel?: () => void;
};

const EMPTY = {
  assetId: "",
  symbol: "",
  name: "",
  account: "Carteira principal",
  quantity: "",
  avgBuyPrice: "",
  investedAmount: "",
};

export function ManualHoldingForm({ onSubmit, onCancel }: ManualHoldingFormProps) {
  const [form, setForm] = useState(EMPTY);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const quantity = safeNumber(form.quantity);
    const avgBuyPrice = safeNumber(form.avgBuyPrice);
    const investedAmount = form.investedAmount.trim() ? safeNumber(form.investedAmount) : undefined;

    if (!form.symbol.trim() || quantity <= 0 || avgBuyPrice <= 0) return;

    onSubmit({
      assetId: form.assetId.trim() || form.symbol.trim().toLowerCase(),
      symbol: form.symbol.trim().toUpperCase(),
      name: form.name.trim() || form.symbol.trim().toUpperCase(),
      account: form.account.trim() || "Carteira principal",
      quantity,
      avgBuyPrice,
      investedAmount,
    });

    setForm(EMPTY);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={form.symbol} onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value }))} placeholder="Símbolo (ex: BTC)" className="rounded-xl border border-[var(--card-border)] bg-white/5 px-3 py-2 text-sm" />
        <input value={form.assetId} onChange={(e) => setForm((p) => ({ ...p, assetId: e.target.value }))} placeholder="Asset ID (ex: bitcoin)" className="rounded-xl border border-[var(--card-border)] bg-white/5 px-3 py-2 text-sm" />
        <input value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} placeholder="Quantidade" className="tabular-nums rounded-xl border border-[var(--card-border)] bg-white/5 px-3 py-2 text-sm" />
        <input value={form.avgBuyPrice} onChange={(e) => setForm((p) => ({ ...p, avgBuyPrice: e.target.value }))} placeholder="Preço médio" className="tabular-nums rounded-xl border border-[var(--card-border)] bg-white/5 px-3 py-2 text-sm" />
        <input value={form.investedAmount} onChange={(e) => setForm((p) => ({ ...p, investedAmount: e.target.value }))} placeholder="Valor investido (opcional)" className="tabular-nums rounded-xl border border-[var(--card-border)] bg-white/5 px-3 py-2 text-sm" />
        <select value={form.account} onChange={(e) => setForm((p) => ({ ...p, account: e.target.value }))} className="rounded-xl border border-[var(--card-border)] bg-white/5 px-3 py-2 text-sm">
          <option>Carteira principal</option>
          <option>Coinbase</option>
          <option>Ledger</option>
          <option>Reserva USDC</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black">Adicionar</button>
        {onCancel ? <button type="button" onClick={onCancel} className="rounded-xl border border-[var(--card-border)] px-3 py-2 text-sm text-[var(--text-muted)]">Cancelar</button> : null}
      </div>
    </form>
  );
}
