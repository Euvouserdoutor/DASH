type LiveDotProps = {
  isLive?: boolean;
  showLabel?: boolean;
  className?: string;
};

export function LiveDot({ isLive = false, showLabel = false, className = "" }: LiveDotProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isLive ? "bg-[color:var(--profit-green)]" : "bg-[color:var(--text-muted)]/60"}`}
      >
        {isLive ? (
          <span className="absolute inset-0 rounded-full bg-[color:var(--profit-green)] opacity-60 blur-[2px]" />
        ) : null}
      </span>
      {showLabel ? <span className="text-xs text-[var(--text-muted)]">{isLive ? "Ao vivo" : "Offline"}</span> : null}
    </span>
  );
}
