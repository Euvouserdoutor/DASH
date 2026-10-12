import { NextRequest, NextResponse } from "next/server";

import { getAssetChart, getFallbackAssetChart, RateLimitError } from "@/lib/api/coingecko.server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const daysParam = _req.nextUrl.searchParams.get("days");
  const days = daysParam === "7" || daysParam === "30" ? daysParam : "1";

  try {
    const points = await getAssetChart(id, days);
    return NextResponse.json({ id, days, points, source: "coingecko" }, { status: 200 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          id,
          days,
          points: getFallbackAssetChart(id, days),
          source: "fallback",
          warning: "chart_rate_limited",
          message: "Live chart data is rate limited. No synthetic chart is displayed.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        id,
        days,
        points: getFallbackAssetChart(id, days),
        source: "fallback",
        warning: "chart_unavailable",
        message: "Live chart data is unavailable. Showing local fallback chart.",
      },
      { status: 200 },
    );
  }
}
