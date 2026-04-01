"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function SortableHeader({
  label,
  field,
  align = "left",
}: {
  label: string;
  field: string;
  align?: "left" | "right" | "center";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") ?? "plannedDate";
  const currentDir = searchParams.get("dir") ?? "asc";
  const isActive = currentSort === field;

  function handleClick() {
    const params = new URLSearchParams(searchParams.toString());

    if (isActive) {
      const newDir = currentDir === "asc" ? "desc" : "asc";
      if (newDir === "asc") params.delete("dir");
      else params.set("dir", newDir);
    } else {
      if (field === "plannedDate") params.delete("sort");
      else params.set("sort", field);
      params.delete("dir");
    }

    const qs = params.toString();
    router.replace(`/milestones${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer select-none",
        isActive
          ? "text-secondary-foreground"
          : "text-muted-foreground hover:text-muted-foreground",
        align === "right" && "ml-auto flex-row-reverse",
        align === "center" && "mx-auto",
      )}
    >
      {label}
      <span className={cn(
        "flex items-center justify-center rounded transition-all",
        isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-muted-foreground",
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
