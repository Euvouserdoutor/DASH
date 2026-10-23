import Link from "next/link";

import { AddHoldingDialog } from "@/components/portfolio/AddHoldingDialog";

import { SearchCommand } from "./SearchCommand";

type TopbarProps = {
  title?: string;
};

export function Topbar({ title = "Painel" }: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-[60px] items-center gap-3 border-b border-[var(--card-border)] bg-[var(--bg-secondary)] px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="text-xs text-[var(--text-muted)]">▯</span>
        <span className="text-xs text-[var(--text-muted)]">▦</span>
        <h1 className="truncate text-[13px] font-semibold">{title}</h1>
      </div>

      <div className="hidden md:block">
        <SearchCommand />
      </div>

      <Link
        href="/analytics"
        className="rounded-md border border-[var(--card-border)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition hover:bg-white/10 hover:text-[var(--text-primary)]"
      >
        Último ano
      </Link>

      <Link
        href="/settings"
        className="rounded-md border border-[var(--card-border)] bg-white/5 px-3 py-1.5 text-xs text-[var(--text-primary)] transition hover:bg-white/10"
      >
        Editar layout
      </Link>

      <AddHoldingDialog
        label="Adicionar ativo"
        triggerClassName="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black transition hover:bg-white/90"
      />

    </header>
  );
}
