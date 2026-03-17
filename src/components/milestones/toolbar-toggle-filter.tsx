"use client";

import { cn } from "@/lib/utils";

interface ToggleOption {
  key: string;
  label: string;
  color?: string;
}

export function ToolbarToggleFilter({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="mr-1 text-xs font-medium text-muted-foreground/50">{label}</span>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(active ? "" : opt.key)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition-all",
              active
                ? opt.color
                  ? "border-red-500/40 bg-red-500/10 text-red-300"
                  : "border-teal-500/40 bg-teal-500/10 text-teal-300"
                : cn(
                    "border-border/40 bg-card/60 hover:border-border/70 hover:bg-card hover:text-foreground/80",
                    opt.color
                      ? "text-red-400/70"
                      : "text-muted-foreground",
                  ),
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
