import { NextRequest, NextResponse } from "next/server";

import { getFallbackMarketAssets, getMarketAssets, normalizeCoinGeckoId, RateLimitError } from "@/lib/api/coingecko.server";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("ids");
  const requested = raw?.split(",").map((item) => normalizeCoinGeckoId(item)).filter(Boolean) ?? [];
  if (raw && (requested.length > 40 || requested.some((id) => !/^[a-z0-9-]{1,80}$/.test(id)))) {
    return NextResponse.json({ error: "invalid_asset_ids" }, { status: 400 });
  }
  try {
    const assets = await getMarketAssets(requested.length ? requested : undefined);
    return NextResponse.json({ assets, source: "coingecko" }, { status: 200 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          assets: getFallbackMarketAssets(),
          source: "fallback",
          warning: "market_data_rate_limited",
          message: "Live market data is rate limited. No fallback prices are displayed.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        assets: getFallbackMarketAssets(),
        source: "fallback",
        warning: "market_data_unavailable",
        message: "Live market data is unavailable. Showing local fallback prices.",
      },
      { status: 200 },
    );
  }
}
