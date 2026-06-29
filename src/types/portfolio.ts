export type PortfolioHolding = {
  id: string;
  assetId: string;
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  value: number;
  pnlValue: number;
  pnlPct: number;
  allocationPct: number;
  source: "manual" | "coinbase";
};

export type PortfolioSummary = {
  totalBalance: number;
  totalPnlValue: number;
  totalPnlPct: number;
  change24hValue: number;
  change24hPct: number;
  stablecoinsCashValue: number;
  coinbaseBalance: number;
  manualHoldingsValue: number;
  holdingsCount: number;
  updatedAt: string;
};
