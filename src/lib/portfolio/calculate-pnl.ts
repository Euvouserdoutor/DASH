import { safeNumber } from "@/lib/formatters";

type CalculatePnlInput = {
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  investedAmount?: number;
};

export type PnlResult = {
  investedValue: number;
  currentValue: number;
  pnlValue: number;
  pnlPct: number;
};

export function calculatePnl(input: CalculatePnlInput): PnlResult {
  const quantity = safeNumber(input.quantity);
  const avgBuyPrice = safeNumber(input.avgBuyPrice);
  const currentPrice = safeNumber(input.currentPrice);
  const investedValue = input.investedAmount !== undefined ? safeNumber(input.investedAmount) : quantity * avgBuyPrice;
  const currentValue = quantity * currentPrice;
  const pnlValue = currentValue - investedValue;
  const pnlPct = investedValue > 0 ? (pnlValue / investedValue) * 100 : 0;

  return { investedValue, currentValue, pnlValue, pnlPct };
}
