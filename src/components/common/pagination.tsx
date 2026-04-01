"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function getPageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);

  return pages;
}

export function Pagination({
  page,
  totalPages,
  totalCount,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const pageSize = Math.ceil(totalCount / totalPages);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    const qs = params.toString();
    router.replace(`${window.location.pathname}${qs ? `?${qs}` : ""}`, {
      scroll: false,
    });
  }

  const pages = getPageNumbers(page, totalPages);

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => goToPage(page - 1)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            page <= 1
              ? "cursor-not-allowed text-muted-foreground/50"
              : "text-muted-foreground hover:bg-muted hover:text-secondary-foreground",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span
              key={`e-${i}`}
              className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground/50"
            >
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => goToPage(p)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition-colors",
                p === page
                  ? "border border-teal-500/20 bg-teal-500/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-secondary-foreground",
              )}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => goToPage(page + 1)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            page >= totalPages
              ? "cursor-not-allowed text-muted-foreground/50"
              : "text-muted-foreground hover:bg-muted hover:text-secondary-foreground",
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <p className="text-xs tabular-nums text-muted-foreground/50">
        Showing {from}–{to} of {totalCount}
      </p>
    </div>
  );
}
