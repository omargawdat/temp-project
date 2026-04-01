"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Layers, User } from "lucide-react";
import { ToolbarSearch } from "@/components/toolbar/toolbar-search";
import { ToolbarStatusPills } from "@/components/toolbar/toolbar-status-pills";
import { ToolbarMultiSelect } from "@/components/toolbar/toolbar-multi-select";
import { ToolbarDateRange } from "@/components/milestones/toolbar-date-range";
import { AUDIT_ACTION_STATUSES, AUDIT_ENTITY_TYPES } from "@/lib/status-config";

export function AuditToolbar({
  resultCount,
  users,
}: {
  resultCount: number;
  users: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const actionFilter =
    searchParams.get("action")?.split(",").filter(Boolean) ?? [];
  const entityTypeFilter =
    searchParams.get("entityType")?.split(",").filter(Boolean) ?? [];
  const performedByFilter =
    searchParams.get("performedBy")?.split(",").filter(Boolean) ?? [];
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

  const hasFilters =
    q ||
    actionFilter.length > 0 ||
    entityTypeFilter.length > 0 ||
    performedByFilter.length > 0 ||
    dateFrom ||
    dateTo;

  const clearAll = useCallback(() => {
    router.replace("/audit-log", { scroll: false });
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
      router.replace(`/audit-log${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="relative z-20 mb-5 space-y-3">
      {/* Row 1: Search, entity type filter, date range, results */}
      <div className="flex items-center gap-2.5">
        <ToolbarSearch
          value={q}
          onChange={(v) => updateParams({ q: v || null })}
          placeholder="Search audit log..."
        />
        <ToolbarMultiSelect
          label="Entity"
          icon={Layers}
          items={AUDIT_ENTITY_TYPES.map((e) => ({ id: e.id, name: e.name }))}
          value={entityTypeFilter}
          onChange={(v) =>
            updateParams({ entityType: v.length > 0 ? v.join(",") : null })
          }
          showAvatar={false}
        />
        <ToolbarMultiSelect
          label="By"
          icon={User}
          items={users}
          value={performedByFilter}
          onChange={(v) =>
            updateParams({ performedBy: v.length > 0 ? v.join(",") : null })
          }
          showAvatar={false}
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
      </div>

      {/* Row 2: Action pills + clear all */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border bg-card card-elevated px-4 py-2.5">
        <ToolbarStatusPills
          statuses={AUDIT_ACTION_STATUSES}
          value={actionFilter}
          onChange={(v) =>
            updateParams({ action: v.length > 0 ? v.join(",") : null })
          }
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
