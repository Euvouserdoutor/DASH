"use client";

import { useMemo, useState } from "react";

import { MetricCard } from "@/components/dashboard/MetricCard";
import { AppShell } from "@/components/shell/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { usePortfolioStore } from "@/store/portfolioStore";

export default function TransactionsPage() {
  const { holdings } = usePortfolioStore();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const transactions = useMemo(
    () => holdings
      .map((holding) => ({
        id: holding.id,
        label: `Posição registrada: ${holding.name || holding.symbol}`,
        date: new Date(holding.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
        asset: holding.symbol,
        account: holding.account,
        amount: holding.investedAmount ?? holding.quantity * holding.avgBuyPrice,
      }))
      .sort((a, b) => b.id.localeCompare(a.id)),
    [holdings],
  );
  const filtered = transactions.filter((item) => `${item.label} ${item.asset} ${item.account}`.toLowerCase().includes(query.trim().toLowerCase()));
  const total = transactions.reduce((sum, item) => sum + item.amount, 0);
  const selectedAll = filtered.length > 0 && filtered.every((item) => selected.includes(item.id));

  function toggleAll() {
    setSelected((current) => selectedAll ? current.filter((id) => !filtered.some((item) => item.id === id)) : Array.from(new Set([...current, ...filtered.map((item) => item.id)])));
  }

  return <AppShell title="Transações">
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Aportes registrados" value={total} changeLabel={`${transactions.length} movimentações locais`} changeVariant="success" />
      <MetricCard label="Último aporte" value={transactions[0]?.amount ?? 0} changeLabel={transactions[0]?.asset ?? "Sem movimentações"} changeVariant="neutral" />
      <MetricCard label="Contas utilizadas" value={new Set(transactions.map((item) => item.account)).size} valuePrefix="" changeLabel="Custódias locais" changeVariant="neutral" />
      <MetricCard label="Ativos aportados" value={new Set(transactions.map((item) => item.asset)).size} valuePrefix="" changeLabel="Sincronizado com carteira" changeVariant="success" />
    </section>
    <GlassCard className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[var(--card-border)] p-4 lg:flex-row lg:items-center lg:justify-between">
        <div><h2 className="text-base font-semibold">Movimentações</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Aportes gerados ao adicionar posições na carteira.</p></div>
        <label className="flex h-9 items-center gap-2 rounded-lg border border-[var(--card-border)] bg-black/10 px-3 text-sm text-[var(--text-muted)] sm:w-64"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-faint)]" placeholder="Buscar movimentações" /></label>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm"><thead className="bg-black/10 text-left text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]"><tr className="border-b border-[var(--card-border)]"><th className="w-12 px-4 py-3"><input type="checkbox" checked={selectedAll} onChange={toggleAll} aria-label="Selecionar todas" className="size-4 accent-white" /></th><th className="px-2 py-3 font-medium">Movimentação</th><th className="px-4 py-3 font-medium">Ativo</th><th className="px-4 py-3 font-medium">Conta</th><th className="px-4 py-3 font-medium">Tipo</th><th className="px-4 py-3 text-right font-medium">Valor</th></tr></thead><tbody>
        {filtered.map((item) => <tr key={item.id} className="border-b border-[var(--card-border)] transition-colors hover:bg-white/[0.025] last:border-b-0"><td className="px-4 py-3"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => setSelected((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} aria-label={`Selecionar ${item.label}`} className="size-4 accent-white" /></td><td className="px-2 py-3"><div className="font-medium">{item.label}</div><div className="mt-0.5 text-xs text-[var(--text-muted)]">{item.date}</div></td><td className="display-mono px-4 py-3 font-medium">{item.asset}</td><td className="px-4 py-3"><span className="rounded-full border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--text-muted)]">{item.account}</span></td><td className="px-4 py-3"><span className="rounded-full bg-[color:rgba(53,208,127,0.1)] px-2 py-1 text-xs text-[var(--profit-green)]">Compra</span></td><td className="display-mono px-4 py-3 text-right font-medium text-[var(--profit-green)]">+${item.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>)}
      </tbody></table></div>
      <div className="flex justify-between border-t border-[var(--card-border)] px-4 py-3 text-xs text-[var(--text-muted)]"><span>{filtered.length} de {transactions.length} movimentações exibidas</span><span>{selected.length > 0 ? `${selected.length} selecionada(s)` : "Dados locais"}</span></div>
    </GlassCard>
  </AppShell>;
}
