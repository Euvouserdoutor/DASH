const DEFAULT_LOCALE = "en-US";

export function safeNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function fmtCurrency(value: unknown, currency = "USD"): string {
  const amount = safeNumber(value);
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function fmtCompactCurrency(value: unknown, currency = "USD"): string {
  const amount = safeNumber(value);
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency,
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function fmtPct(value: unknown): string {
  const pct = safeNumber(value);
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

export function fmtTokenAmount(value: unknown): string {
  const amount = safeNumber(value);

  if (amount === 0) return "0";

  if (Math.abs(amount) >= 1) {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  }

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(amount);
}

export function fmtDateTime(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
