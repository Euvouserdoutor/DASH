import type { PortfolioHolding, PortfolioSummary } from "@/types/portfolio";

const STABLE_SYMBOLS = new Set(["USDC", "USDT", "DAI", "USD"]);

export function calculateSummary(holdings: PortfolioHolding[]): PortfolioSummary {
  const totalBalance = holdings.reduce((sum, holding) => sum + holding.value, 0);
  const totalPnlValue = holdings.reduce((sum, holding) => sum + holding.pnlValue, 0);
  const invested = totalBalance - totalPnlValue;
  const totalPnlPct = invested > 0 ? (totalPnlValue / invested) * 100 : 0;
  const stablecoinsCashValue = holdings
    .filter((holding) => STABLE_SYMBOLS.has(holding.symbol.toUpperCase()))
    .reduce((sum, holding) => sum + holding.value, 0);
  const manualHoldingsValue = holdings
    .filter((holding) => holding.source === "manual")
    .reduce((sum, holding) => sum + holding.value, 0);

  return {
    totalBalance,
    totalPnlValue,
    totalPnlPct,
    change24hValue: 0,
    change24hPct: 0,
    stablecoinsCashValue,
    coinbaseBalance: 0,
    manualHoldingsValue,
    holdingsCount: holdings.length,
    updatedAt: new Date().toISOString(),
  };
}
