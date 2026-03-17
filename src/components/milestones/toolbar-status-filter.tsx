"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { cn } from "@/lib/utils";

const STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "READY_FOR_INVOICING",
  "INVOICED",
] as const;

export function ToolbarStatusFilter({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function toggle(status: string) {
    onChange(
      value.includes(status)
        ? value.filter((s) => s !== status)
        : [...value, status],
    );
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "h-8 gap-1.5 text-xs font-medium",
          value.length > 0 && "border-teal-500/30 text-teal-400",
        )}
        onClick={() => setOpen(!open)}
      >
        Status
        {value.length > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-500/15 px-1 text-[10px] font-bold text-teal-400">
            {value.length}
          </span>
        )}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-[220px] rounded-xl border border-border/50 bg-card p-1.5 shadow-2xl shadow-black/40">
          {STATUSES.map((status) => {
            const selected = value.includes(status);
            return (
              <button
                key={status}
                type="button"
                onClick={() => toggle(status)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent/50"
              >
                <div className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                  selected
                    ? "border-teal-500 bg-teal-500"
                    : "border-border/50 bg-transparent",
                )}>
                  {selected && <Check className="h-3 w-3 text-white" />}
                </div>
                <StatusBadge status={status} />
              </button>
            );
          })}
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full rounded-lg px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
