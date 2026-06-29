export type PricePoint = {
  timestamp: string;
  price: number;
};

export type MarketAsset = {
  id: string;
  symbol: string;
  name: string;
  imageUrl?: string;
  currentPrice: number;
  priceChange24hPct: number;
  marketCap?: number;
  volume24h?: number;
  sparkline?: PricePoint[];
  updatedAt?: string;
};
