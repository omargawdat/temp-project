"use client";

import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

export interface MilestoneChoice {
  id: string;
  name: string;
  value?: string | number;
  disabledReason?: string | null;
}

interface MilestoneSelectorProps {
  milestones: MilestoneChoice[];
  mode: "single" | "multi";
  selected: Set<string>;
  onSelect: (id: string) => void;
  currency?: string;
}

function formatCur(amount: number, currency: string) {
  return amount.toLocaleString("en-US", { style: "currency", currency, maximumFractionDigits: 0 });
}

export function MilestoneSelector({ milestones, mode, selected, onSelect, currency }: MilestoneSelectorProps) {
  if (milestones.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No milestones in this project</p>;
  }

  return (
    <div className="space-y-1.5">
      {milestones.map((m) => {
        const isDisabled = !!m.disabledReason;
        const isSelected = selected.has(m.id);

        return (
          <label
            key={m.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-3 text-sm transition-all",
              isDisabled
                ? "cursor-not-allowed opacity-50 border-border bg-muted/30"
                : "cursor-pointer",
              !isDisabled && isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary/25"
                : !isDisabled && "border-border hover:bg-accent",
            )}
          >
            <input
              type={mode === "single" ? "radio" : "checkbox"}
              name="_milestone_selector"
              value={m.id}
              checked={isSelected}
              onChange={() => !isDisabled && onSelect(m.id)}
              disabled={isDisabled}
              className="sr-only"
            />

            {/* Selection indicator */}
            {mode === "single" ? (
              <div className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                isDisabled ? "border-border" : isSelected ? "border-primary bg-primary" : "border-border",
              )}>
                {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
              </div>
            ) : (
              <div className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                isDisabled ? "border-border bg-accent" : isSelected ? "border-primary bg-primary" : "border-border",
              )}>
                {isDisabled ? (
                  <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                ) : isSelected ? (
                  <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : null}
              </div>
            )}

            {/* Name + reason */}
            <div className="flex-1 min-w-0">
              <span className={cn("font-medium", isDisabled ? "text-muted-foreground" : "text-foreground")}>
                {m.name}
              </span>
              {m.disabledReason && (
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">{m.disabledReason}</p>
              )}
            </div>

            {/* Value */}
            {m.value != null && currency && (
              <span className={cn(
                "font-mono text-sm font-semibold tabular-nums shrink-0",
                isDisabled ? "text-muted-foreground/50" : isSelected ? "text-primary" : "text-muted-foreground",
              )}>
                {formatCur(Number(m.value), currency)}
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}
