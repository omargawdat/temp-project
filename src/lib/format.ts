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
