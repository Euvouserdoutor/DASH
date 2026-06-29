import { NextResponse } from "next/server";

import { getCoinbasePermissionStatus } from "@/lib/api/coinbase.server";

export async function GET() {
  const status = await getCoinbasePermissionStatus();
  const http = status.state === "not_configured" ? 200 : status.state === "blocked" ? 403 : 200;
  return NextResponse.json({ status }, { status: http });
}
