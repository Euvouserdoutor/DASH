"use client";

import { useEffect, useRef, useState } from "react";

type PriceFlashProps = {
  value: number;
  formattedValue?: string;
  className?: string;
};

type FlashState = "up" | "down" | "none";

export function PriceFlash({ value, formattedValue, className = "" }: PriceFlashProps) {
  const previousRef = useRef<number | null>(null);
  const [flash, setFlash] = useState<FlashState>("none");

  useEffect(() => {
    const previous = previousRef.current;
    if (previous !== null) {
      if (value > previous) setFlash("up");
      if (value < previous) setFlash("down");
    }

    previousRef.current = value;

    if (previous !== null && value !== previous) {
      const timer = window.setTimeout(() => setFlash("none"), 400);
      return () => window.clearTimeout(timer);
    }

    return;
  }, [value]);

  const flashClass =
    flash === "up"
      ? "text-[color:var(--profit-green)]"
      : flash === "down"
        ? "text-[color:var(--loss-red)]"
        : "text-[var(--text-primary)]";

  return <span className={`tabular-nums transition-colors duration-300 ${flashClass} ${className}`.trim()}>{formattedValue ?? value}</span>;
}
