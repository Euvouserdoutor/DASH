"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { usePortfolioStore } from "@/store/portfolioStore";

const items = [
  { label: "Visão geral", href: "/dashboard", icon: "▦" },
  { label: "Transações", href: "/transactions", icon: "↔" },
  { label: "Plano de aportes", href: "/budgets", icon: "◔" },
  { label: "Contas", href: "/accounts", icon: "▤" },
  { label: "Análises", href: "/analytics", icon: "▥" },
  { label: "Investimentos", href: "/portfolio", icon: "↗" },
  { label: "Alertas", href: "/alerts", icon: "◇" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { holdings } = usePortfolioStore();
  const accounts = useMemo(
    () => Object.values(holdings.reduce<Record<string, { label: string; value: number }>>((map, holding) => {
      const label = holding.account;
      const current = map[label] ?? { label, value: 0 };
      current.value += holding.investedAmount ?? holding.quantity * holding.avgBuyPrice;
      map[label] = current;
      return map;
    }, {})).sort((a, b) => b.value - a.value).slice(0, 4),
    [holdings],
  );
  const displayedAccounts = accounts;

  return (
    <aside className="flex h-full w-full flex-col bg-[var(--bg-secondary)] p-2">
      <div className="mb-4 flex items-center justify-between gap-2 px-1 py-1">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-white text-sm font-bold text-black">↗</div>
          <h2 className="truncate text-sm font-semibold">DASH Crypto</h2>
        </div>
        <span className="text-xs text-[var(--text-faint)]">⌄</span>
      </div>

      <nav className="space-y-1">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)) ||
            (item.href === "/dashboard" && pathname === "/");

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex h-8 items-center gap-2 rounded-md px-3 text-[13px] transition",
                isActive
                  ? "bg-white/10 text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:bg-white/[0.07] hover:text-[var(--text-primary)]",
              ].join(" ")}
            >
              <span className="w-4 text-center text-xs">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-7 flex items-center justify-between px-3 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
        <span>Carteira</span>
        <span className="text-base leading-none">+</span>
      </div>
      <div className="mt-3 space-y-4 px-3 text-sm">
        {displayedAccounts.length === 0 ? <p className="text-xs text-[var(--text-muted)]">Nenhuma posição registrada</p> : null}
        {displayedAccounts.map((account, index) => (
          <div key={account.label} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className={`size-2 rounded-full ${["bg-[var(--chart-orange)]", "bg-[var(--chart-blue)]", "bg-[var(--profit-green)]", "bg-[var(--chart-cyan)]"][index % 4]}`} />
              <span className="truncate">{account.label}</span>
            </span>
            <span className={`display-mono ${account.value < 0 ? "text-[var(--loss-red)]" : "text-[var(--text-muted)]"}`}>
              {account.value < 0 ? "-" : ""}${Math.abs(account.value).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-2 px-1">
        <Link href="/settings" className="block rounded-md px-3 py-2 text-sm text-[var(--text-muted)] transition hover:bg-white/[0.07] hover:text-[var(--text-primary)]">Configurações</Link>
        <Link href="/alerts" className="block rounded-md px-3 py-2 text-sm text-[var(--text-muted)] transition hover:bg-white/[0.07] hover:text-[var(--text-primary)]">Ajuda</Link>
        <div className="rounded-lg border border-[var(--card-border)] bg-black/10 p-4">
          <h3 className="text-sm font-semibold">Plano DCA</h3>
          <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">Acompanhe aportes, preço médio e exposição por ativo.</p>
        </div>
        <Link href="/settings" className="mt-3 block rounded-md bg-white px-3 py-2 text-center text-xs font-medium text-black">Configurações</Link>
      </div>
    </aside>
  );
}
