"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FloatingAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "primary" | "default" | "warning" | "danger" | "accent";
  badge?: number;
  disabled?: boolean;
}

const variantClasses: Record<string, string> = {
  primary:
    "text-primary hover:bg-accent hover:text-primary/80",
  default:
    "text-muted-foreground hover:bg-muted hover:text-foreground",
  warning:
    "text-amber-500 hover:bg-amber-50 hover:text-amber-600",
  danger:
    "text-muted-foreground hover:bg-muted hover:text-muted-foreground",
  accent:
    "text-primary hover:bg-accent hover:text-primary ring-1 ring-primary/20",
};

export function FloatingActionBar({ actions }: { actions: FloatingAction[] }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur-2xl ring-1 ring-ring/20">
        {actions.map((action, i) => (
          <div key={action.label} className="flex items-center">
            {i > 0 && <div className="mx-0.5 h-5 w-px bg-muted" />}
            <button
              disabled={action.disabled}
              onClick={action.onClick}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-40",
                variantClasses[action.variant ?? "default"],
              )}
            >
              <action.icon className="h-4 w-4" />
              <span>{action.label}</span>
              {action.badge != null && action.badge > 0 && (
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary/20 px-1 text-[10px] font-bold tabular-nums text-primary">
                  {action.badge}
                </span>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
