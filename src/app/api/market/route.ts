import { NextResponse } from "next/server";

import { getFallbackMarketAssets, getMarketAssets, RateLimitError } from "@/lib/api/coingecko.server";

export async function GET() {
  try {
    const assets = await getMarketAssets();
    return NextResponse.json({ assets, source: "coingecko" }, { status: 200 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          assets: getFallbackMarketAssets(),
          source: "fallback",
          warning: "market_data_rate_limited",
          message: "Live market data is rate limited. Showing local fallback prices.",
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
