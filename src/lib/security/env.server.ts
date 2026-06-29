import { maskSecret } from "@/lib/security/redact";

export type CoinbaseEnv = {
  apiKeyName: string;
  apiPrivateKey: string;
  portfolioUuid: string;
};

export type CoinbaseEnvStatus = {
  configured: boolean;
  missing: string[];
  safePreview: {
    apiKeyName: string;
    apiPrivateKey: string;
    portfolioUuid: string;
  };
};

export function getCoinbaseEnv(): CoinbaseEnv {
  return {
    apiKeyName: process.env.COINBASE_API_KEY_NAME ?? "",
    apiPrivateKey: process.env.COINBASE_API_PRIVATE_KEY ?? "",
    portfolioUuid: process.env.COINBASE_PORTFOLIO_UUID ?? "",
  };
}

export function getCoinbaseEnvStatus(): CoinbaseEnvStatus {
  const env = getCoinbaseEnv();
  const missing: string[] = [];

  if (!env.apiKeyName) missing.push("COINBASE_API_KEY_NAME");
  if (!env.apiPrivateKey) missing.push("COINBASE_API_PRIVATE_KEY");
  if (!env.portfolioUuid) missing.push("COINBASE_PORTFOLIO_UUID");

  return {
    configured: missing.length === 0,
    missing,
    safePreview: {
      apiKeyName: maskSecret(env.apiKeyName),
      apiPrivateKey: maskSecret(env.apiPrivateKey),
      portfolioUuid: maskSecret(env.portfolioUuid),
    },
  };
}
