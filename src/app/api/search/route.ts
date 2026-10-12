
import { NextRequest, NextResponse } from "next/server";
import { searchCoinGecko, RateLimitError } from "@/lib/api/coingecko.server";
export async function GET(req: NextRequest) {
  const query = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const rawLimit = Number(req.nextUrl.searchParams.get("limit") ?? 15);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(25, rawLimit)) : 15;
  if (query.length > 80) return NextResponse.json({ error: "query_too_long" }, { status: 400 });
  try {
    const results = await searchCoinGecko(query, limit);
    return NextResponse.json({ results, source: "coingecko" });
  } catch (error) {
    return NextResponse.json({
      results: [],
      source: "fallback",
      warning: error instanceof RateLimitError ? "search_rate_limited" : "search_unavailable",
    });
  }
}
