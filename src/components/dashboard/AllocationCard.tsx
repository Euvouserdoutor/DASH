import { GlassCard } from "@/components/ui/GlassCard";

const allocation = [
  ["Bitcoin", "$920", "24,6%", "#ff7a33"], ["Ethereum", "$1.200", "32,1%", "#3478f6"], ["Solana", "$380", "10,2%", "#42c6d6"], ["USDC", "$540", "14,4%", "#9a61df"], ["Chainlink", "$240", "6,4%", "#4cb778"], ["Polygon", "$180", "4,8%", "#ff5277"], ["Outros", "$280", "7,5%", "#71717a"],
] as const;
const donut = "conic-gradient(#ff7a33 0 24.6%, #3478f6 24.6% 56.7%, #42c6d6 56.7% 66.9%, #9a61df 66.9% 81.3%, #4cb778 81.3% 87.7%, #ff5277 87.7% 92.5%, #71717a 92.5% 100%)";

export function AllocationCard() {
  return <GlassCard className="h-[278px] p-4"><div><h3 className="text-sm font-semibold">Alocação por ativo</h3><p className="mt-0.5 text-xs text-[var(--text-muted)]">Distribuição atual</p></div><div className="mt-5 grid grid-cols-[140px_1fr] items-center gap-4"><div className="relative mx-auto size-[132px] rounded-full" style={{ background: donut }}><div className="absolute inset-[19px] grid place-items-center rounded-full bg-[var(--card-bg)] text-center"><div><p className="display-mono text-lg font-semibold">$3.7k</p><p className="text-[10px] text-[var(--text-muted)]">Total</p></div></div></div><div className="space-y-2">{allocation.map(([label, value, pct, color]) => <div key={label} className="grid grid-cols-[minmax(0,1fr)_44px_38px] items-center gap-2 text-[11px]"><span className="flex min-w-0 items-center gap-2 text-[var(--text-muted)]"><i className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} /><span className="truncate">{label}</span></span><span className="display-mono text-right text-[var(--text-primary)]">{value}</span><span className="text-right text-[10px] text-[var(--text-muted)]">{pct}</span></div>)}</div></div></GlassCard>;
}
