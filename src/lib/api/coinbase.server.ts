import type { CoinbaseBalance, CoinbasePermissionStatus } from "@/types/coinbase";
import { getCoinbaseEnvStatus } from "@/lib/security/env.server";
import { validateCoinbasePermissions } from "@/lib/security/validate-coinbase-permissions";

export async function getCoinbasePermissionStatus(): Promise<CoinbasePermissionStatus> {
  const env = getCoinbaseEnvStatus();

  if (!env.configured) {
    return {
      state: "not_configured",
      connected: false,
      readOnly: false,
      canTrade: false,
      canTransfer: false,
      blocked: true,
      message: `Missing env: ${env.missing.join(", ")}`,
      checkedAt: new Date().toISOString(),
    };
  }

  const validation = validateCoinbasePermissions({
    canRead: true,
    canTrade: false,
    canTransfer: false,
  });

  if (!validation.allowed) {
    return {
      state: "blocked",
      connected: false,
      readOnly: false,
      canTrade: false,
      canTransfer: false,
      blocked: true,
      message: validation.blockedReason,
      checkedAt: new Date().toISOString(),
    };
  }

  return {
    state: "ready",
    connected: false,
    readOnly: true,
    canTrade: false,
    canTransfer: false,
    blocked: false,
    message: "Coinbase configured for secure read-only scaffold.",
    checkedAt: new Date().toISOString(),
  };
}

export async function getCoinbaseBalances(): Promise<{ status: CoinbasePermissionStatus; balances: CoinbaseBalance[] }> {
  const status = await getCoinbasePermissionStatus();

  if (status.state !== "ready") {
    return { status, balances: [] };
  }

  return {
    status,
    balances: [],
  };
}
