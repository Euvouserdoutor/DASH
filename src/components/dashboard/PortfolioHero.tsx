import { GlowOrb } from "@/components/ui/GlowOrb";
import { GlassCard } from "@/components/ui/GlassCard";

export function PortfolioHero() {
  return (
    <GlassCard className="neon-glow relative overflow-hidden p-6 sm:p-7">
      <GlowOrb className="-right-20 -top-24 opacity-90" size={320} />
      <GlowOrb className="-left-20 bottom-0 opacity-70" size={220} />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--text-muted)]">Sua carteira, seus dados</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">DASH Crypto Pulse</h2>
          <p className="mt-2 max-w-xl text-sm text-[var(--text-muted)]">
            Painel consolidado para acompanhar portfólio, alocação, risco e sinais de mercado.
          </p>
        </div>
        <span className="rounded-lg border border-[var(--card-border)] px-3 py-1 text-xs text-[var(--text-muted)]">Dados identificados por fonte</span>
      </div>
    </GlassCard>
  );
}
