export type AlertDirection = "above" | "below";

export type PriceAlert = {
  id: string;
  assetId: string;
  symbol: string;
  targetPrice: number;
  direction: AlertDirection;
  note?: string;
  enabled: boolean;
  createdAt: string;
};
