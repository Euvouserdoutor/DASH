type SkeletonCardProps = {
  className?: string;
  lines?: number;
};

export function SkeletonCard({ className = "", lines = 3 }: SkeletonCardProps) {
  return (
    <div className={`glass-card subtle-border p-4 ${className}`.trim()}>
      <div className="mb-4 h-4 w-28 animate-pulse rounded bg-white/10" />
      <div className="space-y-2">
        {Array.from({ length: Math.max(1, lines) }).map((_, index) => (
          <div
            key={index}
            className="h-3 animate-pulse rounded bg-white/10"
            style={{ width: `${100 - (index % 3) * 12}%` }}
          />
        ))}
      </div>
    </div>
  );
}
