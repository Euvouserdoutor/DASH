import { NextResponse } from "next/server";
import { getCoinbasePermissionStatus } from "@/lib/api/coinbase.server";
export const runtime = "nodejs";
export async function GET() {
  const status = await getCoinbasePermissionStatus();
  return NextResponse.json({ status }, {
    status: status.state === "blocked" ? 503 : 200,
    headers: { "Cache-Control": "private, no-store" },
  });
}
