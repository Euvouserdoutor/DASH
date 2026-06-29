import { AppShell } from "@/components/shell/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";

type CoinPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CoinPage({ params }: CoinPageProps) {
  const { id } = await params;

  return (
    <AppShell title={`Coin: ${id.toUpperCase()}`}>
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold">{id.toUpperCase()} Details</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Detalhamento do ativo em construção (chart avançado, risco e correlações).</p>
      </GlassCard>
    </AppShell>
  );
}
