"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ToolbarSearch } from "@/components/toolbar/toolbar-search";
import { ToolbarExportButton } from "@/components/toolbar/toolbar-export-button";

export function PMToolbar({ resultCount }: { resultCount: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";

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
      router.replace(`/project-managers${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="relative z-20 mb-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <ToolbarSearch
          value={q}
          onChange={(v) => updateParams({ q: v || null })}
          placeholder="Search managers..."
        />

        <div className="flex-1" />

        <span className="text-xs tabular-nums text-muted-foreground/40">
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </span>

        <div className="h-5 w-px bg-border/15" />

        <ToolbarExportButton
          searchParams={searchParams.toString()}
          exportPath="/api/project-managers/export"
          filenamePrefix="project-managers"
        />
      </div>
    </div>
  );
}
