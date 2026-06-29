import { NextRequest, NextResponse } from "next/server";

import { getFallbackMarketAssets, getMarketAssets, RateLimitError } from "@/lib/api/coingecko.server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? 10);
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(25, limitParam)) : 10;

  try {
    const assets = await getMarketAssets();
    const results = query
      ? assets.filter((asset) =>
          asset.id.toLowerCase().includes(query) ||
          asset.symbol.toLowerCase().includes(query) ||
          asset.name.toLowerCase().includes(query),
        )
      : assets;

    return NextResponse.json({ results: results.slice(0, limit), source: "coingecko" }, { status: 200 });
  } catch (error) {
    const assets = getFallbackMarketAssets();
    const results = query
      ? assets.filter((asset) =>
          asset.id.toLowerCase().includes(query) ||
          asset.symbol.toLowerCase().includes(query) ||
          asset.name.toLowerCase().includes(query),
        )
      : assets;

    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          results: results.slice(0, limit),
          source: "fallback",
          warning: "search_rate_limited",
          message: "Live search is rate limited. Showing local fallback assets.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        results: results.slice(0, limit),
        source: "fallback",
        warning: "search_unavailable",
        message: "Live search is unavailable. Showing local fallback assets.",
      },
      { status: 200 },
    );
  }
}
