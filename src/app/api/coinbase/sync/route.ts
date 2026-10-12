import { NextResponse } from "next/server";
import { getCoinbaseBalances } from "@/lib/api/coinbase.server";
export const runtime = "nodejs";
export async function POST() {
  // Read-only refresh. Never writes portfolio data or places orders.
  const data = await getCoinbaseBalances();
  return NextResponse.json({
    ...data,
    synced: data.status.state === "ready",
    message: data.status.message,
  }, {
    status: data.status.state === "blocked" ? 503 : 200,
    headers: { "Cache-Control": "private, no-store" },
  });
}
