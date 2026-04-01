"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { label: "Planned Date", value: "plannedDate" },
  { label: "Name", value: "name" },
  { label: "Value", value: "value" },
  { label: "Project", value: "project" },
  { label: "Status", value: "status" },
] as const;

export function ToolbarSort({
  sort,
  dir,
  onChange,
}: {
  sort: string;
  dir: string;
  onChange: (sort: string, dir: string) => void;
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

  const currentLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Date";

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs font-medium"
        onClick={() => setOpen(!open)}
      >
        <ArrowUpDown className="h-3 w-3" />
        {currentLabel}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-[200px] rounded-xl border border-border/50 bg-card shadow-2xl shadow-black/40">
          <div className="p-1.5">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
              Sort by
            </p>
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value, dir); }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent/50"
              >
                <span className={cn(
                  "text-foreground/70",
                  sort === option.value && "text-primary font-medium",
                )}>
                  {option.label}
                </span>
                {sort === option.value && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            ))}
          </div>

          <div className="border-t border-border/30 p-2">
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
              Direction
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onChange(sort, "asc")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors",
                  dir === "asc"
                    ? "bg-accent text-primary"
                    : "text-muted-foreground/50 hover:text-muted-foreground",
                )}
              >
                <ArrowUp className="h-3 w-3" />
                Asc
              </button>
              <button
                type="button"
                onClick={() => onChange(sort, "desc")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors",
                  dir === "desc"
                    ? "bg-accent text-primary"
                    : "text-muted-foreground/50 hover:text-muted-foreground",
                )}
              >
                <ArrowDown className="h-3 w-3" />
                Desc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
