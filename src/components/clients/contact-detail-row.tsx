"use client";

import { useState } from "react";
import { Mail, Phone, Check, Copy, ExternalLink } from "lucide-react";

const ICONS = { mail: Mail, phone: Phone } as const;

export function ContactDetailRow({
  value,
  icon,
  href,
}: {
  value: string;
  icon: "mail" | "phone";
  href: string;
}) {
  const [copied, setCopied] = useState(false);
  const Icon = ICONS[icon];

  return (
    <div className="flex items-center gap-2.5 text-sm group">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">{value}</span>
      <div className="ml-auto flex items-center gap-0.5 shrink-0">
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
