"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ToolbarProjectFilter({
  projects,
  value,
  onChange,
}: {
  projects: { id: string; name: string }[];
  value: string[];
  onChange: (value: string[]) => void;
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
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

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
        Project
        {value.length > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-500/15 px-1 text-[10px] font-bold text-teal-400">
            {value.length}
          </span>
        )}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-[260px] rounded-xl border border-border/50 bg-card shadow-2xl shadow-black/40">
          {/* Search */}
          <div className="border-b border-border/30 p-2">
            <div className="flex items-center gap-2 rounded-lg bg-background/60 px-2.5 py-1.5">
              <Search className="h-3 w-3 text-muted-foreground/40" />
              <input
                type="text"
                placeholder="Filter projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/30 outline-none"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-[240px] overflow-y-auto p-1.5 custom-scrollbar">
            {filtered.map((project) => {
              const selected = value.includes(project.id);
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => toggle(project.id)}
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
                  <span className="truncate text-sm text-foreground/80">{project.name}</span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground/40">No projects found</p>
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
