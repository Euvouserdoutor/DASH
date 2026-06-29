import type { PropsWithChildren } from "react";

type MetricVariant = "success" | "danger" | "neutral" | "warning";

type MetricBadgeProps = PropsWithChildren<{
  variant?: MetricVariant;
  className?: string;
}>;

const variantStyles: Record<MetricVariant, string> = {
  success: "border-[color:var(--profit-green)]/20 bg-[color:var(--profit-green)]/10 text-[color:var(--profit-green)]",
  danger: "border-[color:var(--loss-red)]/20 bg-[color:var(--loss-red)]/10 text-[color:var(--loss-red)]",
  neutral: "border-[var(--card-border)] bg-white/[0.04] text-[var(--text-muted)]",
  warning: "border-[color:var(--warning-amber)]/20 bg-[color:var(--warning-amber)]/10 text-[color:var(--warning-amber)]",
};

export function MetricBadge({ children, variant = "neutral", className = "" }: MetricBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${variantStyles[variant]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
