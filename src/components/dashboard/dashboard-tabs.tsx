"use client";

import { useState } from "react";
import { AlertTriangle, Columns3, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "attention", label: "Attention", icon: AlertTriangle },
  { id: "pipeline", label: "Pipeline", icon: Columns3 },
  { id: "timeline", label: "Timeline", icon: CalendarRange },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface DashboardTabsProps {
  attentionContent: React.ReactNode;
  pipelineContent: React.ReactNode;
  timelineContent: React.ReactNode;
  defaultTab?: TabId;
  attentionCount?: number;
}

export function DashboardTabs({
  attentionContent,
  pipelineContent,
  timelineContent,
  defaultTab = "attention",
  attentionCount = 0,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-card card-elevated text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.id === "attention" && attentionCount > 0 && (
              <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-red-600">
                {attentionCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        <div className={activeTab === "attention" ? "block" : "hidden"}>{attentionContent}</div>
        <div className={activeTab === "pipeline" ? "block" : "hidden"}>{pipelineContent}</div>
        <div className={activeTab === "timeline" ? "block" : "hidden"}>{timelineContent}</div>
      </div>
    </div>
  );
}
