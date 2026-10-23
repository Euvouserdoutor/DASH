import { getCache, setCache } from "@/lib/api/cache";
import type { MarketAsset, PricePoint } from "@/types/market";

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
const DEFAULT_IDS = ["bitcoin", "ethereum", "solana", "usd-coin", "chainlink", "near"];
const SYMBOL_TO_ID: Record<string, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  sol: "solana",
  usdc: "usd-coin",
  link: "chainlink",
  near: "near",
  aero: "aerodrome-finance",
  bch: "bitcoin-cash",
  cro: "cronos",
  celo: "celo",
  zora: "zora",
  avnt: "avantis",
  usdt: "tether",
};

export class RateLimitError extends Error {}

// Intentionally never manufacture prices or charts when the provider is unavailable.
export function getFallbackMarketAssets(_ids: string[] = DEFAULT_IDS): MarketAsset[] {
  void _ids;
  return [];
}

export function getFallbackPrices(_ids: string[] = DEFAULT_IDS): Record<string, number> {
  void _ids;
  return {};
}

export function getFallbackPricesForInput(_input: { ids?: string[]; symbols?: string[] }): Record<string, number> {
  void _input;
  return {};
}

export function getFallbackAssetChart(_id: string, _days: "1" | "7" | "30" = "1"): PricePoint[] {
  void _id;
  void _days;
  return [];
}

export function normalizeCoinGeckoId(value: string): string {
  const clean = value.trim().toLowerCase();
  return SYMBOL_TO_ID[clean] ?? clean;
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
  sparkline_in_7d?: { price?: number[] };
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
    sparkline: "true",
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
    sparkline7d: (asset.sparkline_in_7d?.price ?? [])
      .map(Number).filter((price) => Number.isFinite(price) && price > 0),
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


type CoinSearchResponse = {
  coins?: Array<{ id: string; symbol: string; name: string; thumb?: string }>;
};

export async function searchCoinGecko(query: string, limit = 15): Promise<MarketAsset[]> {
  const value = query.trim().slice(0, 80);
  if (!value) return getMarketAssets();
  const cached = getCache<MarketAsset[]>("coingecko:search:" + value.toLowerCase());
  if (cached) return cached.slice(0, limit);
  const response = await coingeckoFetch<CoinSearchResponse>(
    "/search?query=" + encodeURIComponent(value), 120,
  );
  const coins = (response.coins ?? []).slice(0, 25).map((coin) => ({
    id: coin.id,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    imageUrl: coin.thumb,
    currentPrice: 0,
    priceChange24hPct: 0,
  }));
  setCache("coingecko:search:" + value.toLowerCase(), coins, 120_000);
  return coins.slice(0, limit);
}
