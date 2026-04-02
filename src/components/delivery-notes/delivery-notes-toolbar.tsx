"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, FolderKanban } from "lucide-react";
import { ToolbarSearch } from "@/components/toolbar/toolbar-search";
import { ToolbarStatusPills } from "@/components/toolbar/toolbar-status-pills";
import { ToolbarMultiSelect } from "@/components/toolbar/toolbar-multi-select";
import { ToolbarExportButton } from "@/components/toolbar/toolbar-export-button";
import { DELIVERY_NOTE_STATUSES } from "@/lib/status-config";

export function DeliveryNotesToolbar({
  projects,
  resultCount,
}: {
  projects: { id: string; name: string; count?: number }[];
  resultCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const statusFilter = searchParams.get("status")?.split(",").filter(Boolean) ?? [];
  const projectFilter = searchParams.get("project")?.split(",").filter(Boolean) ?? [];

  const hasFilters = q || statusFilter.length > 0 || projectFilter.length > 0;

  const clearAll = useCallback(() => {
    router.replace("/delivery-notes", { scroll: false });
  }, [router]);

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
      params.delete("page");
      const qs = params.toString();
      router.replace(`/delivery-notes${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="relative z-20 mb-5 space-y-3">
      {/* Row 1: Search, project filter, results, export */}
      <div className="flex items-center gap-2.5">
        <ToolbarSearch
          value={q}
          onChange={(v) => updateParams({ q: v || null })}
          placeholder="Search delivery notes..."
        />
        <ToolbarMultiSelect
          label="Project"
          icon={FolderKanban}
          items={projects}
          value={projectFilter}
          onChange={(v) => updateParams({ project: v.length > 0 ? v.join(",") : null })}
        />

        <div className="flex-1" />

        <span className="text-xs tabular-nums text-muted-foreground">
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </span>

        <div className="h-5 w-px bg-border/15" />

        <ToolbarExportButton
          searchParams={searchParams.toString()}
          exportPath="/api/delivery-notes/export"
          filenamePrefix="delivery-notes"
        />
      </div>

      {/* Row 2: Status pills + clear all */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border bg-card card-elevated px-4 py-2.5">
        <ToolbarStatusPills
          statuses={DELIVERY_NOTE_STATUSES}
          value={statusFilter}
          onChange={(v) => updateParams({ status: v.length > 0 ? v.join(",") : null })}
        />

        {hasFilters && (
          <>
            <div className="h-5 w-px bg-border/30" />
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          </>
        )}
      </div>
    </div>
  );
}
