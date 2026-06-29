import { NextResponse } from "next/server";

import { getCoinbaseBalances } from "@/lib/api/coinbase.server";

export async function GET() {
  const payload = await getCoinbaseBalances();
  const http = payload.status.state === "ready" ? 200 : 200;
  return NextResponse.json(payload, { status: http });
}
