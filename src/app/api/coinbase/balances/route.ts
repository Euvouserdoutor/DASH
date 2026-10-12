import { getCurrentUser } from "@/lib/auth/server";
import { NextResponse } from "next/server";
import { getCoinbaseBalances } from "@/lib/api/coinbase.server";
export const runtime = "nodejs";
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !process.env.COINBASE_ALLOWED_USER_ID || user.id !== process.env.COINBASE_ALLOWED_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  }
  const payload = await getCoinbaseBalances();
  return NextResponse.json(payload, {
    status: payload.status.state === "blocked" ? 503 : 200,
    headers: { "Cache-Control": "private, no-store" },
  });
}
