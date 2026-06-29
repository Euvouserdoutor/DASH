import { safeNumber } from "@/lib/formatters";

type ValueHolding = { value: number };

export function calculateAllocation<T extends ValueHolding>(holdings: T[]): Array<T & { allocationPct: number }> {
  const total = holdings.reduce((sum, holding) => sum + safeNumber(holding.value), 0);

  return holdings.map((holding) => ({
    ...holding,
    allocationPct: total > 0 ? (safeNumber(holding.value) / total) * 100 : 0,
  }));
}
