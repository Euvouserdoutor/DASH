import { GlassCard } from "@/components/ui/GlassCard";
import { PriceFlash } from "@/components/ui/PriceFlash";

type MetricCardProps = {
  label: string;
  value: number;
  valuePrefix?: string;
  changeLabel?: string;
  changeVariant?: "success" | "danger" | "neutral" | "warning";
};

export function MetricCard({
  label,
  value,
  valuePrefix = "$",
  changeLabel,
  changeVariant = "neutral",
}: MetricCardProps) {
  const icon =
    changeVariant === "success" ? "↗" : changeVariant === "danger" ? "↘" : changeVariant === "warning" ? "!" : "▣";
  const tone =
    changeVariant === "success" ? "text-[var(--profit-green)] bg-[color:rgba(53,208,127,0.1)]" :
      changeVariant === "danger" ? "text-[var(--loss-red)] bg-[color:rgba(255,82,119,0.1)]" :
        changeVariant === "warning" ? "text-[var(--warning-amber)] bg-[color:rgba(246,167,42,0.1)]" :
          "text-[var(--text-muted)] bg-white/[0.05]";

  return (
    <GlassCard className="h-[110px] p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
        <span className={`grid size-7 place-items-center rounded-lg text-xs ${tone}`}>
          {icon}
        </span>
      </div>
      <p className="display-mono tabular-nums mt-2 text-[23px] font-semibold leading-none">
        {valuePrefix}
        <PriceFlash value={value} formattedValue={value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} />
      </p>
      {changeLabel ? (
        <p className={`mt-1.5 text-[11px] ${tone.split(" ")[0]}`}>{changeLabel}</p>
      ) : null}
    </GlassCard>
  );
}
