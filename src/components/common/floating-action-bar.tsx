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
    "text-teal-400/80 hover:bg-teal-500/10 hover:text-teal-400",
  default:
    "text-white/60 hover:bg-white/[0.08] hover:text-white",
  warning:
    "text-amber-400/70 hover:bg-amber-500/10 hover:text-amber-400",
  danger:
    "text-white/35 hover:bg-white/[0.06] hover:text-white/60",
  accent:
    "bg-teal-500/15 text-teal-400 hover:bg-teal-500/25 hover:text-teal-300 ring-1 ring-teal-500/20",
};

export function FloatingActionBar({ actions }: { actions: FloatingAction[] }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-2xl border border-white/[0.12] bg-[#131d2e]/95 px-4 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.7),0_0_20px_rgba(45,212,191,0.08)] backdrop-blur-2xl ring-1 ring-white/[0.06]">
        {actions.map((action, i) => (
          <div key={action.label} className="flex items-center">
            {i > 0 && <div className="mx-0.5 h-5 w-px bg-white/[0.06]" />}
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
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-teal-500/20 px-1 text-[10px] font-bold tabular-nums text-teal-400">
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
