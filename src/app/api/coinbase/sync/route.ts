import { NextResponse } from "next/server";

import { getCoinbasePermissionStatus } from "@/lib/api/coinbase.server";

export async function POST() {
  const status = await getCoinbasePermissionStatus();

  if (status.state !== "ready") {
    return NextResponse.json(
      {
        status,
        synced: false,
        error: "coinbase_sync_unavailable",
        message: status.message ?? "Coinbase is not configured for read-only sync.",
      },
      { status: status.state === "blocked" ? 403 : 200 },
    );
  }

  return NextResponse.json(
    {
      status,
      synced: false,
      error: "coinbase_sync_not_implemented",
      message: "Read-only Coinbase sync endpoint is scaffolded, but live account import is not implemented yet.",
    },
    { status: 501 },
  );
}
