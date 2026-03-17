"use client";

import { cn } from "@/lib/utils";

export interface StatusOption {
  key: string;
  label: string;
  dot: string;
}

export function ToolbarStatusPills({
  statuses,
  value,
  onChange,
}: {
  statuses: StatusOption[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  function toggle(status: string) {
    onChange(
      value.includes(status)
        ? value.filter((s) => s !== status)
        : [...value, status],
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {statuses.map((s) => {
        const active = value.includes(s.key);
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => toggle(s.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all",
              active
                ? "border-teal-500/40 bg-teal-500/10 text-teal-300"
                : "border-border/40 bg-card/60 text-muted-foreground hover:border-border/70 hover:bg-card hover:text-foreground/80",
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", s.dot, !active && "opacity-60")} />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
