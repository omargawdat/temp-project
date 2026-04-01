"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface CurrencyTabsProps {
  currencies: string[];
}

export function CurrencyTabs({ currencies }: CurrencyTabsProps) {
  const searchParams = useSearchParams();
  const active = searchParams.get("currency") ?? currencies[0] ?? "USD";

  if (currencies.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
      {currencies.map((c) => (
        <Link
          key={c}
          href={`/dashboard?currency=${c}`}
          scroll={false}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
            active === c
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {c}
        </Link>
      ))}
    </div>
  );
}
