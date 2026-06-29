export type CoinbaseIntegrationState = "not_configured" | "ready" | "blocked";

export type CoinbaseBalance = {
  asset: string;
  symbol: string;
  quantity: number;
  availableQuantity?: number;
  holdQuantity?: number;
  fiatValueUsd?: number;
};

export type CoinbasePermissionStatus = {
  state: CoinbaseIntegrationState;
  connected: boolean;
  readOnly: boolean;
  canTrade: boolean;
  canTransfer: boolean;
  blocked: boolean;
  message?: string;
  checkedAt: string;
};
