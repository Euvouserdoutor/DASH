import { createPrivateKey, randomBytes, sign as signBytes } from "node:crypto";
import type { CoinbaseBalance, CoinbasePermissionStatus } from "@/types/coinbase";
import { getCoinbaseEnv, getCoinbaseEnvStatus } from "@/lib/security/env.server";
import { validateCoinbasePermissions } from "@/lib/security/validate-coinbase-permissions";

const HOST = "api.coinbase.com";
const ROOT = "/api/v3/brokerage";
const PAGE_LIMIT = 20;

type Permissions = {
  can_view?: boolean;
  can_trade?: boolean;
  can_transfer?: boolean;
  portfolio_uuid?: string;
};
type ApiAccount = {
  currency?: string;
  retail_portfolio_id?: string;
  available_balance?: { value?: string };
  hold?: { value?: string };
};
type AccountsResponse = {
  accounts?: ApiAccount[];
  has_next?: boolean;
  cursor?: string;
};

function encoded(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function tokenForPath(path: string): string {
  const env = getCoinbaseEnv();
  const key = createPrivateKey(env.apiPrivateKey.replace(/\\n/g, "\n"));
  const alg = key.asymmetricKeyType === "ed25519" ? "EdDSA" : key.asymmetricKeyType === "ec" ? "ES256" : null;
  if (!alg) throw new Error("Unsupported Coinbase key algorithm");
  const now = Math.floor(Date.now() / 1000);
  const header = encoded({ typ: "JWT", alg, kid: env.apiKeyName, nonce: randomBytes(16).toString("hex") });
  const payload = encoded({
    iss: "cdp",
    sub: env.apiKeyName,
    nbf: now,
    exp: now + 120,
    uri: "GET " + HOST + ROOT + path,
  });
  const body = header + "." + payload;
  const signature = alg === "EdDSA"
    ? signBytes(null, Buffer.from(body), key)
    : signBytes("sha256", Buffer.from(body), { key, dsaEncoding: "ieee-p1363" });
  return body + "." + signature.toString("base64url");
}

async function coinbaseGet<T>(path: string, query = ""): Promise<T> {
  // JWT must be scoped to the path without query parameters.
  const response = await fetch("https://" + HOST + ROOT + path + query, {
    method: "GET",
    headers: { Authorization: "Bearer " + tokenForPath(path), Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Coinbase API returned status " + response.status);
  return (await response.json()) as T;
}

function status(state: CoinbasePermissionStatus["state"], message: string, flags?: Permissions): CoinbasePermissionStatus {
  const allowed = state === "ready";
  return {
    state,
    connected: allowed,
    readOnly: allowed,
    canTrade: flags?.can_trade === true,
    canTransfer: flags?.can_transfer === true,
    blocked: !allowed,
    message,
    checkedAt: new Date().toISOString(),
  };
}

export async function getCoinbasePermissionStatus(): Promise<CoinbasePermissionStatus> {
  const envStatus = getCoinbaseEnvStatus();
  if (!envStatus.configured) {
    return status("not_configured", "Configuração Coinbase incompleta: " + envStatus.missing.join(", "));
  }
  try {
    const flags = await coinbaseGet<Permissions>("/key_permissions");
    // Fail closed if the API changes the schema or permissions are too broad.
    const validation = validateCoinbasePermissions({
      canRead: flags.can_view === true,
      canTrade: flags.can_trade !== false,
      canTransfer: flags.can_transfer !== false,
    });
    if (!validation.allowed) return status("blocked", "Chave recusada: " + validation.blockedReason, flags);
    if (flags.portfolio_uuid !== getCoinbaseEnv().portfolioUuid) {
      return status("blocked", "A chave não pertence ao portfólio Coinbase configurado.", flags);
    }
    return status("ready", "Conexão Coinbase validada com permissão somente leitura.", flags);
  } catch {
    return status("blocked", "Falha ao autenticar a chave Coinbase. Verifique credenciais e conectividade.");
  }
}

export async function getCoinbaseBalances(): Promise<{
  status: CoinbasePermissionStatus;
  balances: CoinbaseBalance[];
  syncedAt: string | null;
}> {
  const permission = await getCoinbasePermissionStatus();
  if (permission.state !== "ready") return { status: permission, balances: [], syncedAt: null };
  try {
    const totals = new Map<string, { available: number; hold: number }>();
    const portfolioId = getCoinbaseEnv().portfolioUuid;
    let cursor = "";
    let hasNext = true;
    let page = 0;
    const seen = new Set<string>();
    while (hasNext && page < PAGE_LIMIT) {
      const query = "?limit=250" + (cursor ? "&cursor=" + encodeURIComponent(cursor) : "");
      const response = await coinbaseGet<AccountsResponse>("/accounts", query);
      page += 1;
      for (const account of response.accounts ?? []) {
        if (account.retail_portfolio_id && account.retail_portfolio_id !== portfolioId) continue;
        const symbol = (account.currency ?? "").trim().toUpperCase();
        if (!symbol) continue;
        const available = Number(account.available_balance?.value ?? 0);
        const hold = Number(account.hold?.value ?? 0);
        if (!Number.isFinite(available) || !Number.isFinite(hold) || available < 0 || hold < 0) continue;
        const current = totals.get(symbol) ?? { available: 0, hold: 0 };
        current.available += available;
        current.hold += hold;
        totals.set(symbol, current);
      }
      hasNext = response.has_next === true;
      const nextCursor = response.cursor ?? "";
      if (hasNext && (!nextCursor || seen.has(nextCursor))) throw new Error("Invalid Coinbase pagination");
      if (hasNext) seen.add(nextCursor);
      cursor = nextCursor;
    }
    if (hasNext) throw new Error("Coinbase account pagination incomplete");
    const balances: CoinbaseBalance[] = [...totals.entries()]
      .map(([symbol, value]) => ({
        asset: symbol,
        symbol,
        quantity: value.available + value.hold,
        availableQuantity: value.available,
        holdQuantity: value.hold,
      }))
      .filter((item) => item.quantity > 0)
      .sort((a, b) => a.symbol.localeCompare(b.symbol));
    return { status: permission, balances, syncedAt: new Date().toISOString() };
  } catch {
    return {
      status: status("blocked", "Não foi possível concluir a leitura dos saldos. Nenhum saldo parcial foi exibido."),
      balances: [],
      syncedAt: null,
    };
  }
}
