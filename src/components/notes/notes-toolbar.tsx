"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Layers, User } from "lucide-react";
import { ToolbarSearch } from "@/components/toolbar/toolbar-search";
import { ToolbarStatusPills } from "@/components/toolbar/toolbar-status-pills";
import { ToolbarMultiSelect } from "@/components/toolbar/toolbar-multi-select";
import { NOTE_TYPE_STATUSES, NOTE_ENTITY_TYPES } from "@/lib/status-config";

export function NotesToolbar({
  resultCount,
  users,
}: {
  resultCount: number;
  users: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const noteTypeFilter =
    searchParams.get("noteType")?.split(",").filter(Boolean) ?? [];
  const entityTypeFilter =
    searchParams.get("entityType")?.split(",").filter(Boolean) ?? [];
  const createdByFilter =
    searchParams.get("createdBy")?.split(",").filter(Boolean) ?? [];

  const hasFilters =
    q || noteTypeFilter.length > 0 || entityTypeFilter.length > 0 || createdByFilter.length > 0;

  const clearAll = useCallback(() => {
    router.replace("/notes", { scroll: false });
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
      router.replace(`/notes${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="relative z-20 mb-5 space-y-3">
      {/* Row 1: Search, entity type filter, results */}
      <div className="flex items-center gap-2.5">
        <ToolbarSearch
          value={q}
          onChange={(v) => updateParams({ q: v || null })}
          placeholder="Search notes..."
        />
        <ToolbarMultiSelect
          label="Entity"
          icon={Layers}
          items={NOTE_ENTITY_TYPES.map((e) => ({ id: e.id, name: e.name }))}
          value={entityTypeFilter}
          onChange={(v) =>
            updateParams({ entityType: v.length > 0 ? v.join(",") : null })
          }
          showAvatar={false}
        />
        <ToolbarMultiSelect
          label="Created By"
          icon={User}
          items={users}
          value={createdByFilter}
          onChange={(v) =>
            updateParams({ createdBy: v.length > 0 ? v.join(",") : null })
          }
          showAvatar={false}
        />

        <div className="flex-1" />

        <span className="text-xs tabular-nums text-muted-foreground/40">
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Row 2: Note type pills + clear all */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border/20 bg-card/40 px-4 py-2.5">
        <ToolbarStatusPills
          statuses={NOTE_TYPE_STATUSES}
          value={noteTypeFilter}
          onChange={(v) =>
            updateParams({ noteType: v.length > 0 ? v.join(",") : null })
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
