type GlowOrbProps = {
  className?: string;
  size?: number;
};

export function GlowOrb({ className = "", size = 240 }: GlowOrbProps) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full ${className}`.trim()}
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle, rgba(154, 92, 255, 0.28) 0%, rgba(111, 140, 255, 0.12) 45%, rgba(7, 7, 11, 0) 72%)",
        filter: "blur(8px)",
      }}
    />
  );
}
