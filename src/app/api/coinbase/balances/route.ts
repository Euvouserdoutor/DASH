import { NextResponse } from "next/server";
import { getCoinbaseBalances } from "@/lib/api/coinbase.server";
export const runtime = "nodejs";
export async function GET() {
  const payload = await getCoinbaseBalances();
  return NextResponse.json(payload, {
    status: payload.status.state === "blocked" ? 503 : 200,
    headers: { "Cache-Control": "private, no-store" },
  });
}
