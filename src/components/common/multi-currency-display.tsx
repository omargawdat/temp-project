import { formatCurrency, type CurrencyTotals } from "@/lib/format";

function formatCompactCurrency(amount: number, currency: string): string {
  const abs = Math.abs(amount);
  let compact: string;
  if (abs >= 1_000_000) {
    compact = `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  } else if (abs >= 1_000) {
    compact = `${(amount / 1_000).toFixed(0)}K`;
  } else {
    compact = String(amount);
  }

  const symbol = new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 })
    .formatToParts(0)
    .find((p) => p.type === "currency")?.value ?? currency;

  return `${symbol} ${compact}`;
}

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
  const visible = sorted.slice(0, 2);
  const remaining = sorted.length - 2;
  const cls = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span className={`${cls} font-bold tabular-nums ${colorClass ?? ""}`}>
      {visible.map(([currency, amount]) => formatCompactCurrency(amount, currency)).join(" · ")}
      {remaining > 0 && (
        <span className="ml-1 text-muted-foreground font-medium" title={sorted.slice(2).map(([c, a]) => formatCompactCurrency(a, c)).join(", ")}>
          +{remaining}
        </span>
      )}
    </span>
  );
}
