"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, FolderKanban, AlertTriangle } from "lucide-react";
import { ToolbarSearch } from "@/components/toolbar/toolbar-search";
import { ToolbarStatusPills } from "@/components/toolbar/toolbar-status-pills";
import { ToolbarMultiSelect } from "@/components/toolbar/toolbar-multi-select";
import { ToolbarExportButton } from "@/components/toolbar/toolbar-export-button";
import { ToolbarDateRange } from "@/components/milestones/toolbar-date-range";
import { INVOICE_STATUSES } from "@/lib/status-config";

export function InvoicesToolbar({
  projects,
  resultCount,
}: {
  projects: { id: string; name: string; imageUrl?: string | null; count?: number }[];
  resultCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const statusFilter =
    searchParams.get("status")?.split(",").filter(Boolean) ?? [];
  const projectFilter =
    searchParams.get("project")?.split(",").filter(Boolean) ?? [];
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const overdueFilter = searchParams.get("overdue") ?? "";

  const hasFilters =
    q ||
    statusFilter.length > 0 ||
    projectFilter.length > 0 ||
    dateFrom ||
    dateTo ||
    overdueFilter;

  const clearAll = useCallback(() => {
    router.replace("/invoices", { scroll: false });
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
      router.replace(`/invoices${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="relative z-20 mb-5 space-y-3">
      {/* Row 1: Search, project filter, date range, results, export */}
      <div className="flex items-center gap-2.5">
        <ToolbarSearch
          value={q}
          onChange={(v) => updateParams({ q: v || null })}
          placeholder="Search invoices..."
        />
        <ToolbarMultiSelect
          label="Project"
          icon={FolderKanban}
          items={projects}
          value={projectFilter}
          onChange={(v) =>
            updateParams({ project: v.length > 0 ? v.join(",") : null })
          }
        />
        <ToolbarDateRange
          from={dateFrom}
          to={dateTo}
          onChange={(from, to) => updateParams({ dateFrom: from, dateTo: to })}
        />

        <div className="flex-1" />

        <span className="text-xs tabular-nums text-muted-foreground">
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </span>

        <div className="h-5 w-px bg-border/15" />

        <ToolbarExportButton
          searchParams={searchParams.toString()}
          exportPath="/api/invoices/export"
          filenamePrefix="invoices"
        />
      </div>

      {/* Row 2: Status pills + clear all */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border bg-card card-elevated px-4 py-2.5">
        <ToolbarStatusPills
          statuses={INVOICE_STATUSES}
          value={statusFilter}
          onChange={(v) =>
            updateParams({ status: v.length > 0 ? v.join(",") : null })
          }
        />

        <div className="h-5 w-px bg-border/30" />

        <button
          type="button"
          onClick={() => updateParams({ overdue: overdueFilter === "true" ? null : "true" })}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            overdueFilter === "true"
              ? "bg-red-100 text-red-600"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertTriangle className="h-3 w-3" />
          Overdue
        </button>

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
