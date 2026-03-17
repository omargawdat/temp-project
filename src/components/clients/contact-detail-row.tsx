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
      <Icon className="h-4 w-4 text-white/20 shrink-0" />
      <span className="text-white/55">{value}</span>
      <div className="ml-auto flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded p-1 transition-colors hover:bg-white/[0.08] hover:text-white/60"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-white/30" />
          )}
        </button>
        <button
          type="button"
          onClick={() => window.open(href, "_blank", "noopener")}
          className="rounded p-1 transition-colors hover:bg-white/[0.08] hover:text-white/60"
        >
          <ExternalLink className="h-3.5 w-3.5 text-white/30" />
        </button>
      </div>
    </div>
  );
}
