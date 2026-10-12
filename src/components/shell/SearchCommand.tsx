"use client";

import { useEffect, useMemo, useState } from "react";

import type { MarketAsset } from "@/types/market";
import { useWatchlistStore } from "@/store/watchlistStore";

type SearchCommandProps = {
  triggerClassName?: string;
};

export function SearchCommand({ triggerClassName = "" }: SearchCommandProps) {
  const { add, remove, has } = useWatchlistStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [shortcutHint, setShortcutHint] = useState("Ctrl+K");

  useEffect(() => {
    setShortcutHint(navigator.platform.toLowerCase().includes("mac") ? "⌘K" : "Ctrl+K");

    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isShortcut) return;
      event.preventDefault();
      setOpen((prev) => !prev);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const url = "/api/search?q=" + encodeURIComponent(query.trim()) + "&limit=25";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { results?: MarketAsset[] };
        if (!cancelled) setAssets(data.results ?? []);
      } catch {
        if (!cancelled) setAssets([]);
      }
    }, query.trim() ? 350 : 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [open, query]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return assets;
    return assets.filter(
      (asset) =>
        asset.symbol.toLowerCase().includes(term) ||
        asset.name.toLowerCase().includes(term) ||
        asset.id.toLowerCase().includes(term),
    );
  }, [assets, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-xl border border-[var(--card-border)] bg-white/5 px-3 py-2 text-sm text-[var(--text-muted)] ${triggerClassName}`.trim()}
      >
        Buscar... <span className="ml-2 text-xs">{shortcutHint}</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-20">
          <div className="glass-card subtle-border w-full max-w-2xl p-4">
            <div className="mb-3 flex items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar BTC, ETH, SOL..."
                className="w-full rounded-xl border border-[var(--card-border)] bg-white/5 px-3 py-2 text-sm"
                autoFocus
              />
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--text-muted)]">Fechar</button>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-2 py-4 text-sm text-[var(--text-muted)]">Nenhum ativo encontrado.</p>
              ) : (
                <ul className="space-y-1">
                  {filtered.map((asset) => {
                    const inWatchlist = has(asset.id);
                    return (
                      <li key={asset.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/5">
                        <div>
                          <p className="font-medium">{asset.symbol}</p>
                          <p className="text-xs text-[var(--text-muted)]">{asset.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            inWatchlist
                              ? remove(asset.id)
                              : add({ id: asset.id, symbol: asset.symbol, name: asset.name })
                          }
                          className="rounded-lg border border-[var(--card-border)] px-2 py-1 text-xs"
                        >
                          {inWatchlist ? "Remover" : "Adicionar"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
