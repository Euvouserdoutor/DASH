import { GlassCard } from "@/components/ui/GlassCard";

const bitcoin = [74, 77, 70, 82, 81, 95, 77, 81, 83, 79, 86, 84];
const market = [44, 42, 46, 39, 41, 50, 40, 38, 39, 41, 37, 40];
const months = ["Jul", "Ago", "Set", "Out", "Nov", "Dez", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];

function points(values: number[]) {
  const left = 42;
  const width = 720;
  const height = 148;
  return values.map((value, index) => `${(left + index / (values.length - 1) * (width - left)).toFixed(1)},${(height - value / 100 * height).toFixed(1)}`).join(" ");
}

export function AssetChartCard() {
  const bitcoinPoints = points(bitcoin);
  const marketPoints = points(market);

  return <GlassCard className="h-[278px] overflow-hidden p-4">
    <div className="flex items-start justify-between">
      <div><h3 className="text-sm font-semibold">Bitcoin vs Mercado</h3><p className="mt-0.5 text-xs text-[var(--text-muted)]">Comparativo mensal de tendência</p></div>
      <button type="button" className="grid size-7 place-items-center rounded-md text-sm text-[var(--text-muted)]" aria-label="Mais opções">...</button>
    </div>
    <div className="mt-3 h-[165px]">
      <svg viewBox="0 0 720 176" className="h-[165px] w-full overflow-visible" role="img" aria-label="Comparação mensal entre Bitcoin e mercado">
        <defs>
          <linearGradient id="bitcoinArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3478f6" stopOpacity="0.22" /><stop offset="100%" stopColor="#3478f6" stopOpacity="0" /></linearGradient>
          <linearGradient id="marketArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f2348b" stopOpacity="0.10" /><stop offset="100%" stopColor="#f2348b" stopOpacity="0" /></linearGradient>
        </defs>
        {[[0, "$10k"], [37, "$8k"], [74, "$5k"], [111, "$3k"], [148, "$0"]].map(([y, label]) => <g key={String(label)}><line x1="42" x2="720" y1={Number(y)} y2={Number(y)} stroke="var(--card-border)" strokeDasharray="3 4" /><text x="0" y={Number(y) + 4} fill="var(--text-muted)" fontSize="9">{label}</text></g>)}
        <polygon points={`42,148 ${bitcoinPoints} 720,148`} fill="url(#bitcoinArea)" />
        <polygon points={`42,148 ${marketPoints} 720,148`} fill="url(#marketArea)" />
        <polyline points={bitcoinPoints} fill="none" stroke="var(--chart-blue)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
        <polyline points={marketPoints} fill="none" stroke="var(--chart-pink)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
        {months.map((month, index) => <text key={month} x={42 + index / (months.length - 1) * 678} y="169" textAnchor="middle" fill="var(--text-muted)" fontSize="9">{month}</text>)}
      </svg>
    </div>
    <div className="mt-2 flex items-center justify-center gap-5 text-xs text-[var(--text-muted)]"><span className="flex items-center gap-1.5"><i className="size-2 rounded-sm bg-[var(--chart-blue)]" />Bitcoin</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-sm bg-[var(--chart-pink)]" />Mercado</span></div>
  </GlassCard>;
}
