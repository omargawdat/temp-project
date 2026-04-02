"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

export function ContactDetailRow({
  value,
  href,
}: {
  value: string;
  icon: "mail" | "phone";
  href: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center gap-1.5 text-sm group">
      <span className="text-muted-foreground truncate">{value}</span>
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded p-1 transition-colors hover:bg-muted hover:text-secondary-foreground"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
        <button
          type="button"
          onClick={() => window.open(href, "_blank", "noopener")}
          className="rounded p-1 transition-colors hover:bg-muted hover:text-secondary-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
