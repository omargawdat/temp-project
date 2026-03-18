"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Globe } from "lucide-react";
import { ToolbarSearch } from "@/components/toolbar/toolbar-search";
import { ToolbarStatusPills } from "@/components/toolbar/toolbar-status-pills";
import { ToolbarMultiSelect } from "@/components/toolbar/toolbar-multi-select";
import { ToolbarSortDropdown } from "@/components/toolbar/toolbar-sort-dropdown";
import { ToolbarExportButton } from "@/components/toolbar/toolbar-export-button";
import { CLIENT_SECTORS } from "@/lib/status-config";

const SORT_OPTIONS = [
  { label: "Name", value: "name" },
  { label: "Code", value: "code" },
  { label: "Country", value: "country" },
  { label: "Sector", value: "sector" },
];

export function ClientsToolbar({
  countries,
  resultCount,
}: {
  countries: { id: string; name: string; flag: string; count?: number }[];
  resultCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const sectorFilter = searchParams.get("sector")?.split(",").filter(Boolean) ?? [];
  const countryFilter = searchParams.get("country")?.split(",").filter(Boolean) ?? [];
  const sort = searchParams.get("sort") ?? "name";
  const dir = searchParams.get("dir") ?? "asc";

  const hasFilters = q || sectorFilter.length > 0 || countryFilter.length > 0;

  const clearAll = useCallback(() => {
    router.replace("/clients", { scroll: false });
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
      router.replace(`/clients${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="relative z-20 mb-5 space-y-3">
      {/* Row 1: Search, sort, results, export */}
      <div className="flex items-center gap-2.5">
        <ToolbarSearch
          value={q}
          onChange={(v) => updateParams({ q: v || null })}
          placeholder="Search clients..."
        />
        <ToolbarMultiSelect
          label="Country"
          icon={Globe}
          items={countries.map((c) => ({ id: c.id, name: c.name, count: c.count }))}
          value={countryFilter}
          onChange={(v) => updateParams({ country: v.length > 0 ? v.join(",") : null })}
          showAvatar={false}
        />
        <ToolbarSortDropdown
          options={SORT_OPTIONS}
          sort={sort}
          dir={dir}
          onChange={(s, d) => updateParams({ sort: s, dir: d })}
        />

        <div className="flex-1" />

        <span className="text-xs tabular-nums text-muted-foreground/40">
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </span>

        <div className="h-5 w-px bg-border/15" />

        <ToolbarExportButton
          searchParams={searchParams.toString()}
          exportPath="/api/clients/export"
          filenamePrefix="clients"
        />
      </div>

      {/* Row 2: Sector pills + clear all */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border/20 bg-card/40 px-4 py-2.5">
        <ToolbarStatusPills
          statuses={CLIENT_SECTORS}
          value={sectorFilter}
          onChange={(v) => updateParams({ sector: v.length > 0 ? v.join(",") : null })}
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
