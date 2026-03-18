import { DATE_FORMAT_SHORT, DATE_FORMAT_FULL, DATE_FORMAT_MONTH_YEAR } from "./constants";

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatCurrency(amount: number, currency: string): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}

export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

export function formatDate(
  date: Date | string,
  style: "short" | "full" | "month-year" = "full",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const fmt =
    style === "short"
      ? DATE_FORMAT_SHORT
      : style === "month-year"
        ? DATE_FORMAT_MONTH_YEAR
        : DATE_FORMAT_FULL;
  return d.toLocaleDateString("en-US", fmt);
}

export function toDateInputValue(date: Date | string): string {
  return new Date(date).toISOString().split("T")[0];
}

/** Safe percentage: returns 0 when denominator is 0. */
export function safePercent(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.min(100, Math.round((numerator / denominator) * 100)) : 0;
}

/** Record of currency code → amount */
export type CurrencyTotals = Record<string, number>;

/** Accumulate an amount into a CurrencyTotals map. */
export function addToCurrency(totals: CurrencyTotals, currency: string, amount: number): void {
  totals[currency] = (totals[currency] ?? 0) + amount;
}

/**
 * Format a CurrencyTotals map into a display string.
 * e.g. { USD: 320000, AED: 1520000 } → "USD 320,000 · AED 1,520,000"
 * If only one currency, uses full format: "$320,000" / "AED 1,520,000".
 */
export function formatMultiCurrency(totals: CurrencyTotals): string {
  const entries = Object.entries(totals).filter(([, v]) => v !== 0);
  if (entries.length === 0) return formatCurrency(0, "USD");
  if (entries.length === 1) return formatCurrency(entries[0][1], entries[0][0]);
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([c, v]) => `${c} ${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`)
    .join(" · ");
}

/** Check if totals contain more than one currency. */
export function isMultiCurrency(totals: CurrencyTotals): boolean {
  return Object.keys(totals).filter((k) => totals[k] !== 0).length > 1;
}

/** Get the single currency from totals, or null if multi. */
export function getSingleCurrency(totals: CurrencyTotals): string | null {
  const keys = Object.keys(totals).filter((k) => totals[k] !== 0);
  return keys.length === 1 ? keys[0] : null;
}

/** Sum all values in a CurrencyTotals (for single-currency contexts or rough totals). */
export function sumCurrencyTotals(totals: CurrencyTotals): number {
  return Object.values(totals).reduce((s, v) => s + v, 0);
}
