import { getCache, setCache } from "@/lib/api/cache";
import type { MarketAsset, PricePoint } from "@/types/market";

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
const DEFAULT_IDS = ["bitcoin", "ethereum", "solana", "usd-coin", "chainlink", "near"];
const FALLBACK_MARKET_ASSETS: MarketAsset[] = [
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    currentPrice: 105760,
    priceChange24hPct: 2.4,
    marketCap: 2_080_000_000_000,
    volume24h: 42_000_000_000,
  },
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    currentPrice: 3075,
    priceChange24hPct: 1.2,
    marketCap: 370_000_000_000,
    volume24h: 18_000_000_000,
  },
  {
    id: "solana",
    symbol: "SOL",
    name: "Solana",
    currentPrice: 141.11,
    priceChange24hPct: -0.8,
    marketCap: 76_000_000_000,
    volume24h: 4_200_000_000,
  },
  {
    id: "usd-coin",
    symbol: "USDC",
    name: "USDC",
    currentPrice: 1,
    priceChange24hPct: 0.01,
    marketCap: 32_000_000_000,
    volume24h: 5_100_000_000,
  },
  {
    id: "chainlink",
    symbol: "LINK",
    name: "Chainlink",
    currentPrice: 14,
    priceChange24hPct: 0.6,
    marketCap: 8_900_000_000,
    volume24h: 540_000_000,
  },
  {
    id: "near",
    symbol: "NEAR",
    name: "NEAR Protocol",
    currentPrice: 3.35,
    priceChange24hPct: -1.1,
    marketCap: 4_200_000_000,
    volume24h: 210_000_000,
  },
];
const SYMBOL_TO_ID: Record<string, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  sol: "solana",
  usdc: "usd-coin",
  link: "chainlink",
  near: "near",
  aero: "aerodrome-finance",
};

export class RateLimitError extends Error {}

export function getFallbackMarketAssets(ids: string[] = DEFAULT_IDS): MarketAsset[] {
  const wanted = new Set(ids.map((id) => id.toLowerCase()));
  return FALLBACK_MARKET_ASSETS.filter((asset) => wanted.has(asset.id)).map((asset) => ({ ...asset }));
}

export function getFallbackPrices(ids: string[] = DEFAULT_IDS): Record<string, number> {
  const prices: Record<string, number> = {};
  for (const asset of getFallbackMarketAssets(ids)) {
    prices[asset.id] = asset.currentPrice;
  }
  return prices;
}

export function getFallbackPricesForInput(input: { ids?: string[]; symbols?: string[] }): Record<string, number> {
  const fromSymbols = (input.symbols ?? [])
    .map((symbol) => SYMBOL_TO_ID[symbol.toLowerCase()])
    .filter(Boolean);
  const targetIds = Array.from(new Set([...(input.ids ?? []), ...fromSymbols]));
  return getFallbackPrices(targetIds.length > 0 ? targetIds : DEFAULT_IDS);
}

export function getFallbackAssetChart(id: string, days: "1" | "7" | "30" = "1"): PricePoint[] {
  const asset = FALLBACK_MARKET_ASSETS.find((item) => item.id === id) ?? FALLBACK_MARKET_ASSETS[0];
  const pointCount = days === "30" ? 30 : days === "7" ? 14 : 12;
  const intervalMs = days === "1" ? 2 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const now = Date.now();

  return Array.from({ length: pointCount }, (_, index) => {
    const distanceFromEnd = pointCount - index - 1;
    const wave = Math.sin(index / 2) * 0.012;
    const drift = (index - pointCount / 2) * 0.003;
    const price = asset.currentPrice * (1 + wave + drift);

    return {
      timestamp: new Date(now - distanceFromEnd * intervalMs).toISOString(),
      price: Number(price.toFixed(2)),
    };
  });
}

async function coingeckoFetch<T>(path: string, revalidateSeconds: number): Promise<T> {
  const url = `${COINGECKO_BASE_URL}${path}`;
  const headers: HeadersInit = {};

  if (process.env.COINGECKO_API_KEY) {
    headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
  }

  const res = await fetch(url, {
    headers,
    next: { revalidate: revalidateSeconds },
  });

  if (res.status === 429) throw new RateLimitError("CoinGecko rate limit");
  if (!res.ok) throw new Error(`CoinGecko request failed: ${res.status}`);

  return (await res.json()) as T;
}

type CoinGeckoMarket = {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price: number;
  price_change_percentage_24h?: number;
  market_cap?: number;
  total_volume?: number;
  last_updated?: string;
};

export async function getMarketAssets(ids: string[] = DEFAULT_IDS): Promise<MarketAsset[]> {
  const uniqueIds = Array.from(new Set(ids));
  const cacheKey = `coingecko:market:${uniqueIds.join(",")}`;
  const cached = getCache<MarketAsset[]>(cacheKey);
  if (cached) return cached;

  const search = new URLSearchParams({
    vs_currency: "usd",
    ids: uniqueIds.join(","),
    order: "market_cap_desc",
    per_page: String(uniqueIds.length),
    page: "1",
    sparkline: "false",
    price_change_percentage: "24h",
  });

  const data = await coingeckoFetch<CoinGeckoMarket[]>(`/coins/markets?${search.toString()}`, 120);
  const normalized: MarketAsset[] = data.map((asset) => ({
    id: asset.id,
    symbol: asset.symbol.toUpperCase(),
    name: asset.name,
    imageUrl: asset.image,
    currentPrice: Number(asset.current_price ?? 0),
    priceChange24hPct: Number(asset.price_change_percentage_24h ?? 0),
    marketCap: Number(asset.market_cap ?? 0),
    volume24h: Number(asset.total_volume ?? 0),
    updatedAt: asset.last_updated,
  }));

  setCache(cacheKey, normalized, 120_000);
  return normalized;
}

export async function getPrices(input: { ids?: string[]; symbols?: string[] }): Promise<Record<string, number>> {
  const fromSymbols = (input.symbols ?? [])
    .map((s) => SYMBOL_TO_ID[s.toLowerCase()])
    .filter(Boolean);
  const ids = Array.from(new Set([...(input.ids ?? []), ...fromSymbols]));
  const targetIds = ids.length > 0 ? ids : DEFAULT_IDS;

  const cacheKey = `coingecko:prices:${targetIds.join(",")}`;
  const cached = getCache<Record<string, number>>(cacheKey);
  if (cached) return cached;

  const search = new URLSearchParams({
    ids: targetIds.join(","),
    vs_currencies: "usd",
  });

  const data = await coingeckoFetch<Record<string, { usd?: number }>>(`/simple/price?${search.toString()}`, 60);
  const prices: Record<string, number> = {};

  for (const id of targetIds) {
    prices[id] = Number(data[id]?.usd ?? 0);
  }

  setCache(cacheKey, prices, 60_000);
  return prices;
}

export async function getAssetChart(id: string, days: "1" | "7" | "30" = "1"): Promise<PricePoint[]> {
  const cacheKey = `coingecko:chart:${id}:${days}`;
  const cached = getCache<PricePoint[]>(cacheKey);
  if (cached) return cached;

  const search = new URLSearchParams({
    vs_currency: "usd",
    days,
  });

  const data = await coingeckoFetch<{ prices?: [number, number][] }>(`/coins/${id}/market_chart?${search.toString()}`, 300);
  const points: PricePoint[] = (data.prices ?? []).map(([ts, price]) => ({
    timestamp: new Date(ts).toISOString(),
    price: Number(price ?? 0),
  }));

  setCache(cacheKey, points, 300_000);
  return points;
}
