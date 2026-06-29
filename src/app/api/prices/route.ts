import { NextRequest, NextResponse } from "next/server";

import { getFallbackPricesForInput, getPrices, RateLimitError } from "@/lib/api/coingecko.server";

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids")?.split(",").map((v) => v.trim()).filter(Boolean) ?? [];
  const symbols = req.nextUrl.searchParams.get("symbols")?.split(",").map((v) => v.trim()).filter(Boolean) ?? [];

  try {
    const prices = await getPrices({ ids, symbols });
    return NextResponse.json({ prices, source: "coingecko" }, { status: 200 });
  } catch (error) {
    const fallbackPrices = getFallbackPricesForInput({ ids, symbols });

    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          prices: fallbackPrices,
          source: "fallback",
          warning: "prices_rate_limited",
          message: "Live prices are rate limited. Showing local fallback prices.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        prices: fallbackPrices,
        source: "fallback",
        warning: "prices_unavailable",
        message: "Live prices are unavailable. Showing local fallback prices.",
      },
      { status: 200 },
    );
  }
}
