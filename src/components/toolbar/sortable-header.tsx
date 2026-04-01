"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function SortableHeader({
  label,
  field,
  align = "left",
  basePath,
  defaultSort,
}: {
  label: string;
  field: string;
  align?: "left" | "right" | "center";
  basePath: string;
  defaultSort: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const explicitSort = searchParams.get("sort");
  const explicitDir = searchParams.get("dir");
  const hasExplicitSort = explicitSort !== null || explicitDir !== null;
  const currentSort = explicitSort ?? defaultSort;
  const currentDir = explicitDir ?? "asc";
  const isActive = hasExplicitSort && currentSort === field;

  function handleClick() {
    const params = new URLSearchParams(searchParams.toString());

    if (isActive) {
      if (currentDir === "asc") {
        // asc → desc
        params.set("sort", field);
        params.set("dir", "desc");
      } else {
        // desc → clear sort
        params.delete("sort");
        params.delete("dir");
      }
    } else {
      // activate this column as asc
      params.set("sort", field);
      params.delete("dir");
    }

    params.delete("page");
    const qs = params.toString();
    router.replace(`${basePath}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase transition-colors cursor-pointer select-none",
        isActive
          ? "text-foreground/80"
          : "text-muted-foreground/50 hover:text-muted-foreground/80",
        align === "right" && "ml-auto flex-row-reverse",
        align === "center" && "mx-auto",
      )}
    >
      {label}
      <span className={cn(
        "flex items-center justify-center rounded transition-all",
        isActive ? "text-primary" : "text-muted-foreground/25 group-hover:text-muted-foreground/50",
      )}>
        {isActive ? (
          currentDir === "asc"
            ? <ArrowUp className="h-3 w-3" strokeWidth={2.5} />
            : <ArrowDown className="h-3 w-3" strokeWidth={2.5} />
        ) : (
          <ArrowUpDown className="h-3 w-3" />
        )}
      </span>
    </button>
  );
}
