import { getCurrentUser } from "@/lib/auth/server";
import { NextResponse } from "next/server";
import { getCoinbaseBalances } from "@/lib/api/coinbase.server";
export const runtime = "nodejs";
export async function POST() {
  const user = await getCurrentUser();
  if (!user || !process.env.COINBASE_ALLOWED_USER_ID || user.id !== process.env.COINBASE_ALLOWED_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  }
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
