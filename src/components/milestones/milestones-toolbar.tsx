"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ToolbarSearch } from "./toolbar-search";
import { ToolbarStatusFilter } from "./toolbar-status-filter";
import { ToolbarProjectFilter } from "./toolbar-project-filter";
import { ToolbarExportButton } from "./toolbar-export-button";

export function MilestonesToolbar({
  projects,
  resultCount,
}: {
  projects: { id: string; name: string }[];
  resultCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const statusFilter = searchParams.get("status")?.split(",").filter(Boolean) ?? [];
  const projectFilter = searchParams.get("project")?.split(",").filter(Boolean) ?? [];

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.replace(`/milestones${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="relative z-20 mb-5 flex items-center gap-2.5">
      <ToolbarSearch
        value={q}
        onChange={(v) => updateParams({ q: v || null })}
      />

      <ToolbarStatusFilter
        value={statusFilter}
        onChange={(v) => updateParams({ status: v.length > 0 ? v.join(",") : null })}
      />
      <ToolbarProjectFilter
        projects={projects}
        value={projectFilter}
        onChange={(v) => updateParams({ project: v.length > 0 ? v.join(",") : null })}
      />

      <div className="flex-1" />

      <span className="text-xs tabular-nums text-muted-foreground/40">
        {resultCount} result{resultCount !== 1 ? "s" : ""}
      </span>

      <div className="h-5 w-px bg-border/15" />

      <ToolbarExportButton searchParams={searchParams.toString()} />
    </div>
  );
}
