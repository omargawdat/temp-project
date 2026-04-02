"use client";

import { List, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarViewToggleProps {
  view: string;
  onChange: (view: string) => void;
}

export function ToolbarViewToggle({ view, onChange }: ToolbarViewToggleProps) {
  return (
    <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
      <button
        type="button"
        onClick={() => onChange("list")}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md transition-all",
          view === "list"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <List className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md transition-all",
          view === "grid"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
