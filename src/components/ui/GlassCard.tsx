import type { PropsWithChildren } from "react";

type GlassCardProps = PropsWithChildren<{
  className?: string;
}>;

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`glass-card subtle-border ${className}`.trim()}
    >
      {children}
    </div>
  );
}
