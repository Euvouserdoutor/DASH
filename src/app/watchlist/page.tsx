import { WatchlistCard } from "@/components/watchlist/WatchlistCard";
import { AppShell } from "@/components/shell/AppShell";

export default function WatchlistPage() {
  return (
    <AppShell title="Lista de observação">
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">DASH Crypto Pulse</p>
          <h2 className="mt-1 text-2xl font-semibold">Ativos favoritos</h2>
        </div>
        <WatchlistCard />
      </div>
    </AppShell>
  );
}
