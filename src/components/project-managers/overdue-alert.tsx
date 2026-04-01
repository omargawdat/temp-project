"use client";

import { AlertTriangle, Calendar } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { OverdueMilestoneDetail } from "@/lib/pm-stats";

export function OverdueAlert({
  count,
  details,
}: {
  count: number;
  details: OverdueMilestoneDetail[];
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="inline-flex animate-pulse items-center gap-1 cursor-default text-xs font-medium text-red-400" />
        }
      >
        <AlertTriangle className="h-3 w-3" />
        {count}
      </TooltipTrigger>
      <TooltipContent hideArrow className="bg-muted border border-red-500/20 max-w-xs p-0 text-foreground">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
          <span className="text-xs font-semibold text-red-400">
            {count} overdue milestone{count !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Items */}
        <div className="divide-y divide-border/50 px-3">
          {details.map((d, i) => (
            <div key={i} className="py-2.5">
              <p className="text-xs font-medium text-foreground">{d.milestoneName}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{d.projectName}</p>
              <div className="mt-1 flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground/70">
                  <Calendar className="h-3 w-3" />
                  {new Date(d.plannedDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="font-medium text-red-400/80">{d.daysOverdue}d overdue</span>
              </div>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
