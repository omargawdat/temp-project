"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Building2, User } from "lucide-react";
import { ToolbarSearch } from "@/components/toolbar/toolbar-search";
import { ToolbarStatusPills } from "@/components/toolbar/toolbar-status-pills";
import { ToolbarMultiSelect } from "@/components/toolbar/toolbar-multi-select";
import { ToolbarExportButton } from "@/components/toolbar/toolbar-export-button";
import { ToolbarSortDropdown } from "@/components/toolbar/toolbar-sort-dropdown";
import { ToolbarViewToggle } from "@/components/toolbar/toolbar-view-toggle";
import { PROJECT_STATUSES } from "@/lib/status-config";

const SORT_OPTIONS = [
  { label: "Name", value: "name" },
  { label: "Contract Value", value: "contractValue" },
  { label: "Start Date", value: "startDate" },
  { label: "End Date", value: "endDate" },
  { label: "Client", value: "client" },
];

export function ProjectsToolbar({
  clients,
  projectManagers,
  resultCount,
}: {
  clients: { id: string; name: string; count?: number }[];
  projectManagers: { id: string; name: string; imageUrl?: string | null; count?: number }[];
  resultCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const statusFilter = searchParams.get("status")?.split(",").filter(Boolean) ?? [];
  const clientFilter = searchParams.get("client")?.split(",").filter(Boolean) ?? [];
  const pmFilter = searchParams.get("pm")?.split(",").filter(Boolean) ?? [];
  const sort = searchParams.get("sort") ?? "";
  const dir = searchParams.get("dir") ?? "asc";
  const view = searchParams.get("view") ?? "list";

  const hasFilters = q || statusFilter.length > 0 || clientFilter.length > 0 || pmFilter.length > 0;

  const clearAll = useCallback(() => {
    router.replace("/projects", { scroll: false });
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
      router.replace(`/projects${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="relative z-20 mb-5 space-y-3">
      {/* Row 1: Search, client filter, PM filter, sort, results, export */}
      <div className="flex items-center gap-2.5">
        <ToolbarSearch
          value={q}
          onChange={(v) => updateParams({ q: v || null })}
          placeholder="Search projects..."
        />
        <ToolbarMultiSelect
          label="Client"
          icon={Building2}
          items={clients}
          value={clientFilter}
          onChange={(v) => updateParams({ client: v.length > 0 ? v.join(",") : null })}
        />
        <ToolbarMultiSelect
          label="PM"
          icon={User}
          items={projectManagers}
          value={pmFilter}
          onChange={(v) => updateParams({ pm: v.length > 0 ? v.join(",") : null })}
        />
        <ToolbarSortDropdown
          options={SORT_OPTIONS}
          sort={sort}
          dir={dir}
          onChange={(s, d) => updateParams({ sort: s || null, dir: d === "asc" ? null : d })}
        />

        <div className="flex-1" />

        <span className="text-xs tabular-nums text-muted-foreground">
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </span>

        <div className="h-5 w-px bg-border/15" />

        <ToolbarViewToggle view={view} onChange={(v) => updateParams({ view: v === "list" ? null : v })} />

        <div className="h-5 w-px bg-border/15" />

        <ToolbarExportButton
          searchParams={searchParams.toString()}
          exportPath="/api/projects/export"
          filenamePrefix="projects"
        />
      </div>

      {/* Row 2: Status pills + clear all */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border bg-card card-elevated px-4 py-2.5">
        <ToolbarStatusPills
          statuses={PROJECT_STATUSES}
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
