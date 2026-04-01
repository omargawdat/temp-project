import { formatCurrency, type CurrencyTotals } from "@/lib/format";

interface MultiCurrencyDisplayProps {
  totals: CurrencyTotals;
  size?: "sm" | "md";
  colorClass?: string;
}

export function MultiCurrencyDisplay({ totals, size = "md", colorClass }: MultiCurrencyDisplayProps) {
  const entries = Object.entries(totals).filter(([, v]) => v !== 0);

  if (entries.length === 0) {
    const cls = size === "sm" ? "text-xs" : "text-xl";
    return <span className={`${cls} font-bold tabular-nums ${colorClass ?? ""}`}>{formatCurrency(0, "USD")}</span>;
  }

  if (entries.length === 1) {
    const cls = size === "sm" ? "text-xs" : "text-xl";
    return (
      <span className={`${cls} font-bold tabular-nums ${colorClass ?? ""}`}>
        {formatCurrency(entries[0][1], entries[0][0])}
      </span>
    );
  }

  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const cls = size === "sm" ? "text-xs" : "text-base";

  return (
    <div className="flex flex-col">
      {sorted.map(([currency, amount]) => (
        <span key={currency} className={`${cls} font-bold tabular-nums ${colorClass ?? ""}`}>
          {formatCurrency(amount, currency)}
        </span>
      ))}
    </div>
  );
}
