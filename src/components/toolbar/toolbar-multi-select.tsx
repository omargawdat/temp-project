"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MultiSelectItem {
  id: string;
  name: string;
  imageUrl?: string | null;
  count?: number;
}

export function ToolbarMultiSelect({
  label,
  icon: Icon,
  items,
  value,
  onChange,
  searchPlaceholder,
  showAvatar = true,
}: {
  label: string;
  icon?: LucideIcon;
  items: MultiSelectItem[];
  value: string[];
  onChange: (value: string[]) => void;
  searchPlaceholder?: string;
  showAvatar?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  function toggle(id: string) {
    onChange(
      value.includes(id)
        ? value.filter((v) => v !== id)
        : [...value, id],
    );
  }

  const filtered = search
    ? items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "h-10 gap-2 px-4 text-sm font-medium",
          value.length > 0 && "border-teal-500/30 text-teal-400",
        )}
        onClick={() => setOpen(!open)}
      >
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />}
        {label}
        {value.length > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-500/15 px-1 text-[10px] font-bold text-teal-400">
            {value.length}
          </span>
        )}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-[280px] rounded-xl border border-border/50 bg-card shadow-2xl shadow-black/40">
          <div className="border-b border-border/30 p-2">
            <div className="flex items-center gap-2 rounded-lg bg-background/60 px-2.5 py-1.5">
              <Search className="h-3 w-3 text-muted-foreground/40" />
              <input
                type="text"
                placeholder={searchPlaceholder ?? `Filter ${label.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/30 outline-none"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-[240px] overflow-y-auto p-1.5">
            {filtered.map((item) => {
              const selected = value.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
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
                  {showAvatar && (
                    item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[9px] font-bold text-muted-foreground/50">
                        {item.name.charAt(0)}
                      </div>
                    )
                  )}
                  <span className="flex-1 truncate text-sm text-foreground/80">{item.name}</span>
                  {item.count !== undefined && (
                    <span className="text-[11px] tabular-nums text-muted-foreground/35">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground/40">No items found</p>
            )}
          </div>

          {value.length > 0 && (
            <div className="border-t border-border/30 p-1.5">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full rounded-lg px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
