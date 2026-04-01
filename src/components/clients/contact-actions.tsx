"use client";

import { User, Mail, Phone, Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

function ActionRow({
  value,
  icon: Icon,
  href,
}: {
  value: string;
  icon: typeof Mail;
  href: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center gap-2 rounded-md px-1.5 -mx-1.5 py-1 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{value}</span>
      <div className="ml-auto flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded p-1 transition-colors hover:bg-muted hover:text-muted-foreground"
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(href, "_blank", "noopener");
          }}
          className="rounded p-1 transition-colors hover:bg-muted hover:text-muted-foreground"
        >
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export function ContactActions({
  contact,
  email,
  phone,
}: {
  contact: string;
  email?: string | null;
  phone?: string | null;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2 px-1.5 -mx-1.5 py-1 text-xs text-muted-foreground">
        <User className="h-3.5 w-3.5 shrink-0" />
        <span>{contact}</span>
        <span className="text-[10px] text-muted-foreground">Primary Contact</span>
      </div>
      {email && <ActionRow value={email} icon={Mail} href={`mailto:${email}`} />}
      {phone && <ActionRow value={phone} icon={Phone} href={`tel:${phone}`} />}
    </div>
  );
}
